# augment_dataset.py
import os, cv2, random
import numpy as np
from pathlib import Path

IMAGES_DIR = "dataset/images/train"
LABELS_DIR = "dataset/labels/train"

# Target roughly equal numbers for all classes
# Current: cap=262, sunglasses=191, mask=170
# We want all classes around 500+
AUGMENT_CONFIG = {
    0: 2,   # cap        → x2 extra copies (262 → ~786)
    1: 3,   # sunglasses → x3 extra copies (191 → ~764)
    2: 3,   # mask       → x3 extra copies (170 → ~680)
}

def augment_image(img):
    h, w = img.shape[:2]
    augmented = []
    # Flip
    augmented.append(('flip',   cv2.flip(img, 1)))
    # Bright
    augmented.append(('bright', cv2.convertScaleAbs(img, alpha=1.3, beta=30)))
    # Dark
    augmented.append(('dark',   cv2.convertScaleAbs(img, alpha=0.7, beta=-20)))
    # Rotate
    angle = random.choice([-10, -5, 5, 10])
    M = cv2.getRotationMatrix2D((w//2, h//2), angle, 1.0)
    augmented.append(('rot',    cv2.warpAffine(img, M, (w, h))))
    return augmented

def flip_label(line):
    parts = line.strip().split()
    if len(parts) != 5:
        return line
    cls, cx, cy, w, h = parts
    return f"{cls} {1.0 - float(cx):.6f} {cy} {w} {h}\n"

# First delete existing augmented files
removed = 0
for f in os.listdir(IMAGES_DIR):
    if '_aug_' in f:
        os.remove(os.path.join(IMAGES_DIR, f))
        removed += 1
for f in os.listdir(LABELS_DIR):
    if '_aug_' in f:
        os.remove(os.path.join(LABELS_DIR, f))
        removed += 1
print(f"Removed {removed} old augmented files")

# Get images per class
class_images = {0: [], 1: [], 2: []}
for label_file in os.listdir(LABELS_DIR):
    if not label_file.endswith(".txt") or "_aug_" in label_file:
        continue
    with open(os.path.join(LABELS_DIR, label_file)) as f:
        lines = f.readlines()
    classes = [int(l.split()[0]) for l in lines if l.strip()]
    for cls in set(classes):
        if cls in class_images:
            class_images[cls].append((label_file, lines))

print(f"Original images per class:")
for cls, imgs in class_images.items():
    names = {0:'cap', 1:'sunglasses', 2:'mask'}
    print(f"  {names[cls]:12s}: {len(imgs)}")

# Augment each class
created = 0
for cls, times in AUGMENT_CONFIG.items():
    images = class_images[cls]
    augmentations = augment_image.__doc__ and [] or []

    for label_file, label_lines in images:
        stem    = Path(label_file).stem
        img_path = None
        ext_used = None
        for ext in [".jpg", ".jpeg", ".png"]:
            candidate = os.path.join(IMAGES_DIR, stem + ext)
            if os.path.exists(candidate):
                img_path = candidate
                ext_used = ext
                break
        if img_path is None:
            continue

        img = cv2.imread(img_path)
        if img is None:
            continue

        all_augs = augment_image(img)

        for i, (aug_name, aug_img) in enumerate(all_augs[:times]):
            new_name = f"{stem}_aug_{aug_name}"
            cv2.imwrite(
                os.path.join(IMAGES_DIR, new_name + ext_used),
                aug_img
            )
            new_labels = []
            for line in label_lines:
                if aug_name == 'flip':
                    new_labels.append(flip_label(line))
                else:
                    new_labels.append(line)
            with open(os.path.join(LABELS_DIR, new_name + ".txt"), "w") as f:
                f.writelines(new_labels)
            created += 1

print(f"\nCreated {created} augmented images!")
print("Run: python check_labels.py to verify balance")