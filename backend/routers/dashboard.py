# backend/routers/dashboard.py
from fastapi import APIRouter, HTTPException
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(
    os.path.dirname(os.path.abspath(__file__)))))

from blockchain_service import BlockchainService
from criminal_db import get_all_criminals

router = APIRouter(
    prefix="/api/dashboard", tags=["Dashboard"]
)
bc = BlockchainService()

@router.get("/stats")
def get_stats():
    """Get system statistics."""
    try:
        total_criminals = bc.get_total_criminals()
        total_ids       = bc.get_identification_logs()
        return {
            "total_criminals"      : total_criminals,
            "total_identifications": len(total_ids),
            "blockchain_block"     : bc.w3.eth.block_number,
            "blockchain_connected" : bc.w3.is_connected()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/criminals")
def get_all_criminals_dashboard():
    """Get all criminals for dashboard."""
    try:
        ids     = bc.get_all_ids()
        records = []
        for cid in ids:
            record = bc.get_criminal(cid)
            if record:
                records.append(record)
        return {"total": len(records), "criminals": records}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/identifications")
def get_identifications():
    """Get all identification logs."""
    try:
        logs    = bc.get_identification_logs()
        results = []
        for log in logs:
            results.append({
                "criminal_id" : log[0],
                "video_file"  : log[1],
                "timestamp"   : log[2],
                "confidence"  : log[3] / 10000,
                "frame_count" : log[4],
                "detected_at" : log[5]
            })
        return {
            "total": len(results),
            "logs" : results
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))