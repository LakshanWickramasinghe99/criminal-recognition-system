# enroll_blockchain.py
import cv2
from insightface.app import FaceAnalysis
from blockchain_service import BlockchainService
from criminal_db import init_db, register_criminal

print("Initializing systems...")
init_db()

# Connect to blockchain
bc = BlockchainService()

# Load face recognition
app = FaceAnalysis(
    name="buffalo_l",
    allowed_modules=["detection", "recognition"]
)
app.prepare(ctx_id=-1, det_size=(640, 640))
print("All systems ready!\n")

def enroll(image_path, criminal_id, name, age, crime_history):
    print(f"\n── Enrolling: {name} ──")

    # Detect face
    img = cv2.imread(image_path)
    if img is None:
        print(f"Cannot read: {image_path}")
        return False

    faces = app.get(img)
    if not faces:
        print(f"No face detected in: {image_path}")
        return False

    embedding = faces[0].normed_embedding
    print(f"Face detected ({faces[0].det_score:.1%} confidence)")

    # Save to SQLite (for fast searching)
    register_criminal(
        criminal_id   = criminal_id,
        name          = name,
        age           = age,
        crime_history = crime_history,
        embedding     = embedding
    )

    # Save hash to blockchain (for immutability)
    tx_hash = bc.register_criminal(
        criminal_id   = criminal_id,
        name          = name,
        age           = age,
        crime_history = crime_history,
        embedding     = embedding
    )

    if tx_hash:
        print(f"Blockchain TX: {tx_hash}")
        return True
    return False

# ── Enroll criminals ──────────────────────────────
enroll(
    image_path    = "my_photo.jpeg",
    criminal_id   = "BC001",
    name          = "Tharaka",
    age           = 25,
    crime_history = "Test entry — blockchain demo"
)

enroll(
    image_path    = "test_cap.jpg",
    criminal_id   = "BC002",
    name          = "Test Criminal Two",
    age           = 28,
    crime_history = "Theft 2020"
)

enroll(
    image_path    = "test_mask.jpg",
    criminal_id   = "BC003",
    name          = "Test Criminal Three",
    age           = 42,
    crime_history = "Fraud 2022"
)

# ── Verify on blockchain ──────────────────────────
print("\n" + "=" * 50)
print("BLOCKCHAIN VERIFICATION")
print("=" * 50)
print(f"Total criminals on blockchain: {bc.get_total_criminals()}")
print(f"Criminal IDs: {bc.get_all_ids()}")

for cid in ["BC001", "BC002", "BC003"]:
    record = bc.get_criminal(cid)
    if record:
        print(f"\n{cid} — {record['name']}")
        print(f"  Age          : {record['age']}")
        print(f"  Crime history: {record['crime_history']}")
        print(f"  Registered at: {record['registered_at']}")
        print(f"  Embedding hash: {record['embedding_hash'][:20]}...")