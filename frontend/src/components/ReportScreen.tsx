"use client";

import React, { useState } from "react";
import { Difficulty, ReportResponse } from "@/lib/api";

interface ReportScreenProps {
  topic: string;
  difficulty: Difficulty;
  report: ReportResponse;
  onStartNew: () => void;
}

export default function ReportScreen({
  topic,
  difficulty,
  report,
  onStartNew,
}: ReportScreenProps) {
  const [copied, setCopied] = useState(false);

  // Score color coding: 85+ Excellent (emerald), 70-84 Good (blue/cyan), 55-69 Adequate (amber), <55 Weak (rose/red)
  const getScoreColorClass = (score: number) => {
    if (score >= 85) return "score-excellent";
    if (score >= 70) return "score-good";
    if (score >= 55) return "score-adequate";
    return "score-weak";
  };

  const handleCopySummary = () => {
    const summaryText = [
      `AI Interview Coach — Evaluation Report`,
      `Topic: ${topic} (${difficulty})`,
      `Score: ${report.score}/100 (${report.grade}) — ${
        report.passed ? "PASSED" : "FAILED"
      }`,
      ``,
      `Verdict:`,
      report.verdict,
      ``,
      `Key Strengths:`,
      ...report.strengths.map((s) => `- ${s}`),
      ``,
      `Areas for Improvement:`,
      ...report.weaknesses.map((w) => `- ${w}`),
      ``,
      `Recommended Topics to Revise:`,
      ...report.topics_to_revise.map((t) => `- ${t}`),
    ].join("\n");

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(summaryText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="report-container">
      <div className="card report-card">
        {/* Header */}
        <header className="report-header">
          <div className="report-badge">Interview Complete</div>
          <h1 className="report-title">Candidate Evaluation Report</h1>
          <div className="report-meta">
            <span className="report-meta-item">
              Topic: <strong>{topic}</strong>
            </span>
            <span className="meta-sep">·</span>
            <span className="report-meta-item">
              Difficulty:{" "}
              <span className={`diff-pill diff-${difficulty.toLowerCase()}`}>
                {difficulty}
              </span>
            </span>
          </div>
        </header>

        {/* Score & Result Banner */}
        <div className="report-hero-grid">
          <div className={`score-box ${getScoreColorClass(report.score)}`}>
            <span className="score-label">Overall Score</span>
            <div className="score-value">
              {report.score}
              <span className="score-max">/100</span>
            </div>
            <span className="score-grade">{report.grade}</span>
          </div>

          <div
            className={`verdict-box ${
              report.passed ? "verdict-pass" : "verdict-fail"
            }`}
          >
            <span className="verdict-label">Outcome</span>
            <div className="verdict-status">
              {report.passed ? "PASSED" : "FAILED"}
            </div>
            <p className="verdict-summary">{report.verdict}</p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="report-sections">
          {/* Strengths */}
          <section className="report-section section-strengths">
            <h2 className="section-title">
              <span className="section-icon">✓</span> Key Strengths
            </h2>
            <ul className="bullet-list">
              {report.strengths.map((item, i) => (
                <li key={i} className="bullet-item">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Weaknesses */}
          <section className="report-section section-weaknesses">
            <h2 className="section-title">
              <span className="section-icon">✕</span> Areas for Improvement
            </h2>
            <ul className="bullet-list">
              {report.weaknesses.map((item, i) => (
                <li key={i} className="bullet-item">
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Topics to Revise */}
          <section className="report-section section-revision">
            <h2 className="section-title">
              <span className="section-icon">📖</span> Recommended Topics to Revise
            </h2>
            <div className="revision-tags">
              {report.topics_to_revise.map((item, i) => (
                <span key={i} className="revision-tag">
                  {item}
                </span>
              ))}
            </div>
          </section>
        </div>

        {/* Action Footer */}
        <footer className="report-footer">
          <button
            type="button"
            className="btn-ghost btn-copy"
            onClick={handleCopySummary}
          >
            {copied ? "✓ Copied to Clipboard!" : "Copy Report Summary"}
          </button>
          <button
            type="button"
            className="btn-primary btn-large"
            onClick={onStartNew}
          >
            Start New Interview
          </button>
        </footer>
      </div>
    </div>
  );
}
