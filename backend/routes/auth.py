from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel
from pwdlib import PasswordHash
from backend.database.database import get_connection
import re
import base64
import hashlib
import hmac
import os
import time

router = APIRouter(prefix="/auth", tags=["Authentication"])

SESSION_COOKIE = "finora_session"
SESSION_DAYS = 7

def _session_secret():
    value = os.getenv("FINORA_SECRET_KEY") or os.getenv("DATABASE_URL") or "finora-local-secret"
    return hashlib.sha256(value.encode("utf-8")).digest()

def create_session(user_id):
    payload = f"{int(user_id)}:{int(time.time()) + SESSION_DAYS * 86400}".encode("utf-8")
    encoded = base64.urlsafe_b64encode(payload).decode("ascii").rstrip("=")
    signature = hmac.new(_session_secret(), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    return f"{encoded}.{signature}"

def get_user_id_from_session(token):
    if not token or "." not in token:
        return None
    encoded, signature = token.rsplit(".", 1)
    expected = hmac.new(_session_secret(), encoded.encode("ascii"), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(signature, expected):
        return None
    try:
        padding = "=" * (-len(encoded) % 4)
        payload = base64.urlsafe_b64decode((encoded + padding).encode("ascii")).decode("utf-8")
        user_id_text, expires_text = payload.split(":", 1)
        user_id = int(user_id_text)
        expires = int(expires_text)
    except (ValueError, UnicodeError, base64.binascii.Error):
        return None
    if user_id <= 0 or expires < int(time.time()):
        return None
    return user_id


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
def login(data: LoginData, response: Response):
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

    response.set_cookie(
        key=SESSION_COOKIE,
        value=create_session(user["id"]),
        httponly=True,
        secure=os.getenv("VERCEL") == "1" or os.getenv("ENVIRONMENT") == "production",
        samesite="lax",
        max_age=SESSION_DAYS * 86400,
        path="/"
    )

    return {
        "message": "Login successful",
        "user": {
            "id": user["id"],
            "name": user["name"],
            "mobile": user["mobile"],
            "email": user["email"]
        }
    }


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie(key=SESSION_COOKIE, path="/")
    return {"message": "Logged out successfully"}
