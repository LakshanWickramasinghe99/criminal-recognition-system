# backend/routers/enrollment.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from backend.models.schemas import EnrollmentResponse
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))

import cv2
import shutil
import uuid
import tempfile
from insightface.app import FaceAnalysis
from criminal_db import init_db, register_criminal, add_crime
from blockchain_service import BlockchainService
from typing import Optional

router = APIRouter(prefix="/api/enrollment", tags=["Enrollment"])

# Create photos folder
PHOTOS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))),
    "criminal_photos"
)
os.makedirs(PHOTOS_DIR, exist_ok=True)

# Initialize services
init_db()
bc  = BlockchainService()
app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))


# ── Helper: extract embedding from image bytes ────────────────────────────────
def extract_embedding(image_bytes: bytes, filename: str):
    ext = os.path.splitext(filename)[1] or ".jpg"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(image_bytes)
        tmp_path = tmp.name
    try:
        img = cv2.imread(tmp_path)
        if img is None:
            raise HTTPException(status_code=400, detail="Cannot read uploaded image")
        faces = app.get(img)
        if not faces:
            raise HTTPException(status_code=400, detail="No face detected in uploaded photo — ensure clear frontal face")
        return faces[0].normed_embedding
    finally:
        os.unlink(tmp_path)


# ── Helper: extract embeddings from video frames ──────────────────────────────
def extract_embedding_from_video(video_bytes: bytes, filename: str):
    ext = os.path.splitext(filename)[1] or ".mp4"
    with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name
    try:
        cap = cv2.VideoCapture(tmp_path)
        embeddings = []
        frame_count = 0
        while True:
            ret, frame = cap.read()
            if not ret:
                break
            frame_count += 1
            if frame_count % 15 != 0:   # sample every 15th frame
                continue
            faces = app.get(frame)
            if faces:
                embeddings.append(faces[0].normed_embedding)
            if len(embeddings) >= 10:   # cap at 10 samples
                break
        cap.release()
        if not embeddings:
            return None
        import numpy as np
        return np.mean(embeddings, axis=0)
    finally:
        os.unlink(tmp_path)


# ── POST /api/enrollment/enroll  (new — full schema) ─────────────────────────
@router.post("/enroll", response_model=EnrollmentResponse)
async def enroll_criminal_endpoint(
    # ── Core ──
    age                  : int             = Form(...),
    # ── Personal ──
    full_name            : str             = Form(...),
    dob                  : Optional[str]   = Form(None),
    nic_number           : Optional[str]   = Form(None),
    gender               : Optional[str]   = Form(None),
    nationality          : Optional[str]   = Form("Sri Lankan"),
    address              : Optional[str]   = Form(None),
    phone                : Optional[str]   = Form(None),
    occupation           : Optional[str]   = Form(None),
    height_cm            : Optional[int]   = Form(None),
    weight_kg            : Optional[int]   = Form(None),
    eye_color            : Optional[str]   = Form(None),
    distinguishing_marks : Optional[str]   = Form(None),
    # ── Crime ──
    crime_type           : str             = Form(...),
    case_id              : Optional[str]   = Form(None),
    crime_description    : Optional[str]   = Form(None),
    crime_date           : Optional[str]   = Form(None),
    crime_location       : Optional[str]   = Form(None),
    crime_status         : Optional[str]   = Form("Wanted"),
    weapons_used         : Optional[str]   = Form(None),
    victims_count        : Optional[int]   = Form(None),
    damage_value         : Optional[str]   = Form(None),
    # ── Officer ──
    officer_id           : Optional[str]   = Form(None),
    officer_name         : Optional[str]   = Form(None),
    badge_number         : Optional[str]   = Form(None),
    station              : Optional[str]   = Form(None),
    rank                 : Optional[str]   = Form(None),
    # ── Files ──
    photo                : UploadFile      = File(...),
    video                : Optional[UploadFile] = File(None),
):
    try:
        photo_bytes = await photo.read()

        # -- Extract embedding (prefer video average if provided) --
        embedding = None
        if video and video.filename:
            video_bytes = await video.read()
            embedding = extract_embedding_from_video(video_bytes, video.filename)

        if embedding is None:
            embedding = extract_embedding(photo_bytes, photo.filename)

        # -- Auto-generate criminal_id --
        criminal_id = f"CRM-{str(uuid.uuid4())[:8].upper()}"

        # -- Build crime_history summary for legacy fields --
        crime_history = f"{crime_type}"
        if crime_date:
            crime_history += f" ({crime_date})"
        if crime_status:
            crime_history += f" — {crime_status}"

        # -- Save photo permanently --
        ext = os.path.splitext(photo.filename)[1] or ".jpg"
        photo_path = os.path.join(PHOTOS_DIR, f"{criminal_id}{ext}")
        with open(photo_path, "wb") as f:
            f.write(photo_bytes)

        # -- Build extra dict for SQLite --
        extra = dict(
            dob=dob, nic_number=nic_number, gender=gender,
            nationality=nationality or "Sri Lankan",
            address=address, phone=phone, occupation=occupation,
            height_cm=height_cm, weight_kg=weight_kg,
            eye_color=eye_color, distinguishing_marks=distinguishing_marks,
            officer_id=officer_id, officer_name=officer_name,
            badge_number=badge_number, station=station, rank=rank,
        )

        # -- Register in SQLite --
        success = register_criminal(
            criminal_id   = criminal_id,
            name          = full_name,
            age           = age,
            crime_history = crime_history,
            embedding     = embedding,
            extra         = extra,
        )
        if not success:
            raise HTTPException(status_code=400, detail=f"Criminal ID {criminal_id} collision — retry")

        # -- Add crime record to crimes table --
        effective_case_id = case_id or f"CASE-{str(uuid.uuid4())[:8].upper()}"
        add_crime(
            criminal_id       = criminal_id,
            case_id           = effective_case_id,
            crime_type        = crime_type,
            crime_description = crime_description,
            crime_date        = crime_date,
            crime_location    = crime_location,
            crime_status      = crime_status or "Wanted",
            weapons_used      = weapons_used,
            victims_count     = victims_count,
            damage_value      = damage_value,
        )

        # -- Register on blockchain --
        tx = bc.register_criminal(
            criminal_id   = criminal_id,
            name          = full_name,
            age           = age,
            crime_history = crime_history,
            embedding     = embedding,
        )

        return EnrollmentResponse(
            success       = True,
            criminal_id   = criminal_id,
            name          = full_name,
            blockchain_tx = tx,
            message       = f"Successfully registered {full_name} on blockchain"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── POST /api/enrollment/register  (legacy — kept for compatibility) ──────────
@router.post("/register", response_model=EnrollmentResponse)
async def register_criminal_endpoint(
    criminal_id  : str        = Form(...),
    name         : str        = Form(...),
    age          : int        = Form(...),
    crime_history: str        = Form(...),
    photo        : UploadFile = File(...),
):
    try:
        contents = await photo.read()

        ext        = os.path.splitext(photo.filename)[1] or ".jpg"
        photo_path = os.path.join(PHOTOS_DIR, f"{criminal_id}{ext}")
        with open(photo_path, "wb") as f:
            f.write(contents)

        embedding = extract_embedding(contents, photo.filename)

        success = register_criminal(
            criminal_id   = criminal_id,
            name          = name,
            age           = age,
            crime_history = crime_history,
            embedding     = embedding,
        )
        if not success:
            raise HTTPException(status_code=400, detail=f"Criminal ID {criminal_id} already exists")

        tx = bc.register_criminal(
            criminal_id   = criminal_id,
            name          = name,
            age           = age,
            crime_history = crime_history,
            embedding     = embedding,
        )

        return EnrollmentResponse(
            success       = True,
            criminal_id   = criminal_id,
            name          = name,
            blockchain_tx = tx,
            message       = f"Successfully registered {name} on blockchain"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/enrollment/photo/{criminal_id} ───────────────────────────────────
@router.get("/photo/{criminal_id}")
def get_criminal_photo(criminal_id: str):
    for ext in [".jpg", ".jpeg", ".png", ".webp"]:
        path = os.path.join(PHOTOS_DIR, f"{criminal_id}{ext}")
        if os.path.exists(path):
            return FileResponse(path, media_type="image/jpeg")
    raise HTTPException(status_code=404, detail="Photo not found")


# ── GET /api/enrollment/list ──────────────────────────────────────────────────
@router.get("/list")
def list_criminals():
    try:
        ids     = bc.get_all_ids()
        records = []
        for cid in ids:
            record = bc.get_criminal(cid)
            if record:
                records.append(record)
        return {"total": len(records), "criminals": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── GET /api/enrollment/criminal/{criminal_id} ────────────────────────────────
@router.get("/criminal/{criminal_id}")
def get_criminal(criminal_id: str):
    record = bc.get_criminal(criminal_id)
    if not record:
        raise HTTPException(status_code=404, detail=f"Criminal {criminal_id} not found")
    return record
