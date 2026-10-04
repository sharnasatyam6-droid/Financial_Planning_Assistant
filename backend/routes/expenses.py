from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from backend.database.database import get_connection

router = APIRouter(prefix="/expenses", tags=["Expenses"])


class ExpenseData(BaseModel):
    user_id: int
    amount: float
    category: str
    description: str
    payment_mode: str
    transaction_id: str = ""
    expense_date: str


@router.post("/add")
def add_expense(data: ExpenseData):
    if data.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    if data.payment_mode not in ["cash", "online"]:
        raise HTTPException(status_code=400, detail="Invalid payment mode")

    if data.payment_mode == "online" and not data.transaction_id.strip():
        raise HTTPException(
            status_code=400,
            detail="Transaction ID is required for online expenses"
        )

    connection = get_connection()

    user = connection.execute(
        "SELECT id FROM users WHERE id = ?",
        (data.user_id,)
    ).fetchone()

    if not user:
        connection.close()
        raise HTTPException(status_code=404, detail="User not found")

    connection.execute(
        """
        INSERT INTO expenses
        (user_id, amount, category, description, payment_mode, transaction_id, expense_date)
        VALUES (?, ?, ?, ?, ?, ?, ?)
        """,
        (
            data.user_id,
            data.amount,
            data.category,
            data.description,
            data.payment_mode,
            data.transaction_id,
            data.expense_date
        )
    )

    connection.commit()
    connection.close()

    return {
        "message": "Expense added successfully"
    }


@router.get("/{user_id}")
def get_expenses(user_id: int):
    connection = get_connection()

    expenses = connection.execute(
        """
        SELECT id,
               amount,
               category,
               description,
               payment_mode,
               transaction_id,
               expense_date
        FROM expenses
        WHERE user_id = ?
        ORDER BY expense_date DESC, id DESC
        """,
        (user_id,)
    ).fetchall()

    connection.close()

    return {
        "expenses": [dict(expense) for expense in expenses]
    }

@router.get("/summary/{user_id}")
def get_expense_summary(user_id: int):
    connection = get_connection()

    summary = connection.execute(
        """
        SELECT
            COALESCE(SUM(amount), 0) AS total_expenses,
            COUNT(*) AS expense_count
        FROM expenses
        WHERE user_id = ?
        """,
        (user_id,)
    ).fetchone()

    connection.close()

    return {
        "total_expenses": summary["total_expenses"],
        "expense_count": summary["expense_count"]
    }

@router.get("/category-summary/{user_id}")
def get_category_summary(user_id: int):
    connection = get_connection()

    categories = connection.execute(
        """
        SELECT category, SUM(amount) AS total
        FROM expenses
        WHERE user_id = ?
        GROUP BY category
        ORDER BY total DESC
        """,
        (user_id,)
    ).fetchall()

    connection.close()

    return {
        "categories": [dict(category) for category in categories]
    }

@router.get("/analytics/{user_id}")
def get_expense_analytics(user_id: int):
    connection = get_connection()

    summary = connection.execute(
        """
        SELECT
            COALESCE(SUM(amount), 0) AS total_spending,
            COUNT(*) AS transaction_count
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

    return {
        "total_spending": summary["total_spending"],
        "transaction_count": summary["transaction_count"],
        "top_category": top_category["category"] if top_category else None,
        "top_category_amount": top_category["total"] if top_category else 0
    }

@router.get("/monthly-trend/{user_id}")
def get_monthly_trend(user_id: int):
    connection = get_connection()

    trend = connection.execute(
        """
        SELECT
            strftime('%Y-%m', expense_date) AS month,
            SUM(amount) AS total
        FROM expenses
        WHERE user_id = ?
        GROUP BY strftime('%Y-%m', expense_date)
        ORDER BY month ASC
        LIMIT 6
        """,
        (user_id,)
    ).fetchall()

    connection.close()

    return {
        "trend": [dict(item) for item in trend]
    }