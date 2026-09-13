import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

function isDemoSource(value?: string | null) {
  return /test data|test sample|demo|example|sample/i.test(value ?? "");
}

async function main() {
  const rawArgs = process.argv.slice(2);
  const inputPath = rawArgs[0];
  if (!inputPath) {
    console.error("Usage: tsx scripts/import-official-pyq.ts <path-to-official-json>");
    process.exit(1);
  }

  const absolutePath = path.resolve(inputPath);
  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const file = JSON.parse(fs.readFileSync(absolutePath, "utf8")) as {
    year: number;
    title: string;
    paperType?: string | null;
    source?: string;
    sourceUrl?: string;
    durationMinutes?: number;
    totalQuestions?: number;
    totalMarks?: number;
    config?: Record<string, unknown>;
    questions: Array<{
      questionNumber: number;
      questionText: string;
      optionA?: string | null;
      optionB?: string | null;
      optionC?: string | null;
      optionD?: string | null;
      correctOption?: string | null;
      marks?: number;
      negativeMarks?: number;
      category?: string | null;
      source?: string | null;
      answerSource?: string | null;
    }>;
  };

  if (!file.year || !file.title || !Array.isArray(file.questions) || file.questions.length === 0) {
    throw new Error(`Invalid official paper JSON: ${absolutePath}`);
  }

  if (file.questions.some((q) => isDemoSource(q.source) || isDemoSource(file.source))) {
    throw new Error(`Refusing to import test/demo data as official PYQ: ${absolutePath}`);
  }

  const paper = await prisma.pyqPaper.upsert({
    where: {
      year_title_paperType: {
        year: file.year,
        title: file.title,
        paperType: file.paperType ?? "JECA",
      },
    },
    update: {
      source: file.source ?? "Official JECA paper",
      sourceUrl: file.sourceUrl ?? "https://wbjeeb.nic.in/",
      durationMinutes: file.durationMinutes ?? 120,
      totalQuestions: file.totalQuestions ?? file.questions.length,
      totalMarks: file.totalMarks ?? null,
      config: file.config ?? { answerKeyVerified: false, importMode: "official-json" },
      isPublished: false,
    },
    create: {
      year: file.year,
      title: file.title,
      paperType: file.paperType ?? "JECA",
      source: file.source ?? "Official JECA paper",
      sourceUrl: file.sourceUrl ?? "https://wbjeeb.nic.in/",
      durationMinutes: file.durationMinutes ?? 120,
      totalQuestions: file.totalQuestions ?? file.questions.length,
      totalMarks: file.totalMarks ?? null,
      config: file.config ?? { answerKeyVerified: false, importMode: "official-json" },
      isPublished: false,
    },
  });

  for (const question of file.questions) {
    const questionText = (question.questionText ?? "").trim();
    if (!questionText) continue;

    const normalized = {
      questionNumber: Number(question.questionNumber),
      questionText: questionText,
      optionA: question.optionA?.trim() ?? null,
      optionB: question.optionB?.trim() ?? null,
      optionC: question.optionC?.trim() ?? null,
      optionD: question.optionD?.trim() ?? null,
      correctOption: question.correctOption ?? null,
      marks: Number(question.marks ?? (question.questionNumber <= 80 ? 1 : 2)),
      negativeMarks: Number(question.negativeMarks ?? (question.questionNumber <= 80 ? 0.25 : 0)),
      category: question.category ?? (question.questionNumber <= 80 ? "Category-1" : "Category-2"),
      source: question.source ?? file.source ?? "Official JECA paper",
      answerSource: question.answerSource ?? null,
    };

    await prisma.pyqQuestion.upsert({
      where: {
        paperId_questionNumber: {
          paperId: paper.id,
          questionNumber: normalized.questionNumber,
        },
      },
      update: {
        questionText: normalized.questionText,
        optionA: normalized.optionA,
        optionB: normalized.optionB,
        optionC: normalized.optionC,
        optionD: normalized.optionD,
        correctOption: normalized.correctOption,
        marks: normalized.marks,
        negativeMarks: normalized.negativeMarks,
        category: normalized.category,
        source: normalized.source,
        answerSource: normalized.answerSource,
      },
      create: {
        paperId: paper.id,
        questionNumber: normalized.questionNumber,
        questionText: normalized.questionText,
        optionA: normalized.optionA,
        optionB: normalized.optionB,
        optionC: normalized.optionC,
        optionD: normalized.optionD,
        correctOption: normalized.correctOption,
        marks: normalized.marks,
        negativeMarks: normalized.negativeMarks,
        category: normalized.category,
        source: normalized.source,
        answerSource: normalized.answerSource,
      },
    });
  }

  console.log(`Imported official PYQ paper ${file.title} (${file.year}) — unpublished until answer key is verified.`);
}

main().catch((err: Error) => {
  console.error("Official import failed:", err.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
