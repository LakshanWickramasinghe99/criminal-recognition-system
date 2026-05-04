# test_occlusion.py
import cv2
import numpy as np
from insightface.app import FaceAnalysis
from criminal_db import get_all_criminals

print("Loading model...")
app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))

# Load criminals from database
criminals = get_all_criminals()
print(f"Loaded {len(criminals)} criminals\n")

def identify(image_path):
    """Try to identify person in image against criminal database."""
    print(f"── Testing: {image_path} ──")
    img = cv2.imread(image_path)
    if img is None:
        print(f"  Cannot read image!")
        return

    faces = app.get(img)
    if not faces:
        print(f"  No face detected ❌")
        return

    print(f"  Face detected ({faces[0].det_score:.1%} confidence)")
    emb = faces[0].normed_embedding

    # Compare against all criminals
    best_match = None
    best_score = 0
    for criminal in criminals:
        score = float(np.dot(emb, criminal["embedding"]))
        if score > best_score:
            best_score = score
            best_match = criminal

    if best_score >= 0.4:
        print(f"  ✅ MATCH FOUND!")
        print(f"     Name      : {best_match['name']}")
        print(f"     ID        : {best_match['criminal_id']}")
        print(f"     Confidence: {best_score:.1%}")
    elif best_score >= 0.2:
        print(f"  ⚠️  POSSIBLE MATCH: {best_match['name']} "
              f"({best_score:.1%}) — needs more frames")
    else:
        print(f"  ❌ No match (best score: {best_score:.1%})")
    print()

# ── Run all 4 tests ───────────────────────────────
print("=" * 50)
print("OCCLUSION IDENTIFICATION TEST")
print("=" * 50 + "\n")

identify("my_photo.jpeg")         # should match ✅
identify("my_mask.jpeg")          # should match ✅ (research goal!)
identify("my_sunglasses.jpeg")    # should match ✅ (research goal!)
identify("my_mask_glasses.jpeg")  # hardest test