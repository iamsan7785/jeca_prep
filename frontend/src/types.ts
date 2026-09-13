import type { AttemptAnswer, Question } from "@jeca/shared/types";

export interface User {
  id: string;
  name: string;
  email: string;
  role: "STUDENT" | "ADMIN";
}

export interface Session {
  user: User;
  token: string;
  mode: "api" | "local";
}

export type ExamAttemptType = "MOCK" | "PYQ";

export interface ActiveExam {
  attemptId: string;
  remote: boolean;
  remoteType?: ExamAttemptType;
  testId: string;
  title: string;
  questions: Question[];
  answers: Record<string, AttemptAnswer>;
  currentIndex: number;
  startedAt: string;
  endAt: string;
  submitted?: boolean;
}

export interface ResultData {
  score: number;
  maximumScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  partial: number;
  accuracy: number;
  subjectBreakdown: { subject: string; correct: number; incorrect: number; unattempted: number; score: number; maximumScore: number; accuracy: number }[];
  questionScores: { questionId: string; status: "correct" | "incorrect" | "unattempted" | "partial"; score: number; maximumScore: number }[];
  review: (Question & { selectedOptionIds: string[]; marksObtained: number })[];
  submittedAt: string;
  testName: string;
}

export interface StartSettings {
  testId: string;
  testName: string;
  count: number;
  durationMinutes: number;
  subject?: string;
  type?: ExamAttemptType;
  paperId?: string;
}
