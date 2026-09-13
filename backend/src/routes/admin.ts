import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { requireAdmin, requireAuth } from "../middleware/auth.js";
import { hydrateQuestionBankFromDatabase, memoryStore, selectQuestions } from "../services/store.js";
import { canPublishPyq, validatePyqQuestions } from "../services/pyqValidation.js";

const prisma = new PrismaClient();
export const adminRouter = Router();

const optionSchema = z.object({ id: z.string().min(1).max(2), text: z.string().trim().min(1).max(2000) });
const editableQuestionSchema = z.object({
  kind: z.enum(["QUESTION", "PYQ"]).optional(),
  questionText: z.string().trim().min(8).max(10000).optional(),
  questionType: z.enum(["SINGLE", "MULTIPLE"]).optional(),
  options: z.array(optionSchema).min(2).max(4).optional(),
  correctAnswers: z.array(z.string().min(1).max(2)).min(1).max(4).optional(),
  subject: z.string().trim().min(2).max(120).optional(),
  topic: z.string().trim().min(2).max(120).optional(),
  category: z.string().trim().min(1).max(80).optional(),
  difficulty: z.enum(["Easy", "Medium", "Hard"]).optional(),
  marks: z.coerce.number().positive().optional(),
  negativeMarks: z.coerce.number().min(0).optional(),
  explanation: z.string().max(10000).optional(),
  source: z.string().trim().min(1).max(500).optional(),
  sourceType: z.enum(["MOCK", "PRACTICE", "PREDICTED"]).optional(),
  year: z.coerce.number().int().nullable().optional(),
  answerStatus: z.enum(["UNVERIFIED", "AI_CHECKED", "ADMIN_VERIFIED", "OFFICIAL_KEY_VERIFIED"]).optional(),
});

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "general";
}

function validateAnswers(payload: { questionType?: string; options?: Array<{ id: string; text: string }>; correctAnswers?: string[] }) {
  if (!payload.options || !payload.correctAnswers) return null;
  const optionIds = payload.options.map((option) => option.id.toUpperCase());
  if (new Set(optionIds).size !== optionIds.length || payload.correctAnswers.some((answer) => !optionIds.includes(answer.toUpperCase()))) return "Every correct answer must match an available option.";
  if (payload.questionType === "SINGLE" && payload.correctAnswers.length !== 1) return "A single-answer question must have exactly one correct answer.";
  if (payload.questionType === "MULTIPLE" && payload.correctAnswers.length < 2) return "A multiple-answer question must have at least two correct answers.";
  return null;
}

function questionOptions(question: any) {
  return Array.isArray(question.options) ? question.options : ["A", "B", "C", "D"].map((id) => ({ id, text: question[`option${id}`] })).filter((option) => option.text);
}

function auditData(value: unknown) {
  return JSON.parse(JSON.stringify(value));
}

function adminQuestion(question: any, kind: "QUESTION" | "PYQ") {
  const pyq = kind === "PYQ";
  const options = questionOptions(question);
  const correctAnswers = pyq
    ? (question.correctOptions?.length ? question.correctOptions : question.correctOption ? [question.correctOption] : [])
    : question.correctAnswers;
  return {
    id: question.id,
    kind,
    questionText: question.questionText,
    questionType: pyq ? (question.category === "CATEGORY_2" || correctAnswers.length > 1 ? "MULTIPLE" : "SINGLE") : question.questionType,
    options,
    correctAnswers,
    subject: pyq ? question.subject?.name ?? question.subjectId ?? "PYQ" : question.subject.name,
    topic: pyq ? `PYQ question ${question.questionNumber}` : question.topic?.name ?? "General",
    category: pyq ? question.category ?? "CATEGORY_1" : question.category,
    difficulty: pyq ? "Medium" : `${question.difficulty.charAt(0)}${question.difficulty.slice(1).toLowerCase()}`,
    marks: Number(question.marks),
    negativeMarks: Number(question.negativeMarks),
    explanation: pyq ? question.answerExplanation ?? "" : question.explanation,
    source: pyq ? question.source ?? question.paper.source : question.source,
    sourceType: pyq ? "PYQ" : question.sourceType,
    year: pyq ? question.paper.year : question.year,
    originalQuestionNumber: pyq ? String(question.questionNumber) : question.originalQuestionNumber,
    sourceUrl: pyq ? question.paper.sourceUrl : undefined,
    paperId: pyq ? question.paperId : undefined,
    paperTitle: pyq ? question.paper.title : undefined,
    published: pyq ? question.paper.isPublished : question.published,
    answerStatus: pyq ? question.answerStatus ?? "UNVERIFIED" : question.answerStatus ?? "UNVERIFIED",
    updatedAt: question.updatedAt,
  };
}

async function findAdminQuestion(id: string, kind?: "QUESTION" | "PYQ") {
  if (kind !== "PYQ") {
    const question = await prisma.question.findUnique({ where: { id }, include: { subject: true, topic: true } });
    if (question) return { kind: "QUESTION" as const, question };
  }
  if (kind !== "QUESTION") {
    const question = await prisma.pyqQuestion.findUnique({ where: { id }, include: { paper: true } });
    if (question) return { kind: "PYQ" as const, question };
  }
  return null;
}

async function databaseAdminUserId(userId: string) {
  const byId = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (byId) return byId.id;
  const memoryUser = memoryStore.users.get(userId);
  if (memoryUser) {
    const byEmail = await prisma.user.findUnique({ where: { email: memoryUser.email }, select: { id: true } });
    if (byEmail) return byEmail.id;
  }
  return userId;
}

adminRouter.use(requireAuth, requireAdmin);
adminRouter.get("/overview", async (_request, response) => {
  const [users, questions, attempts] = await Promise.all([prisma.user.count(), prisma.question.count(), prisma.examAttempt.count()]);
  return response.json({ users, questions, attempts, storage: "postgresql" });
});

adminRouter.get("/questions", async (request, response) => {
  const search = String(request.query.search ?? "").trim();
  const sourceType = String(request.query.sourceType ?? "").toUpperCase();
  const mockSet = String(request.query.mockSet ?? "").trim();
  const subject = String(request.query.subject ?? "").trim();
  const topic = String(request.query.topic ?? "").trim();
  const difficulty = String(request.query.difficulty ?? "").toUpperCase();
  const category = String(request.query.category ?? "").trim();
  const published = String(request.query.published ?? "");
  const yearValue = String(request.query.year ?? "").trim();
  const year = yearValue ? Number(yearValue) : Number.NaN;
  const page = Math.max(1, Number(request.query.page ?? 1));
  const limit = Math.min(50, Math.max(1, Number(request.query.limit ?? 20)));
  const subjectRows = subject ? await prisma.subject.findMany({ where: { name: { contains: subject, mode: "insensitive" } }, select: { id: true } }) : [];
  const mockQuestionIds = mockSet ? selectQuestions(100, undefined, mockSet).map((question) => question.id) : [];
  const take = mockSet ? mockQuestionIds.length : Math.min(1000, page * limit);
  const questionWhere: any = { ...(mockSet ? { id: { in: mockQuestionIds } } : sourceType && sourceType !== "PYQ" && sourceType !== "MOCK" ? { sourceType } : {}), ...(search ? { OR: [{ id: { contains: search, mode: "insensitive" } }, { questionText: { contains: search, mode: "insensitive" } }] } : {}), ...(subject ? { subject: { name: { contains: subject, mode: "insensitive" } } } : {}), ...(topic ? { topic: { name: { contains: topic, mode: "insensitive" } } } : {}), ...(difficulty ? { difficulty } : {}), ...(category ? { category } : {}), ...(Number.isFinite(year) ? { year } : {}), ...(published === "true" || published === "false" ? { published: published === "true" } : {}) };
  const pyqWhere: any = { ...(sourceType && sourceType !== "PYQ" ? { id: "__no_pyq__" } : {}), ...(search ? { OR: [{ id: { contains: search, mode: "insensitive" } }, { questionText: { contains: search, mode: "insensitive" } }] } : {}), ...(subject ? { subjectId: { in: subjectRows.map((row) => row.id) } } : {}), ...(category ? { category } : {}), ...((Number.isFinite(year) || published === "true" || published === "false") ? { paper: { ...(Number.isFinite(year) ? { year } : {}), ...(published === "true" || published === "false" ? { isPublished: published === "true" } : {}) } } : {}) };
  if (sourceType && sourceType !== "PYQ") pyqWhere.id = "__no_pyq__";
  if (sourceType === "PYQ") Object.keys(questionWhere).forEach((key) => delete questionWhere[key]);
  const [questions, pyqQuestions, questionTotal, pyqTotal] = await Promise.all([
    sourceType === "PYQ" ? [] : prisma.question.findMany({ where: questionWhere, include: { subject: true, topic: true }, orderBy: { updatedAt: "desc" }, take }),
    sourceType && sourceType !== "PYQ" ? [] : prisma.pyqQuestion.findMany({ where: pyqWhere, include: { paper: true }, orderBy: { updatedAt: "desc" }, take }),
    sourceType === "PYQ" ? 0 : prisma.question.count({ where: questionWhere }),
    sourceType && sourceType !== "PYQ" ? 0 : prisma.pyqQuestion.count({ where: pyqWhere }),
  ]);
  const items: Array<ReturnType<typeof adminQuestion> & { questionNumber?: number | null }> = [...questions.map((question) => adminQuestion(question, "QUESTION")), ...pyqQuestions.map((question) => adminQuestion(question, "PYQ"))].sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime());
  if (mockSet) {
    const setOrder = new Map(selectQuestions(100, undefined, mockSet).map((question, index) => [question.id, index + 1]));
    items.forEach((item) => { item.questionNumber = setOrder.get(item.id) ?? null; });
    items.sort((left, right) => (left.questionNumber ?? Number.MAX_SAFE_INTEGER) - (right.questionNumber ?? Number.MAX_SAFE_INTEGER));
  } else if (sourceType === "PYQ") {
    items.forEach((item) => { item.questionNumber = item.originalQuestionNumber ? Number(item.originalQuestionNumber) : null; });
    items.sort((left, right) => (left.questionNumber ?? Number.MAX_SAFE_INTEGER) - (right.questionNumber ?? Number.MAX_SAFE_INTEGER));
  }
  return response.json({ items: items.slice((page - 1) * limit, page * limit), total: questionTotal + pyqTotal, page, limit });
});

adminRouter.get("/questions/:id", async (request, response) => {
  const kind = request.query.kind === "PYQ" ? "PYQ" : request.query.kind === "QUESTION" ? "QUESTION" : undefined;
  const found = await findAdminQuestion(String(request.params.id), kind);
  if (!found) return response.status(404).json({ message: "Question not found." });
  return response.json({ question: adminQuestion(found.question, found.kind) });
});

adminRouter.get("/questions/:id/history", async (request, response) => {
  const id = String(request.params.id);
  const history = await prisma.questionEditHistory.findMany({ where: { OR: [{ questionId: id }, { pyqQuestionId: id }] }, orderBy: { changedAt: "desc" }, take: 50, include: { adminUser: { select: { id: true, name: true, email: true } } } });
  return response.json({ history });
});

adminRouter.put("/questions/:id", async (request, response) => {
  const parsed = editableQuestionSchema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Question validation failed.", issues: parsed.error.flatten() });
  const data = parsed.data;
  const found = await findAdminQuestion(String(request.params.id), data.kind);
  if (!found) return response.status(404).json({ message: "Question not found." });
  const current = adminQuestion(found.question, found.kind);
  const merged = { ...current, ...data, options: data.options ?? current.options, correctAnswers: data.correctAnswers ?? current.correctAnswers, questionType: data.questionType ?? current.questionType };
  const answerError = validateAnswers(merged);
  if (answerError) return response.status(400).json({ message: answerError });
  if (found.kind === "QUESTION" && data.answerStatus === "OFFICIAL_KEY_VERIFIED") return response.status(400).json({ message: "Official verification is reserved for PYQ records with an official answer key." });
  if (found.kind === "PYQ" && data.answerStatus === "OFFICIAL_KEY_VERIFIED" && !found.question.officialVerifiedAt) return response.status(400).json({ message: "Official verification requires an official answer key source." });

  if (found.kind === "QUESTION") {
    const subjectName = data.subject ?? current.subject;
    const subject = await prisma.subject.upsert({ where: { slug: slugify(subjectName) }, update: { name: subjectName }, create: { name: subjectName, slug: slugify(subjectName) } });
    const topicName = data.topic ?? current.topic;
    const topic = await prisma.topic.upsert({ where: { subjectId_slug: { subjectId: subject.id, slug: slugify(topicName) } }, update: { name: topicName }, create: { subjectId: subject.id, name: topicName, slug: slugify(topicName) } });
    const previousData = current;
    const adminUserId = await databaseAdminUserId(request.auth!.userId);
    const updated = await prisma.$transaction(async (transaction) => {
      const question = await transaction.question.update({ where: { id: found.question.id }, data: { questionText: data.questionText, questionType: merged.questionType, category: data.category ?? current.category, subjectId: subject.id, topicId: topic.id, difficulty: (data.difficulty ?? current.difficulty).toUpperCase(), options: merged.options, correctAnswers: merged.correctAnswers, explanation: data.explanation ?? current.explanation, marks: data.marks ?? current.marks, negativeMarks: data.negativeMarks ?? current.negativeMarks, source: data.source ?? current.source, sourceType: data.sourceType ?? current.sourceType, year: data.year === undefined ? current.year : data.year, answerStatus: data.answerStatus ?? current.answerStatus } as any, include: { subject: true, topic: true } });
      await transaction.questionEditHistory.create({ data: { questionId: question.id, adminUserId, previousData: auditData(previousData), newData: auditData(adminQuestion(question, "QUESTION")) } as any });
      return question;
    });
    const memoryIndex = memoryStore.questions.findIndex((question) => question.id === updated.id);
    if (memoryIndex >= 0) memoryStore.questions[memoryIndex] = { ...memoryStore.questions[memoryIndex], ...{ questionText: updated.questionText, questionType: updated.questionType as any, category: updated.category as any, subject: updated.subject.name, topic: updated.topic?.name ?? "General", difficulty: `${updated.difficulty.charAt(0)}${updated.difficulty.slice(1).toLowerCase()}` as any, options: updated.options as any, correctAnswers: updated.correctAnswers as string[], explanation: updated.explanation, marks: Number(updated.marks), negativeMarks: Number(updated.negativeMarks), source: updated.source, sourceType: updated.sourceType as any, year: updated.year ?? undefined } };
    return response.json({ question: adminQuestion(updated, "QUESTION") });
  }

  const previousData = current;
  const options = merged.options as Array<{ id: string; text: string }>;
  const optionMap = new Map(options.map((option) => [option.id.toUpperCase(), option.text]));
  const correctAnswers = merged.correctAnswers.map((answer: string) => answer.toUpperCase());
  const adminUserId = await databaseAdminUserId(request.auth!.userId);
  const updated = await prisma.$transaction(async (transaction) => {
    const subject = data.subject ? await transaction.subject.findUnique({ where: { id: data.subject } }) ?? await transaction.subject.upsert({ where: { slug: slugify(data.subject) }, update: { name: data.subject }, create: { name: data.subject, slug: slugify(data.subject) } }) : null;
    const question = await transaction.pyqQuestion.update({ where: { id: found.question.id }, data: { questionText: data.questionText, optionA: optionMap.get("A") ?? null, optionB: optionMap.get("B") ?? null, optionC: optionMap.get("C") ?? null, optionD: optionMap.get("D") ?? null, correctOption: correctAnswers[0] ?? null, correctOptions: correctAnswers, category: data.category ?? current.category, subjectId: subject?.id ?? found.question.subjectId, marks: data.marks ?? current.marks, negativeMarks: data.negativeMarks ?? current.negativeMarks, source: data.source ?? current.source, answerStatus: data.answerStatus ?? current.answerStatus, answerExplanation: data.explanation ?? current.explanation, verifiedAt: data.answerStatus === "ADMIN_VERIFIED" ? new Date() : found.question.verifiedAt, answerSource: data.answerStatus === "ADMIN_VERIFIED" ? "ADMIN" : found.question.answerSource } as any, include: { paper: true } });
    await transaction.questionEditHistory.create({ data: { pyqQuestionId: question.id, adminUserId, previousData: auditData(previousData), newData: auditData(adminQuestion(question, "PYQ")) } as any });
    return question;
  });
  return response.json({ question: adminQuestion(updated, "PYQ") });
});
adminRouter.post("/questions/import", async (request, response) => {
  const schema = z.array(z.object({ questionText: z.string().min(8), optionA: z.string().min(1), optionB: z.string().min(1), optionC: z.string().min(1), optionD: z.string().min(1), correctAnswers: z.string().min(1), questionType: z.enum(["SINGLE", "MULTIPLE"]), subject: z.string().min(2), topic: z.string().min(2), difficulty: z.enum(["Easy", "Medium", "Hard"]), marks: z.coerce.number().positive(), negativeMarks: z.coerce.number().min(0), sourceType: z.enum(["PYQ", "MOCK", "PRACTICE", "PREDICTED"]), explanation: z.string().min(4) }));
  const parsed = schema.safeParse(request.body);
  if (!parsed.success) return response.status(400).json({ message: "Import validation failed. No records were imported.", issues: parsed.error.flatten() });
  if (parsed.data.some((item) => item.questionType === "SINGLE" && item.correctAnswers.split(",").length !== 1)) return response.status(400).json({ message: "Single-answer questions must contain exactly one correct option." });
  if (parsed.data.some((item) => item.questionType === "MULTIPLE" && item.correctAnswers.split(",").length < 2)) return response.status(400).json({ message: "Multiple-answer questions must contain at least two correct options." });
  const imported = await prisma.$transaction(async (transaction) => {
    const created = [];
    for (const item of parsed.data) {
      const subject = await transaction.subject.upsert({ where: { slug: slugify(item.subject) }, update: { name: item.subject }, create: { name: item.subject, slug: slugify(item.subject) } });
      const topic = await transaction.topic.upsert({ where: { subjectId_slug: { subjectId: subject.id, slug: slugify(item.topic) } }, update: { name: item.topic }, create: { subjectId: subject.id, name: item.topic, slug: slugify(item.topic) } });
      const correctAnswers = item.correctAnswers.split(",").map((answer) => answer.trim().toUpperCase()).filter(Boolean);
      const question = await transaction.question.create({ data: { questionText: item.questionText, questionType: item.questionType, category: item.questionType === "SINGLE" ? "CATEGORY_1" : "CATEGORY_2", subjectId: subject.id, topicId: topic.id, difficulty: item.difficulty.toUpperCase(), options: [{ id: "A", text: item.optionA }, { id: "B", text: item.optionB }, { id: "C", text: item.optionC }, { id: "D", text: item.optionD }], correctAnswers, explanation: item.explanation, marks: item.marks, negativeMarks: item.negativeMarks, source: "Admin import", sourceType: item.sourceType, tags: [], published: true } as any });
      created.push(question.id);
    }
    return created;
  });
  await hydrateQuestionBankFromDatabase();
  return response.status(201).json({ imported: imported.length, ids: imported });
});

adminRouter.get("/pyq/verification-summary", async (_request, response) => {
  const papers = await prisma.pyqPaper.findMany({ orderBy: [{ year: "desc" }], include: { questions: true } });

  const summary = papers.map((paper) => {
    const totalQuestions = paper.questions.length;
    const aiVerified = paper.questions.filter((question) => question.answerStatus === "AI_VERIFIED").length;
    const officialVerified = paper.questions.filter((question) => question.answerStatus === "OFFICIAL_VERIFIED").length;
    const unverified = paper.questions.filter((question) => !question.answerStatus || question.answerStatus === "UNVERIFIED").length;
    const lowConfidence = paper.questions.filter((question) => question.answerStatus === "UNVERIFIED" && question.answerConfidence !== null && Number(question.answerConfidence) < 0.8).length;

    return {
      id: paper.id,
      year: paper.year,
      title: paper.title,
      totalQuestions,
      aiVerified,
      officialVerified,
      unverified,
      lowConfidence,
    };
  });

  return response.json({ summary });
});

adminRouter.get("/pyq/:paperId/validation", async (request, response) => {
  const paperId = String(request.params.paperId);
  const paper = await prisma.pyqPaper.findUnique({ where: { id: paperId }, include: { questions: { orderBy: { questionNumber: "asc" } } } });
  if (!paper) return response.status(404).json({ message: "Official PYQ paper not found." });

  const summary = validatePyqQuestions(paper.questions.map((question) => ({
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctOption,
    marks: Number(question.marks),
    negativeMarks: Number(question.negativeMarks),
    answerStatus: question.answerStatus,
    answerSource: question.answerSource,
  })));

  return response.json({ paper: { id: paper.id, year: paper.year, title: paper.title, source: paper.source, isPublished: paper.isPublished }, summary, publishable: canPublishPyq(summary) });
});

adminRouter.post("/pyq/:paperId/publish", async (request, response) => {
  const paperId = String(request.params.paperId);
  const paper = await prisma.pyqPaper.findUnique({ where: { id: paperId }, include: { questions: { orderBy: { questionNumber: "asc" } } } });
  if (!paper) return response.status(404).json({ message: "Official PYQ paper not found." });

  const summary = validatePyqQuestions(paper.questions.map((question) => ({
    questionNumber: question.questionNumber,
    questionText: question.questionText,
    optionA: question.optionA,
    optionB: question.optionB,
    optionC: question.optionC,
    optionD: question.optionD,
    correctOption: question.correctOption,
    marks: Number(question.marks),
    negativeMarks: Number(question.negativeMarks),
    answerStatus: question.answerStatus,
    answerSource: question.answerSource,
  })));

  if (!canPublishPyq(summary)) {
    return response.status(400).json({
      message: "This paper cannot be published because the official content is structurally invalid.",
      summary,
      publishable: false,
    });
  }

  const updatedPaper = await prisma.pyqPaper.update({
    where: { id: paperId },
    data: { isPublished: true },
    select: { id: true, title: true, year: true, isPublished: true },
  });

  return response.json({ message: "Official PYQ paper published.", paper: updatedPaper, summary });
});
