import { describe, expect, it } from "vitest";
import { canPublishPyq, validatePyqQuestions } from "./pyqValidation.js";

describe("validatePyqQuestions", () => {
  it("does not publish a paper when answers are still unverified", () => {
    const summary = validatePyqQuestions([
      { questionNumber: 1, questionText: "Q1", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: null, marks: 1, negativeMarks: 0.25, answerStatus: "UNVERIFIED" },
      { questionNumber: 2, questionText: "Q2", optionA: "A", optionB: "B", optionC: "C", optionD: "D", correctOption: null, marks: 1, negativeMarks: 0.25, answerStatus: "UNVERIFIED" },
    ]);

    expect(summary.status).toBe("NOT_PUBLISHABLE");
    expect(summary.unresolved).toBe(2);
    expect(canPublishPyq(summary)).toBe(false);
  });

  it("allows publishing when an AI-determined answer exists but is explicitly marked as AI-generated", () => {
    const questions = Array.from({ length: 2 }, (_, index) => ({
      questionNumber: index + 1,
      questionText: `Question ${index + 1}`,
      optionA: "Option A",
      optionB: "Option B",
      optionC: "Option C",
      optionD: "Option D",
      correctOption: index % 2 === 0 ? "A" : "D",
      marks: 1,
      negativeMarks: 0.25,
      answerStatus: "AI_VERIFIED",
      answerSource: "AI",
    }));

    const summary = validatePyqQuestions(questions);

    expect(summary.status).toBe("READY");
    expect(summary.verifiedAnswers).toBe(2);
    expect(canPublishPyq(summary)).toBe(true);
  });
});
