import { describe, expect, it } from "vitest";
import { MOCK_QUESTIONS_PER_SET, getMockTests, memoryStore, selectQuestions } from "./store.js";

describe("mock test question allocation", () => {
  it("publishes more than three sets with complete question counts", () => {
    const mocks = getMockTests();
    expect(mocks.length).toBeGreaterThan(3);
    expect(mocks.every((mock) => mock.questionCount === MOCK_QUESTIONS_PER_SET)).toBe(true);
  });

  it("keeps each set unique and makes every configured set distinct", () => {
    const mocks = getMockTests();
    const sets = mocks.map((mock) => selectQuestions(mock.questionCount, undefined, mock.id));
    expect(sets.every((questions) => new Set(questions.map((question) => question.id)).size === questions.length)).toBe(true);
    expect(new Set(sets.map((questions) => questions.map((question) => question.id).join(","))).size).toBe(sets.length);
    expect(sets.flat().every((question) => memoryStore.questions.some((bankQuestion) => bankQuestion.id === question.id))).toBe(true);
  });

  it("uses only unavoidable overlap for the 100-question contract", () => {
    const mocks = getMockTests();
    const first = new Set(selectQuestions(mocks[0].questionCount, undefined, mocks[0].id).map((question) => question.id));
    const second = selectQuestions(mocks[1].questionCount, undefined, mocks[1].id);
    const overlap = second.filter((question) => first.has(question.id)).length;
    expect(memoryStore.questions.length).toBe(110);
    expect(Math.floor(memoryStore.questions.length / MOCK_QUESTIONS_PER_SET)).toBe(1);
    expect(overlap).toBe(MOCK_QUESTIONS_PER_SET - (memoryStore.questions.length - MOCK_QUESTIONS_PER_SET));
  });

  it("reports overlap across every pair when ten full sets exceed the bank", () => {
    const sets = getMockTests().map((mock) => new Set(selectQuestions(mock.questionCount, undefined, mock.id).map((question) => question.id)));
    const pairOverlaps = sets.flatMap((left, leftIndex) => sets.slice(leftIndex + 1).map((right) => [...left].filter((id) => right.has(id)).length));
    expect(pairOverlaps.every((overlap) => overlap > 0)).toBe(true);
    expect(pairOverlaps).toHaveLength(45);
  });

  it("returns the same questions for the same mock after a new request", () => {
    expect(selectQuestions(100, undefined, "full-mock-4").map((question) => question.id))
      .toEqual(selectQuestions(100, undefined, "full-mock-4").map((question) => question.id));
  });
});