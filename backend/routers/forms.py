import os
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Optional, List

from fastapi import APIRouter, Depends, Header, HTTPException
from postgrest.exceptions import APIError

from models.forms import FormCreate, FormUpdate, FormShareRequest, FormJoinRequest, FormCollaboratorResponse
from routers.auth import get_current_admin
from services.auth_service import hash_password, verify_password
from services.email_service import normalize_email_list, send_bulk_form_publish_emails
from services.supabase_client import get_supabase

router = APIRouter()
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")


def _slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s-]", "", text)
    text = re.sub(r"[\s_]+", "-", text)
    text = re.sub(r"-+", "-", text).strip("-")
    return text or "form"


def _is_collaborator(sb, form_id: str, user_id: str) -> bool:
    result = (
        sb.table("form_collaborators")
        .select("id")
        .eq("form_id", form_id)
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )
    return result.data is not None


@router.get("")
def list_forms(current_admin: dict = Depends(get_current_admin)):
    sb = get_supabase()
    
    # Forms owned by admin
    owned_result = (
        sb.table("forms")
        .select("id,slug,title,is_published,created_at,updated_at,schema")
        .eq("admin_id", current_admin["id"])
        .order("created_at", desc=True)
        .execute()
    )
    
    # Forms where admin is a collaborator
    collab_result = (
        sb.table("form_collaborators")
        .select("form_id")
        .eq("user_id", current_admin["id"])
        .execute()
    )
    collab_ids = [c["form_id"] for c in collab_result.data or []]
    
    collab_forms = []
    if collab_ids:
        shared_result = (
            sb.table("forms")
            .select("id,slug,title,is_published,created_at,updated_at,schema")
            .in_("id", collab_ids)
            .execute()
        )
        collab_forms = shared_result.data or []

    # Deduplicate — owner may also appear as collaborator
    seen_ids = set()
    all_forms = []
    for f in (owned_result.data or []) + collab_forms:
        if f["id"] not in seen_ids:
            seen_ids.add(f["id"])
            all_forms.append(f)
    
    forms = []
    for f in all_forms:
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
                "is_owner": f.get("admin_id") == current_admin["id"] if "admin_id" in f else True
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

    # Unpublished forms are only visible to authenticated admins (owner or collaborator)
    if not form["is_published"]:
        if not authorization or not authorization.startswith("Bearer "):
            raise HTTPException(status_code=404, detail="Form not found")
        
        # Check if user is owner or collaborator
        try:
            from services.auth_service import decode_token
            token = authorization.split(" ", 1)[1]
            user_id = decode_token(token)
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        if form["admin_id"] != user_id and not _is_collaborator(sb, form_id, user_id):
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
    if not existing.data:
        raise HTTPException(status_code=404, detail="Form not found")
    
    # Check permission: owner or editor collaborator
    is_owner = existing.data["admin_id"] == current_admin["id"]
    if not is_owner and not _is_collaborator(sb, form_id, current_admin["id"]):
        raise HTTPException(status_code=403, detail="Permission denied")

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
    # Only owner can delete
    if not getattr(existing, "data", None) or existing.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=404, detail="Form not found or you are not the owner")

    sb.table("forms").delete().eq("id", form_id).execute()
    return {"success": True}


# --- Collaboration Endpoints ---

@router.post("/{form_id}/share")
def share_form(
    form_id: str,
    body: FormShareRequest,
    current_admin: dict = Depends(get_current_admin),
):
    sb = get_supabase()
    
    # Only owner can share
    existing = sb.table("forms").select("admin_id").eq("id", form_id).maybe_single().execute()
    if not existing.data or existing.data["admin_id"] != current_admin["id"]:
        raise HTTPException(status_code=403, detail="Only the owner can share this form")
    
    token = secrets.token_urlsafe(32)
    password_hash = hash_password(body.password) if body.password else None
    expires_at = datetime.now(timezone.utc) + timedelta(hours=body.expires_in_hours)
    
    result = sb.table("collaboration_links").insert({
        "form_id": form_id,
        "token": token,
        "password_hash": password_hash,
        "expires_at": expires_at.isoformat()
    }).execute()
    
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create sharing link")
        
    return {"link": f"{FRONTEND_URL}/collab/join?token={token}", "token": token}


@router.post("/join")
def join_collaboration(
    body: FormJoinRequest,
    current_admin: dict = Depends(get_current_admin),
):
    sb = get_supabase()
    
    # Find active link
    link_result = (
        sb.table("collaboration_links")
        .select("*")
        .eq("token", body.token)
        .gt("expires_at", datetime.now(timezone.utc).isoformat())
        .maybe_single()
        .execute()
    )
    
    if not link_result.data:
        raise HTTPException(status_code=404, detail="Invalid or expired collaboration link")
        
    link = link_result.data
    
    # Check password if required
    if link["password_hash"]:
        if not body.password or not verify_password(body.password, link["password_hash"]):
            raise HTTPException(status_code=403, detail="Incorrect password for collaboration link")
            
    # Add as collaborator
    try:
        sb.table("form_collaborators").insert({
            "form_id": link["form_id"],
            "user_id": current_admin["id"],
            "role": "editor"
        }).execute()
    except APIError as e:
        if "duplicate key" not in str(e).lower():
            raise
            
    return {"form_id": link["form_id"], "success": True}


@router.get("/{form_id}/collaborators", response_model=List[FormCollaboratorResponse])
def get_collaborators(
    form_id: str,
    current_admin: dict = Depends(get_current_admin),
):
    sb = get_supabase()
    
    # Check access
    existing = sb.table("forms").select("admin_id").eq("id", form_id).maybe_single().execute()
    if not existing.data:
         raise HTTPException(status_code=404, detail="Form not found")
         
    if existing.data["admin_id"] != current_admin["id"] and not _is_collaborator(sb, form_id, current_admin["id"]):
        raise HTTPException(status_code=403, detail="Access denied")
        
    result = (
        sb.table("form_collaborators")
        .select("user_id, role, admins(username)")
        .eq("form_id", form_id)
        .execute()
    )
    
    collabs = []
    for c in result.data or []:
        admins = c.get("admins") or {}
        collabs.append({
            "user_id": c["user_id"],
            "role": c["role"],
            "username": admins.get("username")
        })
    return collabs


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
    if not existing_row:
         raise HTTPException(status_code=404, detail="Form not found")

    # Only owner can publish
    if existing_row["admin_id"] != current_admin["id"]:
         raise HTTPException(status_code=403, detail="Only the owner can publish this form")

    new_state = True

    schema_result = (
        sb.table("forms")
        .select("schema,title")
        .eq("id", form_id)
        .maybe_single()
        .execute()
    )
    schema = (schema_result.data or {}).get("schema") or {}
    current_version = schema.get("version", 1)
    try:
        current_version = int(current_version)
    except Exception:
        current_version = 1
    next_version = max(1, current_version + 1)
    schema["version"] = next_version
    settings = schema.get("settings") or {}

    update_payload = {"is_published": new_state, "schema": schema}
    result = sb.table("forms").update(update_payload).eq("id", form_id).execute()
    updated_row = result.data[0] if getattr(result, "data", None) else {}
    if not updated_row:
        latest = sb.table("forms").select("id,title,is_published,schema").eq("id", form_id).maybe_single().execute()
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
        if recipients:
            try:
                sent_count = send_bulk_form_publish_emails(
                    recipients,
                    form_title=form_title,
                    form_url=form_url,
                    custom_message=message,
                    admin_name=current_admin.get("username"),
                )
            except Exception as e:
                print(f"[Zealflow] Publish email batch failed: {e}")

        email_result = {
            "mailing_list_count": len(recipients),
            "mailing_list_sent": sent_count,
        }

    response_schema = updated_row.get("schema") or schema
    return {
        **updated_row,
        **email_result,
        "version": (response_schema or {}).get("version", next_version),
        "republished": bool(existing_row.get("is_published")),
    }
