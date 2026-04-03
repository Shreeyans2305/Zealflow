import csv
import io
import json

from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.responses import SubmitRequest
from routers.auth import get_current_admin
from services.supabase_client import get_supabase

router = APIRouter()


@router.post("/{form_id}/submit")
def submit_response(form_id: str, body: SubmitRequest, request: Request):
    sb = get_supabase()

    form_result = (
        sb.table("forms").select("id,is_published,schema").eq("id", form_id).maybe_single().execute()
    )
    if not form_result.data:
        raise HTTPException(status_code=404, detail="Form not found")

    schema = form_result.data.get("schema") or {}
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

    ip = request.client.host if request.client else None

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
