# train.py
from ultralytics import YOLO

model = YOLO("yolov8n.pt")

model.train(
    data      = "dataset.yaml",
    epochs    = 50,
    imgsz     = 640,
    batch     = 16,
    name      = "occlusion_v3",       # ← updated
    project   = "runs/detect",
    patience  = 15,
    save      = True,
    plots     = True
)

print("Done! Model saved at: runs/detect/occlusion_v3/weights/best.pt")