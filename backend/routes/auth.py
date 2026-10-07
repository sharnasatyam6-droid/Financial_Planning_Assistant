from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from pwdlib import PasswordHash
from backend.database.database import get_connection
import re

router = APIRouter(prefix="/auth", tags=["Authentication"])

password_hash = PasswordHash.recommended()

EMAIL_PATTERN = re.compile(r"^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$")
NAME_PATTERN = re.compile(r"^[A-Za-zÀ-ÖØ-öø-ÿ][A-Za-zÀ-ÖØ-öø-ÿ .'-]{1,59}$")


class SignupData(BaseModel):
    name: str
    mobile: str
    email: str
    password: str
    confirm_password: str


def validate_signup_details(data: SignupData):
    name = " ".join(data.name.strip().split())
    mobile = data.mobile.strip()
    email = data.email.strip().lower()

    if not NAME_PATTERN.fullmatch(name) or len(name) < 2:
        raise HTTPException(
            status_code=400,
            detail="Enter your real full name using letters, spaces, dots, hyphens or apostrophes."
        )

    if len(mobile) != 10 or not mobile.isdigit() or mobile[0] not in "6789":
        raise HTTPException(
            status_code=400,
            detail="Enter a valid 10 digit Indian mobile number starting with 6, 7, 8 or 9."
        )

    if len(set(mobile)) == 1 or mobile in {
        "0123456789", "1234567890", "9876543210"
    }:
        raise HTTPException(
            status_code=400,
            detail="Enter your actual mobile number, not a sample or placeholder number."
        )

    if not EMAIL_PATTERN.fullmatch(email) or len(email) > 254:
        raise HTTPException(
            status_code=400,
            detail="Enter a valid email address that you actually use."
        )

    if data.password != data.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match.")

    if len(data.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters long."
        )

    if not any(char.isalpha() for char in data.password) or not any(char.isdigit() for char in data.password):
        raise HTTPException(
            status_code=400,
            detail="Password must contain at least one letter and one number."
        )

    return name, mobile, email


@router.post("/signup")
def signup(data: SignupData):
    name, mobile, email = validate_signup_details(data)

    connection = get_connection()

    existing_user = connection.execute(
        "SELECT id FROM users WHERE mobile = ? OR LOWER(email) = ?",
        (mobile, email)
    ).fetchone()

    if existing_user:
        connection.close()
        raise HTTPException(
            status_code=400,
            detail="This mobile number or email is already registered."
        )

    hashed_password = password_hash.hash(data.password)

    try:
        connection.execute(
            """
            INSERT INTO users (name, mobile, email, password)
            VALUES (?, ?, ?, ?)
            """,
            (name, mobile, email, hashed_password)
        )
        connection.commit()
    except Exception:
        connection.close()
        raise HTTPException(
            status_code=400,
            detail="This mobile number or email is already registered."
        )

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
        (data.mobile.strip(),)
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
