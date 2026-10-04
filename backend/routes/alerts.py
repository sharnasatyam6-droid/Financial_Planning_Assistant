from fastapi import APIRouter, HTTPException
from datetime import date
from backend.database.database import get_connection

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("/{user_id}")
def get_alerts(user_id: int):
    connection = get_connection()

    profile = connection.execute(
        """
        SELECT monthly_income,
               current_savings,
               fixed_expenses
        FROM financial_profiles
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    goal = connection.execute(
        """
        SELECT goal_name,
               target_amount,
               target_date
        FROM savings_goals
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    spending = connection.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total
        FROM expenses
        WHERE user_id = ?
        AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')
        """,
        (user_id,)
    ).fetchone()

    top_category = connection.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM expenses
        WHERE user_id = ?
        AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')
        GROUP BY category
        ORDER BY total DESC
        LIMIT 1
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Financial profile not found"
        )

    income = float(profile["monthly_income"])
    fixed_expenses = float(profile["fixed_expenses"])
    current_savings = float(profile["current_savings"])
    monthly_spending = float(spending["total"])

    alerts = []

    if goal:
        target_amount = float(goal["target_amount"])
        target_date = date.fromisoformat(goal["target_date"])

        available = max(0, income - fixed_expenses)
        remaining_goal = max(0, target_amount - current_savings)

        today = date.today()
        months = max(
            1,
            (target_date.year - today.year) * 12
            + (target_date.month - today.month)
        )

        required_saving = (remaining_goal + months - 1) // months
        spending_budget = max(0, available - required_saving)

        if spending_budget <= 0:
            alerts.append({
                "level": "critical",
                "title": "Goal budget is too tight",
                "message": "Your current income and fixed expenses leave little room for monthly spending while meeting this goal."
            })
        else:
            budget_used = (monthly_spending / spending_budget) * 100

            if budget_used >= 100:
                alerts.append({
                    "level": "critical",
                    "title": "Spending budget exceeded",
                    "message": f"You have exceeded your suggested monthly spending budget by ₹{monthly_spending - spending_budget:,.0f}."
                })
            elif budget_used >= 80:
                alerts.append({
                    "level": "warning",
                    "title": "Spending budget is near its limit",
                    "message": f"You have used {round(budget_used)}% of your suggested monthly spending budget."
                })
            elif budget_used >= 60:
                alerts.append({
                    "level": "info",
                    "title": "Spending is moving upward",
                    "message": f"You have used {round(budget_used)}% of your suggested monthly spending budget."
                })

        progress = 0

        if target_amount > 0:
            progress = (current_savings / target_amount) * 100

        if progress < 25 and months <= 3 and remaining_goal > 0:
            alerts.append({
                "level": "warning",
                "title": "Goal progress needs attention",
                "message": f"Your current savings are only {round(progress)}% of the target with about {months} month(s) remaining."
            })

    else:
        if monthly_spending > 0:
            alerts.append({
                "level": "info",
                "title": "Set a savings goal",
                "message": "Create a savings goal to get a personalized spending budget and goal-based alerts."
            })

    if top_category:
        category_amount = float(top_category["total"])

        if monthly_spending > 0:
            category_share = (category_amount / monthly_spending) * 100

            if category_share >= 40:
                alerts.append({
                    "level": "info",
                    "title": f"{top_category['category']} is your largest spending area",
                    "message": f"{top_category['category']} accounts for about {round(category_share)}% of your recorded spending this month."
                })

    if not alerts:
        alerts.append({
            "level": "success",
            "title": "Everything looks on track",
            "message": "Your recorded spending is currently within the planned range."
        })

    level_order = {
        "critical": 0,
        "warning": 1,
        "info": 2,
        "success": 3
    }

    alerts.sort(key=lambda item: level_order[item["level"]])

    return {
        "alert_count": len(alerts),
        "alerts": alerts
    }
