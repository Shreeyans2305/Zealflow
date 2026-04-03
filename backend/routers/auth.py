import os
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException

from models.auth import AdminOut, LoginRequest, ResendVerificationRequest, SignupRequest
from services.auth_service import (
    create_token,
    decode_token,
    generate_verify_token,
    hash_password,
    verify_password,
)
from services.email_service import build_verification_url, send_verification_email
from services.supabase_client import get_supabase

router = APIRouter()
ALLOW_DEV_VERIFY_FALLBACK = os.getenv("ALLOW_DEV_VERIFY_FALLBACK", "true").lower() == "true"


def get_current_admin(authorization: Optional[str] = Header(None)) -> dict:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = authorization.split(" ", 1)[1]
    try:
        admin_id = decode_token(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    sb = get_supabase()
    result = sb.table("admins").select("*").eq("id", admin_id).maybe_single().execute()
    if not result.data:
        raise HTTPException(status_code=401, detail="Admin not found")
    return result.data


@router.post("/signup")
def signup(body: SignupRequest):
    sb = get_supabase()

    # Check for existing username
    user_check = sb.table("admins").select("id").eq("username", body.username).execute()
    if user_check.data:
        raise HTTPException(status_code=400, detail="Username already taken")

    # Check for existing email
    email_check = sb.table("admins").select("id").eq("email", body.email).execute()
    if email_check.data:
        raise HTTPException(status_code=400, detail="Email already registered")

    password_hash = hash_password(body.password)
    verify_token = generate_verify_token()

    result = sb.table("admins").insert(
        {
            "username": body.username,
            "email": body.email,
            "password_hash": password_hash,
            "is_verified": False,
            "verify_token": verify_token,
        }
    ).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create account")

    try:
        send_verification_email(body.email, body.username, verify_token)
        return {
            "message": "Account created. Check your email to verify before logging in.",
            "email_sent": True,
        }
    except Exception as e:
        print(f"[Zealflow] Verification email failed: {e}")

        if ALLOW_DEV_VERIFY_FALLBACK:
            return {
                "message": "Account created, but email delivery failed. Use the verification link below.",
                "email_sent": False,
                "verification_url": build_verification_url(verify_token),
            }

        return {
            "message": "Account created, but verification email could not be delivered. Use resend verification.",
            "email_sent": False,
        }


@router.get("/verify")
def verify_email(token: str):
    sb = get_supabase()
    result = sb.table("admins").select("id, is_verified").eq("verify_token", token).maybe_single().execute()
    admin_data = result.data if result else None
    if not admin_data:
        raise HTTPException(status_code=400, detail="Invalid or expired verification token")

    if not admin_data["is_verified"]:
        admin_id = admin_data["id"]
        sb.table("admins").update({"is_verified": True}).eq("id", admin_id).execute()

    return {"message": "Email verified. You can now log in."}


@router.post("/resend-verification")
def resend_verification(body: ResendVerificationRequest):
    sb = get_supabase()
    result = sb.table("admins").select("id, username, is_verified").eq("email", body.email).maybe_single().execute()

    admin = result.data
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found for this email")

    if admin["is_verified"]:
        return {"message": "Email is already verified.", "email_sent": False}

    verify_token = generate_verify_token()
    sb.table("admins").update({"verify_token": verify_token}).eq("id", admin["id"]).execute()

    try:
        send_verification_email(body.email, admin["username"], verify_token)
        return {"message": "Verification email sent.", "email_sent": True}
    except Exception as e:
        print(f"[Zealflow] Resend verification email failed: {e}")

        if ALLOW_DEV_VERIFY_FALLBACK:
            return {
                "message": "Email delivery failed. Use the verification link below.",
                "email_sent": False,
                "verification_url": build_verification_url(verify_token),
            }

        raise HTTPException(status_code=500, detail="Failed to send verification email")


@router.post("/login")
def login(body: LoginRequest):
    sb = get_supabase()
    result = sb.table("admins").select("*").eq("username", body.username).maybe_single().execute()

    admin = result.data
    if not admin:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not verify_password(body.password, admin["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid username or password")

    if not admin["is_verified"]:
        raise HTTPException(status_code=403, detail="Email not verified. Check your inbox.")

    token = create_token(admin["id"])
    return {
        "token": token,
        "admin": {
            "id": admin["id"],
            "username": admin["username"],
            "email": admin["email"],
            "created_at": admin["created_at"],
        },
    }


@router.get("/me")
def me(current_admin: dict = Depends(get_current_admin)):
    return AdminOut(
        id=current_admin["id"],
        username=current_admin["username"],
        email=current_admin["email"],
        created_at=current_admin["created_at"],
    )
