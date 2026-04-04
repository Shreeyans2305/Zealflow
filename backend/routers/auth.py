import os
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, BackgroundTasks, Depends, Header, HTTPException

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
SMTP_USER = os.getenv("SMTP_USER", "").strip()
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "").strip()


def _is_smtp_configured() -> bool:
    return bool(SMTP_USER and SMTP_PASSWORD)


def _send_verification_email_safe(to_email: str, username: str, token: str) -> None:
    try:
        send_verification_email(to_email, username, token)
    except Exception as e:
        print(f"[Zealflow] Verification email background send failed for {to_email}: {e}")


def _build_admin_summary(sb, admin_id: str, admin_created_at: str | None) -> dict:
    forms_result = (
        sb.table("forms")
        .select("id,title,updated_at,created_at,schema")
        .eq("admin_id", admin_id)
        .execute()
    )
    forms = forms_result.data or []
    form_ids = [f["id"] for f in forms]

    total_responses = 0
    responses_today = 0
    response_timestamps: list[str] = []
    response_count_by_form: dict[str, int] = {}
    last_response_at_by_form: dict[str, str] = {}

    if form_ids:
        responses_result = (
            sb.table("responses")
            .select("submitted_at,form_id")
            .in_("form_id", form_ids)
            .execute()
        )
        responses = responses_result.data or []
        total_responses = len(responses)

        today = datetime.now(timezone.utc).date().isoformat()
        for r in responses:
            form_id = r.get("form_id")
            submitted_at = r.get("submitted_at")
            if not form_id or not submitted_at:
                continue

            response_timestamps.append(submitted_at)
            response_count_by_form[form_id] = response_count_by_form.get(form_id, 0) + 1
            current_last = last_response_at_by_form.get(form_id)
            if not current_last or submitted_at > current_last:
                last_response_at_by_form[form_id] = submitted_at
            if submitted_at.startswith(today):
                responses_today += 1

    activity_candidates = [
        admin_created_at,
        *[f.get("updated_at") for f in forms if f.get("updated_at")],
        *response_timestamps,
    ]
    activity_candidates = [ts for ts in activity_candidates if ts]
    last_activity_at = max(activity_candidates) if activity_candidates else admin_created_at

    recent_forms = []
    for f in forms:
        fid = f["id"]
        schema = f.get("schema") or {}
        recent_forms.append(
            {
                "id": fid,
                "title": f.get("title") or "Untitled form",
                "response_count": response_count_by_form.get(fid, 0),
                "last_response_at": last_response_at_by_form.get(fid),
                "updated_at": f.get("updated_at"),
                "created_at": f.get("created_at"),
                "field_count": len(schema.get("fields", [])),
            }
        )

    recent_forms.sort(
        key=lambda x: x.get("last_response_at") or x.get("updated_at") or x.get("created_at") or "",
        reverse=True,
    )

    return {
        "forms_created": len(forms),
        "total_responses": total_responses,
        "responses_today": responses_today,
        "member_since": admin_created_at,
        "last_activity_at": last_activity_at,
        "recent_forms": recent_forms[:5],
    }


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
def signup(body: SignupRequest, background_tasks: BackgroundTasks):
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

    if not _is_smtp_configured():
        if ALLOW_DEV_VERIFY_FALLBACK:
            return {
                "message": "Account created. SMTP is not configured, use the verification link below.",
                "email_sent": False,
                "verification_url": build_verification_url(verify_token),
            }
        return {
            "message": "Account created, but verification email is not configured. Use resend verification after SMTP setup.",
            "email_sent": False,
        }

    background_tasks.add_task(_send_verification_email_safe, body.email, body.username, verify_token)
    return {
        "message": "Account created. Verification email queued.",
        "email_sent": True,
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
def resend_verification(body: ResendVerificationRequest, background_tasks: BackgroundTasks):
    sb = get_supabase()
    result = sb.table("admins").select("id, username, is_verified").eq("email", body.email).maybe_single().execute()

    admin = result.data
    if not admin:
        raise HTTPException(status_code=404, detail="Account not found for this email")

    if admin["is_verified"]:
        return {"message": "Email is already verified.", "email_sent": False}

    verify_token = generate_verify_token()
    sb.table("admins").update({"verify_token": verify_token}).eq("id", admin["id"]).execute()

    if not _is_smtp_configured():
        if ALLOW_DEV_VERIFY_FALLBACK:
            return {
                "message": "SMTP is not configured. Use the verification link below.",
                "email_sent": False,
                "verification_url": build_verification_url(verify_token),
            }
        raise HTTPException(status_code=500, detail="SMTP is not configured")

    background_tasks.add_task(_send_verification_email_safe, body.email, admin["username"], verify_token)
    return {"message": "Verification email queued.", "email_sent": True}


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


@router.get("/stats")
def auth_stats(current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()
    summary = _build_admin_summary(sb, current_admin["id"], current_admin.get("created_at"))
    return {
        "forms_created": summary["forms_created"],
        "total_responses": summary["total_responses"],
        "responses_today": summary["responses_today"],
        "member_since": summary["member_since"],
        "last_activity_at": summary["last_activity_at"],
    }


@router.get("/profile-summary")
def profile_summary(current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()
    return _build_admin_summary(sb, current_admin["id"], current_admin.get("created_at"))


@router.get("/me")
def me(current_admin: dict = Depends(get_current_admin)):
    return AdminOut(
        id=current_admin["id"],
        username=current_admin["username"],
        email=current_admin["email"],
        created_at=current_admin["created_at"],
    )
