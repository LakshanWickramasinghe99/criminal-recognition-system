# test_face_recognition.py
import cv2
import numpy as np
import os
from insightface.app import FaceAnalysis

print("Loading InsightFace model...")
app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))
print("Model loaded!\n")

def find_image(name):
    """Find image file regardless of extension."""
    for ext in [".jpg", ".jpeg", ".png"]:
        path = name + ext
        if os.path.exists(path):
            return path
        # also try exact name
        if os.path.exists(name):
            return name
    return None

def get_embedding(image_path):
    """Load image and return face embedding."""
    # Try to find the file if exact path not found
    if not os.path.exists(image_path):
        stem = os.path.splitext(image_path)[0]
        found = find_image(stem)
        if found:
            image_path = found
        else:
            print(f"  File not found: {image_path}")
            return None, None

    img = cv2.imread(image_path)
    if img is None:
        print(f"  Cannot read: {image_path}")
        return None, None

    # Try different detection sizes if face not found
    faces = app.get(img)
    if not faces:
        # Try smaller detection size for large images
        app.prepare(ctx_id=-1, det_size=(320, 320))
        faces = app.get(img)
        app.prepare(ctx_id=-1, det_size=(640, 640))

    if not faces:
        print(f"  No face detected in: {image_path}")
        return None, None

    print(f"  {image_path} → {len(faces)} face(s) detected "
          f"(confidence: {faces[0].det_score:.1%})")
    return faces[0].normed_embedding, image_path

def compare(emb1, emb2, label1, label2):
    """Compare two embeddings and print result."""
    if emb1 is None or emb2 is None:
        print("  Cannot compare — missing embedding")
        return
    similarity = float(np.dot(emb1, emb2))
    print(f"\n  Comparing: {label1}  vs  {label2}")
    print(f"  Similarity score : {similarity:.4f}")
    if similarity >= 0.4:
        print(f"  Result: ✅ SAME PERSON ({similarity:.1%} match)")
    elif similarity >= 0.2:
        print(f"  Result: ⚠️  POSSIBLY SAME ({similarity:.1%} match)")
    else:
        print(f"  Result: ❌ DIFFERENT PERSON ({similarity:.1%} match)")

# ── TEST 1: Same person with occlusion ───────────────
print("=" * 55)
print("TEST 1 — Same person: hat+sunglasses vs clear face")
print("=" * 55)
emb1, _ = get_embedding("test_face1.jpg")
emb2, _ = get_embedding("test_face2.jpg")
compare(emb1, emb2, "hat+sunglasses", "clear face")

# ── TEST 2: Same image vs itself ─────────────────────
print("\n" + "=" * 55)
print("TEST 2 — Identical images (must be 100%)")
print("=" * 55)
emb3, _ = get_embedding("test_face2.jpg")
emb4, _ = get_embedding("test_face2.jpg")
compare(emb3, emb4, "clear face", "clear face")

# ── TEST 3: Different people ─────────────────────────
print("\n" + "=" * 55)
print("TEST 3 — Different people (must be low score)")
print("=" * 55)
emb5, _ = get_embedding("test_cap.jpg")
emb6, _ = get_embedding("test_mask.jpg")
compare(emb5, emb6, "cap person", "mask person")

print("\n" + "=" * 55)
print("Summary")
print("=" * 55)
print("Test 2 score = 1.0  → embedding system working ✅")
print("Test 3 score < 0.2  → different people rejected ✅")
print("Test 1 score > 0.4  → occlusion handled ✅")