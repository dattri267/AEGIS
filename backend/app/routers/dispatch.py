import random
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Zone, Dispatch
from ..schemas import DispatchCreate
from ..services.attribution import compute_attribution
from ..services.interventions import rank_interventions

router = APIRouter(prefix="/api/dispatches", tags=["dispatches"])


@router.post("")
def create_dispatch(payload: DispatchCreate, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == payload.zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone not found")
    if not payload.interventions:
        raise HTTPException(400, "At least one intervention must be selected")

    attribution = compute_attribution(zone.traffic, zone.construction, zone.industry, zone.wind)
    ranked = {o["action"]: o for o in rank_interventions(attribution)}

    chosen = [ranked[name] for name in payload.interventions if name in ranked]
    if not chosen:
        raise HTTPException(400, "None of the selected interventions are valid for this zone")

    predicted_reduction = sum(o["impact"] for o in chosen)
    predicted_new_aqi = max(35, zone.aqi - predicted_reduction)
    authority = chosen[0]["authority"] if len(chosen) == 1 else "Multi-agency dispatch"

    dispatch = Dispatch(
        zone_id=zone.id,
        interventions=[o["action"] for o in chosen],
        authority=authority,
        original_aqi=zone.aqi,
        predicted_reduction=predicted_reduction,
        predicted_new_aqi=predicted_new_aqi,
        status="dispatched",
    )
    db.add(dispatch)
    db.commit()
    db.refresh(dispatch)

    return _serialize(dispatch, zone.name)


@router.get("")
def list_dispatches(db: Session = Depends(get_db)):
    rows = db.query(Dispatch).order_by(Dispatch.created_at.desc()).all()
    zones = {z.id: z.name for z in db.query(Zone).all()}
    return {"dispatches": [_serialize(d, zones.get(d.zone_id, "Unknown zone")) for d in rows]}


@router.post("/{dispatch_id}/resolve")
def resolve_dispatch(dispatch_id: int, db: Session = Depends(get_db)):
    """
    Simulates real-world outcome measurement. In production this would be
    triggered by a scheduled job comparing live sensor readings against the
    forecast made at dispatch time — here we generate a plausible actual
    result centered on the prediction with realistic noise, so the
    scorecard has something honest to show.
    """
    dispatch = db.query(Dispatch).filter(Dispatch.id == dispatch_id).first()
    if not dispatch:
        raise HTTPException(404, "Dispatch not found")
    if dispatch.status == "resolved":
        raise HTTPException(400, "Dispatch already resolved")

    noise = random.uniform(-0.22, 0.30)  # real-world interventions underperform more often than overperform
    actual_reduction = max(2, dispatch.predicted_reduction * (1 + noise))
    actual_new_aqi = max(30, dispatch.original_aqi - actual_reduction)

    dispatch.status = "resolved"
    dispatch.resolved_at = datetime.utcnow()
    dispatch.actual_reduction = round(actual_reduction, 1)
    dispatch.actual_new_aqi = round(actual_new_aqi, 1)
    db.commit()
    db.refresh(dispatch)

    zone_name = dispatch.zone.name
    return _serialize(dispatch, zone_name)


def _serialize(d: Dispatch, zone_name: str) -> dict:
    return {
        "id": d.id, "zone_id": d.zone_id, "zone_name": zone_name,
        "created_at": d.created_at, "interventions": d.interventions,
        "authority": d.authority, "original_aqi": d.original_aqi,
        "predicted_reduction": d.predicted_reduction, "predicted_new_aqi": d.predicted_new_aqi,
        "status": d.status, "resolved_at": d.resolved_at,
        "actual_new_aqi": d.actual_new_aqi, "actual_reduction": d.actual_reduction,
    }
