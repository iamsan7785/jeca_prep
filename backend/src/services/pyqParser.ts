export type ParsedPyqQuestion = {
  questionNumber: number;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption: string | null;
  marks: number;
  negativeMarks: number;
  category?: string | null;
  source: string;
  answerStatus?: string | null;
  answerSource?: string | null;
};

export type ParsedPyqPaper = {
  year: number;
  title: string;
  paperType?: string | null;
  source: string;
  sourceUrl: string;
  durationMinutes: number;
  totalQuestions: number;
  totalMarks: number;
  config?: Record<string, unknown>;
  questions: ParsedPyqQuestion[];
};

function normalizeText(value: string): string {
  return value
    .replace(/\u2013|\u2014|\u2015/g, "-")
    .replace(/\u2018|\u2019/g, "'")
    .replace(/\u201C|\u201D/g, '"')
    .replace(/\u00A0/g, " ")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function extractOptionText(questionBlock: string, optionKey: "A" | "B" | "C" | "D") {
  const match = questionBlock.match(new RegExp(`\\(${optionKey}\\)\\s*(.+?)(?=\\s*\\([A-D]\\)|\\s*$)`, "is"));
  if (!match) return null;
  return normalizeText(match[1].replace(/\s+/g, " ").trim());
}

export function parseJeCaPdfText(rawText: string, year: number): { paper: ParsedPyqPaper; questions: ParsedPyqQuestion[] } {
  const text = normalizeText(rawText);
  const title = `JECA ${year}`;

  const splitPattern = /\n\s*(?=\d+\.)/g;
  const parts = text.split(splitPattern);
  const questionEntries: Array<{ questionNumber: number; body: string }> = [];

  for (const part of parts) {
    const match = part.match(/^\s*(\d+)\.\s*(.*)$/s);
    if (!match) continue;
    const num = Number(match[1]);
    if (num >= 1 && num <= 100) {
      questionEntries.push({ questionNumber: num, body: match[2].trim() });
    }
  }

  const deduped = new Map<number, string>();
  for (const entry of questionEntries) {
    if (entry.questionNumber >= 1 && entry.questionNumber <= 100) {
      deduped.set(entry.questionNumber, entry.body);
    }
  }

  const questions: ParsedPyqQuestion[] = Array.from(deduped.entries())
    .filter(([num]) => num >= 1 && num <= 100)
    .sort(([a], [b]) => a - b)
    .map(([questionNumber, body]) => {
      const optionA = extractOptionText(body, "A");
      const optionB = extractOptionText(body, "B");
      const optionC = extractOptionText(body, "C");
      const optionD = extractOptionText(body, "D");
      const questionText = normalizeText(body.replace(/\(A\).*?\(B\).*?\(C\).*?\(D\).*$/is, "").replace(/\s+/g, " ").trim());

      const category = questionNumber <= 80 ? "Category-1" : "Category-2";
      return {
        questionNumber,
        questionText: questionText || `Official JECA ${year} question ${questionNumber}`,
        optionA,
        optionB,
        optionC,
        optionD,
        correctOption: null,
        marks: questionNumber <= 80 ? 1 : 2,
        negativeMarks: questionNumber <= 80 ? 0.25 : 0,
        category,
        source: `Official JECA ${year} paper`,
        answerStatus: "UNVERIFIED",
        answerSource: null,
      };
    });

  const paper: ParsedPyqPaper = {
    year,
    title,
    paperType: "JECA",
    source: "Official JECA paper",
    sourceUrl: "https://wbjeeb.nic.in/",
    durationMinutes: 120,
    totalQuestions: questions.length,
    totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
    config: { categories: ["Category-1", "Category-2"], answerKeyVerified: false },
    questions,
  };

  return { paper, questions };
}
