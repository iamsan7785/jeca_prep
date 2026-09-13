import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { markingDefaults, questionBank } from "@jeca/shared/questions";
import type { AttemptAnswer, Question } from "@jeca/shared/types";
import { api } from "../services/api";
import type { ActiveExam, ResultData, StartSettings } from "../types";
import { useAuth } from "./AuthContext";

interface ExamValue {
  active: ActiveExam | null;
  result: ResultData | null;
  bookmarks: string[];
  start: (settings: StartSettings) => Promise<ActiveExam>;
  answer: (questionId: string, selectedOptionIds: string[]) => void;
  clearAnswer: (questionId: string) => void;
  toggleReview: (questionId: string) => void;
  setCurrentIndex: (index: number) => void;
  submit: () => Promise<ResultData | null>;
  toggleBookmark: (questionId: string) => void;
  discardActive: () => void;
  answerStates: Record<string, "saving" | "saved" | "error">;
  retryAnswer: (questionId: string) => void;
}

const ACTIVE_KEY = "jeca-prep-active-exam";
const RESULT_KEY = "jeca-prep-last-result";
const BOOKMARKS_KEY = "jeca-prep-bookmarks";
const ExamContext = createContext<ExamValue | undefined>(undefined);

function read<T>(key: string): T | null { try { return JSON.parse(localStorage.getItem(key) ?? "null") as T | null; } catch { return null; } }
function uuid() { return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`; }

function localScore(active: ActiveExam): ResultData {
  let score = 0; let correct = 0; let incorrect = 0; let unattempted = 0; let partial = 0;
  const subjects = new Map<string, { subject: string; correct: number; incorrect: number; unattempted: number; score: number; maximumScore: number }>();
  const questionScores = active.questions.map((question) => {
    const selected = active.answers[question.id]?.selectedOptionIds ?? [];
    const multiple = question.questionType === "MULTIPLE";
    const max = multiple ? markingDefaults.multiplePositive : markingDefaults.singlePositive;
    const subject = subjects.get(question.subject) ?? { subject: question.subject, correct: 0, incorrect: 0, unattempted: 0, score: 0, maximumScore: 0 };
    subject.maximumScore += max;
    let marksObtained = 0; let status: "correct" | "incorrect" | "unattempted" | "partial";
    const correctSet = question.correctAnswers ?? [];
    const exact = selected.length === correctSet.length && selected.every((id) => correctSet.includes(id));
    if (!selected.length) { status = "unattempted"; unattempted += 1; subject.unattempted += 1; }
    else if (!multiple && exact) { status = "correct"; marksObtained = markingDefaults.singlePositive; correct += 1; subject.correct += 1; }
    else if (multiple && exact) { status = "correct"; marksObtained = markingDefaults.multiplePositive; correct += 1; subject.correct += 1; }
    else if (multiple && selected.every((id) => correctSet.includes(id))) { status = "partial"; marksObtained = markingDefaults.multiplePartial; partial += 1; subject.correct += 1; }
    else { status = "incorrect"; marksObtained = multiple ? -markingDefaults.multipleNegative : -markingDefaults.singleNegative; incorrect += 1; subject.incorrect += 1; }
    score += marksObtained; subject.score += marksObtained; subjects.set(question.subject, subject);
    return { questionId: question.id, status, score: marksObtained, maximumScore: max };
  });
  const attempted = active.questions.length - unattempted;
  const subjectBreakdown = [...subjects.values()].map((item) => ({ ...item, accuracy: item.correct + item.incorrect ? Number((item.correct / (item.correct + item.incorrect) * 100).toFixed(1)) : 0 }));
  return {
    score: Number(score.toFixed(2)), maximumScore: questionScores.reduce((sum, item) => sum + item.maximumScore, 0), correct, incorrect, unattempted, partial,
    accuracy: attempted ? Number(((correct + partial) / attempted * 100).toFixed(1)) : 0, subjectBreakdown, questionScores,
    review: active.questions.map((question) => ({ ...question, selectedOptionIds: active.answers[question.id]?.selectedOptionIds ?? [], marksObtained: questionScores.find((entry) => entry.questionId === question.id)?.score ?? 0 })),
    submittedAt: new Date().toISOString(), testName: active.title,
  };
}

export function ExamProvider({ children }: { children: ReactNode }) {
  const { session } = useAuth();
  const storageKey = (key: string) => `${key}:${session?.user.id ?? "anonymous"}`;
  const [active, setActive] = useState<ActiveExam | null>(() => read<ActiveExam>(`${ACTIVE_KEY}:${session?.user.id ?? "anonymous"}`));
  const [result, setResult] = useState<ResultData | null>(() => read<ResultData>(`${RESULT_KEY}:${session?.user.id ?? "anonymous"}`));
  const [bookmarks, setBookmarks] = useState<string[]>(() => read<string[]>(`${BOOKMARKS_KEY}:${session?.user.id ?? "anonymous"}`) ?? []);
  const [answerStates, setAnswerStates] = useState<Record<string, "saving" | "saved" | "error">>({});
  useEffect(() => {
    setActive(read<ActiveExam>(storageKey(ACTIVE_KEY))); setResult(read<ResultData>(storageKey(RESULT_KEY))); setBookmarks(read<string[]>(storageKey(BOOKMARKS_KEY)) ?? []);
    if (session?.mode === "api" && session.token) {
      void api.bookmarks(session.token).then((payload) => setBookmarks(payload.items.map((item) => item.id))).catch(() => undefined);
      void api.activeAttempt(session.token).then((remote) => {
        const questions = normalizeRemoteQuestions(remote.questions as any[], { testId: remote.testId, testName: remote.testName, count: remote.questions.length, durationMinutes: 1, type: remote.type }, remote.type);
        setActive({ attemptId: remote.attemptId, remote: true, remoteType: remote.type, testId: remote.testId, title: remote.testName, questions, answers: Object.fromEntries(remote.answers.map((answer) => [answer.questionId, { ...answer, questionId: answer.questionId }])), currentIndex: 0, startedAt: remote.startedAt, endAt: remote.expiresAt });
      }).catch(() => undefined);
    }
  }, [session?.user.id]);
  useEffect(() => { const key = storageKey(ACTIVE_KEY); if (active) localStorage.setItem(key, JSON.stringify(active)); else localStorage.removeItem(key); }, [active, session?.user.id]);
  useEffect(() => { const key = storageKey(RESULT_KEY); if (result) localStorage.setItem(key, JSON.stringify(result)); else localStorage.removeItem(key); }, [result, session?.user.id]);
  useEffect(() => { if (session?.mode !== "api") localStorage.setItem(storageKey(BOOKMARKS_KEY), JSON.stringify(bookmarks)); }, [bookmarks, session?.user.id]);

  const start = async (settings: StartSettings) => {
    if (settings.type === "PYQ") {
      if (session?.token) {
        const response = await api.start(settings, session.token);
        const normalizedQuestions = normalizeRemoteQuestions(response.questions as any[], settings, "PYQ");
        if (!normalizedQuestions.length) throw new Error("The official JECA PYQ paper is empty.");
        const next: ActiveExam = {
          attemptId: response.attemptId,
          remote: true,
          remoteType: "PYQ",
          testId: settings.testId,
          title: settings.testName,
          questions: normalizedQuestions,
          answers: {},
          currentIndex: 0,
          startedAt: response.startedAt,
          endAt: (response as { endAt?: string; expiresAt?: string }).endAt ?? (response as { expiresAt?: string }).expiresAt ?? new Date(Date.now() + settings.durationMinutes * 60_000).toISOString(),
        };
        setResult(null); setActive(next); return next;
      }

      const publicResponse = await fetch(`/api/pyq/${settings.paperId}/questions`);
      if (!publicResponse.ok) throw new Error("Please sign in to start an official PYQ.");
      const payload = await publicResponse.json();
      const normalizedQuestions = normalizeRemoteQuestions(Array.isArray(payload.questions) ? payload.questions : [], settings, "PYQ");
      if (!normalizedQuestions.length) throw new Error("The official JECA PYQ paper is empty.");
      const next: ActiveExam = {
        attemptId: `local-${settings.testId}-${Date.now()}`,
        remote: false,
        testId: settings.testId,
        title: settings.testName,
        questions: normalizedQuestions,
        answers: {},
        currentIndex: 0,
        startedAt: new Date().toISOString(),
        endAt: new Date(Date.now() + settings.durationMinutes * 60_000).toISOString(),
      };
      setResult(null); setActive(next); return next;
    }

    let next: ActiveExam;
    if (session?.mode === "api" && session.token) {
      try {
        const response = await api.start(settings, session.token);
        const remoteType = settings.type ?? "MOCK";
        const normalizedQuestions = normalizeRemoteQuestions(response.questions as any[], settings, remoteType);
        next = {
          attemptId: response.attemptId,
          remote: true,
          remoteType,
          testId: settings.testId,
          title: settings.testName,
          questions: normalizedQuestions,
          answers: {},
          currentIndex: 0,
          startedAt: response.startedAt,
          endAt: (response as { endAt?: string; expiresAt?: string }).endAt ?? (response as { expiresAt?: string }).expiresAt ?? new Date(Date.now() + settings.durationMinutes * 60_000).toISOString(),
        };
      } catch (error) {
        throw error;
      }
    } else next = createLocalExam(settings);
    setResult(null); setActive(next); return next;
  };
  const answer = (questionId: string, selectedOptionIds: string[]) => setActive((previous) => {
    if (!previous) return previous;
    const current = previous.answers[questionId] ?? { questionId, selectedOptionIds: [] };
    const answerData: AttemptAnswer = { ...current, selectedOptionIds };
    if (previous.remote && session?.token) {
      setAnswerStates((states) => ({ ...states, [questionId]: "saving" }));
      void api.saveAnswer(previous.attemptId, answerData, session.token, previous.remoteType ?? "MOCK").then(() => setAnswerStates((states) => ({ ...states, [questionId]: "saved" }))).catch(() => setAnswerStates((states) => ({ ...states, [questionId]: "error" })));
    } else setAnswerStates((states) => ({ ...states, [questionId]: "saved" }));
    return { ...previous, answers: { ...previous.answers, [questionId]: answerData } };
  });
  const retryAnswer = (questionId: string) => {
    const saved = active?.answers[questionId];
    if (saved) answer(questionId, saved.selectedOptionIds);
  };
  const clearAnswer = (questionId: string) => answer(questionId, []);
  const toggleReview = (questionId: string) => setActive((previous) => {
    if (!previous) return previous;
    const current = previous.answers[questionId] ?? { questionId, selectedOptionIds: [] };
    const answerData = { ...current, markedForReview: !current.markedForReview };
    if (previous.remote && session?.token) void api.saveAnswer(previous.attemptId, answerData, session.token, previous.remoteType ?? "MOCK").catch(() => undefined);
    return { ...previous, answers: { ...previous.answers, [questionId]: answerData } };
  });
  const setCurrentIndex = (currentIndex: number) => setActive((previous) => previous ? { ...previous, currentIndex: Math.max(0, Math.min(currentIndex, previous.questions.length - 1)) } : previous);
  const submit = async () => {
    if (!active) return null;
    let scored: ResultData;
    if (active.remote && session?.token) {
      try {
        const response = await api.submit(active.attemptId, session.token, active.remoteType ?? "MOCK") as any;
        if (active.remoteType === "PYQ") {
          const questionScores = Array.isArray(response.questionScores) ? response.questionScores : [];
          const review = active.questions.map((question) => ({
            ...question,
            selectedOptionIds: active.answers[question.id]?.selectedOptionIds ?? [],
            marksObtained: questionScores.find((entry: any) => entry.questionId === question.id)?.score ?? 0,
          }));
          scored = {
            score: Number(response.score ?? 0),
            maximumScore: Number(response.maximumScore ?? 0),
            correct: Number(response.correct ?? 0),
            incorrect: Number(response.incorrect ?? 0),
            unattempted: Number(response.unanswered ?? response.unattempted ?? 0),
            partial: 0,
            accuracy: Number(response.maximumScore) ? Number(((Number(response.score ?? 0) / Number(response.maximumScore ?? 1)) * 100).toFixed(1)) : 0,
            subjectBreakdown: [],
            questionScores: Array.isArray(questionScores) ? questionScores.map((entry: any) => ({ questionId: entry.questionId, status: entry.status ?? "unattempted", score: Number(entry.score ?? 0), maximumScore: Number(entry.maximumScore ?? 0) })) : [],
            review,
            submittedAt: response.attempt?.submittedAt ?? new Date().toISOString(),
            testName: response.attempt?.testName ?? active.title,
          };
        } else {
          scored = { ...response, review: response.review, submittedAt: response.attempt.submittedAt, testName: response.attempt.testName };
        }
      } catch (error) {
        throw error;
      }
    } else scored = localScore(active);
    setResult(scored); setActive({ ...active, submitted: true }); return scored;
  };
  const toggleBookmark = (questionId: string) => {
    const exists = bookmarks.includes(questionId);
    setBookmarks((items) => exists ? items.filter((item) => item !== questionId) : [...items, questionId]);
    if (session?.mode === "api" && session.token) void (exists ? api.removeBookmark(questionId, session.token) : api.addBookmark(questionId, session.token)).catch(() => setBookmarks((items) => exists ? [...items, questionId] : items.filter((item) => item !== questionId)));
  };
  const value = useMemo<ExamValue>(() => ({ active, result, bookmarks, answerStates, retryAnswer, start, answer, clearAnswer, toggleReview, setCurrentIndex, submit, toggleBookmark, discardActive: () => setActive(null) }), [active, result, bookmarks, answerStates, session]);
  return <ExamContext.Provider value={value}>{children}</ExamContext.Provider>;
}

function normalizeRemoteQuestions(questions: any[] | undefined, settings: StartSettings, remoteType: "MOCK" | "PYQ") {
  if (!questions) return [] as Question[];
  if (remoteType === "PYQ") {
    return questions.map((question, index): Question => {
      const optionIds = ["A", "B", "C", "D"] as const;
      const optionValues: Question["options"] = optionIds
        .filter((optionId) => String(question[`option${optionId}`] ?? "").trim())
        .map((optionId) => ({
          id: optionId,
          text: String(question[`option${optionId}`] ?? "").trim(),
        }));
      const correctAnswers = Array.isArray(question.correctOptions) && question.correctOptions.length > 0
        ? question.correctOptions.map((value: string) => String(value).trim().toUpperCase()).filter(Boolean)
        : typeof question.correctOption === "string" && question.correctOption.trim()
          ? [String(question.correctOption).trim().toUpperCase()]
          : [];
      const normalizedCategory = String(question.category ?? "Category-1").toLowerCase() === "category-2" ? "CATEGORY_2" : "CATEGORY_1";
      const questionType: Question["questionType"] = normalizedCategory === "CATEGORY_2" || correctAnswers.length > 1 || Number(question.marks ?? 1) > 1 ? "MULTIPLE" : "SINGLE";
      const questionNumber = Number(question.questionNumber ?? index + 1);

      return {
        id: question.id,
        questionText: question.questionText,
        questionType,
        category: normalizedCategory as Question["category"],
        subject: "PYQ",
        topic: `PYQ question ${questionNumber}`,
        difficulty: "Medium" as const,
        options: optionValues,
        correctAnswers,
        explanation: question.answerExplanation ?? "",
        marks: Number(question.marks ?? (questionType === "MULTIPLE" ? 2 : 1)),
        negativeMarks: Number(question.negativeMarks ?? 0),
        year: Number(question.year ?? (settings.count ? 2025 : 0)) || undefined,
        source: "Official JECA paper",
        sourceType: "PYQ",
        tags: ["pyq", `q${questionNumber}`],
      };
    });
  }
  return questions as Question[];
}

function createLocalExam(settings: StartSettings): ActiveExam {
  const pool = settings.subject ? questionBank.filter((question) => question.subject === settings.subject) : questionBank;
  const mockNumber = settings.testId.match(/^full-mock-(\d+)$/)?.[1];
  const questions = mockNumber && !settings.subject
    ? [...pool.slice(((Number(mockNumber) - 1) * 10) % pool.length), ...pool.slice(0, ((Number(mockNumber) - 1) * 10) % pool.length)].slice(0, Math.min(settings.count, pool.length))
    : Array.from({ length: settings.count }, (_, index) => pool[index % pool.length]);
  const startedAt = new Date();
  return { attemptId: uuid(), remote: false, testId: settings.testId, title: settings.testName, questions, answers: {}, currentIndex: 0, startedAt: startedAt.toISOString(), endAt: new Date(startedAt.getTime() + settings.durationMinutes * 60_000).toISOString() };
}

export function useExam() {
  const context = useContext(ExamContext);
  if (!context) throw new Error("useExam must be used inside ExamProvider");
  return context;
}
