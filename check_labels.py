import os

CLASSES = {0: "cap", 1: "sunglasses", 2: "mask"}

def check(folder, name):
    counts = {0:0, 1:0, 2:0}
    errors = []
    files  = [f for f in os.listdir(folder) if f.endswith(".txt")]
    for fname in files:
        for line in open(os.path.join(folder, fname)):
            p = line.strip().split()
            if len(p) != 5:
                errors.append(f"{fname}: bad line")
                continue
            c = int(p[0])
            if c in counts: counts[c] += 1
            else: errors.append(f"{fname}: unknown class {c}")
    print(f"\n── {name} ({len(files)} files) ──")
    for i, n in CLASSES.items():
        print(f"  {n:12s}: {counts[i]} objects")
    print("  Errors:", len(errors) if errors else "None!")

check("dataset/labels/train", "Train")
check("dataset/labels/val",   "Val")