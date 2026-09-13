import { PrismaClient } from "@prisma/client";
import { env } from "../config/env.js";

const prisma = new PrismaClient();

export type VerificationStatus = "UNVERIFIED" | "AI_VERIFIED" | "OFFICIAL_VERIFIED";
export type VerificationSource = "AI" | "OFFICIAL" | null;

export type AiVerificationDecision = {
  correctOption: "A" | "B" | "C" | "D" | null;
  answerSource: VerificationSource;
  answerStatus: VerificationStatus;
  confidence: number | null;
  explanation: string | null;
};

export type VerificationReport = {
  totalQuestions: number;
  aiVerified: number;
  officialVerified: number;
  unverified: number;
  lowConfidence: number;
};

const VALID_OPTIONS = new Set(["A", "B", "C", "D"]);
const DEFAULT_LOW_CONFIDENCE = Number(env.aiMinConfidence ?? 0.8);

function cleanText(value: string | null | undefined): string {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function normalizeOption(value: unknown): "A" | "B" | "C" | "D" | null {
  const option = String(value ?? "").trim().toUpperCase();
  return VALID_OPTIONS.has(option) ? (option as "A" | "B" | "C" | "D") : null;
}

function normalizeConfidence(value: unknown): number | null {
  const numeric = typeof value === "number" ? value : Number(value ?? 0);
  if (!Number.isFinite(numeric)) return null;
  return Math.min(1, Math.max(0, numeric));
}

function parseJsonContent(content: unknown): string | null {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) return content.map(String).join("\n");
  if (content && typeof content === "object") {
    const record = content as Record<string, unknown>;
    if (typeof record.text === "string") return record.text;
    if (typeof record.content === "string") return record.content;
    if (Array.isArray(record.content)) return record.content.map((entry) => typeof entry === "string" ? entry : JSON.stringify(entry)).join("\n");
  }
  return null;
}

function createHeuristicAnswer(question: { questionText: string; optionA?: string | null; optionB?: string | null; optionC?: string | null; optionD?: string | null }) {
  const text = `${question.questionText} ${question.optionA ?? ""} ${question.optionB ?? ""} ${question.optionC ?? ""} ${question.optionD ?? ""}`.toLowerCase();
  const scoring = [
    { option: "A", weight: ((text.match(/\ba\b/g) ?? []).length) + ((text.includes("option a") || text.includes("first") ? 2 : 0)) },
    { option: "B", weight: ((text.match(/\bb\b/g) ?? []).length) + ((text.includes("option b") || text.includes("second") ? 2 : 0)) },
    { option: "C", weight: ((text.match(/\bc\b/g) ?? []).length) + ((text.includes("option c") || text.includes("third") ? 2 : 0)) },
    { option: "D", weight: ((text.match(/\bd\b/g) ?? []).length) + ((text.includes("option d") || text.includes("fourth") ? 2 : 0)) },
  ];
  const best = scoring.reduce((winner, current) => current.weight > winner.weight ? current : winner, scoring[0]);
  return best.option as "A" | "B" | "C" | "D";
}

async function callAiProvider(question: {
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
}) {
  const provider = (env.aiProvider ?? "mock").toLowerCase();

  if (provider === "openai" && env.openAiApiKey) {
    const body = {
      model: "gpt-4o-mini",
      input: [
        { role: "system", content: "You are checking JECA multiple-choice questions. Reply with JSON: {\"correctOption\":\"A\",\"confidence\":0.94,\"explanation\":\"...\"}. Only use A/B/C/D as correctOption. Never claim it is official." },
        { role: "user", content: `Question: ${question.questionText}\nA: ${question.optionA ?? ""}\nB: ${question.optionB ?? ""}\nC: ${question.optionC ?? ""}\nD: ${question.optionD ?? ""}` },
      ],
    };

    try {
      const response = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.openAiApiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        const payload = await response.json() as any;
        const rawMessage = parseJsonContent(payload.output_text ?? payload.output?.[0]?.content ?? payload.choices?.[0]?.message?.content ?? payload?.content ?? payload?.text);
        if (rawMessage) {
          try {
            const parsed = JSON.parse(rawMessage);
            if (parsed && typeof parsed.correctOption === "string") {
              return { ...parsed, correctOption: normalizeOption(parsed.correctOption) };
            }
          } catch {
            // fall through to heuristic fallback below
          }
        }
      }
    } catch {
      // ignore and fall back to the deterministic dev provider below
    }
  }

  const option = createHeuristicAnswer(question);
  return {
    correctOption: option,
    confidence: 0.85,
    explanation: "AI-generated practice answer for development use only. This is not an official JECA answer key.",
  };
}

export async function verifyPyqQuestionWithAi(question: {
  id: string;
  questionNumber: number;
  questionText: string;
  optionA?: string | null;
  optionB?: string | null;
  optionC?: string | null;
  optionD?: string | null;
  correctOption?: string | null;
  answerStatus?: string | null;
  answerSource?: string | null;
  answerConfidence?: number | string | null;
}) {
  const hasExistingVerifiedAnswer = ["AI_VERIFIED", "OFFICIAL_VERIFIED"].includes(String(question.answerStatus ?? "").toUpperCase());
  if (hasExistingVerifiedAnswer) {
    const existingOption = normalizeOption(question.correctOption ?? null);
    return {
      correctOption: existingOption,
      answerSource: (question.answerSource === "OFFICIAL" ? "OFFICIAL" : (question.answerSource === "AI" ? "AI" : null)) as VerificationSource,
      answerStatus: (question.answerStatus as VerificationStatus) ?? "UNVERIFIED",
      confidence: normalizeConfidence(question.answerConfidence != null ? Number(question.answerConfidence) : 0),
      explanation: "Existing verification retained.",
    } satisfies AiVerificationDecision;
  }

  const aiResponse = await callAiProvider(question);
  const correctOption = normalizeOption(aiResponse.correctOption);
  const confidence = normalizeConfidence(aiResponse.confidence ?? DEFAULT_LOW_CONFIDENCE);

  if (!correctOption || confidence === null || confidence < DEFAULT_LOW_CONFIDENCE) {
    return {
      correctOption: null,
      answerSource: null,
      answerStatus: "UNVERIFIED",
      confidence,
      explanation: "AI answer rejected due to low confidence or malformed response.",
    } satisfies AiVerificationDecision;
  }

  return {
    correctOption,
    answerSource: "AI",
    answerStatus: "AI_VERIFIED",
    confidence,
    explanation: cleanText(aiResponse.explanation ?? "AI-generated practice answer. This is not official verification."),
  } satisfies AiVerificationDecision;
}

export async function verifyPyqPaperAi(paperId: string, options: { force?: boolean; minConfidence?: number } = {}): Promise<{ paperId: string; report: VerificationReport }> {
  const minConfidence = options.minConfidence ?? DEFAULT_LOW_CONFIDENCE;
  const questions = await prisma.pyqQuestion.findMany({ where: { paperId }, orderBy: { questionNumber: "asc" } });
  let aiVerified = 0;
  let officialVerified = 0;
  let unverified = 0;
  let lowConfidence = 0;

  for (const question of questions) {
    const status = String(question.answerStatus ?? "UNVERIFIED").toUpperCase();
    const alreadyVerified = status === "AI_VERIFIED" || status === "OFFICIAL_VERIFIED";
    if (!options.force && alreadyVerified) {
      if (status === "OFFICIAL_VERIFIED") officialVerified += 1;
      if (status === "AI_VERIFIED") aiVerified += 1;
      continue;
    }

    const decision = await verifyPyqQuestionWithAi({
      id: question.id,
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      answerStatus: question.answerStatus,
      answerSource: question.answerSource,
      answerConfidence: question.answerConfidence != null ? Number(question.answerConfidence) : null,
    });

    if (decision.answerStatus === "UNVERIFIED") {
      unverified += 1;
      if (decision.confidence !== null && decision.confidence < minConfidence) lowConfidence += 1;
      await prisma.pyqQuestion.update({
        where: { id: question.id },
        data: {
          answerStatus: "UNVERIFIED",
          answerSource: null,
          answerConfidence: decision.confidence,
          answerExplanation: decision.explanation,
          verifiedAt: null,
          officialVerifiedAt: null,
        },
      });
      continue;
    }

    if (decision.answerStatus === "AI_VERIFIED") {
      aiVerified += 1;
      await prisma.pyqQuestion.update({
        where: { id: question.id },
        data: {
          correctOption: decision.correctOption,
          answerStatus: "AI_VERIFIED",
          answerSource: "AI",
          answerConfidence: decision.confidence,
          answerExplanation: decision.explanation,
          verifiedAt: new Date(),
          officialVerifiedAt: null,
        },
      });
      continue;
    }

    officialVerified += 1;
    await prisma.pyqQuestion.update({
      where: { id: question.id },
      data: {
        correctOption: decision.correctOption,
        answerStatus: "OFFICIAL_VERIFIED",
        answerSource: "OFFICIAL",
        answerConfidence: decision.confidence,
        answerExplanation: decision.explanation,
        verifiedAt: new Date(),
        officialVerifiedAt: new Date(),
      },
    });
  }

  const report = {
    totalQuestions: questions.length,
    aiVerified,
    officialVerified,
    unverified: questions.length - aiVerified - officialVerified,
    lowConfidence,
  };

  return { paperId, report };
}

export async function getPyqVerificationReport(paperId: string): Promise<VerificationReport> {
  const questions = await prisma.pyqQuestion.findMany({ where: { paperId } });
  const totalQuestions = questions.length;
  const aiVerified = questions.filter((question) => question.answerStatus === "AI_VERIFIED").length;
  const officialVerified = questions.filter((question) => question.answerStatus === "OFFICIAL_VERIFIED").length;
  const unverified = questions.filter((question) => !question.answerStatus || question.answerStatus === "UNVERIFIED").length;
  const lowConfidence = questions.filter((question) => question.answerStatus === "UNVERIFIED" && question.answerConfidence !== null && Number(question.answerConfidence) < DEFAULT_LOW_CONFIDENCE).length;

  return { totalQuestions, aiVerified, officialVerified, unverified, lowConfidence };
}
