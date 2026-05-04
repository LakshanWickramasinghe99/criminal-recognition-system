# test_all.py
from ultralytics import YOLO

model = YOLO("runs/detect/runs/detect/occlusion_v3/weights/best.pt")

test_images = {
    "Cap image"       : "test_cap.jpg",
    "Sunglasses image": "test_sunglasses.jpg",
    "Mask image"      : "test_mask.jpg"
}

for label, path in test_images.items():
    print(f"\n── {label} ──")
    try:
        results = model(path, conf=0.5)
        boxes = results[0].boxes
        if len(boxes) == 0:
            print("  Nothing detected")
        else:
            for box in boxes:
                cls_name = model.names[int(box.cls[0])]
                conf     = float(box.conf[0])
                print(f"  → {cls_name:12s} confidence: {conf:.1%}")
        results[0].save(filename=f"result_{label.split()[0].lower()}.jpg")
    except FileNotFoundError:
        print(f"  Image not found — make sure {path} exists in project folder")

print("\nDone! Check result_cap.jpg, result_sunglasses.jpg, result_mask.jpg")