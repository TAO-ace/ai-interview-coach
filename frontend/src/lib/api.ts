/**
 * API client for the AI Interview Coach backend.
 *
 * All three actions are stateless — the full conversation is sent with
 * every request so the backend needs no database.
 */

const RAW_BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const BASE_URL = RAW_BASE_URL.replace(/\/+$/, "");

// ── Types (mirror backend models.py) ─────────────────────────────────────────

export type Difficulty = "Easy" | "Medium" | "Hard";
export type Role = "interviewer" | "user";

export interface Message {
  role: Role;
  content: string;
}

export interface InterviewerResponse {
  message: string;
  interview_ended: boolean;
}

export interface ReportResponse {
  score: number;
  grade: "Excellent" | "Good" | "Adequate" | "Weak";
  passed: boolean;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  topics_to_revise: string[];
}

// ── Shared fetch helper ───────────────────────────────────────────────────────

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    // Try to extract a friendly detail message from the backend
    let detail = `Server error (${res.status})`;
    try {
      const data = await res.json();
      if (data?.detail) detail = data.detail;
    } catch {
      // ignore JSON parse failure
    }
    throw new Error(detail);
  }

  return res.json() as Promise<T>;
}

// ── API actions ───────────────────────────────────────────────────────────────

/**
 * Start a new interview. Returns the interviewer's opening question.
 */
export async function startInterview(
  topic: string,
  difficulty: Difficulty
): Promise<InterviewerResponse> {
  return post<InterviewerResponse>("/interview/start", {
    topic,
    difficulty,
    messages: [],
  });
}

/**
 * Submit the candidate's answer. Returns the interviewer's next message
 * and whether the interview has ended.
 */
export async function submitAnswer(
  topic: string,
  difficulty: Difficulty,
  messages: Message[]
): Promise<InterviewerResponse> {
  return post<InterviewerResponse>("/interview/answer", {
    topic,
    difficulty,
    messages,
  });
}

/**
 * Generate the final interview report from the full conversation.
 */
export async function generateReport(
  topic: string,
  difficulty: Difficulty,
  messages: Message[]
): Promise<ReportResponse> {
  return post<ReportResponse>("/interview/report", {
    topic,
    difficulty,
    messages,
  });
}
