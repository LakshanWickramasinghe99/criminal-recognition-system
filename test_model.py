# test_model.py
from ultralytics import YOLO

model = YOLO("runs/detect/runs/detect/occlusion_v3/weights/best.pt")

IMAGE_PATH = "test3.jpg"

results = model(IMAGE_PATH, conf=0.5)

for r in results:
    boxes = r.boxes
    if len(boxes) == 0:
        print("Nothing detected")
    else:
        print(f"Detected {len(boxes)} object(s):")
        for box in boxes:
            cls_id     = int(box.cls[0])
            confidence = float(box.conf[0])
            cls_name   = model.names[cls_id]
            print(f"  → {cls_name:12s} confidence: {confidence:.1%}")

results[0].save(filename="result.jpg")
print("\nResult saved as result.jpg!")