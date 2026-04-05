import os
import traceback

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from routers import auth, collaboration_ws, forms, responses, ai

app = FastAPI(title="Zealflow API", version="1.0.0")

FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
FRONTEND_URLS = os.getenv("FRONTEND_URLS", "")
FRONTEND_ORIGIN_REGEX = os.getenv("FRONTEND_ORIGIN_REGEX", r"https://.*\.vercel\.app")

allow_origins = [
    FRONTEND_URL,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://zealflow.vercel.app",
]

if FRONTEND_URLS.strip():
    allow_origins.extend([u.strip() for u in FRONTEND_URLS.split(",") if u.strip()])

# de-duplicate while preserving order
allow_origins = list(dict.fromkeys(allow_origins))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=FRONTEND_ORIGIN_REGEX or None,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)


# Global exception handler to ensure CORS headers are always present on errors
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    traceback.print_exc()
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"},
    )


app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(forms.router, prefix="/api/forms", tags=["forms"])
app.include_router(responses.router, prefix="/api/forms", tags=["responses"])
app.include_router(collaboration_ws.router, tags=["collaboration"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])


@app.get("/")
def root():
    return {"status": "ok", "service": "Zealflow API"}


@app.get("/health")
def health():
    return {"status": "healthy", "service": "Zealflow API"}
