import type { AttemptAnswer, MarkingRule, Question } from "@jeca/shared/types";
import { markingDefaults } from "@jeca/shared/questions";

export interface SubjectScore {
  subject: string;
  correct: number;
  incorrect: number;
  unattempted: number;
  score: number;
  maximumScore: number;
  accuracy: number;
}

export interface ScoredQuestion {
  questionId: string;
  status: "correct" | "incorrect" | "unattempted" | "partial";
  score: number;
  maximumScore: number;
}

export interface ScoreResult {
  score: number;
  maximumScore: number;
  correct: number;
  incorrect: number;
  unattempted: number;
  partial: number;
  accuracy: number;
  subjectBreakdown: SubjectScore[];
  questionScores: ScoredQuestion[];
}

const sameSet = (left: string[], right: string[]) => left.length === right.length && left.every((value) => right.includes(value));

export function calculateScore(
  questions: Question[],
  answers: Record<string, AttemptAnswer | undefined>,
  rule: MarkingRule = markingDefaults,
): ScoreResult {
  let score = 0;
  let correct = 0;
  let incorrect = 0;
  let unattempted = 0;
  let partial = 0;
  const subjects = new Map<string, Omit<SubjectScore, "accuracy">>();
  const questionScores: ScoredQuestion[] = [];

  for (const question of questions) {
    const selected = answers[question.id]?.selectedOptionIds ?? [];
    const isMultiple = question.questionType === "MULTIPLE";
    const max = isMultiple ? rule.multiplePositive : rule.singlePositive;
    const subject = subjects.get(question.subject) ?? {
      subject: question.subject,
      correct: 0,
      incorrect: 0,
      unattempted: 0,
      score: 0,
      maximumScore: 0,
    };
    subject.maximumScore += max;
    let questionScore = 0;
    let status: ScoredQuestion["status"];

    if (selected.length === 0) {
      unattempted += 1;
      subject.unattempted += 1;
      status = "unattempted";
    } else if (!isMultiple) {
      if (selected.length === 1 && selected[0] === question.correctAnswers[0]) {
        questionScore = rule.singlePositive;
        correct += 1;
        subject.correct += 1;
        status = "correct";
      } else {
        questionScore = -rule.singleNegative;
        incorrect += 1;
        subject.incorrect += 1;
        status = "incorrect";
      }
    } else if (sameSet(selected, question.correctAnswers)) {
      questionScore = rule.multiplePositive;
      correct += 1;
      subject.correct += 1;
      status = "correct";
    } else if (selected.every((choice) => question.correctAnswers.includes(choice))) {
      questionScore = rule.multiplePartial;
      partial += 1;
      subject.correct += 1;
      status = "partial";
    } else {
      questionScore = rule.multipleNegativeEnabled ? -rule.multipleNegative : 0;
      incorrect += 1;
      subject.incorrect += 1;
      status = "incorrect";
    }

    score += questionScore;
    subject.score += questionScore;
    subjects.set(question.subject, subject);
    questionScores.push({ questionId: question.id, status, score: questionScore, maximumScore: max });
  }

  const attempted = questions.length - unattempted;
  return {
    score: Number(score.toFixed(2)),
    maximumScore: questions.reduce((sum, question) => sum + (question.questionType === "MULTIPLE" ? rule.multiplePositive : rule.singlePositive), 0),
    correct,
    incorrect,
    unattempted,
    partial,
    accuracy: attempted ? Number((((correct + partial) / attempted) * 100).toFixed(1)) : 0,
    subjectBreakdown: [...subjects.values()].map((subject) => ({
      ...subject,
      score: Number(subject.score.toFixed(2)),
      accuracy: subject.correct + subject.incorrect ? Number(((subject.correct / (subject.correct + subject.incorrect)) * 100).toFixed(1)) : 0,
    })),
    questionScores,
  };
}
