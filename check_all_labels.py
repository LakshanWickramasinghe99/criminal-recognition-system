# check_all_labels.py
import cv2, os, random
from pathlib import Path

IMAGES_DIR = "dataset/images/train"
LABELS_DIR = "dataset/labels/train"
OUTPUT_DIR = "label_check_all"
os.makedirs(OUTPUT_DIR, exist_ok=True)

COLORS = {0: (0,255,0), 1: (255,0,0), 2: (0,165,255)}
NAMES  = {0: "cap", 1: "sunglasses", 2: "mask"}

# Get 3 sample images per class
class_images = {0: [], 1: [], 2: []}

for label_file in os.listdir(LABELS_DIR):
    if not label_file.endswith(".txt") or "_aug_" in label_file:
        continue
    with open(os.path.join(LABELS_DIR, label_file)) as f:
        lines = f.readlines()
    classes = [int(l.split()[0]) for l in lines if l.strip()]
    for cls in set(classes):
        if cls in class_images and len(class_images[cls]) < 5:
            class_images[cls].append((label_file, lines))

for cls, samples in class_images.items():
    for label_file, lines in samples:
        stem = Path(label_file).stem
        img_path = None
        for ext in [".jpg", ".jpeg", ".png"]:
            c = os.path.join(IMAGES_DIR, stem + ext)
            if os.path.exists(c):
                img_path = c
                break
        if not img_path:
            continue

        img = cv2.imread(img_path)
        if img is None:
            continue

        h, w = img.shape[:2]
        for line in lines:
            parts = line.strip().split()
            if len(parts) != 5:
                continue
            c = int(parts[0])
            cx, cy, bw, bh = map(float, parts[1:])
            x1 = int((cx - bw/2) * w)
            y1 = int((cy - bh/2) * h)
            x2 = int((cx + bw/2) * w)
            y2 = int((cy + bh/2) * h)
            color = COLORS.get(c, (255,255,255))
            cv2.rectangle(img, (x1,y1), (x2,y2), color, 2)
            cv2.putText(img, NAMES.get(c,str(c)),
                       (x1, y1-8), cv2.FONT_HERSHEY_SIMPLEX,
                       0.8, color, 2)

        out = os.path.join(OUTPUT_DIR, f"class{cls}_{stem}.jpg")
        cv2.imwrite(out, img)

print("Done! Open label_check_all folder")
print("GREEN = cap | RED = sunglasses | ORANGE = mask")