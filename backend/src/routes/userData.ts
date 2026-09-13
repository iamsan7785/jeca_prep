import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";

export const userDataRouter = Router();
const prisma = new PrismaClient();

userDataRouter.get("/attempts", requireAuth, async (request, response) => {
  const attempts = await prisma.examAttempt.findMany({ where: { userId: request.auth!.userId }, orderBy: { startedAt: "desc" }, select: { id: true, type: true, startedAt: true, expiresAt: true, submittedAt: true, status: true, totalQuestions: true, result: true, mockConfig: true, pyqPaper: { select: { title: true, year: true } } } });
  return response.json({ items: attempts.map((attempt) => ({ id: attempt.id, type: attempt.type, testName: attempt.pyqPaper?.title ?? (attempt.mockConfig as { testName?: string } | null)?.testName ?? "Exam", startedAt: attempt.startedAt, endAt: attempt.expiresAt, submittedAt: attempt.submittedAt, status: attempt.status, questionCount: attempt.totalQuestions, result: attempt.result })) });
});

userDataRouter.get("/attempts/:id", requireAuth, async (request, response) => {
  const attempt = await prisma.examAttempt.findFirst({ where: { id: String(request.params.id), userId: request.auth!.userId }, include: { answers: true, pyqPaper: { select: { title: true, year: true } } } });
  if (!attempt) return response.status(404).json({ message: "Attempt not found." });
  return response.json(attempt);
});

userDataRouter.get("/bookmarks", requireAuth, async (request, response) => {
  const bookmarks = await prisma.bookmark.findMany({ where: { userId: request.auth!.userId }, orderBy: { createdAt: "desc" }, include: { question: { include: { subject: true, topic: true } } } });
  return response.json({ items: bookmarks.map(({ question }) => ({ ...question, options: question.options, correctAnswers: [], subject: question.subject.name, topic: question.topic?.name ?? "General" })) });
});

userDataRouter.post("/bookmarks", requireAuth, async (request, response) => {
  const questionId = String(request.body.questionId ?? "");
  const question = await prisma.question.findUnique({ where: { id: questionId }, select: { id: true } });
  if (!question) return response.status(404).json({ message: "Question not found." });
  await prisma.bookmark.upsert({ where: { userId_questionId: { userId: request.auth!.userId, questionId } }, update: {}, create: { userId: request.auth!.userId, questionId } });
  return response.status(201).json({ bookmarked: true });
});

userDataRouter.delete("/bookmarks/:questionId", requireAuth, async (request, response) => {
  await prisma.bookmark.deleteMany({ where: { userId: request.auth!.userId, questionId: String(request.params.questionId) } });
  return response.status(204).send();
});

userDataRouter.get("/analytics", requireAuth, async (request, response) => {
  const completed = await prisma.examAttempt.findMany({ where: { userId: request.auth!.userId, status: { in: ["SUBMITTED", "EXPIRED"] } }, orderBy: { submittedAt: "asc" }, select: { id: true, type: true, submittedAt: true, result: true } });
  const completedWithResults = completed.filter((attempt) => attempt.result !== null);
  const results = completedWithResults.map((attempt) => attempt.result as { score?: number; maximumScore?: number; accuracy?: number; correct?: number; incorrect?: number; unattempted?: number; partial?: number; subjectBreakdown?: Array<{ subject: string; accuracy: number }> });
  const average = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
  const subjectScores = new Map<string, { score: number; count: number }>();
  results.flatMap((result) => result.subjectBreakdown ?? []).forEach((entry) => {
    const current = subjectScores.get(entry.subject) ?? { score: 0, count: 0 };
    current.score += entry.accuracy; current.count += 1; subjectScores.set(entry.subject, current);
  });
  const ranked = [...subjectScores.entries()].map(([subject, entry]) => ({ subject, accuracy: entry.score / entry.count })).sort((a, b) => b.accuracy - a.accuracy);
  return response.json({ totalTests: results.length, averageScore: Number(average(results.map((result) => Number(result.score ?? 0))).toFixed(1)), bestScore: Math.max(0, ...results.map((result) => Number(result.score ?? 0))), averageAccuracy: Number(average(results.map((result) => Number(result.accuracy ?? 0))).toFixed(1)), questionsAttempted: results.reduce((sum, result) => sum + Number(result.correct ?? 0) + Number(result.incorrect ?? 0) + Number(result.partial ?? 0), 0), correctAnswers: results.reduce((sum, result) => sum + Number(result.correct ?? 0), 0), strongestSubject: ranked[0]?.subject ?? null, weakestSubject: ranked.at(-1)?.subject ?? null, trend: completedWithResults.map((attempt, index) => ({ name: `Test ${index + 1}`, type: attempt.type, score: Number((attempt.result as { score?: number } | null)?.score ?? 0), date: attempt.submittedAt })), });
});
