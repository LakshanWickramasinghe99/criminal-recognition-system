# fix_labels.py
import os

LABEL_DIRS = [
    "dataset/labels/train",
    "dataset/labels/val"
]

def swap_classes(line):
    parts = line.strip().split()
    if len(parts) != 5:
        return line
    cls = int(parts[0])
    rest = parts[1:]
    # Swap 0 and 1
    if cls == 0:
        cls = 1
    elif cls == 1:
        cls = 0
    return f"{cls} {' '.join(rest)}\n"

total_fixed = 0

for label_dir in LABEL_DIRS:
    files = [f for f in os.listdir(label_dir) if f.endswith(".txt")]
    for fname in files:
        fpath = os.path.join(label_dir, fname)
        with open(fpath) as f:
            lines = f.readlines()
        new_lines = [swap_classes(l) for l in lines]
        with open(fpath, "w") as f:
            f.writelines(new_lines)
        total_fixed += 1

print(f"Fixed {total_fixed} label files — class 0 and 1 swapped!")
print("Now run: python check_labels.py to verify")