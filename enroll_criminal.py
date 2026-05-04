# enroll_criminal.py
import cv2
from insightface.app import FaceAnalysis
from criminal_db import init_db, register_criminal

init_db()
print("Loading face recognition model...")
app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))
print("Model ready!\n")

def enroll(image_path, criminal_id, name, age, crime_history):
    img = cv2.imread(image_path)
    if img is None:
        print(f"Cannot read image: {image_path}")
        return False
    faces = app.get(img)
    if not faces:
        print(f"No face detected in: {image_path}")
        return False
    embedding = faces[0].normed_embedding
    print(f"Face detected — confidence: {faces[0].det_score:.1%}")
    return register_criminal(
        criminal_id   = criminal_id,
        name          = name,
        age           = age,
        crime_history = crime_history,
        embedding     = embedding
    )

# Enroll yourself as test criminal
enroll(
    image_path    = "my_photo.jpeg",   # your clear face photo
    criminal_id   = "CR004",
    name          = "Thara (Test Criminal)",
    age           = 25,
    crime_history = "Test entry — occlusion demo"
)

print("\nDone! Now run: python test_occlusion.py")r