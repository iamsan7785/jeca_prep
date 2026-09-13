export type SourceType = "PYQ" | "MOCK" | "PRACTICE" | "PREDICTED";
export type QuestionType = "SINGLE" | "MULTIPLE";
export type Difficulty = "Easy" | "Medium" | "Hard";

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  questionText: string;
  questionType: QuestionType;
  category: "CATEGORY_1" | "CATEGORY_2";
  subject: string;
  topic: string;
  difficulty: Difficulty;
  options: QuestionOption[];
  correctAnswers: string[];
  explanation: string;
  marks: number;
  negativeMarks: number;
  year?: number;
  source: string;
  sourceType: SourceType;
  tags: string[];
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionIds: string[];
  markedForReview?: boolean;
  timeSpentSeconds?: number;
}

export interface MarkingRule {
  singlePositive: number;
  singleNegative: number;
  multiplePositive: number;
  multiplePartial: number;
  multipleNegative: number;
  multipleNegativeEnabled: boolean;
}
