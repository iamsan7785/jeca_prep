import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import type { Question } from "@jeca/shared/types";
import { questionBank } from "@jeca/shared/questions";
import type { AttemptRecord, UserRecord } from "../types.js";

export const memoryStore = {
  users: new Map<string, UserRecord>(),
  attempts: new Map<string, AttemptRecord>(),
  bookmarks: new Map<string, Set<string>>(),
  mistakes: new Map<string, Set<string>>(),
  questions: [...questionBank] as Question[],
};

const prisma = new PrismaClient();

function fromDatabaseQuestion(question: {
  id: string;
  questionText: string;
  questionType: string;
  category: string;
  difficulty: string;
  options: unknown;
  correctAnswers: unknown;
  explanation: string;
  marks: unknown;
  negativeMarks: unknown;
  year: number | null;
  source: string;
  sourceType: string;
  tags: string[];
  subject: { name: string };
  topic: { name: string } | null;
}): Question {
  return {
    id: question.id,
    questionText: question.questionText,
    questionType: question.questionType as Question["questionType"],
    category: question.category as Question["category"],
    subject: question.subject.name,
    topic: question.topic?.name ?? "General",
    difficulty: `${question.difficulty.charAt(0)}${question.difficulty.slice(1).toLowerCase()}` as Question["difficulty"],
    options: question.options as Question["options"],
    correctAnswers: question.correctAnswers as string[],
    explanation: question.explanation,
    marks: Number(question.marks),
    negativeMarks: Number(question.negativeMarks),
    year: question.year ?? undefined,
    source: question.source,
    sourceType: question.sourceType as Question["sourceType"],
    tags: question.tags,
  };
}

export async function hydrateQuestionBankFromDatabase() {
  try {
    const questions = await prisma.question.findMany({
      where: { published: true },
      include: { subject: { select: { name: true } }, topic: { select: { name: true } } },
      orderBy: { createdAt: "asc" },
    });
    if (questions.length) memoryStore.questions = questions.map(fromDatabaseQuestion);
  } catch (error) {
    console.warn("Could not hydrate the question bank from Prisma:", error);
  }
}

export const MOCK_QUESTIONS_PER_SET = 100;
export const MOCK_SET_COUNT = 10;

const mockLevels = ["Balanced", "Exam-ready", "Challenging"];

export function getMockTests() {
  const completeSetCount = Math.floor(memoryStore.questions.length / MOCK_QUESTIONS_PER_SET);
  const availableSetCount = memoryStore.questions.length >= MOCK_QUESTIONS_PER_SET
    ? MOCK_SET_COUNT
    : Math.max(1, Math.min(MOCK_SET_COUNT, completeSetCount));

  return Array.from({ length: availableSetCount }, (_, index) => ({
    id: `full-mock-${index + 1}`,
    title: `Full Length Mock ${String(index + 1).padStart(2, "0")}`,
    questionCount: MOCK_QUESTIONS_PER_SET,
    durationMinutes: 120,
    level: mockLevels[index % mockLevels.length],
  }));
}

export function createAttempt(userId: string, testId: string, testName: string, questions: Question[], durationMinutes: number) {
  const startedAt = new Date();
  const attempt: AttemptRecord = {
    id: randomUUID(),
    userId,
    testId,
    testName,
    questions,
    answers: {},
    startedAt,
    endAt: new Date(startedAt.getTime() + durationMinutes * 60_000),
    suspiciousEvents: [],
  };
  memoryStore.attempts.set(attempt.id, attempt);
  return attempt;
}

export function selectQuestions(count: number, subject?: string, testId?: string) {
  const pool = subject ? memoryStore.questions.filter((question) => question.subject === subject) : memoryStore.questions;

  const mockNumber = testId?.match(/^full-mock-(\d+)$/)?.[1];
  if (mockNumber && !subject) {
    const setNumber = Number(mockNumber);
    const mock = getMockTests().find((item) => item.id === testId);
    if (!mock) return [];
    const offset = ((setNumber - 1) * 10) % pool.length;
    const rotated = [...pool.slice(offset), ...pool.slice(0, offset)];
    return rotated.slice(0, Math.min(mock.questionCount, pool.length));
  }

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const selected = shuffled.slice(0, Math.min(count, shuffled.length));
  if (!subject && count > selected.length) {
    return Array.from({ length: count }, (_, index) => memoryStore.questions[index % memoryStore.questions.length]);
  }
  return selected;
}
