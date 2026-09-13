import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { publicQuestion } from "@jeca/shared/questions";
import { requireAuth } from "../middleware/auth.js";
import { calculateScore } from "../services/scoring.js";
import { isAttemptExpired } from "../services/examTiming.js";
import { getMockTests, selectQuestions } from "../services/store.js";

const startSchema = z.object({ testId: z.string().default("full-mock-1"), testName: z.string().default("Full Length Mock 01"), count: z.number().int().min(1).max(100).default(100), durationMinutes: z.number().int().min(1).max(180).default(120), subject: z.string().optional() });
const answerSchema = z.object({ questionId: z.string(), selectedOptionIds: z.array(z.string()).max(4), markedForReview: z.boolean().optional(), timeSpentSeconds: z.number().int().min(0).optional() });
const prisma = new PrismaClient();

export const mockTestsRouter = Router();

mockTestsRouter.get("/", (_request, response) => response.json({
  items: getMockTests(),
  marking: { single: "+1 / −0.25", multiple: "+2 / partial +1 / −0.5" },
}));

mockTestsRouter.get("/:id", (request, response) => {
  const mock = getMockTests().find((item) => item.id === request.params.id);
  if (!mock) return response.status(404).json({ message: "Mock test not found." });
  return response.json(mock);
});

mockTestsRouter.post("/start", requireAuth, async (request, response) => {
  const parsed = startSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Invalid test settings.", issues: parsed.error.flatten() });
  const setting = parsed.data;
  const mock = getMockTests().find((item) => item.id === setting.testId);
  if (setting.testId.startsWith("full-mock-") && !mock) return response.status(404).json({ message: "Mock test not found." });
  const count = mock?.questionCount ?? setting.count;
  const testName = mock?.title ?? setting.testName;
  const questions = selectQuestions(count, setting.subject, setting.testId);
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + setting.durationMinutes * 60_000);
  const attempt = await prisma.examAttempt.create({ data: { userId: request.auth!.userId, type: "MOCK", startedAt, expiresAt, status: "IN_PROGRESS", totalQuestions: questions.length, mockConfig: { testId: setting.testId, testName, durationMinutes: setting.durationMinutes, questions } as any } });
  return response.status(201).json({ attemptId: attempt.id, testName, startedAt, endAt: expiresAt, questions: questions.map(publicQuestion) });
});

mockTestsRouter.post("/:id/answer", requireAuth, async (request, response) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: String(request.params.id) } });
  if (!attempt || attempt.userId !== request.auth!.userId || attempt.type !== "MOCK") return response.status(404).json({ message: "Active attempt not found." });
  if (attempt.status !== "IN_PROGRESS") return response.status(409).json({ message: "This attempt has already been submitted." });
  if (isAttemptExpired(attempt.expiresAt)) { await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status: "EXPIRED", submittedAt: attempt.submittedAt ?? new Date() } }); return response.status(410).json({ message: "This attempt has expired." }); }
  const parsed = answerSchema.safeParse(request.body);
  const config = attempt.mockConfig as { questions?: Array<{ id: string }> } | null;
  if (!parsed.success || !config?.questions?.some((question) => question.id === parsed.data.questionId)) return response.status(400).json({ message: "Invalid answer payload." });
  await prisma.examAttemptAnswer.upsert({ where: { attemptId_questionRef: { attemptId: attempt.id, questionRef: parsed.data.questionId } }, update: { selectedOptionIds: parsed.data.selectedOptionIds, selectedOption: parsed.data.selectedOptionIds[0] ?? null, markedForReview: parsed.data.markedForReview ?? false, timeSpentSeconds: parsed.data.timeSpentSeconds ?? 0, answeredAt: new Date() }, create: { attemptId: attempt.id, questionRef: parsed.data.questionId, selectedOptionIds: parsed.data.selectedOptionIds, selectedOption: parsed.data.selectedOptionIds[0] ?? null, markedForReview: parsed.data.markedForReview ?? false, timeSpentSeconds: parsed.data.timeSpentSeconds ?? 0 } });
  return response.json({ saved: true, savedAt: new Date() });
});

mockTestsRouter.post("/:id/submit", requireAuth, async (request, response) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: String(request.params.id) }, include: { answers: true } });
  if (!attempt || attempt.userId !== request.auth!.userId || attempt.type !== "MOCK") return response.status(404).json({ message: "Attempt not found." });
  if (attempt.status === "SUBMITTED" || (attempt.status === "EXPIRED" && attempt.result)) return response.status(409).json({ message: "This attempt has already been finalized." });
  const config = attempt.mockConfig as { questions?: any[]; testName?: string } | null;
  const questions = (config?.questions ?? []) as any[];
  const answers = Object.fromEntries(attempt.answers.map((answer) => [answer.questionRef, { questionId: answer.questionRef, selectedOptionIds: answer.selectedOptionIds, markedForReview: answer.markedForReview, timeSpentSeconds: answer.timeSpentSeconds }]));
  const submittedAt = new Date();
  const expired = isAttemptExpired(attempt.expiresAt, submittedAt);
  const result = calculateScore(questions, answers);
  const finalized = await prisma.examAttempt.updateMany({ where: { id: attempt.id, userId: request.auth!.userId, status: { in: ["IN_PROGRESS", "EXPIRED"] }, result: undefined }, data: { submittedAt, status: expired ? "EXPIRED" : "SUBMITTED", result: result as any, totalMarks: result.maximumScore } });
  if (finalized.count !== 1) return response.status(409).json({ message: "This attempt has already been finalized." });
  return response.json({ ...result, attempt: { id: attempt.id, testName: config?.testName ?? "Mock test", startedAt: attempt.startedAt, submittedAt }, review: questions.map((question) => ({ ...question, selectedOptionIds: answers[question.id]?.selectedOptionIds ?? [], marksObtained: result.questionScores.find((entry) => entry.questionId === question.id)?.score ?? 0 })) });
});

mockTestsRouter.post("/:id/event", requireAuth, async (request, response) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: String(request.params.id) } });
  if (!attempt || attempt.userId !== request.auth!.userId) return response.status(404).json({ message: "Attempt not found." });
  const events = Array.isArray(attempt.suspiciousEvents) ? attempt.suspiciousEvents : [];
  events.push({ type: String(request.body.type ?? "visibility-change").slice(0, 80), at: new Date().toISOString() });
  await prisma.examAttempt.update({ where: { id: attempt.id }, data: { suspiciousEvents: events } });
  return response.status(204).send();
});
