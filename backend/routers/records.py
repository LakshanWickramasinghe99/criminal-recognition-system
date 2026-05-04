# backend/routers/records.py
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))

import shutil
import uuid
from blockchain_service import BlockchainService
from criminal_db import (add_evidence, add_court_decision,
                          get_criminal_full)

router  = APIRouter(prefix="/api/records", tags=["Records"])
bc      = BlockchainService()

EVIDENCE_DIR = os.path.join(
    os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))),
    "criminal_evidence"
)
os.makedirs(EVIDENCE_DIR, exist_ok=True)

# ── Add Evidence ──────────────────────────────────────────
@router.post("/evidence/{criminal_id}")
async def add_evidence_endpoint(
    criminal_id : str,
    evidence_type: str        = Form(...),
    description  : str        = Form(""),
    collected_by : str        = Form(""),
    collected_date: str       = Form(""),
    file         : UploadFile = File(None)
):
    try:
        if not bc.is_criminal_registered(criminal_id):
            raise HTTPException(
                status_code=404,
                detail=f"Criminal {criminal_id} not found"
            )

        evidence_id   = f"EV{str(uuid.uuid4())[:8].upper()}"
        file_path     = None
        file_hash     = None

        # Save file if uploaded
        if file and file.filename:
            ext       = os.path.splitext(file.filename)[1]
            file_name = f"{criminal_id}_{evidence_id}{ext}"
            file_path = os.path.join(EVIDENCE_DIR, file_name)
            with open(file_path, "wb") as f_out:
                shutil.copyfileobj(file.file, f_out)

        # Log on blockchain
        blockchain_tx = bc.log_evidence(
            criminal_id  = criminal_id,
            evidence_id  = evidence_id,
            evidence_type= evidence_type,
            file_hash    = file_hash or "",
            description  = description
        )

        # Save to SQLite
        file_hash = add_evidence(
            criminal_id     = criminal_id,
            evidence_id     = evidence_id,
            evidence_type   = evidence_type,
            description     = description,
            file_path       = file_path,
            collected_by    = collected_by,
            collected_date  = collected_date,
            blockchain_tx   = blockchain_tx
        )

        return {
            "success"       : True,
            "criminal_id"   : criminal_id,
            "evidence_id"   : evidence_id,
            "file_hash"     : file_hash,
            "blockchain_tx" : blockchain_tx,
            "message"       : f"Evidence {evidence_id} logged on blockchain"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Add Court Decision ────────────────────────────────────
@router.post("/court/{criminal_id}")
async def add_court_decision_endpoint(
    criminal_id  : str,
    decision_id  : str  = Form(""),
    court_name   : str  = Form(...),
    judge_name   : str  = Form(""),
    case_number  : str  = Form(""),
    hearing_date : str  = Form(""),
    verdict      : str  = Form(...),
    sentence     : str  = Form(""),
    sentence_start: str = Form(""),
    sentence_end : str  = Form(""),
    appeal_status: str  = Form(""),
    notes        : str  = Form(""),
):
    try:
        if not bc.is_criminal_registered(criminal_id):
            raise HTTPException(
                status_code=404,
                detail=f"Criminal {criminal_id} not found"
            )

        if not decision_id:
            decision_id = f"CD{str(uuid.uuid4())[:8].upper()}"

        # Log on blockchain
        blockchain_tx = bc.log_court_decision(
            criminal_id = criminal_id,
            decision_id = decision_id,
            court_name  = court_name,
            verdict     = verdict,
            sentence    = sentence,
        )

        # Save to SQLite
        add_court_decision(
            criminal_id  = criminal_id,
            decision_id  = decision_id,
            court_name   = court_name,
            judge_name   = judge_name,
            case_number  = case_number,
            hearing_date = hearing_date,
            verdict      = verdict,
            sentence     = sentence,
            sentence_start = sentence_start,
            sentence_end = sentence_end,
            appeal_status= appeal_status,
            notes        = notes,
            blockchain_tx= blockchain_tx
        )

        return {
            "success"      : True,
            "criminal_id"  : criminal_id,
            "decision_id"  : decision_id,
            "blockchain_tx": blockchain_tx,
            "message"      : f"Court decision {decision_id} logged"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Get Full Criminal Record ──────────────────────────────
@router.get("/full/{criminal_id}")
def get_full_record(criminal_id: str):
    record = get_criminal_full(criminal_id)
    if not record:
        raise HTTPException(
            status_code=404,
            detail=f"Criminal {criminal_id} not found"
        )
    # Add blockchain evidence and court decisions
    record['bc_evidence']  = bc.get_evidence_for_criminal(criminal_id)
    record['bc_court']     = bc.get_court_decisions_for_criminal(
        criminal_id
    )
    return record