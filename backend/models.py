"""
Pydantic models shared across the AI Interview Coach backend.
"""

from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field


# ── Shared primitives ─────────────────────────────────────────────────────────

Difficulty = Literal["Easy", "Medium", "Hard"]
Role = Literal["interviewer", "user"]


class Message(BaseModel):
    """A single turn in the conversation."""
    role: Role
    content: str


# ── Interviewer ───────────────────────────────────────────────────────────────

class InterviewerRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty
    messages: list[Message] = Field(default_factory=list)


class InterviewerResponse(BaseModel):
    message: str
    interview_ended: bool


# ── Report ────────────────────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    topic: str = Field(..., min_length=1, max_length=200)
    difficulty: Difficulty
    messages: list[Message]


class ReportResponse(BaseModel):
    score: int = Field(..., ge=0, le=100)
    grade: Literal["Excellent", "Good", "Adequate", "Weak"]
    passed: bool
    verdict: str
    strengths: list[str]
    weaknesses: list[str]
    topics_to_revise: list[str]
