import csv
import io
import json
import os
import re
import time
from uuid import uuid4
from datetime import datetime, timezone

import jwt
from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from fastapi.responses import StreamingResponse

from models.responses import SubmitRequest
from routers.auth import get_current_admin
from services.auth_service import ALGORITHM, SECRET_KEY
from services.supabase_client import get_supabase

router = APIRouter()
STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "form-uploads")
MAX_UPLOAD_BYTES = int(os.getenv("MAX_UPLOAD_BYTES", str(10 * 1024 * 1024)))


def _normalize_ip(ip: str | None) -> str | None:
    if not ip:
        return None
    value = ip.strip()
    if value in {"::1", "0:0:0:0:0:0:0:1", "localhost"}:
        return "127.0.0.1"
    if value.startswith("::ffff:"):
        return value.replace("::ffff:", "", 1)
    return value


def _client_ip(request: Request) -> str | None:
    forwarded_for = request.headers.get("x-forwarded-for")
    if forwarded_for:
        first = forwarded_for.split(",")[0].strip()
        return _normalize_ip(first)

    if request.client:
        return _normalize_ip(request.client.host)

    return None


def _parse_deadline(deadline_at: str | None) -> datetime | None:
    if not deadline_at:
        return None
    try:
        value = deadline_at.replace("Z", "+00:00")
        dt = datetime.fromisoformat(value)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.astimezone(timezone.utc)
    except Exception:
        return None


def _is_deadline_expired(settings: dict) -> bool:
    deadline = _parse_deadline(settings.get("deadlineAt"))
    if not deadline:
        return False
    return datetime.now(timezone.utc) > deadline


def _resolve_timed_seconds(settings: dict) -> int:
    timed_enabled = bool(settings.get("timedResponseEnabled"))
    raw_seconds = int(settings.get("timedResponseSeconds") or 0)
    if timed_enabled and raw_seconds <= 0:
        return 60
    return max(0, raw_seconds)


def _sanitize_filename(name: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", name or "file")
    cleaned = cleaned.strip("._")
    return cleaned or "file"


def _assert_form_open_for_response(sb, form_id: str) -> dict:
    form_result = (
        sb.table("forms").select("id,is_published,schema").eq("id", form_id).maybe_single().execute()
    )
    if not form_result.data:
        raise HTTPException(status_code=404, detail="Form not found")

    form = form_result.data
    settings = (form.get("schema") or {}).get("settings") or {}
    if _is_deadline_expired(settings):
        raise HTTPException(status_code=403, detail="This form is closed. The deadline has passed.")
    return form


@router.post("/{form_id}/open")
def open_form_session(form_id: str, request: Request):
    sb = get_supabase()

    form_result = (
        sb.table("forms").select("id,is_published,schema").eq("id", form_id).maybe_single().execute()
    )
    if not form_result.data:
        raise HTTPException(status_code=404, detail="Form not found")

    form = form_result.data
    settings = (form.get("schema") or {}).get("settings") or {}

    if _is_deadline_expired(settings):
        raise HTTPException(status_code=403, detail="This form is closed. The deadline has passed.")

    ip = _client_ip(request)
    timed_enabled = bool(settings.get("timedResponseEnabled"))
    timed_seconds = _resolve_timed_seconds(settings)
    started_at = int(time.time())

    print(f"[Zealflow] Form opened: form_id={form_id}, ip={ip}, timed={timed_enabled}")

    session_token = None
    if timed_enabled and timed_seconds > 0:
        payload = {
            "form_id": form_id,
            "ip": ip,
            "started_at": started_at,
            "exp": started_at + timed_seconds + 900,
        }
        session_token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "timed_enabled": timed_enabled,
        "timed_seconds": timed_seconds,
        "session_token": session_token,
        "started_at": started_at,
        "deadline_at": settings.get("deadlineAt"),
    }


@router.post("/{form_id}/submit")
def submit_response(form_id: str, body: SubmitRequest, request: Request):
    sb = get_supabase()

    form = _assert_form_open_for_response(sb, form_id)
    schema = form.get("schema") or {}
    settings = schema.get("settings") or {}

    allow_anonymous = settings.get("allowAnonymousEntries", True)

    if not allow_anonymous:
        submitter_name = (body.meta or {}).get("submitter_name")
        submitter_email = (body.meta or {}).get("submitter_email")
        if not submitter_name or not submitter_email:
            raise HTTPException(
                status_code=400,
                detail="This form does not allow anonymous submissions. Name and email are required.",
            )

    timed_enabled = bool(settings.get("timedResponseEnabled"))
    timed_seconds = _resolve_timed_seconds(settings)
    if timed_enabled and timed_seconds > 0:
        session_token = (body.meta or {}).get("session_token")
        if not session_token:
            raise HTTPException(status_code=400, detail="Timed response is enabled. Session token is required.")

        try:
            payload = jwt.decode(session_token, SECRET_KEY, algorithms=[ALGORITHM])
        except Exception:
            raise HTTPException(status_code=400, detail="Timed response session is invalid or expired.")

        if payload.get("form_id") != form_id:
            raise HTTPException(status_code=400, detail="Timed response session does not match this form.")

        request_ip = _client_ip(request)
        if payload.get("ip") and request_ip and payload.get("ip") != request_ip:
            raise HTTPException(status_code=400, detail="Timed response session IP mismatch.")

        started_at = int(payload.get("started_at") or 0)
        if started_at <= 0:
            raise HTTPException(status_code=400, detail="Timed response session missing start time.")

        elapsed = int(time.time()) - started_at
        if elapsed > timed_seconds:
            raise HTTPException(status_code=403, detail="Time limit exceeded for this form.")

    ip = _client_ip(request)

    payload_data = dict(body.data or {})
    if body.meta:
        payload_data["__meta"] = body.meta

    result = sb.table("responses").insert(
        {"form_id": form_id, "data": payload_data, "ip_address": ip}
    ).execute()

    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to record response")

    row = result.data[0]
    return {"id": row["id"], "submitted_at": row["submitted_at"]}


@router.post("/{form_id}/files/upload")
async def upload_response_file(
    form_id: str,
    file: UploadFile = File(...),
    field_id: str | None = Form(None),
):
    sb = get_supabase()
    _assert_form_open_for_response(sb, form_id)

    if not file.filename:
        raise HTTPException(status_code=400, detail="Missing filename")

    content = await file.read()
    size_bytes = len(content)
    if size_bytes <= 0:
        raise HTTPException(status_code=400, detail="File is empty")
    if size_bytes > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail=f"File exceeds {MAX_UPLOAD_BYTES} bytes limit")

    safe_name = _sanitize_filename(file.filename)
    suffix = safe_name.rsplit(".", 1)[-1] if "." in safe_name else "bin"
    token = uuid4().hex
    key_prefix = f"forms/{form_id}/responses"
    object_path = f"{key_prefix}/{token}.{suffix}"

    try:
        sb.storage.from_(STORAGE_BUCKET).upload(
            object_path,
            content,
            {
                "content-type": file.content_type or "application/octet-stream",
                "upsert": "false",
            },
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload file: {e}")

    return {
        "field_id": field_id,
        "bucket": STORAGE_BUCKET,
        "path": object_path,
        "file_name": safe_name,
        "mime_type": file.content_type or "application/octet-stream",
        "size_bytes": size_bytes,
    }


@router.get("/{form_id}/files/sign")
def sign_response_file_url(
    form_id: str,
    path: str,
    bucket: str | None = None,
    current_admin: dict = Depends(get_current_admin),
):
    sb = get_supabase()

    form_result = (
        sb.table("forms")
        .select("id,admin_id")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    if not form_result.data or form_result.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    normalized_bucket = bucket or STORAGE_BUCKET
    allowed_prefix = f"forms/{form_id}/responses/"
    if not path.startswith(allowed_prefix):
        raise HTTPException(status_code=400, detail="Invalid file path")

    try:
        signed = sb.storage.from_(normalized_bucket).create_signed_url(path, 600)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate signed URL: {e}")

    signed_url = signed.get("signedURL") if isinstance(signed, dict) else None
    if not signed_url:
        raise HTTPException(status_code=500, detail="Failed to create signed URL")

    return {"url": signed_url}


@router.get("/{form_id}/responses")
def list_responses(form_id: str, current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()

    form_result = (
        sb.table("forms")
        .select("id,admin_id,title,schema")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    if not form_result.data or form_result.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    responses_result = (
        sb.table("responses")
        .select("id,data,submitted_at,ip_address")
        .eq("form_id", form_id)
        .order("submitted_at", desc=True)
        .execute()
    )

    return {
        "form_id": form_result.data["id"],
        "form_title": form_result.data["title"],
        "schema": form_result.data["schema"],
        "responses": responses_result.data or [],
    }


@router.get("/{form_id}/responses/export")
def export_csv(form_id: str, current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()

    form_result = (
        sb.table("forms")
        .select("id,admin_id,title,schema")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    if not form_result.data or form_result.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    schema = form_result.data.get("schema") or {}
    fields = schema.get("fields", [])
    title = form_result.data.get("title", "form")

    responses_result = (
        sb.table("responses")
        .select("data,submitted_at")
        .eq("form_id", form_id)
        .order("submitted_at")
        .execute()
    )
    responses = responses_result.data or []

    output = io.StringIO()
    writer = csv.writer(output)

    # Header row: timestamp + one column per visible field
    visible_fields = [f for f in fields if not (f.get("meta") or {}).get("hidden")]
    headers = ["Submitted At"] + [f.get("label") or f["id"] for f in visible_fields]
    writer.writerow(headers)

    for resp in responses:
        data = resp.get("data") or {}
        row = [resp["submitted_at"]]
        for field in visible_fields:
            value = data.get(field["id"], "")
            if isinstance(value, dict) and value.get("path") and value.get("bucket"):
                value = value.get("file_name") or value.get("path")
            if isinstance(value, (list, dict)):
                value = json.dumps(value)
            row.append(value)
        writer.writerow(row)

    output.seek(0)
    safe_title = title.replace(" ", "_").replace("/", "-")
    filename = f"{safe_title}_responses.csv"

    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
