# backend/models/schemas.py
from pydantic import BaseModel
from typing import Optional, List

# ── Personal Information ──────────────────────────────────
class PersonalInfo(BaseModel):
    full_name       : str
    dob             : Optional[str] = None
    nic_number      : Optional[str] = None
    gender          : Optional[str] = None
    nationality     : Optional[str] = "Sri Lankan"
    address         : Optional[str] = None
    phone           : Optional[str] = None
    occupation      : Optional[str] = None
    height_cm       : Optional[int] = None
    weight_kg       : Optional[int] = None
    eye_color       : Optional[str] = None
    distinguishing_marks: Optional[str] = None

# ── Crime Details ─────────────────────────────────────────
class CrimeDetail(BaseModel):
    case_id         : str
    crime_type      : str
    crime_description: Optional[str] = None
    crime_date      : Optional[str] = None
    crime_location  : Optional[str] = None
    crime_status    : Optional[str] = "Wanted"
    weapons_used    : Optional[str] = None
    victims_count   : Optional[int] = None
    damage_value    : Optional[str] = None

# ── Evidence ──────────────────────────────────────────────
class Evidence(BaseModel):
    evidence_id     : str
    evidence_type   : str       # image, video, document, forensic
    description     : Optional[str] = None
    file_hash       : Optional[str] = None  # stored on blockchain
    collected_by    : Optional[str] = None
    collected_date  : Optional[str] = None
    storage_location: Optional[str] = None

# ── Court Decision ────────────────────────────────────────
class CourtDecision(BaseModel):
    decision_id     : str
    court_name      : str
    judge_name      : Optional[str] = None
    case_number     : Optional[str] = None
    hearing_date    : Optional[str] = None
    verdict         : Optional[str] = None   # Guilty, Not Guilty, Pending
    sentence        : Optional[str] = None
    sentence_start  : Optional[str] = None
    sentence_end    : Optional[str] = None
    appeal_status   : Optional[str] = None
    notes           : Optional[str] = None

# ── Officer Information ───────────────────────────────────
class OfficerInfo(BaseModel):
    officer_id      : str
    officer_name    : str
    badge_number    : Optional[str] = None
    station         : str
    rank            : Optional[str] = None
    contact         : Optional[str] = None

# ── Full Criminal Record ──────────────────────────────────
class CriminalRecord(BaseModel):
    # Core
    criminal_id     : str
    age             : int
    # Sections
    personal        : Optional[PersonalInfo] = None
    crimes          : Optional[List[CrimeDetail]] = []
    evidences       : Optional[List[Evidence]] = []
    court_decisions : Optional[List[CourtDecision]] = []
    officer         : Optional[OfficerInfo] = None
    # Blockchain
    embedding_hash  : Optional[str] = None
    registered_at   : Optional[int] = None
    registered_by   : Optional[str] = None
    is_active       : Optional[bool] = True

# ── API Responses ─────────────────────────────────────────
class EnrollmentResponse(BaseModel):
    success         : bool
    criminal_id     : str
    name            : str
    blockchain_tx   : Optional[str] = None
    message         : str

class AddEvidenceResponse(BaseModel):
    success         : bool
    criminal_id     : str
    evidence_id     : str
    file_hash       : Optional[str] = None
    blockchain_tx   : Optional[str] = None
    message         : str

class AddCourtDecisionResponse(BaseModel):
    success         : bool
    criminal_id     : str
    decision_id     : str
    blockchain_tx   : Optional[str] = None
    message         : str

class IdentificationResult(BaseModel):
    criminal_id     : str
    name            : str
    avg_confidence  : float
    frame_count     : int
    first_seen_at   : float
    occlusions      : List[str]
    blockchain_tx   : Optional[str] = None

class VideoAnalysisResponse(BaseModel):
    case_id         : str
    video_file      : str
    total_frames    : int
    processed_frames: int
    duration        : float
    confirmed_matches: List[IdentificationResult]
    status          : str