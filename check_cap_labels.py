# check_cap_labels.py
import cv2, os, random
from pathlib import Path

IMAGES_DIR = "dataset/images/train"
LABELS_DIR = "dataset/labels/train"
OUTPUT_DIR = "label_check"
os.makedirs(OUTPUT_DIR, exist_ok=True)

COLORS = {0: (0,255,0), 1: (255,0,0), 2: (0,0,255)}
NAMES  = {0: "cap", 1: "sunglasses", 2: "mask"}

# Find images that have cap (class 0) labels
cap_images = []
for label_file in os.listdir(LABELS_DIR):
    if not label_file.endswith(".txt"):
        continue
    # Skip augmented files
    if "_aug_" in label_file:
        continue
    with open(os.path.join(LABELS_DIR, label_file)) as f:
        lines = f.readlines()
    classes = [int(l.split()[0]) for l in lines if l.strip()]
    if 0 in classes:
        cap_images.append((label_file, lines))

# Pick 8 random cap images
random.seed(10)
samples = random.sample(cap_images, min(8, len(cap_images)))

print(f"Found {len(cap_images)} cap images — saving 8 samples to '{OUTPUT_DIR}' folder...")

for label_file, lines in samples:
    stem = Path(label_file).stem

    # Find image
    img_path = None
    for ext in [".jpg", ".jpeg", ".png"]:
        candidate = os.path.join(IMAGES_DIR, stem + ext)
        if os.path.exists(candidate):
            img_path = candidate
            break
    if img_path is None:
        continue

    img = cv2.imread(img_path)
    if img is None:
        continue

    h, w = img.shape[:2]

    for line in lines:
        parts = line.strip().split()
        if len(parts) != 5:
            continue
        cls = int(parts[0])
        cx, cy, bw, bh = map(float, parts[1:])

        # Convert from normalized to pixel coords
        x1 = int((cx - bw/2) * w)
        y1 = int((cy - bh/2) * h)
        x2 = int((cx + bw/2) * w)
        y2 = int((cy + bh/2) * h)

        color = COLORS.get(cls, (255,255,255))
        label = NAMES.get(cls, str(cls))

        cv2.rectangle(img, (x1,y1), (x2,y2), color, 2)
        cv2.putText(img, label, (x1, y1-8),
                    cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

    out_path = os.path.join(OUTPUT_DIR, stem + "_check.jpg")
    cv2.imwrite(out_path, img)

print(f"Done! Open the '{OUTPUT_DIR}' folder and check the images.")
print("GREEN box = cap | BLUE box = sunglasses | RED box = mask")