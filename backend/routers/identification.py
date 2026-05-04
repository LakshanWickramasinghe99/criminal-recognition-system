# backend/routers/identification.py
from fastapi import APIRouter, UploadFile, File, HTTPException
from backend.models.schemas import VideoAnalysisResponse
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))

import cv2
import numpy as np
import tempfile
import uuid
from insightface.app import FaceAnalysis
from ultralytics import YOLO
from criminal_db import init_db, get_all_criminals
from blockchain_service import BlockchainService
from collections import defaultdict

router = APIRouter(
    prefix="/api/identification", tags=["Identification"]
)

# Initialize services
init_db()
bc = BlockchainService()
face_app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
face_app.prepare(ctx_id=-1, det_size=(640, 640))
yolo = YOLO(
    "runs/detect/runs/detect/occlusion_v3/weights/best.pt"
)

MATCH_THRESHOLD = 0.4
MIN_FRAMES      = 3
FRAME_SKIP      = 15

@router.post("/analyze-video",
             response_model=VideoAnalysisResponse)
async def analyze_video(
    video: UploadFile = File(...)
):
    """Upload video and identify criminals."""
    case_id = str(uuid.uuid4())[:8].upper()

    try:
        # Save uploaded video
        contents = await video.read()
        with tempfile.NamedTemporaryFile(
            suffix=".mp4", delete=False
        ) as tmp:
            tmp.write(contents)
            tmp_path = tmp.name

        # Load blockchain-synced criminals
        all_criminals = get_all_criminals()
        bc_ids        = bc.get_all_ids()
        criminals     = [
            c for c in all_criminals
            if c["criminal_id"] in bc_ids
        ]

        if not criminals:
            raise HTTPException(
                status_code=400,
                detail="No criminals registered in system"
            )

        # Open video
        cap    = cv2.VideoCapture(tmp_path)
        fps    = cap.get(cv2.CAP_PROP_FPS)
        width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

        match_scores   = defaultdict(list)
        frame_evidence = {}
        frame_num      = 0
        processed      = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break
            frame_num += 1
            timestamp  = frame_num / fps

            if frame_num % FRAME_SKIP != 0:
                continue
            processed += 1

            # Resize if 4K
            scale = 1.0
            if width > 1920:
                scale = 1920 / width
                small = cv2.resize(frame, (
                    int(width * scale),
                    int(height * scale)
                ))
            else:
                small = frame

            # Detect occlusions
            yolo_results = yolo(
                small, conf=0.5, verbose=False
            )
            occlusions = [
                yolo.names[int(b.cls[0])]
                for r in yolo_results
                for b in r.boxes
            ]

            # Detect and match faces
            for face in face_app.get(small):
                emb        = face.normed_embedding
                best_match = None
                best_score = 0
                for criminal in criminals:
                    score = float(
                        np.dot(emb, criminal["embedding"])
                    )
                    if score > best_score:
                        best_score = score
                        best_match = criminal

                if best_score >= MATCH_THRESHOLD \
                        and best_match:
                    cid = best_match["criminal_id"]
                    match_scores[cid].append(best_score)
                    if cid not in frame_evidence or \
                       best_score > \
                       frame_evidence[cid]["confidence"]:
                        frame_evidence[cid] = {
                            "timestamp" : timestamp,
                            "confidence": best_score,
                            "occlusions": occlusions
                        }

        cap.release()
        os.unlink(tmp_path)

        # Multi-frame verification
        confirmed = []
        for cid, scores in match_scores.items():
            high = [s for s in scores
                    if s >= MATCH_THRESHOLD]
            if len(high) >= MIN_FRAMES:
                avg  = float(np.mean(high))
                name = next(
                    c["name"] for c in criminals
                    if c["criminal_id"] == cid
                )
                # Log to blockchain
                tx = bc.log_identification(
                    criminal_id = cid,
                    video_file  = video.filename,
                    timestamp   = frame_evidence[cid]["timestamp"],
                    confidence  = avg,
                    frame_count = len(high)
                )
                confirmed.append({
                    "criminal_id"   : cid,
                    "name"          : name,
                    "avg_confidence": avg,
                    "frame_count"   : len(high),
                    "first_seen_at" : frame_evidence[cid]["timestamp"],
                    "occlusions"    : frame_evidence[cid]["occlusions"],
                    "blockchain_tx" : tx
                })

        return VideoAnalysisResponse(
            case_id          = case_id,
            video_file       = video.filename,
            total_frames     = total,
            processed_frames = processed,
            duration         = total / fps,
            confirmed_matches= confirmed,
            status           = "completed"
        )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))