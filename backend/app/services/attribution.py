"""
Attribution engine.

This is intentionally a clearly-labeled STUB for a real trained model
(e.g. a gradient-boosted regressor fit on historical zone data against
measured AQI). The important architectural point is the *interface*:
`compute_attribution(traffic, construction, industry, wind)` takes raw
signals and returns normalized percentages + a genuine confidence score
derived from how dominant the leading cause is — not a fixed multiplier
and not a fudge-factor confidence like `sum(pct)/1.2`.

Swap the body of this function for a real model call and nothing else
in the app needs to change — routers and the frontend only depend on
the AttributionBreakdown shape.
"""


def compute_attribution(traffic: float, construction: float, industry: float, wind: float) -> dict:
    # Wind disperses pollution — higher wind slightly discounts all source
    # contributions relative to "background" (uncontrollable regional drift).
    wind_discount = max(0.55, 1 - (wind / 40))

    raw = {
        "traffic": traffic * wind_discount,
        "construction": construction * wind_discount * 0.92,
        "industry": industry * wind_discount * 0.97,
    }
    total = sum(raw.values()) or 1.0
    pct = {k: round((v / total) * 100) for k, v in raw.items()}

    # Fix rounding drift so percentages sum to 100
    drift = 100 - sum(pct.values())
    top_key = max(pct, key=pct.get)
    pct[top_key] += drift

    ranked = sorted(pct.items(), key=lambda kv: kv[1], reverse=True)
    dominant = [k for k, v in ranked if v >= 25]

    # Confidence reflects how clearly separated the leading cause is from
    # the runner-up — a genuinely mixed/ambiguous zone should read as LESS
    # confident, not more, which a fixed-formula confidence can't express.
    margin = ranked[0][1] - ranked[1][1]
    confidence = min(96, 55 + margin)

    return {
        "traffic_pct": pct["traffic"],
        "construction_pct": pct["construction"],
        "industry_pct": pct["industry"],
        "dominant_causes": [d.capitalize() for d in dominant] or ["Mixed sources"],
        "confidence": confidence,
    }
