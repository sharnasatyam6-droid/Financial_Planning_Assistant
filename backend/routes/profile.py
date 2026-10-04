from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database.database import get_connection

router = APIRouter(prefix="/profile", tags=["Financial Profile"])


class FinancialProfileData(BaseModel):
    user_id: int
    monthly_income: float
    current_savings: float
    fixed_expenses: float
    financial_priority: str


@router.post("/save")
def save_profile(data: FinancialProfileData):
    if data.monthly_income < 0:
        raise HTTPException(status_code=400, detail="Income cannot be negative")

    if data.current_savings < 0:
        raise HTTPException(status_code=400, detail="Savings cannot be negative")

    if data.fixed_expenses < 0:
        raise HTTPException(status_code=400, detail="Expenses cannot be negative")

    connection = get_connection()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (data.user_id,)
    ).fetchone()

    if not user:
        connection.close()
        raise HTTPException(status_code=404, detail="User not found")

    existing_profile = connection.execute(
        "SELECT id FROM financial_profiles WHERE user_id = ?",
        (data.user_id,)
    ).fetchone()

    if existing_profile:
        connection.execute(
            """
            UPDATE financial_profiles
            SET monthly_income = ?,
                current_savings = ?,
                fixed_expenses = ?,
                financial_priority = ?
            WHERE user_id = ?
            """,
            (
                data.monthly_income,
                data.current_savings,
                data.fixed_expenses,
                data.financial_priority,
                data.user_id
            )
        )
    else:
        connection.execute(
            """
            INSERT INTO financial_profiles
            (user_id, monthly_income, current_savings, fixed_expenses, financial_priority)
            VALUES (?, ?, ?, ?, ?)
            """,
            (
                data.user_id,
                data.monthly_income,
                data.current_savings,
                data.fixed_expenses,
                data.financial_priority
            )
        )

    connection.commit()
    connection.close()

    return {
        "message": "Financial profile saved successfully"
    }

@router.get("/{user_id}")
def get_profile(user_id: int):
    connection = get_connection()

    profile = connection.execute(
        """
        SELECT monthly_income,
               current_savings,
               fixed_expenses,
               financial_priority
        FROM financial_profiles
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    if not profile:
        raise HTTPException(status_code=404, detail="Financial profile not found")

    return {
        "monthly_income": profile["monthly_income"],
        "current_savings": profile["current_savings"],
        "fixed_expenses": profile["fixed_expenses"],
        "financial_priority": profile["financial_priority"]
    }