"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Difficulty,
  Message,
  InterviewerResponse,
  submitAnswer,
  ReportResponse,
  generateReport,
} from "@/lib/api";

interface InterviewScreenProps {
  topic: string;
  difficulty: Difficulty;
  initialQuestion: string;
  initialEnded: boolean;
  onFinishInterview: (report: ReportResponse, messages: Message[]) => void;
  onReset: () => void;
}

export default function InterviewScreen({
  topic,
  difficulty,
  initialQuestion,
  initialEnded,
  onFinishInterview,
  onReset,
}: InterviewScreenProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "interviewer", content: initialQuestion },
  ]);
  const [inputAnswer, setInputAnswer] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom whenever messages change or loading changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isSubmitting, isGeneratingReport]);

  // Focus textarea when done thinking
  useEffect(() => {
    if (!isSubmitting && !isGeneratingReport) {
      textareaRef.current?.focus();
    }
  }, [isSubmitting, isGeneratingReport]);

  // Handle ending interview and generating report
  const handleEndInterview = async (finalMessages: Message[]) => {
    setIsGeneratingReport(true);
    setError(null);
    try {
      const report = await generateReport(topic, difficulty, finalMessages);
      onFinishInterview(report, finalMessages);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to generate report. Please try again.";
      setError(msg);
      setIsGeneratingReport(false);
    }
  };

  // If initial ended immediately (unlikely, but handled)
  useEffect(() => {
    if (initialEnded) {
      handleEndInterview([{ role: "interviewer", content: initialQuestion }]);
    }
  }, [initialEnded]);

  const handleSend = async () => {
    const trimmed = inputAnswer.trim();
    if (!trimmed || isSubmitting || isGeneratingReport) return;

    setError(null);
    const updatedMessages: Message[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(updatedMessages);
    setInputAnswer("");
    setIsSubmitting(true);

    try {
      const res: InterviewerResponse = await submitAnswer(
        topic,
        difficulty,
        updatedMessages
      );

      const nextMessages: Message[] = [
        ...updatedMessages,
        { role: "interviewer", content: res.message },
      ];
      setMessages(nextMessages);

      if (res.interview_ended) {
        await handleEndInterview(nextMessages);
      }
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to submit answer. Please try again.";
      setError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSafeExit = () => {
    if (messages.length > 1) {
      const ok = window.confirm(
        "Are you sure you want to exit? Your active interview session will be discarded."
      );
      if (!ok) return;
    }
    onReset();
  };

  return (
    <div className="interview-container">
      {/* Top Header Bar */}
      <header className="interview-navbar">
        <div className="nav-left">
          <button
            type="button"
            className="btn-ghost"
            onClick={handleSafeExit}
            title="Exit interview and start new"
          >
            ← Exit
          </button>
          <div className="interview-meta">
            <h2 className="interview-topic">{topic}</h2>
            <span className={`diff-pill diff-${difficulty.toLowerCase()}`}>
              {difficulty}
            </span>
          </div>
        </div>

        <div className="nav-right">
          <button
            type="button"
            className="btn-ghost btn-end-early"
            onClick={() => handleEndInterview(messages)}
            disabled={isSubmitting || isGeneratingReport || messages.length <= 1}
            title="Conclude interview now and generate evaluation report"
          >
            Conclude Interview
          </button>
          <div className="live-indicator">
            <span className="live-dot" />
            Live Session
          </div>
        </div>
      </header>

      {/* Chat Messages Stream */}
      <main className="chat-window">
        <div className="messages-stream">
          {messages.map((m, index) => {
            const isAI = m.role === "interviewer";
            return (
              <div
                key={index}
                className={`message-row ${isAI ? "row-interviewer" : "row-candidate"}`}
              >
                <div className={`message-avatar ${isAI ? "avatar-ai" : "avatar-user"}`}>
                  {isAI ? "AI" : "YOU"}
                </div>
                <div className={`message-bubble ${isAI ? "bubble-ai" : "bubble-user"}`}>
                  <div className="message-header">
                    <span className="message-author">
                      {isAI ? "Interviewer" : "You"}
                    </span>
                  </div>
                  <div className="message-body">{m.content}</div>
                </div>
              </div>
            );
          })}

          {/* AI Thinking Indicator */}
          {isSubmitting && (
            <div className="message-row row-interviewer">
              <div className="message-avatar avatar-ai">AI</div>
              <div className="message-bubble bubble-ai bubble-thinking">
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-dot" />
                <span className="thinking-text">Interviewer is thinking...</span>
              </div>
            </div>
          )}

          {/* Report Generating State */}
          {isGeneratingReport && (
            <div className="generating-banner">
              <div className="spinner" />
              <div>
                <strong>Interview Complete!</strong>
                <p>Generating your comprehensive scored report & feedback...</p>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </main>

      {/* Error Alert if request failed */}
      {error && (
        <div className="chat-error-bar">
          <span>{error}</span>
          <button
            type="button"
            className="btn-retry"
            onClick={() => handleSend()}
            disabled={isSubmitting || isGeneratingReport}
          >
            Retry
          </button>
        </div>
      )}

      {/* Input Composer */}
      <footer className="chat-composer-footer">
        <div className="composer-wrapper">
          <textarea
            ref={textareaRef}
            className="composer-textarea"
            placeholder={
              isGeneratingReport
                ? "Interview has concluded. Compiling report..."
                : isSubmitting
                ? "Waiting for interviewer..."
                : "Type your technical answer... (Enter to send, Shift+Enter for newline)"
            }
            value={inputAnswer}
            onChange={(e) => setInputAnswer(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting || isGeneratingReport}
            rows={2}
          />
          <button
            type="button"
            className="btn-send"
            onClick={handleSend}
            disabled={!inputAnswer.trim() || isSubmitting || isGeneratingReport}
            title="Send answer (Enter)"
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="22" y1="2" x2="11" y2="13" />
              <polygon points="22 2 15 22 11 13 2 9 22 2" />
            </svg>
          </button>
        </div>
        <div className="composer-hint">
          Press <strong>Enter</strong> to send · <strong>Shift + Enter</strong> for a new line
        </div>
      </footer>
    </div>
  );
}
