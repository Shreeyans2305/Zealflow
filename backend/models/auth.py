from pydantic import BaseModel, EmailStr


class SignupRequest(BaseModel):
    username: str
    email: EmailStr
    password: str


class LoginRequest(BaseModel):
    username: str
    password: str


class AdminOut(BaseModel):
    id: str
    username: str
    email: str
    created_at: str
