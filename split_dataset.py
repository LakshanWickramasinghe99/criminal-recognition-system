import os, shutil, random
from pathlib import Path

IMAGES_SRC = "dataset/images/train"
LABELS_SRC = "dataset/labels/train"
IMAGES_VAL = "dataset/images/val"
LABELS_VAL = "dataset/labels/val"
SPLIT      = 0.8

all_images = [f for f in os.listdir(IMAGES_SRC)
              if f.lower().endswith((".jpg", ".jpeg", ".png"))]
random.seed(42)
random.shuffle(all_images)

split_idx = int(len(all_images) * SPLIT)
val_imgs  = all_images[split_idx:]

print(f"Total: {len(all_images)} | Train: {split_idx} | Val: {len(val_imgs)}")

moved, missing = 0, []
for img_name in val_imgs:
    stem  = Path(img_name).stem
    i_src = os.path.join(IMAGES_SRC, img_name)
    l_src = os.path.join(LABELS_SRC, stem + ".txt")
    shutil.move(i_src, os.path.join(IMAGES_VAL, img_name))
    if os.path.exists(l_src):
        shutil.move(l_src, os.path.join(LABELS_VAL, stem + ".txt"))
        moved += 1
    else:
        missing.append(img_name)

print(f"Moved {moved} pairs to val/")
print("Missing labels:", missing if missing else "None — all good!")