from decimal import Decimal, ROUND_HALF_UP
from typing import List, Dict, Any
from app.models import Expense


def round_money(val: float | int | Decimal) -> float:
    """Rounds monetary values to 2 decimal places using standard financial round half up."""
    d = Decimal(str(val))
    return float(d.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def calculate_budget_summary(budget_amount: float, expenses: List[Expense]) -> Dict[str, Any]:
    """
    Computes decimal-safe budget calculations from authoritative database records.
    """
    d_budget = Decimal(str(budget_amount))
    d_est_total = Decimal("0.00")
    d_act_total = Decimal("0.00")
    category_breakdown: Dict[str, Dict[str, float]] = {}

    for exp in expenses:
        e_est = Decimal(str(exp.estimated_amount or 0.0))
        e_act = Decimal(str(exp.actual_amount or 0.0))

        d_est_total += e_est
        d_act_total += e_act

        cat = exp.category or "Other"
        if cat not in category_breakdown:
            category_breakdown[cat] = {"estimated": 0.0, "actual": 0.0}

        category_breakdown[cat]["estimated"] = float(
            (Decimal(str(category_breakdown[cat]["estimated"])) + e_est).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )
        category_breakdown[cat]["actual"] = float(
            (Decimal(str(category_breakdown[cat]["actual"])) + e_act).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        )

    remaining = d_budget - d_act_total
    usage_pct = Decimal("0.0")
    if d_budget > 0:
        usage_pct = (d_act_total / d_budget) * Decimal("100.0")

    return {
        "budget_amount": float(d_budget.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "estimated_total": float(d_est_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "actual_total": float(d_act_total.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "remaining_budget": float(remaining.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)),
        "budget_usage_percentage": float(usage_pct.quantize(Decimal("0.1"), rounding=ROUND_HALF_UP)),
        "is_over_budget": d_act_total > d_budget,
        "categories": category_breakdown
    }
