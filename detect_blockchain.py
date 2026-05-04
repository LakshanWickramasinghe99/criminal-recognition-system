# detect_blockchain.py
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from ultralytics import YOLO
from criminal_db import init_db, get_all_criminals
from blockchain_service import BlockchainService
from collections import defaultdict

# ── Configuration ─────────────────────────────────
VIDEO_PATH      = "test_video.mp4"
OUTPUT_PATH     = "output_blockchain.mp4"
MATCH_THRESHOLD = 0.4
MIN_FRAMES      = 3
FRAME_SKIP      = 15
# ──────────────────────────────────────────────────

print("Initializing all systems...")

# Initialize blockchain
bc = BlockchainService()

# Initialize database
init_db()
all_criminals = get_all_criminals()

# Only use criminals that exist on blockchain
bc_ids    = bc.get_all_ids()
criminals = [c for c in all_criminals
             if c["criminal_id"] in bc_ids]

print(f"Total in database  : {len(all_criminals)}")
print(f"Blockchain IDs     : {bc_ids}")
print(f"Synced criminals   : {len(criminals)}")

if not criminals:
    print("\nNo criminals synced with blockchain!")
    print("Run: python enroll_blockchain.py first")
    exit()

# Initialize face recognition
face_app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
face_app.prepare(ctx_id=-1, det_size=(640, 640))

# Initialize occlusion detector
yolo = YOLO(
    "runs/detect/runs/detect/occlusion_v3/weights/best.pt"
)

print("All systems ready!\n")

# Tracking variables
match_scores   = defaultdict(list)
frame_evidence = {}

# Open video
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print(f"Cannot open: {VIDEO_PATH}")
    exit()

fps    = cap.get(cv2.CAP_PROP_FPS)
width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total  = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

print(f"Video    : {VIDEO_PATH}")
print(f"Duration : {total/fps:.1f}s")
print(f"FPS      : {fps:.1f}")
print(f"Resolution: {width}x{height}\n")
print("Processing frames...")
print("-" * 55)

# Output video writer
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out    = cv2.VideoWriter(
    OUTPUT_PATH, fourcc, fps, (width, height)
)

frame_num = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_num += 1
    timestamp  = frame_num / fps
    annotated  = frame.copy()

    # Write non-processed frames as-is
    if frame_num % FRAME_SKIP != 0:
        out.write(frame)
        continue

    # Resize for detection if 4K
    scale = 1.0
    if width > 1920:
        scale = 1920 / width
        small = cv2.resize(
            frame,
            (int(width * scale), int(height * scale))
        )
    else:
        small = frame

    # ── 1. Detect occlusions (YOLOv8) ────────────
    yolo_results = yolo(small, conf=0.5, verbose=False)
    occlusions   = []

    for r in yolo_results:
        for box in r.boxes:
            x1,y1,x2,y2 = map(int, box.xyxy[0])
            if scale < 1.0:
                x1 = int(x1 / scale)
                y1 = int(y1 / scale)
                x2 = int(x2 / scale)
                y2 = int(y2 / scale)
            cls_name = yolo.names[int(box.cls[0])]
            conf     = float(box.conf[0])
            occlusions.append(cls_name)

            # Yellow box for occlusion
            cv2.rectangle(
                annotated, (x1,y1), (x2,y2),
                (0,255,255), 2
            )
            cv2.putText(
                annotated,
                f"{cls_name} {conf:.0%}",
                (x1, y1-8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (0,255,255), 2
            )

    # ── 2. Detect faces (InsightFace) ─────────────
    faces = face_app.get(small)

    for face in faces:
        bbox = face.bbox.astype(float)
        if scale < 1.0:
            bbox = bbox / scale
        bbox = bbox.astype(int)
        emb  = face.normed_embedding
        x1,y1,x2,y2 = bbox

        # ── 3. Match against blockchain criminals ──
        best_match = None
        best_score = 0

        for criminal in criminals:
            score = float(
                np.dot(emb, criminal["embedding"])
            )
            if score > best_score:
                best_score = score
                best_match = criminal

        # ── 4. Track across frames ─────────────────
        if best_score >= MATCH_THRESHOLD and best_match:
            cid = best_match["criminal_id"]
            match_scores[cid].append(best_score)

            if cid not in frame_evidence or \
               best_score > frame_evidence[cid]["confidence"]:
                frame_evidence[cid] = {
                    "timestamp" : timestamp,
                    "confidence": best_score,
                    "frame"     : frame_num,
                    "occlusions": occlusions
                }

            # Red box — criminal matched
            cv2.rectangle(
                annotated, (x1,y1), (x2,y2),
                (0,0,255), 3
            )
            label = (f"MATCH: {best_match['name']} "
                    f"{best_score:.0%}")
            cv2.putText(
                annotated, label,
                (x1, y1-10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.7, (0,0,255), 2
            )
            print(f"  Frame {frame_num:4d} "
                  f"({timestamp:.1f}s) — "
                  f"MATCH: {best_match['name']} "
                  f"({best_score:.1%}) "
                  f"Occlusions: {occlusions}")
        else:
            # Green box — unknown face
            cv2.rectangle(
                annotated, (x1,y1), (x2,y2),
                (0,255,0), 2
            )
            cv2.putText(
                annotated, "Unknown",
                (x1, y1-8),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.6, (0,255,0), 2
            )

    # Frame info overlay
    cv2.putText(
        annotated,
        f"Frame:{frame_num} | Time:{timestamp:.1f}s | "
        f"Criminals:{len(criminals)}",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.6, (255,255,255), 2
    )
    out.write(annotated)

cap.release()
out.release()

# ── 5. Multi-frame verification ───────────────────
print("\n" + "=" * 55)
print("MULTI-FRAME VERIFICATION + BLOCKCHAIN LOGGING")
print("=" * 55)

confirmed = []
for cid, scores in match_scores.items():
    high = [s for s in scores if s >= MATCH_THRESHOLD]
    if len(high) >= MIN_FRAMES:
        avg_conf = np.mean(high)
        name = next(
            c["name"] for c in criminals
            if c["criminal_id"] == cid
        )
        confirmed.append({
            "criminal_id"   : cid,
            "name"          : name,
            "avg_confidence": avg_conf,
            "frame_count"   : len(high),
            "timestamp"     : frame_evidence[cid]["timestamp"],
            "occlusions"    : frame_evidence[cid]["occlusions"]
        })

if confirmed:
    print(f"\n🚨 {len(confirmed)} CRIMINAL(S) CONFIRMED!\n")
    for match in sorted(
        confirmed,
        key=lambda x: x["avg_confidence"],
        reverse=True
    ):
        print(f"  Name          : {match['name']}")
        print(f"  ID            : {match['criminal_id']}")
        print(f"  Avg confidence: {match['avg_confidence']:.1%}")
        print(f"  Frames matched: {match['frame_count']}")
        print(f"  First seen at : {match['timestamp']:.1f}s")
        print(f"  Occlusions    : {match['occlusions']}")

        # Log to blockchain
        print(f"\n  Logging to blockchain...")
        tx = bc.log_identification(
            criminal_id = match["criminal_id"],
            video_file  = VIDEO_PATH,
            timestamp   = match["timestamp"],
            confidence  = match["avg_confidence"],
            frame_count = match["frame_count"]
        )
        if tx:
            print(f"  ✅ Blockchain TX: {tx}")
        else:
            print(f"  ❌ Blockchain logging failed")
        print()

    # Show blockchain audit trail
    print("=" * 55)
    print("BLOCKCHAIN AUDIT TRAIL")
    print("=" * 55)
    logs = bc.get_identification_logs()
    print(f"Total identification events: {len(logs)}")
    for i, log in enumerate(logs):
        print(f"\n  Event {i+1}:")
        print(f"    Criminal ID : {log[0]}")
        print(f"    Video file  : {log[1]}")
        print(f"    Confidence  : {log[3]/10000:.1%}")
        print(f"    Frames      : {log[4]}")
        print(f"    Block time  : {log[5]}")
else:
    print(
        "\nNo criminals confirmed after "
        "multi-frame verification"
    )
    print(f"Threshold : {MATCH_THRESHOLD}")
    print(f"Min frames: {MIN_FRAMES}")

print(f"\nOutput video: {OUTPUT_PATH}")
print("Open output_blockchain.mp4 to see detections!")