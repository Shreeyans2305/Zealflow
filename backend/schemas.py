from pydantic import BaseModel
from typing import Dict, Any, List, Optional
import datetime

class FormBase(BaseModel):
    title: str
    schema_data: Dict[str, Any]
    expires_at: Optional[datetime.datetime] = None

class FormCreate(FormBase):
    pass

class FormResponse(FormBase):
    id: str
    created_at: datetime.datetime

    class Config:
        from_attributes = True

class SubmissionCreate(BaseModel):
    answers: Dict[str, Any]

class SubmissionResponse(BaseModel):
    id: str
    form_id: str
    answers: Dict[str, Any]
    submitted_at: datetime.datetime

    class Config:
        from_attributes = True
