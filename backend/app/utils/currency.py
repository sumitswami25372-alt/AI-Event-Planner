"""
Currency and budget utilities.

Improvements:
- category_breakdown uses Decimal accumulators directly (avoids repeated
  Decimal(str(...)) conversions inside the loop)
- Quantize called once per field at the end rather than on every addition
- Type hints use built-in generics (Python 3.9+)
"""
from __future__ import annotations

from decimal import ROUND_HALF_UP, Decimal
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from app.models import Expense

_CENT = Decimal("0.01")
_TENTH = Decimal("0.1")


def round_money(val: float | Decimal) -> float:
    """Round a monetary value to 2 decimal places (round-half-up)."""
    return float(Decimal(str(val)).quantize(_CENT, rounding=ROUND_HALF_UP))


def calculate_budget_summary(
    budget_amount: float, expenses: list[Expense]
) -> dict[str, Any]:
    """
    Compute decimal-safe budget calculations from authoritative DB records.

    Returns a dict compatible with BudgetSummary schema.
    """
    d_budget = Decimal(str(budget_amount))
    d_est_total = Decimal(0)
    d_act_total = Decimal(0)

    # Use Decimal accumulators per category to avoid repeated str-conversion
    cat_est: dict[str, Decimal] = {}
    cat_act: dict[str, Decimal] = {}

    for exp in expenses:
        e_est = Decimal(str(exp.estimated_amount or 0.0))
        e_act = Decimal(str(exp.actual_amount or 0.0))
        d_est_total += e_est
        d_act_total += e_act

        cat = exp.category or "Other"
        cat_est[cat] = cat_est.get(cat, Decimal(0)) + e_est
        cat_act[cat] = cat_act.get(cat, Decimal(0)) + e_act

    remaining = d_budget - d_act_total
    usage_pct = (
        (d_act_total / d_budget * Decimal(100)).quantize(_TENTH, rounding=ROUND_HALF_UP)
        if d_budget > 0
        else Decimal("0.0")
    )

    # Quantize category totals once at serialisation time
    categories: dict[str, dict[str, float]] = {
        cat: {
            "estimated": float(cat_est[cat].quantize(_CENT, rounding=ROUND_HALF_UP)),
            "actual": float(cat_act[cat].quantize(_CENT, rounding=ROUND_HALF_UP)),
        }
        for cat in cat_est
    }

    return {
        "budget_amount": float(d_budget.quantize(_CENT, rounding=ROUND_HALF_UP)),
        "estimated_total": float(d_est_total.quantize(_CENT, rounding=ROUND_HALF_UP)),
        "actual_total": float(d_act_total.quantize(_CENT, rounding=ROUND_HALF_UP)),
        "remaining_budget": float(remaining.quantize(_CENT, rounding=ROUND_HALF_UP)),
        "budget_usage_percentage": float(usage_pct),
        "is_over_budget": d_act_total > d_budget,
        "categories": categories,
    }
