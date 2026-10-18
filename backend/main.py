"""
AI Interview Coach — FastAPI Backend
Step 8: Robust validation, friendly errors, and clear startup reporting.
"""

import os
import sys
from fastapi import FastAPI, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load .env BEFORE importing anything that reads env vars (e.g. Groq client).
# override=False means env vars already set in the process (e.g. on Render/Vercel)
# are never overwritten by the .env file.
load_dotenv(override=False)

# ── Router import (after load_dotenv so GROQ_API_KEY is available) ────────────
from routers.interview import router as interview_router  # noqa: E402
from ai.client import MODEL as AI_MODEL  # noqa: E402

# ── App ───────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="AI Interview Coach API",
    description=(
        "Backend for the AI Interview Coach app.\n\n"
        "**Endpoints**\n"
        "- `POST /interview/start` — start a new interview, get the first question\n"
        "- `POST /interview/answer` — submit an answer, get the next question\n"
        "- `POST /interview/report` — generate a scored report for the full conversation\n"
        "- `GET  /health` — liveness probe\n"
    ),
    version="1.0.0",
)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [
    o.strip()
    for o in os.getenv(
        "ALLOWED_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if o.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Friendly Error Handlers ───────────────────────────────────────────────────

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    """
    Transform raw Pydantic validation errors into clean, friendly human messages.
    """
    error_messages = []
    for err in exc.errors():
        field_loc = " -> ".join(str(loc) for loc in err.get("loc", []) if loc != "body")
        msg = err.get("msg", "invalid input")
        if field_loc:
            error_messages.append(f"Field '{field_loc}': {msg}")
        else:
            error_messages.append(msg)

    friendly_detail = "; ".join(error_messages) if error_messages else "Invalid request data."
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "detail": friendly_detail,
            "errors": exc.errors(),
        },
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Catch-all exception handler to prevent unhandled crashes.
    """
    sys.stderr.write(f"[Server Error] Unhandled exception on {request.url.path}: {exc}\n")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "detail": "An unexpected server error occurred. Please try again shortly.",
        },
    )


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(interview_router)


# ── Meta routes ───────────────────────────────────────────────────────────────
@app.get("/health", tags=["meta"])
async def health_check():
    """Liveness probe — returns 200 if the server is up."""
    return {
        "status": "ok",
        "message": "AI Interview Coach API is running smoothly.",
        "model": AI_MODEL,
    }


@app.get("/", tags=["meta"])
async def root():
    return {
        "name": "AI Interview Coach API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# ── Clear Startup Banner ──────────────────────────────────────────────────────
@app.on_event("startup")
def print_startup_banner():
    key_set = bool(os.getenv("GROQ_API_KEY"))
    status_key = "Configured (Ready)" if key_set else "MISSING (Set in .env)"
    print(
        f"\n"
        f"  +=======================================================+\n"
        f"  |             AI INTERVIEW COACH API                    |\n"
        f"  +=======================================================+\n"
        f"  |  Status:    ONLINE                                    |\n"
        f"  |  AI Model:  {AI_MODEL:<42}|\n"
        f"  |  Groq Key:  {status_key:<42}|\n"
        f"  |  API Docs:  http://localhost:8000/docs                |\n"
        f"  |  Health:    http://localhost:8000/health              |\n"
        f"  +=======================================================+\n"
    )


# ── Entry-point ───────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import uvicorn

    port = int(os.getenv("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
