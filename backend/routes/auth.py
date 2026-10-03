from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pwdlib import PasswordHash
from backend.database.database import get_connection

router = APIRouter(prefix="/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()


class SignupData(BaseModel):
    name: str
    mobile: str
    email: str
    password: str
    confirm_password: str


@router.post("/signup")
def signup(data: SignupData):
    if len(data.mobile) != 10 or not data.mobile.isdigit():
        raise HTTPException(status_code=400, detail="Enter a valid 10 digit mobile number")

    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    if len(data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    connection = get_connection()

    existing_user = connection.execute(
        "SELECT id FROM users WHERE mobile = ? OR email = ?",
        (data.mobile, data.email)
    ).fetchone()

    if existing_user:
        connection.close()
        raise HTTPException(status_code=400, detail="Mobile number or email already registered")

    hashed_password = password_hash.hash(data.password)

    connection.execute(
        """
        INSERT INTO users (name, mobile, email, password)
        VALUES (?, ?, ?, ?)
        """,
        (data.name, data.mobile, data.email, hashed_password)
    )

    connection.commit()
    connection.close()

    return {
        "message": "Account created successfully"
    }

class LoginData(BaseModel):
    mobile: str
    password: str


@router.post("/login")
def login(data: LoginData):
    connection = get_connection()

    user = connection.execute(
        "SELECT * FROM users WHERE mobile = ?",
        (data.mobile,)
    ).fetchone()

    connection.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")

    if not password_hash.verify(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid mobile number or password")

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "mobile": user["mobile"],
            "email": user["email"]
        }
    }