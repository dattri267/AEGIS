"""
Seeds the database from data/zones_seed.csv (the same 5-zone dataset the
original prototype used) and generates a synthetic 30-day hourly history
per zone so trend sparklines / charts have something real to draw.

Run standalone: `python -m app.seed`
"""
import math
import os
import random
from datetime import datetime, timedelta

import pandas as pd

from .database import Base, engine, SessionLocal
from .models import Zone, Reading

CSV_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "zones_seed.csv")


def generate_history(zone_seed: int, base_aqi: float, base_traffic, base_construction, base_industry, base_wind, hours=24 * 30):
    rng = random.Random(zone_seed)
    now = datetime.utcnow()
    points = []
    for i in range(hours, 0, -1):
        ts = now - timedelta(hours=i)
        # Daily cycle (traffic-driven peaks) + slow drift + noise
        daily = math.sin((ts.hour / 24) * 2 * math.pi - math.pi / 2) * 0.12
        drift = math.sin(i / 96) * 0.08
        noise = rng.uniform(-0.06, 0.06)
        factor = 1 + daily + drift + noise
        points.append(Reading(
            timestamp=ts,
            aqi=max(25, base_aqi * factor),
            traffic=max(5, base_traffic * (1 + daily * 1.4 + rng.uniform(-0.05, 0.05))),
            construction=max(5, base_construction * (1 + rng.uniform(-0.08, 0.08))),
            industry=max(5, base_industry * (1 + rng.uniform(-0.06, 0.06))),
            wind=max(1, base_wind * (1 + rng.uniform(-0.2, 0.2))),
        ))
    return points


def seed():
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    df = pd.read_csv(CSV_PATH)
    db = SessionLocal()
    try:
        for i, row in df.iterrows():
            zone = Zone(
                name=row["Zone"],
                lat=float(row["Lat"]),
                lon=float(row["Lon"]),
                aqi=float(row["AQI"]),
                traffic=float(row["Traffic"]),
                construction=float(row["Construction"]),
                industry=float(row["Industry"]),
                wind=float(row["Wind"]),
            )
            db.add(zone)
            db.flush()  # get zone.id

            history = generate_history(
                zone_seed=i, base_aqi=zone.aqi, base_traffic=zone.traffic,
                base_construction=zone.construction, base_industry=zone.industry, base_wind=zone.wind,
            )
            for r in history:
                r.zone_id = zone.id
            db.add_all(history)

        db.commit()
        print(f"Seeded {len(df)} zones with {24 * 30} hourly readings each.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
