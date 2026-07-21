"""
Intervention engine.

The original prototype picked `all_actions[:2]` as "selected" and called
the rest "skipped" — order-dependent, not reasoned. Here every candidate
intervention is scored on impact vs. cost/friction/speed and *ranked*,
so the frontend can show real tradeoffs and let an operator sort by
whichever dimension matters most in the moment (fast to demo, but
consequential: friction/cost differ a lot between "divert traffic" and
"halt construction").
"""

CATALOG = {
    "traffic": {
        "action": "Divert peak-hour traffic",
        "authority": "Metropolitan Transit Authority",
        "impact": 20,
        "cost": "Low",
        "speed_hours": 2,
        "friction": 20,
    },
    "construction": {
        "action": "Halt construction activity",
        "authority": "Urban Development Board",
        "impact": 25,
        "cost": "High",
        "speed_hours": 6,
        "friction": 70,
    },
    "industry": {
        "action": "Inspect & throttle industrial output",
        "authority": "Regional Energy & Environment Grid",
        "impact": 15,
        "cost": "Moderate",
        "speed_hours": 12,
        "friction": 45,
    },
}

_COST_WEIGHT = {"Low": 1.0, "Moderate": 1.5, "High": 2.2}


def rank_interventions(attribution: dict) -> list[dict]:
    causes = {
        "traffic": attribution["traffic_pct"],
        "construction": attribution["construction_pct"],
        "industry": attribution["industry_pct"],
    }
    options = []
    for cause, pct in causes.items():
        if pct < 15:
            continue  # not a meaningful contributor here — don't recommend acting on it
        base = CATALOG[cause]
        # Scale expected impact by how much this cause actually contributes locally
        scaled_impact = round(base["impact"] * (pct / 100) * 2.1)
        score = scaled_impact / (_COST_WEIGHT[base["cost"]] * (1 + base["friction"] / 100))
        options.append({
            "action": base["action"],
            "cause": cause.capitalize(),
            "impact": scaled_impact,
            "cost": base["cost"],
            "speed_hours": base["speed_hours"],
            "friction": base["friction"],
            "authority": base["authority"],
            "score": round(score, 2),
        })

    return sorted(options, key=lambda o: o["score"], reverse=True)
