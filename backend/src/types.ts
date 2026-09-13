import type { AttemptAnswer, Question } from "@jeca/shared/types";

export type AppRole = "STUDENT" | "ADMIN";

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: AppRole;
  createdAt: Date;
}

export interface AttemptRecord {
  id: string;
  userId: string;
  testId: string;
  testName: string;
  questions: Question[];
  answers: Record<string, AttemptAnswer>;
  startedAt: Date;
  endAt: Date;
  submittedAt?: Date;
  suspiciousEvents: { type: string; at: Date }[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: AppRole };
    }
  }
}
