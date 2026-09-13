export type PyqQuestionRecord = {
  questionNumber: number;
  questionText?: string | null;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: string | null;
  correctOptions?: string[] | null;
  marks?: number | string | null;
  negativeMarks?: number | string | null;
  answerStatus?: string | null;
  answerSource?: string | null;
};

export type PyqVerificationStatus = "UNVERIFIED" | "AI_VERIFIED" | "OFFICIAL_VERIFIED";

export function normalizePyqAnswerStatus(value?: string | null): PyqVerificationStatus {
  const normalized = String(value ?? "UNVERIFIED").trim().toUpperCase().replace(/\s+/g, "_");
  if (normalized === "AI_VERIFIED" || normalized === "OFFICIAL_VERIFIED" || normalized === "VERIFIED" || normalized === "UNVERIFIED") {
    return normalized === "VERIFIED" ? "OFFICIAL_VERIFIED" : normalized;
  }
  return "UNVERIFIED";
}

export function normalizePyqOption(value?: string | null): "A" | "B" | "C" | "D" | null {
  const normalized = String(value ?? "").trim().toUpperCase();
  if (["A", "B", "C", "D"].includes(normalized)) return normalized as "A" | "B" | "C" | "D";
  return null;
}

export type PyqValidationSummary = {
  totalQuestions: number;
  verifiedAnswers: number;
  unresolved: number;
  invalidQuestionNumbers: number;
  duplicateQuestionNumbers: number[];
  missingOptions: number;
  malformedQuestions: number;
  status: "READY" | "NOT_PUBLISHABLE";
  reasons: string[];
};

export function validatePyqQuestions(questions: PyqQuestionRecord[]): PyqValidationSummary {
  const seen = new Map<number, number>();
  let invalidQuestionNumbers = 0;
  let malformedQuestions = 0;
  let missingOptions = 0;
  const duplicateQuestionNumbers: number[] = [];
  let verifiedAnswers = 0;
  const reasons: string[] = [];

  for (const question of questions) {
    const qn = Number(question.questionNumber);
    const isValidQuestionNumber = Number.isInteger(qn) && qn >= 1;
    if (!isValidQuestionNumber) {
      invalidQuestionNumbers += 1;
      reasons.push(`Invalid question number: ${question.questionNumber}`);
    }

    if (Number.isInteger(qn) && qn >= 1) {
      const count = seen.get(qn) ?? 0;
      if (count > 0) {
        duplicateQuestionNumbers.push(qn);
        reasons.push(`Duplicate question number: ${qn}`);
      }
      seen.set(qn, count + 1);
    }

    const hasMissingText = !String(question.questionText ?? "").trim();
    const hasMissingOptions = [question.optionA, question.optionB, question.optionC, question.optionD].some((option) => !String(option ?? "").trim());
    const correctOptions = Array.isArray(question.correctOptions) ? question.correctOptions.filter((value): value is string => Boolean(String(value ?? "").trim())) : [];
    const normalizedOption = normalizePyqOption(question.correctOption);
    const hasInvalidOption = question.correctOption !== null && question.correctOption !== undefined && !normalizedOption;
    const hasInvalidMultiOption = Array.isArray(question.correctOptions) && question.correctOptions.some((value) => !normalizePyqOption(value));
    const status = normalizePyqAnswerStatus(question.answerStatus ?? ((question.answerSource === "OFFICIAL" || question.answerSource === "VERIFIED") ? "OFFICIAL_VERIFIED" : question.answerSource === "AI" ? "AI_VERIFIED" : "UNVERIFIED"));

    if (hasMissingText || hasInvalidOption || hasInvalidMultiOption || hasMissingOptions) {
      malformedQuestions += 1;
      reasons.push(`Malformed question ${question.questionNumber ?? "unknown"}`);
    }

    if (hasMissingOptions) {
      missingOptions += 1;
    }

    const hasAnyCorrectAnswer = Boolean(normalizedOption || correctOptions.length > 0);
    if (hasAnyCorrectAnswer && (status === "AI_VERIFIED" || status === "OFFICIAL_VERIFIED")) {
      verifiedAnswers += 1;
    }
  }

  const totalQuestions = questions.length;
  const unresolved = Math.max(0, totalQuestions - verifiedAnswers);
  const duplicateCount = [...new Set(duplicateQuestionNumbers)].length;
  const hasStructuralProblems = invalidQuestionNumbers > 0 || duplicateCount > 0 || missingOptions > 0 || malformedQuestions > 0 || unresolved > 0;
  const status: "READY" | "NOT_PUBLISHABLE" = totalQuestions > 0 && !hasStructuralProblems ? "READY" : "NOT_PUBLISHABLE";

  if (unresolved > 0 && totalQuestions > 0) {
    reasons.push(`Unresolved answers: ${unresolved} of ${totalQuestions}`);
  }

  return {
    totalQuestions,
    verifiedAnswers,
    unresolved,
    invalidQuestionNumbers,
    duplicateQuestionNumbers: [...new Set(duplicateQuestionNumbers)],
    missingOptions,
    malformedQuestions,
    status,
    reasons: [...new Set(reasons)],
  };
}

export function canPublishPyq(summary: PyqValidationSummary): boolean {
  return summary.status === "READY";
}
