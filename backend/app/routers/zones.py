from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc

from ..database import get_db
from ..models import Zone, Reading
from ..services.severity import classify
from ..services.attribution import compute_attribution
from ..services.forecast import compute_forecast
from ..services.interventions import rank_interventions

router = APIRouter(prefix="/api/zones", tags=["zones"])


def _trend_pct(db: Session, zone: Zone) -> float:
    six_hours_ago = datetime.utcnow() - timedelta(hours=6)
    past = (
        db.query(Reading)
        .filter(Reading.zone_id == zone.id, Reading.timestamp <= six_hours_ago)
        .order_by(desc(Reading.timestamp))
        .first()
    )
    if not past or past.aqi == 0:
        return 0.0
    return round(((zone.aqi - past.aqi) / past.aqi) * 100, 1)


@router.get("")
def list_zones(db: Session = Depends(get_db)):
    zones = db.query(Zone).all()
    out = []
    for z in zones:
        sev, color = classify(z.aqi)
        out.append({
            "id": z.id, "name": z.name, "lat": z.lat, "lon": z.lon,
            "aqi": z.aqi, "severity": sev, "severity_color": color,
            "trend": _trend_pct(db, z),
        })
    # Attention Queue ordering: worse + worsening-faster zones surface first
    out.sort(key=lambda z: (z["aqi"] * 0.7 + max(z["trend"], 0) * 8), reverse=True)
    return {"zones": out}


@router.get("/{zone_id}")
def get_zone(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone not found")

    sev, color = classify(zone.aqi)
    attribution = compute_attribution(zone.traffic, zone.construction, zone.industry, zone.wind)
    forecast = compute_forecast(zone.aqi, zone.wind)

    history_rows = (
        db.query(Reading)
        .filter(Reading.zone_id == zone.id)
        .order_by(Reading.timestamp)
        .all()
    )
    # Downsample to ~120 points so the chart payload stays small
    step = max(1, len(history_rows) // 120)
    history = [{"timestamp": r.timestamp, "aqi": round(r.aqi, 1)} for r in history_rows[::step]]

    return {
        "id": zone.id, "name": zone.name, "lat": zone.lat, "lon": zone.lon,
        "aqi": zone.aqi, "traffic": zone.traffic, "construction": zone.construction,
        "industry": zone.industry, "wind": zone.wind,
        "severity": sev, "severity_color": color,
        "attribution": attribution,
        "forecast": forecast,
        "history": history,
    }


@router.get("/{zone_id}/interventions")
def get_interventions(zone_id: int, db: Session = Depends(get_db)):
    zone = db.query(Zone).filter(Zone.id == zone_id).first()
    if not zone:
        raise HTTPException(404, "Zone not found")
    attribution = compute_attribution(zone.traffic, zone.construction, zone.industry, zone.wind)
    return {"interventions": rank_interventions(attribution)}
