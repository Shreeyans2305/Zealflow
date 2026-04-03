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
