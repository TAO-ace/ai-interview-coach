"""
AI Interviewer
==============
Given a topic, difficulty, and the conversation so far, returns the
interviewer's next message and whether the interview has ended.

Uses Groq JSON mode so that `interview_ended` is reliably structured
rather than parsed from free text.
"""

from __future__ import annotations
import json

from models import Message, InterviewerRequest, InterviewerResponse
from ai.client import client, MODEL


# ── System prompt ─────────────────────────────────────────────────────────────

def _build_system_prompt(topic: str, difficulty: str) -> str:
    difficulty_guide = {
        "Easy": (
            "Focus on basic definitions, terminology, and recall. "
            "Ask one straightforward conceptual question at a time."
        ),
        "Medium": (
            "Focus on applied problems and practical understanding. "
            "Ask candidates to explain how or why, not just what."
        ),
        "Hard": (
            "Focus on trade-offs, edge cases, and system-level thinking. "
            "Push for depth: scalability, failure modes, design decisions."
        ),
    }

    return f"""You are a professional technical interviewer conducting a {difficulty} interview on the topic: "{topic}".

DIFFICULTY GUIDE:
{difficulty_guide[difficulty]}

BEHAVIOUR RULES — follow these exactly:
1. Ask ONE question at a time. Never ask multiple questions in one turn.
2. If the candidate's answer is STRONG: acknowledge it briefly (one sentence), then move to a DIFFERENT aspect of the topic.
3. If the answer is PARTLY CORRECT: ask ONE targeted follow-up that probes the gap. Do NOT reveal the answer or hint at it.
4. If the answer is WRONG or very weak: note the gap in one short sentence (e.g., "That's not quite right."), then move on to a new question.
5. NEVER teach, explain, or hint at the correct answer. Stay professional and encouraging.
6. END the interview early (set interview_ended=true) if:
   - The candidate is clearly struggling across MULTIPLE consecutive questions (3+), OR
   - You have covered the key areas of the topic well and the candidate is performing consistently.
7. When ending, write a brief, kind closing statement (e.g., "That wraps up our session today — thank you for your time."). Do NOT end mid-topic without a closing line.
8. Keep all messages concise — no walls of text.

OUTPUT FORMAT — you MUST always respond with valid JSON matching this exact schema:
{{
  "message": "<your message to the candidate>",
  "interview_ended": <true or false>
}}

Do not include any text outside the JSON object."""


# ── Core function ─────────────────────────────────────────────────────────────

def get_next_interviewer_message(req: InterviewerRequest) -> InterviewerResponse:
    """
    Call Groq and return the interviewer's next message + end-of-interview flag.
    """
    system_prompt = _build_system_prompt(req.topic, req.difficulty)

    # Convert our conversation history to the format Groq expects.
    # "interviewer" maps to "assistant", "user" stays "user".
    groq_messages: list[dict] = []
    for msg in req.messages:
        groq_role = "assistant" if msg.role == "interviewer" else "user"
        groq_messages.append({"role": groq_role, "content": msg.content})

    response = client.chat.completions.create(
        model=MODEL,
        messages=[
            {"role": "system", "content": system_prompt},
            *groq_messages,
        ],
        response_format={"type": "json_object"},
        temperature=0.7,
        max_tokens=512,
    )

    raw = response.choices[0].message.content
    data = json.loads(raw)

    return InterviewerResponse(
        message=data["message"],
        interview_ended=bool(data.get("interview_ended", False)),
    )
