import { randomUUID } from "node:crypto";
import { Router } from "express";
import { z } from "zod";
import { publicQuestion, supportedSubjects } from "@jeca/shared/questions";
import type { Question } from "@jeca/shared/types";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { memoryStore } from "../services/store.js";

const questionInput = z.object({
  questionText: z.string().min(8),
  questionType: z.enum(["SINGLE", "MULTIPLE"]),
  subject: z.string().min(2),
  topic: z.string().min(2),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  options: z.array(z.object({ id: z.string().min(1), text: z.string().min(1) })).min(2),
  correctAnswers: z.array(z.string().min(1)).min(1),
  explanation: z.string().min(4),
  marks: z.number().positive().default(1),
  negativeMarks: z.number().min(0).default(0.25),
  sourceType: z.enum(["PYQ", "MOCK", "PRACTICE", "PREDICTED"]).default("PRACTICE"),
  source: z.string().min(2),
  year: z.number().int().optional(),
  tags: z.array(z.string()).default([]),
});

export const questionsRouter = Router();

questionsRouter.get("/", (request, response) => {
  const search = String(request.query.search ?? "").toLowerCase();
  const subject = String(request.query.subject ?? "");
  const difficulty = String(request.query.difficulty ?? "");
  const sourceType = String(request.query.sourceType ?? "");
  const page = Math.max(1, Number(request.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 12)));
  const filtered = memoryStore.questions.filter((question) =>
    (!search || `${question.questionText} ${question.subject} ${question.topic}`.toLowerCase().includes(search)) &&
    (!subject || subject === "All" || question.subject === subject) &&
    (!difficulty || difficulty === "All" || question.difficulty === difficulty) &&
    (!sourceType || sourceType === "All" || question.sourceType === sourceType),
  );
  return response.json({ items: filtered.slice((page - 1) * limit, page * limit).map(publicQuestion), total: filtered.length, page, limit, subjects: supportedSubjects });
});

questionsRouter.get("/:id", (request, response) => {
  const question = memoryStore.questions.find((item) => item.id === request.params.id);
  if (!question) return response.status(404).json({ message: "Question not found." });
  return response.json(publicQuestion(question));
});

questionsRouter.post("/", requireAuth, requireAdmin, (request, response) => {
  const parsed = questionInput.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Question validation failed.", issues: parsed.error.flatten() });
  if (parsed.data.questionType === "MULTIPLE" && parsed.data.correctAnswers.length < 2) return response.status(400).json({ message: "A multiple-correct question needs at least two correct choices." });
  const question: Question = { ...parsed.data, id: randomUUID(), category: parsed.data.questionType === "SINGLE" ? "CATEGORY_1" : "CATEGORY_2" };
  memoryStore.questions.unshift(question);
  return response.status(201).json(question);
});

questionsRouter.put("/:id", requireAuth, requireAdmin, (request, response) => {
  const index = memoryStore.questions.findIndex((item) => item.id === request.params.id);
  if (index < 0) return response.status(404).json({ message: "Question not found." });
  const parsed = questionInput.partial().safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Question validation failed.", issues: parsed.error.flatten() });
  memoryStore.questions[index] = { ...memoryStore.questions[index], ...parsed.data };
  return response.json(memoryStore.questions[index]);
});

questionsRouter.delete("/:id", requireAuth, requireAdmin, (request, response) => {
  return response.status(405).json({ message: "Question deletion is disabled. Archive or unpublish the record instead." });
});
