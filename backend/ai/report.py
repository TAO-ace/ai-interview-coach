"""
Report Generator
================
Given the full conversation, returns a structured interview report
with score, grade, pass/fail, strengths, weaknesses, topics to revise,
and an overall verdict.

Grade thresholds (from spec):
  85–100  Excellent
  70–84   Good
  55–69   Adequate
  0–54    Weak

Pass threshold: score >= 55.

Uses Groq JSON mode for reliable structured output. Grade and pass/fail
are computed server-side from the score so the AI cannot be inconsistent.
"""

from __future__ import annotations
import json

from models import Message, ReportRequest, ReportResponse
from ai.client import client, MODEL


# ── System prompt ─────────────────────────────────────────────────────────────

def _build_report_system_prompt(topic: str, difficulty: str) -> str:
    return f"""You are an expert technical interviewer evaluating a completed {difficulty} interview on "{topic}".

You will be given the full interview transcript. Analyse it carefully and produce an objective assessment.

SCORING GUIDE:
- Score the candidate from 0 to 100 based on accuracy, depth, and clarity.
- Be fair but strict: partial answers should not score as high as complete ones.
- Consider the difficulty level when calibrating — a score of 70 at Hard is excellent work.

OUTPUT — respond ONLY with a valid JSON object matching this exact schema:
{{
  "score": <integer 0–100>,
  "verdict": "<2-4 sentence overall assessment of the candidate's performance>",
  "strengths": ["<specific thing the candidate said or demonstrated>", ...],
  "weaknesses": ["<specific gap or incorrect statement from the candidate>", ...],
  "topics_to_revise": ["<topic or sub-topic the candidate should study>", ...]
}}

RULES:
- strengths and weaknesses MUST reference things the candidate actually said, not generic advice.
- topics_to_revise should be concrete (e.g., "Binary Tree traversal algorithms", not just "trees").
- Provide at least 1 strength and 1 weakness. Provide 1–5 items per list.
- verdict must be 2–4 sentences: what they did well, where they fell short, bottom-line assessment.
- Do NOT include grade or pass/fail — those are computed separately.
- Do not include any text outside the JSON object."""


# ── Grade / pass helpers ──────────────────────────────────────────────────────

def _grade(score: int) -> str:
    if score >= 85:
        return "Excellent"
    if score >= 70:
        return "Good"
    if score >= 55:
        return "Adequate"
    return "Weak"


def _passed(score: int) -> bool:
    return score >= 55


# ── Core function ─────────────────────────────────────────────────────────────

def generate_report(req: ReportRequest) -> ReportResponse:
    """
    Call Groq and return a fully structured interview report.
    """
    system_prompt = _build_report_system_prompt(req.topic, req.difficulty)

    # Build a readable transcript for the model.
    transcript_lines: list[str] = []
    for i, msg in enumerate(req.messages, 1):
        speaker = "Interviewer" if msg.role == "interviewer" else "Candidate"
        transcript_lines.append(f"[Turn {i}] {speaker}: {msg.content}")
    transcript = "\n".join(transcript_lines)

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": (
                    f"Topic: {req.topic}\n"
                    f"Difficulty: {req.difficulty}\n\n"
                    f"Transcript:\n{transcript}"
                ),
            },
        ],
        response_format={"type": "json_object"},
        temperature=0.3,   # lower temp for more consistent scoring
        max_tokens=1024,
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)

    score = int(data["score"])
    # Clamp to 0–100 in case the model drifts slightly
    score = max(0, min(100, score))

    return ReportResponse(
        score=score,
        grade=_grade(score),
        passed=_passed(score),
        verdict=data["verdict"],
        strengths=data.get("strengths", []),
        weaknesses=data.get("weaknesses", []),
        topics_to_revise=data.get("topics_to_revise", []),
    )
