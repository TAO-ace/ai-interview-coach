"use client";

import React, { useState } from "react";
import { Difficulty, startInterview, InterviewerResponse } from "@/lib/api";

interface StartScreenProps {
  onInterviewStarted: (
    topic: string,
    difficulty: Difficulty,
    firstResponse: InterviewerResponse
  ) => void;
}

const QUICK_TOPICS = [
  "Binary Trees",
  "System Design",
  "SQL & Indexing",
  "REST APIs & HTTP",
  "Dynamic Programming",
  "Concurrency & Async",
];

const DIFFICULTY_OPTIONS: {
  level: Difficulty;
  label: string;
  desc: string;
  badgeColor: string;
}[] = [
  {
    level: "Easy",
    label: "Easy",
    desc: "Core definitions, recall & fundamentals",
    badgeColor: "badge-easy",
  },
  {
    level: "Medium",
    label: "Medium",
    desc: "Applied problems & algorithm scenarios",
    badgeColor: "badge-medium",
  },
  {
    level: "Hard",
    label: "Hard",
    desc: "Architecture, trade-offs & system depth",
    badgeColor: "badge-hard",
  },
];

export default function StartScreen({ onInterviewStarted }: StartScreenProps) {
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmedTopic = topic.trim();
    if (!trimmedTopic) {
      setErrorMessage("Please enter a technical topic to begin your interview.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await startInterview(trimmedTopic, difficulty);
      onInterviewStarted(trimmedTopic, difficulty, response);
    } catch (err: unknown) {
      const msg =
        err instanceof Error
          ? err.message
          : "Failed to connect to the backend server. Please verify the backend is running.";
      setErrorMessage(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="start-container">
      <div className="ambient-glow" />

      <div className="card start-card">
        {/* Header */}
        <header className="start-header">
          <div className="badge-pill">AI Technical Interview</div>
          <h1 className="main-title">AI Interview Coach</h1>
          <p className="subtitle">
            Practice real technical interviews one question at a time. The AI
            interviewer adapts to your responses and provides a detailed scored
            report with Pass/Fail.
          </p>
        </header>

        {/* Error Alert */}
        {errorMessage && (
          <div className="alert alert-error" role="alert">
            <svg
              className="alert-icon"
              viewBox="0 0 20 20"
              fill="currentColor"
              width="20"
              height="20"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <div className="alert-content">
              <strong>Error:</strong> {errorMessage}
            </div>
            <button
              type="button"
              className="alert-close"
              onClick={() => setErrorMessage(null)}
              aria-label="Dismiss error"
            >
              &times;
            </button>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="start-form">
          {/* Topic Section */}
          <div className="form-group">
            <label htmlFor="topic-input" className="form-label">
              Technical Topic
            </label>
            <input
              id="topic-input"
              type="text"
              className="form-input"
              placeholder="e.g. Binary Search Trees, React Architecture, Redis Caching..."
              value={topic}
              onChange={(e) => {
                setTopic(e.target.value);
                if (errorMessage) setErrorMessage(null);
              }}
              disabled={isLoading}
              autoFocus
            />

            {/* Quick Topic Chips */}
            <div className="quick-topics">
              <span className="quick-topics-label">Suggestions:</span>
              <div className="chips-row">
                {QUICK_TOPICS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={`topic-chip ${topic === item ? "active" : ""}`}
                    onClick={() => {
                      setTopic(item);
                      if (errorMessage) setErrorMessage(null);
                    }}
                    disabled={isLoading}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Difficulty Section */}
          <div className="form-group">
            <label className="form-label">Interview Difficulty</label>
            <div className="difficulty-grid">
              {DIFFICULTY_OPTIONS.map((opt) => {
                const isSelected = difficulty === opt.level;
                return (
                  <button
                    key={opt.level}
                    type="button"
                    className={`difficulty-card ${isSelected ? "selected" : ""}`}
                    onClick={() => setDifficulty(opt.level)}
                    disabled={isLoading}
                  >
                    <div className="difficulty-card-top">
                      <span className={`diff-badge ${opt.badgeColor}`}>
                        {opt.label}
                      </span>
                      {isSelected && <span className="diff-check">●</span>}
                    </div>
                    <p className="difficulty-card-desc">{opt.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            className="btn-primary start-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <span className="btn-loading">
                <span className="spinner" />
                Preparing Interview with AI...
              </span>
            ) : (
              <span className="btn-content">
                Start Interview
                <svg
                  className="arrow-icon"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </span>
            )}
          </button>
        </form>

        {/* Feature Highlights Footer */}
        <footer className="start-footer">
          <div className="feature-item">
            <span className="feature-dot" />
            <span>Stateless AI Interviewer</span>
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            <span>Adaptive Follow-ups</span>
          </div>
          <div className="feature-item">
            <span className="feature-dot" />
            <span>Pass / Fail & Revision Breakdown</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
