from typing import Any
from pydantic import BaseModel


class SubmitRequest(BaseModel):
    data: dict[str, Any]
