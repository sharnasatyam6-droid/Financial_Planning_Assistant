from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import date
from backend.database.database import get_connection

router = APIRouter(prefix="/goals", tags=["Savings Goals"])


class GoalData(BaseModel):
    user_id: int
    goal_name: str
    target_amount: float
    target_date: str


@router.post("/save")
def save_goal(data: GoalData):

    if not data.goal_name.strip():
        raise HTTPException(status_code=400, detail="Goal name is required")

    if data.target_amount <= 0:
        raise HTTPException(
            status_code=400,
            detail="Target amount must be greater than 0"
        )

    if not data.target_date:
        raise HTTPException(status_code=400, detail="Target date is required")

    connection = get_connection()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (data.user_id,)
    ).fetchone()

    if not user:
        connection.close()
        raise HTTPException(status_code=404, detail="User not found")

    existing_goal = connection.execute(
        "SELECT id FROM savings_goals WHERE user_id = ?",
        (data.user_id,)
    ).fetchone()

    if existing_goal:

        connection.execute(
            """
            UPDATE savings_goals
            SET goal_name = ?,
                target_amount = ?,
                target_date = ?
            WHERE user_id = ?
            """,
            (
                data.goal_name.strip(),
                data.target_amount,
                data.target_date,
                data.user_id
            )
        )

    else:

        connection.execute(
            """
            INSERT INTO savings_goals
            (user_id, goal_name, target_amount, target_date)
            VALUES (?, ?, ?, ?)
            """,
            (
                data.user_id,
                data.goal_name.strip(),
                data.target_amount,
                data.target_date
            )
        )

    connection.commit()
    connection.close()

    return {
        "message": "Savings goal saved successfully"
    }


@router.get("/{user_id}")
def get_goal(user_id: int):

    connection = get_connection()

    goal = connection.execute(
        """
        SELECT id,
               goal_name,
               target_amount,
               target_date
        FROM savings_goals
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    return {
        "id": goal["id"],
        "goal_name": goal["goal_name"],
        "target_amount": goal["target_amount"],
        "target_date": goal["target_date"]
    }


@router.get("/plan/{user_id}")
def get_goal_plan(user_id: int):

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

    connection.close()

    if not profile:
        raise HTTPException(
            status_code=404,
            detail="Financial profile not found"
        )

    if not goal:
        raise HTTPException(
            status_code=404,
            detail="Savings goal not found"
        )

    income = float(profile["monthly_income"])
    fixed_expenses = float(profile["fixed_expenses"])
    current_savings = float(profile["current_savings"])

    target_amount = float(goal["target_amount"])
    monthly_spending = float(spending["total"])

    available = max(0, income - fixed_expenses)

    remaining_goal = max(
        0,
        target_amount - current_savings
    )

    today = date.today()
    target_date = date.fromisoformat(goal["target_date"])

    months = max(
        1,
        (target_date.year - today.year) * 12
        + (target_date.month - today.month)
    )

    required_saving = (
        (remaining_goal + months - 1) // months
    )

    spending_budget = max(
        0,
        available - required_saving
    )

    remaining_budget = max(
        0,
        spending_budget - monthly_spending
    )

    budget_used_percent = 0

    if spending_budget > 0:
        budget_used_percent = round(
            (monthly_spending / spending_budget) * 100
        )

    if budget_used_percent >= 100:
        budget_status = "Over Budget"
    elif budget_used_percent >= 80:
        budget_status = "Near Limit"
    else:
        budget_status = "Healthy"

    progress = 0

    if target_amount > 0:
        progress = min(
            100,
            round((current_savings / target_amount) * 100)
        )

    return {
        "goal_name": goal["goal_name"],
        "target_amount": target_amount,
        "target_date": goal["target_date"],
        "current_savings": current_savings,
        "monthly_income": income,
        "fixed_expenses": fixed_expenses,
        "available_after_fixed": available,
        "required_monthly_saving": required_saving,
        "suggested_spending_budget": spending_budget,
        "monthly_spending": monthly_spending,
        "remaining_spending_budget": remaining_budget,
        "progress": progress,
        "months_remaining": months,
        "budget_used_percent": budget_used_percent,
        "budget_status": budget_status,
    }