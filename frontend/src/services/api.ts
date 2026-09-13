import type { Session, StartSettings } from "../types";

export type AdminQuestion = {
  id: string;
  questionNumber?: number | null;
  kind: "QUESTION" | "PYQ";
  questionText: string;
  questionType: "SINGLE" | "MULTIPLE";
  options: Array<{ id: string; text: string }>;
  correctAnswers: string[];
  subject: string;
  topic: string;
  category: string;
  difficulty: "Easy" | "Medium" | "Hard";
  marks: number;
  negativeMarks: number;
  explanation: string;
  source: string;
  sourceType: "PYQ" | "MOCK" | "PRACTICE" | "PREDICTED";
  year?: number | null;
  originalQuestionNumber?: string | null;
  sourceUrl?: string;
  paperId?: string;
  paperTitle?: string;
  published: boolean;
  answerStatus: "UNVERIFIED" | "AI_CHECKED" | "ADMIN_VERIFIED" | "OFFICIAL_KEY_VERIFIED";
  updatedAt: string;
};

const request = async <T>(path: string, init: RequestInit = {}, token?: string): Promise<T> => {
  const response = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(init.headers ?? {}) },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.message ?? "The request could not be completed.");
  return payload as T;
};

export const api = {
  register: (name: string, email: string, password: string) => request<Session>("/api/auth/register", { method: "POST", body: JSON.stringify({ name, email, password }) }),
  login: (email: string, password: string) => request<Session>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) }),
  start: async (settings: StartSettings, token: string) => {
    if (settings.type === "PYQ" && settings.paperId) {
      return request<{ attemptId: string; startedAt: string; expiresAt: string; questions: unknown[] }>(`/api/exams/pyq/${settings.paperId}/start`, { method: "POST", body: JSON.stringify({}) }, token);
    }
    return request<{ attemptId: string; testName: string; startedAt: string; endAt: string; questions: unknown[] }>("/api/mock-tests/start", { method: "POST", body: JSON.stringify(settings) }, token);
  },
  saveAnswer: (attemptId: string, answer: unknown, token: string, kind: "MOCK" | "PYQ" = "MOCK") => request(kind === "PYQ" ? `/api/exams/${attemptId}/answer` : `/api/mock-tests/${attemptId}/answer`, { method: "POST", body: JSON.stringify(answer) }, token),
  submit: (attemptId: string, token: string, kind: "MOCK" | "PYQ" = "MOCK") => request<Record<string, unknown>>(kind === "PYQ" ? `/api/exams/${attemptId}/submit` : `/api/mock-tests/${attemptId}/submit`, { method: "POST", body: "{}" }, token),
  activeAttempt: (token: string) => request<{ attemptId: string; type: "MOCK" | "PYQ"; testId: string; testName: string; startedAt: string; expiresAt: string; questions: unknown[]; answers: Array<{ questionId: string; selectedOptionIds: string[]; markedForReview?: boolean; timeSpentSeconds?: number }> }>("/api/exams/active", {}, token),
  bookmarks: (token: string) => request<{ items: any[] }>("/api/bookmarks", {}, token),
  addBookmark: (questionId: string, token: string) => request<{ bookmarked: boolean }>("/api/bookmarks", { method: "POST", body: JSON.stringify({ questionId }) }, token),
  removeBookmark: (questionId: string, token: string) => request<void>(`/api/bookmarks/${questionId}`, { method: "DELETE" }, token),
  event: (attemptId: string, type: string, token: string, kind: "MOCK" | "PYQ" = "MOCK") => request(kind === "PYQ" ? `/api/exams/${attemptId}/event` : `/api/mock-tests/${attemptId}/event`, { method: "POST", body: JSON.stringify({ type }) }, token),
  adminQuestions: (token: string, params: Record<string, string | number> = {}) => request<{ items: AdminQuestion[]; total: number; page: number; limit: number }>(`/api/admin/questions?${new URLSearchParams(Object.entries(params).map(([key, value]) => [key, String(value)]))}`, {}, token),
  adminQuestion: (id: string, token: string, kind?: AdminQuestion["kind"]) => request<{ question: AdminQuestion }>(`/api/admin/questions/${id}${kind ? `?kind=${kind}` : ""}`, {}, token),
  updateAdminQuestion: (id: string, payload: Partial<AdminQuestion>, token: string) => request<{ question: AdminQuestion }>(`/api/admin/questions/${id}`, { method: "PUT", body: JSON.stringify(payload) }, token),
};
