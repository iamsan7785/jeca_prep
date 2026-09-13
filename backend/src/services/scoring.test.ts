import { describe, expect, it } from "vitest";
import type { Question } from "@jeca/shared/types";
import { calculateScore } from "./scoring.js";

const single: Question = { id: "s", questionText: "Single", questionType: "SINGLE", category: "CATEGORY_1", subject: "C Programming", topic: "Basics", difficulty: "Easy", options: [{ id: "A", text: "one" }, { id: "B", text: "two" }], correctAnswers: ["A"], explanation: "A", marks: 1, negativeMarks: 0.25, source: "Original", sourceType: "PRACTICE", tags: [] };
const multiple: Question = { ...single, id: "m", questionType: "MULTIPLE", category: "CATEGORY_2", correctAnswers: ["A", "B"], options: [{ id: "A", text: "one" }, { id: "B", text: "two" }, { id: "C", text: "three" }] };

describe("calculateScore", () => {
  it("scores correct, incorrect and unattempted single answers", () => {
    const result = calculateScore([single, { ...single, id: "s2" }, { ...single, id: "s3" }], { s: { questionId: "s", selectedOptionIds: ["A"] }, s2: { questionId: "s2", selectedOptionIds: ["B"] } });
    expect(result.score).toBe(0.75);
    expect(result.correct).toBe(1);
    expect(result.incorrect).toBe(1);
    expect(result.unattempted).toBe(1);
  });
  it("awards full and partial multiple-answer marks", () => {
    const result = calculateScore([multiple, { ...multiple, id: "m2" }], { m: { questionId: "m", selectedOptionIds: ["A", "B"] }, m2: { questionId: "m2", selectedOptionIds: ["A"] } });
    expect(result.score).toBe(3);
    expect(result.correct).toBe(1);
    expect(result.partial).toBe(1);
  });
  it("applies configurable multiple-answer negative marking", () => {
    const result = calculateScore([multiple], { m: { questionId: "m", selectedOptionIds: ["A", "C"] } }, { singlePositive: 1, singleNegative: 0.25, multiplePositive: 2, multiplePartial: 1, multipleNegative: 0.5, multipleNegativeEnabled: true });
    expect(result.score).toBe(-0.5);
    expect(result.incorrect).toBe(1);
  });
});
