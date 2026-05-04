# detect_in_video.py
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from ultralytics import YOLO
from criminal_db import init_db, get_all_criminals, log_identification
from collections import defaultdict
from datetime import datetime
import os

# ── Configuration ─────────────────────────────────
VIDEO_PATH      = "test_video.mp4"  # your uploaded video
OUTPUT_PATH     = "output_video.mp4"
MATCH_THRESHOLD = 0.4    # cosine similarity threshold
MIN_FRAMES      = 3      # must match in this many frames
FRAME_SKIP      = 15     # process every 15th frame (1 per ~0.5sec)
# ──────────────────────────────────────────────────

print("Loading models...")
# Face recognition
face_app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
face_app.prepare(ctx_id=-1, det_size=(640, 640))

# Occlusion detector (your trained YOLOv8)
yolo = YOLO("runs/detect/runs/detect/occlusion_v3/weights/best.pt")

print("Loading criminal registry...")
init_db()
criminals = get_all_criminals()
print(f"Loaded {len(criminals)} criminals from database\n")

if not criminals:
    print("No criminals in database!")
    print("Run: python enroll_criminal.py first")
    exit()

# Track matches across frames
match_scores  = defaultdict(list)   # {criminal_id: [scores]}
frame_evidence = {}                  # {criminal_id: best frame info}

# Open video
cap = cv2.VideoCapture(VIDEO_PATH)
if not cap.isOpened():
    print(f"Cannot open video: {VIDEO_PATH}")
    exit()

# Video properties
fps        = cap.get(cv2.CAP_PROP_FPS)
width      = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
height     = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
total      = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
duration   = total / fps

print(f"Video: {VIDEO_PATH}")
print(f"Duration: {duration:.1f}s | FPS: {fps} | "
      f"Frames: {total} | Resolution: {width}x{height}\n")

# Output video writer
fourcc = cv2.VideoWriter_fourcc(*"mp4v")
out    = cv2.VideoWriter(OUTPUT_PATH, fourcc, fps, (width, height))

frame_num    = 0
processed    = 0
detections   = 0

print("Processing video...")
print("-" * 50)

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    frame_num += 1
    timestamp = frame_num / fps

    # Process every Nth frame
    if frame_num % FRAME_SKIP != 0:
        out.write(frame)
        continue

    processed += 1
    annotated = frame.copy()

    # ── 1. Detect occlusions with YOLOv8 ──────────
    yolo_results = yolo(frame, conf=0.5, verbose=False)
    for r in yolo_results:
        for box in r.boxes:
            x1,y1,x2,y2 = map(int, box.xyxy[0])
            cls_name = yolo.names[int(box.cls[0])]
            conf     = float(box.conf[0])
            # Draw occlusion box in yellow
            cv2.rectangle(annotated, (x1,y1), (x2,y2),
                         (0,255,255), 2)
            cv2.putText(annotated, f"{cls_name} {conf:.0%}",
                       (x1, y1-8),
                       cv2.FONT_HERSHEY_SIMPLEX,
                       0.6, (0,255,255), 2)

    # ── 2. Detect faces ───────────────────────────
    faces = face_app.get(frame)

    for face in faces:
        bbox = face.bbox.astype(int)
        emb  = face.normed_embedding
        x1,y1,x2,y2 = bbox

        # ── 3. Compare against all criminals ──────
        best_match    = None
        best_score    = 0

        for criminal in criminals:
            score = float(np.dot(emb, criminal["embedding"]))
            if score > best_score:
                best_score = score
                best_match = criminal

        # ── 4. Track match across frames ──────────
        if best_score >= MATCH_THRESHOLD and best_match:
            cid = best_match["criminal_id"]
            match_scores[cid].append(best_score)

            # Save best evidence frame
            if cid not in frame_evidence or \
               best_score > frame_evidence[cid]["confidence"]:
                frame_evidence[cid] = {
                    "timestamp":  timestamp,
                    "confidence": best_score,
                    "frame_num":  frame_num
                }

            # Draw RED box — match found
            cv2.rectangle(annotated, (x1,y1), (x2,y2),
                         (0,0,255), 3)
            label = (f"MATCH: {best_match['name']} "
                    f"{best_score:.0%}")
            cv2.putText(annotated, label, (x1, y1-10),
                       cv2.FONT_HERSHEY_SIMPLEX,
                       0.7, (0,0,255), 2)
            detections += 1
            print(f"  Frame {frame_num:4d} "
                  f"({timestamp:.1f}s) — "
                  f"MATCH: {best_match['name']} "
                  f"({best_score:.1%})")
        else:
            # Draw GREEN box — unknown face
            cv2.rectangle(annotated, (x1,y1), (x2,y2),
                         (0,255,0), 2)
            cv2.putText(annotated, "Unknown",
                       (x1, y1-8),
                       cv2.FONT_HERSHEY_SIMPLEX,
                       0.6, (0,255,0), 2)

    # Add frame info overlay
    cv2.putText(annotated,
               f"Frame: {frame_num} | Time: {timestamp:.1f}s",
               (10, 30),
               cv2.FONT_HERSHEY_SIMPLEX,
               0.7, (255,255,255), 2)

    out.write(annotated)

cap.release()
out.release()

# ── 5. Multi-frame verification ───────────────────
print("\n" + "=" * 50)
print("MULTI-FRAME VERIFICATION RESULTS")
print("=" * 50)

confirmed = []
for cid, scores in match_scores.items():
    high_conf = [s for s in scores if s >= MATCH_THRESHOLD]
    if len(high_conf) >= MIN_FRAMES:
        avg_conf = np.mean(high_conf)
        confirmed.append({
            "criminal_id": cid,
            "name": next(
                c["name"] for c in criminals
                if c["criminal_id"] == cid
            ),
            "avg_confidence": avg_conf,
            "frame_count":    len(high_conf),
            "timestamp":      frame_evidence[cid]["timestamp"]
        })

if confirmed:
    print(f"\n🚨 {len(confirmed)} CRIMINAL(S) IDENTIFIED!\n")
    for match in sorted(confirmed,
                key=lambda x: x["avg_confidence"],
                reverse=True):
        print(f"  Name        : {match['name']}")
        print(f"  Criminal ID : {match['criminal_id']}")
        print(f"  Confidence  : {match['avg_confidence']:.1%}")
        print(f"  Frames matched: {match['frame_count']}")
        print(f"  First seen  : {match['timestamp']:.1f}s")
        print()
        # Log to database
        log_identification(
            criminal_id = match["criminal_id"],
            video_file  = VIDEO_PATH,
            timestamp   = match["timestamp"],
            confidence  = match["avg_confidence"],
            frame_count = match["frame_count"]
        )
        print(f"  Logged to database ✅")
else:
    print("\nNo criminals confirmed after multi-frame verification")
    print(f"(Raw detections: {detections} | "
          f"Min frames required: {MIN_FRAMES})")

print(f"\nProcessed {processed} frames from {total} total")
print(f"Output video saved: {OUTPUT_PATH}")