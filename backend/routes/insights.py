from fastapi import APIRouter, HTTPException
from backend.database.database import get_connection

router = APIRouter(prefix="/insights", tags=["Insights"])

@router.get("/{user_id}")
def get_insights(user_id: int):
    connection = get_connection()

    profile = connection.execute(
        "SELECT monthly_income, current_savings, fixed_expenses FROM financial_profiles WHERE user_id = ?",
        (user_id,)
    ).fetchone()

    goal = connection.execute(
        "SELECT goal_name, target_amount FROM savings_goals WHERE user_id = ?",
        (user_id,)
    ).fetchone()

    spending = connection.execute(
        """
        SELECT COALESCE(SUM(amount), 0) AS total, COUNT(*) AS count
        FROM expenses
        WHERE user_id = ?
        AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')
        """,
        (user_id,)
    ).fetchone()

    categories = connection.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM expenses
        WHERE user_id = ?
        AND strftime('%Y-%m', expense_date) = strftime('%Y-%m', 'now')
        GROUP BY category
        ORDER BY total DESC
        """,
        (user_id,)
    ).fetchall()

    connection.close()

    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    income = float(profile["monthly_income"])
    fixed = float(profile["fixed_expenses"])
    savings = float(profile["current_savings"])
    monthly_spending = float(spending["total"])

    available = max(0, income - fixed)
    spending_rate = round((monthly_spending / income) * 100) if income > 0 else 0
    savings_capacity = max(0, available - monthly_spending)

    score = 100

    if income <= 0:
        score = 0
    else:
        if spending_rate > 80:
            score -= 35
        elif spending_rate > 60:
            score -= 20
        elif spending_rate > 40:
            score -= 10

        if savings_capacity <= 0:
            score -= 30
        elif savings_capacity < income * 0.10:
            score -= 15
        elif savings_capacity >= income * 0.20:
            score += 5

    score = max(0, min(100, score))

    if score >= 80:
        health = "Strong"
        health_text = "Your recorded spending leaves a healthy amount of room for planning."
    elif score >= 60:
        health = "Balanced"
        health_text = "Your financial position is workable, but a few spending decisions deserve attention."
    elif score >= 40:
        health = "Watchful"
        health_text = "Your current spending pattern is putting pressure on available income."
    else:
        health = "Needs attention"
        health_text = "Your recorded spending is leaving very little room for your financial plans."

    insights = []

    if monthly_spending == 0:
        insights.append({
            "type": "info",
            "title": "Start tracking your spending",
            "message": "Record a few daily expenses so Finora can identify your real spending pattern."
        })
    elif spending_rate > 80:
        insights.append({
            "type": "warning",
            "title": "Most of your income is being spent",
            "message": f"Recorded spending is using about {spending_rate}% of monthly income. Reviewing discretionary expenses could create more room for your goals."
        })
    elif spending_rate > 60:
        insights.append({
            "type": "info",
            "title": "Your spending deserves a closer look",
            "message": f"Recorded spending is equal to {spending_rate}% of monthly income. Keeping discretionary categories controlled can protect savings capacity."
        })
    else:
        insights.append({
            "type": "positive",
            "title": "Your spending is within a comfortable range",
            "message": f"Recorded spending is currently {spending_rate}% of monthly income, leaving room for planned savings."
        })

    if categories:
        top = categories[0]
        share = round((float(top["total"]) / monthly_spending) * 100) if monthly_spending else 0
        insights.append({
            "type": "focus",
            "title": f"{top['category']} is your biggest spending area",
            "message": f"{top['category']} accounts for about {share}% of recorded spending this month (₹{float(top['total']):,.0f})."
        })

    if goal:
        target = float(goal["target_amount"])
        remaining = max(0, target - savings)

        if remaining == 0:
            goal_message = f"You have already reached your {goal['goal_name']} target."
            goal_type = "positive"
        elif savings_capacity > 0:
            goal_message = f"You currently have about ₹{savings_capacity:,.0f} of monthly recorded capacity after fixed costs and spending."
            goal_type = "focus"
        else:
            goal_message = "Your current recorded spending leaves no monthly capacity after fixed costs. Review spending before increasing the goal."
            goal_type = "warning"

        insights.append({
            "type": goal_type,
            "title": f"Goal: {goal['goal_name']}",
            "message": goal_message
        })

    return {
        "financial_score": score,
        "health": health,
        "health_text": health_text,
        "monthly_income": income,
        "monthly_spending": monthly_spending,
        "spending_rate": spending_rate,
        "savings_capacity": savings_capacity,
        "transaction_count": int(spending["count"]),
        "insights": insights[:4]
    }
