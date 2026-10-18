"use client";

import React, { useState } from "react";
import StartScreen from "@/components/StartScreen";
import InterviewScreen from "@/components/InterviewScreen";
import ReportScreen from "@/components/ReportScreen";
import { Difficulty, InterviewerResponse, Message, ReportResponse } from "@/lib/api";

type AppScreen = "start" | "interview" | "report";

export default function Home() {
  const [screen, setScreen] = useState<AppScreen>("start");
  const [topic, setTopic] = useState("");
  const [difficulty, setDifficulty] = useState<Difficulty>("Medium");
  const [initialQuestion, setInitialQuestion] = useState("");
  const [initialEnded, setInitialEnded] = useState(false);
  const [reportData, setReportData] = useState<ReportResponse | null>(null);

  const handleInterviewStarted = (
    selectedTopic: string,
    selectedDifficulty: Difficulty,
    firstResponse: InterviewerResponse
  ) => {
    setTopic(selectedTopic);
    setDifficulty(selectedDifficulty);
    setInitialQuestion(firstResponse.message);
    setInitialEnded(firstResponse.interview_ended);
    setScreen("interview");
  };

  const handleFinishInterview = (report: ReportResponse) => {
    setReportData(report);
    setScreen("report");
  };

  const handleReset = () => {
    setTopic("");
    setDifficulty("Medium");
    setInitialQuestion("");
    setInitialEnded(false);
    setReportData(null);
    setScreen("start");
  };

  return (
    <div className="app-shell">
      {screen === "start" && (
        <StartScreen onInterviewStarted={handleInterviewStarted} />
      )}

      {screen === "interview" && (
        <InterviewScreen
          topic={topic}
          difficulty={difficulty}
          initialQuestion={initialQuestion}
          initialEnded={initialEnded}
          onFinishInterview={handleFinishInterview}
          onReset={handleReset}
        />
      )}

      {screen === "report" && reportData && (
        <ReportScreen
          topic={topic}
          difficulty={difficulty}
          report={reportData}
          onStartNew={handleReset}
        />
      )}
    </div>
  );
}
