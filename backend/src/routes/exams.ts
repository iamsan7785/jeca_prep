import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { requireAuth } from "../middleware/auth.js";
import { isAttemptExpired } from "../services/examTiming.js";

const prisma = new PrismaClient();
export const examsRouter = Router();

const isDemoPyqPaper = (paper: { title: string | null; source: string | null; paperType?: string | null }) => {
  const haystack = `${paper.title ?? ""} ${paper.source ?? ""} ${paper.paperType ?? ""}`.toLowerCase();
  return /(test data|test sample|demo|example|sample)/.test(haystack);
};

const normalizeSelectedOptionIds = (payload: { selectedOption?: string | null; selectedOptionIds?: string[] | null }) => {
  const explicit = Array.isArray(payload.selectedOptionIds) ? payload.selectedOptionIds.filter((value): value is string => Boolean(value && String(value).trim())) : [];
  const single = typeof payload.selectedOption === 'string' && payload.selectedOption.trim() ? [payload.selectedOption.trim()] : [];
  return Array.from(new Set([...explicit, ...single].map((value) => value.toUpperCase())));
};

const getCorrectOptionSet = (question: { correctOption?: string | null; correctOptions?: string[] | null }) => {
  const fromArray = Array.isArray(question.correctOptions) ? question.correctOptions.filter((value): value is string => Boolean(value && String(value).trim())) : [];
  if (fromArray.length > 0) return Array.from(new Set(fromArray.map((value) => value.toUpperCase())));
  if (question.correctOption && String(question.correctOption).trim()) return [String(question.correctOption).trim().toUpperCase()];
  return [];
};

const publicSnapshotQuestion = (question: any) => {
  if (question.optionA !== undefined) return { id: question.id, questionNumber: question.questionNumber, questionText: question.questionText, optionA: question.optionA, optionB: question.optionB, optionC: question.optionC, optionD: question.optionD, marks: question.marks, negativeMarks: question.negativeMarks, category: question.category };
  return { ...question, correctAnswers: undefined };
};

// Restore the newest active attempt for this user after a browser refresh.
examsRouter.get('/active', requireAuth, async (req, res) => {
  const attempt = await prisma.examAttempt.findFirst({ where: { userId: req.auth!.userId, status: 'IN_PROGRESS' }, orderBy: { startedAt: 'desc' }, include: { answers: true } });
  if (!attempt) return res.status(404).json({ message: 'No active attempt.' });
  if (isAttemptExpired(attempt.expiresAt)) {
    await prisma.examAttempt.update({ where: { id: attempt.id }, data: { status: 'EXPIRED', submittedAt: new Date() } });
    return res.status(410).json({ message: 'Active attempt expired.' });
  }
  const config = attempt.mockConfig as { testId?: string; testName?: string; questions?: any[] } | null;
  const snapshot = config?.questions ?? [];
  const questions = attempt.type === 'PYQ'
    ? await prisma.pyqQuestion.findMany({ where: { id: { in: snapshot.map((question) => question.id) } }, orderBy: { questionNumber: 'asc' } })
    : snapshot;
  return res.json({ attemptId: attempt.id, type: attempt.type, testId: config?.testId ?? `pyq-${attempt.pyqPaperId}`, testName: config?.testName ?? 'Official PYQ', startedAt: attempt.startedAt, expiresAt: attempt.expiresAt, questions: questions.map(publicSnapshotQuestion), answers: attempt.answers.map((answer) => ({ questionId: answer.questionRef, selectedOptionIds: answer.selectedOptionIds, markedForReview: answer.markedForReview, timeSpentSeconds: answer.timeSpentSeconds })) });
});

// Start a PYQ exam
examsRouter.post('/pyq/:paperId/start', requireAuth, async (req, res) => {
  const paperId = String(req.params.paperId);
  const userId = req.auth!.userId;
  const paper = await prisma.pyqPaper.findUnique({ where: { id: paperId } });
  if (!paper || isDemoPyqPaper(paper) || !paper.isPublished) return res.status(404).json({ message: 'Official PYQ paper not found.' });

  const questions = await prisma.pyqQuestion.findMany({ where: { paperId }, orderBy: { questionNumber: 'asc' } });
  const totalQuestions = questions.length;
  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + paper.durationMinutes * 60_000);
  const attempt = await prisma.examAttempt.create({ data: { userId, type: 'PYQ', pyqPaperId: paperId, startedAt, expiresAt, status: 'IN_PROGRESS', totalQuestions, totalMarks: paper.totalMarks ?? null, mockConfig: { questions: questions.map((question) => ({ id: question.id, questionNumber: question.questionNumber, marks: Number(question.marks), negativeMarks: Number(question.negativeMarks), correctOption: question.correctOption, correctOptions: question.correctOptions, answerStatus: question.answerStatus })) } } });

  const payloadQuestions = questions.map((q) => ({ id: q.id, questionNumber: q.questionNumber, questionText: q.questionText, optionA: q.optionA, optionB: q.optionB, optionC: q.optionC, optionD: q.optionD, marks: q.marks, negativeMarks: q.negativeMarks, category: q.category }));
  return res.status(201).json({
    attemptId: attempt.id,
    paper: { id: paper.id, title: paper.title, year: paper.year, totalQuestions, totalMarks: paper.totalMarks },
    questions: payloadQuestions,
    startedAt,
    expiresAt,
    totalQuestions,
    totalMarks: paper.totalMarks,
  });
});

// Save/update answer for an attempt
examsRouter.post('/:attemptId/answer', requireAuth, async (req, res) => {
  const attemptId = String(req.params.attemptId);
  const userId = req.auth!.userId;
  const payload = req.body as { questionId?: string; questionRef?: string; selectedOption?: string | null; selectedOptionIds?: string[] };
  const questionRef = String(payload.questionRef ?? payload.questionId ?? '');
  const selectedOptionIds = normalizeSelectedOptionIds(payload);
  const selectedOption = selectedOptionIds[0] ?? null;

  if (!questionRef) return res.status(400).json({ message: 'Question reference is required.' });

  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { pyqPaper: true } });
  if (!attempt || attempt.userId !== userId) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status !== 'IN_PROGRESS') return res.status(409).json({ message: 'Attempt not active' });
  if (isAttemptExpired(attempt.expiresAt)) {
    await prisma.examAttempt.update({ where: { id: attemptId }, data: { status: 'EXPIRED', submittedAt: attempt.submittedAt ?? new Date() } });
    return res.status(410).json({ message: 'Attempt expired' });
  }

  let validQuestion: { id: string; paperId: string } | null = null;
  if (attempt.type === 'PYQ' && attempt.pyqPaperId) {
    validQuestion = await prisma.pyqQuestion.findFirst({ where: { id: questionRef, paperId: attempt.pyqPaperId }, select: { id: true, paperId: true } });
  }

  if (!validQuestion) return res.status(400).json({ message: 'Question does not belong to this attempt.' });

  const answerData = {
    selectedOption,
    selectedOptionIds: selectedOptionIds.length ? selectedOptionIds : [],
    markedForReview: Boolean(req.body.markedForReview),
    timeSpentSeconds: Number.isInteger(req.body.timeSpentSeconds) && req.body.timeSpentSeconds >= 0 ? req.body.timeSpentSeconds : 0,
    answeredAt: new Date(),
  };
  await prisma.examAttemptAnswer.upsert({ where: { attemptId_questionRef: { attemptId, questionRef } }, update: answerData, create: { attemptId, questionRef, ...answerData } });
  return res.json({ saved: true });
});

examsRouter.post('/:attemptId/event', requireAuth, async (req, res) => {
  const attempt = await prisma.examAttempt.findUnique({ where: { id: String(req.params.attemptId) }, select: { userId: true, suspiciousEvents: true } });
  if (!attempt || attempt.userId !== req.auth!.userId) return res.status(404).json({ message: 'Attempt not found' });
  const events = Array.isArray(attempt.suspiciousEvents) ? attempt.suspiciousEvents : [];
  events.push({ type: String(req.body.type ?? 'visibility-change').slice(0, 80), at: new Date().toISOString() });
  await prisma.examAttempt.update({ where: { id: String(req.params.attemptId) }, data: { suspiciousEvents: events } });
  return res.status(204).send();
});

// Submit attempt
examsRouter.post('/:attemptId/submit', requireAuth, async (req, res) => {
  const attemptId = String(req.params.attemptId);
  const userId = req.auth!.userId;
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { answers: true, pyqPaper: true } });
  if (!attempt || attempt.userId !== userId) return res.status(404).json({ message: 'Attempt not found' });
  if (attempt.status === 'SUBMITTED' || (attempt.status === 'EXPIRED' && attempt.result)) return res.status(409).json({ message: 'Attempt already finalized' });

  if (attempt.type !== 'PYQ' || !attempt.pyqPaperId) return res.status(400).json({ message: 'Only PYQ submissions supported here' });
  const snapshot = attempt.mockConfig && typeof attempt.mockConfig === "object" && !Array.isArray(attempt.mockConfig) && "questions" in attempt.mockConfig && Array.isArray(attempt.mockConfig.questions) ? attempt.mockConfig.questions as Array<{ id: string; marks: number; negativeMarks: number; correctOption?: string | null; correctOptions?: string[]; answerStatus?: string | null }> : null;
  const questions: Array<{ id: string; marks: number; negativeMarks: number; correctOption?: string | null; correctOptions?: string[] | null; answerStatus?: string | null }> = snapshot ?? (await prisma.pyqQuestion.findMany({ where: { paperId: attempt.pyqPaperId } })).map((question) => ({ id: question.id, marks: Number(question.marks), negativeMarks: Number(question.negativeMarks), correctOption: question.correctOption, correctOptions: question.correctOptions, answerStatus: question.answerStatus }));
  let totalScore = 0;
  let correct = 0, incorrect = 0, unanswered = 0;
  const questionScores: any[] = [];

  for (const q of questions) {
    const ans = attempt.answers.find((a) => a.questionRef === q.id);
    const selectedOptionIds = ans?.selectedOptionIds && ans.selectedOptionIds.length ? ans.selectedOptionIds : (ans?.selectedOption ? [ans.selectedOption] : []);
    const correctOptions = getCorrectOptionSet(q);

    if (!selectedOptionIds.length) {
      unanswered++;
      if (!correctOptions.length || q.answerStatus === 'UNVERIFIED') {
        questionScores.push({ questionId: q.id, status: 'pending_verification', score: 0, maximumScore: Number(q.marks) });
      } else {
        questionScores.push({ questionId: q.id, status: 'unattempted', score: 0, maximumScore: Number(q.marks) });
      }
      continue;
    }

    if (!correctOptions.length || q.answerStatus === 'UNVERIFIED') {
      questionScores.push({ questionId: q.id, status: 'pending_verification', score: 0, maximumScore: Number(q.marks) });
      continue;
    }

    const selectedSet = new Set(selectedOptionIds.map((value) => value.toUpperCase()));
    const correctSet = new Set(correctOptions.map((value) => value.toUpperCase()));
    const isCorrect = selectedSet.size === correctSet.size && [...selectedSet].every((value) => correctSet.has(value));

    if (isCorrect) {
      correct++;
      totalScore += Number(q.marks);
      questionScores.push({ questionId: q.id, status: 'correct', score: Number(q.marks), maximumScore: Number(q.marks) });
    } else {
      incorrect++;
      const penalty = q.negativeMarks ? Number(q.negativeMarks) : 0;
      totalScore -= penalty;
      questionScores.push({ questionId: q.id, status: 'incorrect', score: -penalty, maximumScore: Number(q.marks) });
    }
  }

  const submittedAt = new Date();
  const expired = isAttemptExpired(attempt.expiresAt);
  const result = { score: totalScore, maximumScore: attempt.totalMarks ?? null, correct, incorrect, unanswered, pendingVerification: questions.filter((question) => !getCorrectOptionSet(question).length || question.answerStatus === 'UNVERIFIED').length, questionScores };
  const finalized = await prisma.examAttempt.updateMany({ where: { id: attemptId, userId, status: { in: ['IN_PROGRESS', 'EXPIRED'] }, result: undefined }, data: { submittedAt, status: expired ? 'EXPIRED' : 'SUBMITTED', result } });
  if (finalized.count !== 1) return res.status(409).json({ message: 'Attempt already finalized' });
  return res.json({ ...result, attempt: { id: attempt.id, startedAt: attempt.startedAt, submittedAt } });
});

// Get attempt result
examsRouter.get('/:attemptId/result', requireAuth, async (req, res) => {
  const attemptId = String(req.params.attemptId);
  const userId = req.auth!.userId;
  const attempt = await prisma.examAttempt.findUnique({ where: { id: attemptId }, include: { answers: true } });
  if (!attempt || attempt.userId !== userId) return res.status(404).json({ message: 'Attempt not found' });
  if (!attempt.result) return res.status(404).json({ message: 'Result not available' });
  // For review, attach correct answers now by joining questions
  const qids = attempt.answers.map((a) => a.questionRef);
  const questions = await prisma.pyqQuestion.findMany({ where: { id: { in: qids } }, select: { id: true, correctOption: true, correctOptions: true, questionNumber: true } });
  const correctMap = new Map(questions.map((q) => [q.id, { correctOption: q.correctOption ?? null, correctOptions: q.correctOptions ?? [] }]));
  const answersWithCorrect = attempt.answers.map((a) => ({
    questionRef: a.questionRef,
    selectedOption: a.selectedOption,
    selectedOptionIds: a.selectedOptionIds ?? (a.selectedOption ? [a.selectedOption] : []),
    correctOption: correctMap.get(a.questionRef)?.correctOption ?? null,
    correctOptions: correctMap.get(a.questionRef)?.correctOptions ?? [],
    marksObtained: a.marksObtained ?? null,
  }));
  return res.json({ attempt: { id: attempt.id, type: attempt.type, startedAt: attempt.startedAt, submittedAt: attempt.submittedAt, status: attempt.status }, result: attempt.result, answers: answersWithCorrect });
});

// User exam history
examsRouter.get('/history', requireAuth, async (req, res) => {
  const userId = req.auth!.userId;
  const attempts = await prisma.examAttempt.findMany({ where: { userId }, orderBy: { createdAt: 'desc' }, select: { id: true, type: true, pyqPaperId: true, startedAt: true, submittedAt: true, status: true, result: true } });
  return res.json({ attempts });
});
