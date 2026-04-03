import os
import re
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from postgrest.exceptions import APIError

from models.forms import FormCreate, FormUpdate
from routers.auth import get_current_admin
from services.email_service import normalize_email_list, send_form_publish_email
from services.supabase_client import get_supabase

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "form"


def _unique_slug(sb, base: str) -> str:
    slug = base
    counter = 1
    while True:
        result = sb.table("forms").select("id").eq("slug", slug).execute()
        if not result.data:
            return slug
        slug = f"{base}-{counter}"
        counter += 1


@router.get("")
def list_forms(current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()
    result = (
        sb.table("forms")
        .select("id,slug,title,is_published,created_at,updated_at,schema")
        .eq("admin_id", current_admin["id"])
        .order("created_at", desc=True)
        .execute()
    )

    forms = []
    for f in result.data or []:
        schema = f.get("schema") or {}
        forms.append(
            {
                "id": f["id"],
                "slug": f["slug"],
                "title": f["title"],
                "is_published": f["is_published"],
                "created_at": f["created_at"],
                "updated_at": f["updated_at"],
                "schema": schema,
                "field_count": len(schema.get("fields", [])),
                "version": schema.get("version", 1),
                "settings": schema.get("settings", {}),
                "theme": schema.get("theme", {}),
            }
        )
    return forms


@router.post("")
def create_form(body: FormCreate, current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()

    existing = sb.table("forms").select("id").eq("id", body.id).execute()
    if getattr(existing, "data", None):
        raise HTTPException(status_code=409, detail="Form ID already exists")

    base_slug = _slugify(body.slug or body.title or "untitled-form")

    for attempt in range(20):
        slug = base_slug if attempt == 0 else f"{base_slug}-{attempt}"

        try:
            result = sb.table("forms").insert(
                {
                    "id": body.id,
                    "slug": slug,
                    "title": body.title,
                    "schema": body.schema,
                    "admin_id": current_admin["id"],
                    "is_published": False,
                }
            ).execute()

            if getattr(result, "data", None):
                return result.data[0]
        except APIError as exc:
            if str(exc).lower().find("forms_slug_key") == -1 and str(exc).lower().find("duplicate key value") == -1:
                raise

    raise HTTPException(status_code=500, detail="Failed to create form")


@router.get("/{form_id}")
def get_form(form_id: str, authorization: Optional[str] = Header(None)):
    sb = get_supabase()
    result = sb.table("forms").select("*").eq("id", form_id).maybe_single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Form not found")

    form = result.data

    # Unpublished forms are only visible to authenticated admins
    if not form["is_published"]:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=404, detail="Form not found")

    return form


@router.put("/{form_id}")
def update_form(
    form_id: str,
    body: FormUpdate,
    current_admin: dict = Depends(get_current_admin),
):
    sb = get_supabase()

    existing = (
        sb.table("forms")
        .select("id,admin_id,title")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    if not existing.data or existing.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    updates: dict = {}
    if body.schema is not None:
        updates["schema"] = body.schema
        updates["title"] = body.schema.get("title") or existing.data.get("title", "")
    if body.title is not None:
        updates["title"] = body.title
    if body.is_published is not None:
        updates["is_published"] = body.is_published
    if body.slug is not None:
        updates["slug"] = body.slug

    if not updates:
        return existing.data

    result = sb.table("forms").update(updates).eq("id", form_id).execute()
    return result.data[0] if result.data else {}


@router.delete("/{form_id}")
def delete_form(form_id: str, current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()

    existing = (
        sb.table("forms")
        .select("id,admin_id")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    if not getattr(existing, "data", None) or existing.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    sb.table("forms").delete().eq("id", form_id).execute()
    return {"success": True}


@router.patch("/{form_id}/publish")
def toggle_publish(form_id: str, current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()

    existing = (
        sb.table("forms")
        .select("id,admin_id,is_published")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    existing_row = existing.data if getattr(existing, "data", None) else None
    if not existing_row or existing_row["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found")

    new_state = True

    schema_result = (
        sb.table("forms")
        .select("schema,title")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    schema = (schema_result.data or {}).get("schema") or {}
    settings = schema.get("settings") or {}

    update_payload = {"is_published": new_state}
    result = sb.table("forms").update(update_payload).eq("id", form_id).execute()
    updated_row = result.data[0] if getattr(result, "data", None) else {}
    if not updated_row:
        latest = sb.table("forms").select("id,title,is_published").eq("id", form_id).maybe_single().execute()
        updated_row = latest.data or {}

    email_result = {
        "mailing_list_count": 0,
        "mailing_list_sent": 0,
    }

    if new_state:
        recipients = normalize_email_list(settings.get("mailingListEmails"))
        message = (settings.get("publishEmailMessage") or "").strip()
        form_url = f"{FRONTEND_URL}/f/{form_id}"
        form_title = updated_row.get("title") or schema_result.data.get("title") or "Untitled form"
        sent_count = 0

        for recipient in recipients:
            try:
                send_form_publish_email(
                    recipient,
                    form_title=form_title,
                    form_url=form_url,
                    custom_message=message,
                    admin_name=current_admin.get("username"),
                )
                sent_count += 1
            except Exception as e:
                print(f"[Zealflow] Publish email failed for {recipient}: {e}")

        email_result = {
            "mailing_list_count": len(recipients),
            "mailing_list_sent": sent_count,
        }

    return {**updated_row, **email_result}
