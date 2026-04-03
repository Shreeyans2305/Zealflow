import uuid
import datetime
from sqlalchemy import Column, String, JSON, DateTime, ForeignKey
from database import Base

class Form(Base):
    __tablename__ = "forms"
    id = Column(String, primary_key=True, index=True, default=lambda: f"form_{uuid.uuid4().hex[:12]}")
    title = Column(String, index=True)
    schema_data = Column(JSON)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)

class Response(Base):
    __tablename__ = "responses"
    id = Column(String, primary_key=True, index=True, default=lambda: f"resp_{uuid.uuid4().hex[:12]}")
    form_id = Column(String, ForeignKey("forms.id"))
    answers = Column(JSON)
    submitted_at = Column(DateTime, default=datetime.datetime.utcnow)
