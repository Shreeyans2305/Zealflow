import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import auth, forms, responses

app = FastAPI(title="Zealflow API", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(forms.router, prefix="/api/forms", tags=["forms"])
app.include_router(responses.router, prefix="/api/forms", tags=["responses"])


@app.get("/")
def root():
    return {"status": "ok", "service": "Zealflow API"}
