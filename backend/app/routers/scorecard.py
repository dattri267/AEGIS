from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Dispatch, Zone
from .dispatch import _serialize

router = APIRouter(prefix="/api/scorecard", tags=["scorecard"])


@router.get("")
def scorecard(db: Session = Depends(get_db)):
    all_dispatches = db.query(Dispatch).order_by(Dispatch.created_at.desc()).all()
    resolved = [d for d in all_dispatches if d.status == "resolved"]
    zones = {z.id: z.name for z in db.query(Zone).all()}

    if resolved:
        avg_predicted = sum(d.predicted_reduction for d in resolved) / len(resolved)
        avg_actual = sum(d.actual_reduction for d in resolved) / len(resolved)
        # Accuracy = how close actual landed to predicted, averaged, floored at 0
        errors = [abs(d.actual_reduction - d.predicted_reduction) / max(d.predicted_reduction, 1) for d in resolved]
        accuracy = max(0, 100 - (sum(errors) / len(errors)) * 100)
    else:
        avg_predicted = avg_actual = accuracy = 0.0

    return {
        "total_dispatches": len(all_dispatches),
        "resolved_dispatches": len(resolved),
        "avg_predicted_reduction": round(avg_predicted, 1),
        "avg_actual_reduction": round(avg_actual, 1),
        "prediction_accuracy_pct": round(accuracy, 1),
        "by_dispatch": [_serialize(d, zones.get(d.zone_id, "Unknown zone")) for d in all_dispatches],
    }
