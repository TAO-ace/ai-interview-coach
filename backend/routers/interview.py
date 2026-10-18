"""
Interview router
================
Exposes three actions the frontend needs:

  POST /interview/start   — send topic + difficulty, get the first question
  POST /interview/answer  — send the full conversation, get the next message
                            + whether the interview has ended
  POST /interview/report  — send the full conversation, get the scored report

No database: the frontend sends the full message history every request.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from groq import APIConnectionError, APIStatusError, RateLimitError

from models import (
    InterviewerRequest,
    InterviewerResponse,
    ReportRequest,
    ReportResponse,
)
from ai.interviewer import get_next_interviewer_message
from ai.report import generate_report

router = APIRouter(prefix="/interview", tags=["interview"])


# ── Helper: uniform Groq error handler ───────────────────────────────────────

def _handle_groq_error(exc: Exception) -> None:
    """Raise a user-friendly HTTPException for any Groq SDK error."""
    if isinstance(exc, RateLimitError):
        raise HTTPException(
            status_code=429,
            detail="The AI service is busy. Please wait a moment and try again.",
        )
    if isinstance(exc, APIConnectionError):
        raise HTTPException(
            status_code=503,
            detail="Could not reach the AI service. Check your internet connection.",
        )
    if isinstance(exc, APIStatusError):
        raise HTTPException(
            status_code=502,
            detail=f"The AI service returned an error ({exc.status_code}). Please try again.",
        )
    raise HTTPException(
        status_code=500,
        detail="An unexpected error occurred. Please try again.",
    )


# ── POST /interview/start ─────────────────────────────────────────────────────

@router.post(
    "/start",
    response_model=InterviewerResponse,
    summary="Start a new interview",
    description=(
        "Send a topic and difficulty. Receive the interviewer's opening question. "
        "The `messages` field should be empty for a fresh interview."
    ),
)
async def start_interview(req: InterviewerRequest) -> InterviewerResponse:
    """
    Kicks off a new interview by asking the AI for its first question.
    The client should pass an empty `messages` list.
    """
    # Ensure we start fresh — ignore any messages the client may have sent
    fresh_req = InterviewerRequest(
        topic=req.topic,
        difficulty=req.difficulty,
        messages=[],
    )
    try:
        return get_next_interviewer_message(fresh_req)
    except (RateLimitError, APIConnectionError, APIStatusError) as exc:
        _handle_groq_error(exc)
    except Exception as exc:
        _handle_groq_error(exc)


# ── POST /interview/answer ────────────────────────────────────────────────────

@router.post(
    "/answer",
    response_model=InterviewerResponse,
    summary="Submit an answer and get the next interviewer message",
    description=(
        "Send the full conversation history (including the candidate's latest answer). "
        "Returns the interviewer's next message and `interview_ended` flag."
    ),
)
async def submit_answer(req: InterviewerRequest) -> InterviewerResponse:
    """
    The client sends the entire conversation so far (including the newest user
    message). The AI decides what to say next and whether to end the interview.
    """
    if not req.messages:
        raise HTTPException(
            status_code=422,
            detail="messages must not be empty. Send the full conversation history.",
        )
    try:
        return get_next_interviewer_message(req)
    except (RateLimitError, APIConnectionError, APIStatusError) as exc:
        _handle_groq_error(exc)
    except Exception as exc:
        _handle_groq_error(exc)


# ── POST /interview/report ────────────────────────────────────────────────────

@router.post(
    "/report",
    response_model=ReportResponse,
    summary="Generate the interview report",
    description=(
        "Send the complete interview transcript. "
        "Returns a structured report: score, grade, pass/fail, strengths, "
        "weaknesses, topics to revise, and an overall verdict."
    ),
)
async def get_report(req: ReportRequest) -> ReportResponse:
    """
    Analyses the full conversation and returns a scored, structured report.
    Grade and pass/fail are computed server-side from the AI-generated score.
    """
    if not req.messages:
        raise HTTPException(
            status_code=422,
            detail="messages must not be empty. The interview must have at least one turn.",
        )
    try:
        return generate_report(req)
    except (RateLimitError, APIConnectionError, APIStatusError) as exc:
        _handle_groq_error(exc)
    except Exception as exc:
        _handle_groq_error(exc)
