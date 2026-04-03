from typing import Any, Optional
from pydantic import BaseModel


class FormCreate(BaseModel):
    id: str
    title: str
    schema: dict[str, Any]
    slug: Optional[str] = None


class FormUpdate(BaseModel):
    title: Optional[str] = None
    schema: Optional[dict[str, Any]] = None
    slug: Optional[str] = None
    is_published: Optional[bool] = None


class FormShareRequest(BaseModel):
    password: Optional[str] = None
    expires_in_hours: Optional[int] = 24


class FormJoinRequest(BaseModel):
    token: str
    password: Optional[str] = None


class FormCollaboratorResponse(BaseModel):
    user_id: str
    role: str
    username: Optional[str] = None
