import { Prisma, PrismaClient } from "@prisma/client";
import { execFileSync } from "child_process";
import fs from "fs";
import path from "path";
import { parseJeCaPdfText } from "./pyqParser.js";

const prisma = new PrismaClient();

function runPython(script: string, args: string[] = []): string {
  const pythonPath = path.resolve(process.cwd(), ".venv", "bin", "python");
  if (!fs.existsSync(pythonPath)) {
    throw new Error(`Python environment not found at ${pythonPath}. Use the workspace .venv.`);
  }
  return execFileSync(pythonPath, ["-c", script, ...args], { encoding: "utf8" });
}

function extractPdfText(pdfPath: string): string {
  const directScript = `from pypdf import PdfReader
import sys
pdf = sys.argv[1]
reader = PdfReader(pdf)
text = '\\n'.join(page.extract_text() or '' for page in reader.pages)
print(text)`;

  const rawText = runPython(directScript, [pdfPath]);
  const isLikelyReadable = rawText.trim().length > 1500 && /\b\d+\.?\s+/.test(rawText.slice(0, 500));
  if (isLikelyReadable) return rawText;

  const ocrScript = `import sys, os
import fitz
import pytesseract
from pathlib import Path
pdf = sys.argv[1]
doc = fitz.open(pdf)
parts = []
for index, page in enumerate(doc, start=1):
    pix = page.get_pixmap(matrix=fitz.Matrix(2,2), alpha=False)
    image_path = Path('/tmp') / f'je ca pyq ocr_{index}.png'
    pix.save(str(image_path))
    text = pytesseract.image_to_string(str(image_path), config='--psm 6')
    parts.append(text)
    try:
        os.remove(image_path)
    except FileNotFoundError:
        pass
print('\n'.join(parts))`;

  return runPython(ocrScript, [pdfPath]);
}

function isDemoSource(value: string | null | undefined) {
  const haystack = (value ?? "").toLowerCase();
  return /(test data|test sample|demo|example|sample)/.test(haystack);
}

async function importOfficialPyqFromPdf(pdfPath: string, options: { year: number; title?: string; sourceUrl?: string; source?: string }) {
  const absolutePath = path.resolve(pdfPath);
  if (!fs.existsSync(absolutePath)) throw new Error(`PDF not found: ${absolutePath}`);

  const text = extractPdfText(absolutePath);
  const parsed = parseJeCaPdfText(text, options.year);

  if (parsed.questions.length === 0) {
    throw new Error(`No reliable questions were extracted from ${absolutePath}. Import stopped.`);
  }

  const paper = await prisma.pyqPaper.upsert({
    where: { year_title_paperType: { year: options.year, title: options.title ?? `JECA ${options.year}`, paperType: "JECA" } },
    update: {
      source: options.source ?? parsed.paper.source,
      sourceUrl: options.sourceUrl ?? parsed.paper.sourceUrl,
      durationMinutes: parsed.paper.durationMinutes,
      totalQuestions: parsed.paper.totalQuestions,
      totalMarks: parsed.paper.totalMarks,
      config: parsed.paper.config as Prisma.InputJsonValue | undefined,
      isPublished: false,
    },
    create: {
      year: options.year,
      title: options.title ?? `JECA ${options.year}`,
      paperType: "JECA",
      source: options.source ?? parsed.paper.source,
      sourceUrl: options.sourceUrl ?? parsed.paper.sourceUrl,
      durationMinutes: parsed.paper.durationMinutes,
      totalQuestions: parsed.paper.totalQuestions,
      totalMarks: parsed.paper.totalMarks,
      config: parsed.paper.config as Prisma.InputJsonValue | undefined,
      isPublished: false,
    },
  });

  for (const question of parsed.questions) {
    const safeQuestionText = question.questionText.trim();
    if (!safeQuestionText || isDemoSource(question.source)) continue;

    await prisma.pyqQuestion.upsert({
      where: { paperId_questionNumber: { paperId: paper.id, questionNumber: question.questionNumber } },
      update: {
        questionText: safeQuestionText,
        optionA: question.optionA ?? null,
        optionB: question.optionB ?? null,
        optionC: question.optionC ?? null,
        optionD: question.optionD ?? null,
        correctOption: question.correctOption,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        category: question.category ?? null,
        source: question.source,
        answerSource: question.answerSource ?? null,
      },
      create: {
        paperId: paper.id,
        questionNumber: question.questionNumber,
        questionText: safeQuestionText,
        optionA: question.optionA ?? null,
        optionB: question.optionB ?? null,
        optionC: question.optionC ?? null,
        optionD: question.optionD ?? null,
        correctOption: question.correctOption,
        marks: question.marks,
        negativeMarks: question.negativeMarks,
        category: question.category ?? null,
        source: question.source,
        answerSource: question.answerSource ?? null,
      },
    });
  }

  return paper;
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: tsx backend/src/services/importOfficialPyq.ts <path-to-pdf> --year 2023");
    process.exit(1);
  }

  const pdfPath = args[0];
  const yearArg = Number(args.find((arg) => arg === "--year") ? args[args.indexOf("--year") + 1] : undefined);
  const year = Number.isFinite(yearArg) ? yearArg : Number(path.basename(pdfPath).match(/(20\d{2})/)?.[1] ?? 0);

  if (!year) {
    throw new Error("A valid year is required. Use --year 2023");
  }

  const source = args.includes("--source") ? args[args.indexOf("--source") + 1] : undefined;
  const sourceUrl = args.includes("--source-url") ? args[args.indexOf("--source-url") + 1] : undefined;

  console.log(`Importing official JECA paper for ${year} from ${pdfPath}`);
  const paper = await importOfficialPyqFromPdf(pdfPath, { year, source, sourceUrl });
  console.log("Paper ready:", { id: paper.id, year: paper.year, title: paper.title, totalQuestions: paper.totalQuestions });
}

main().catch((error: Error) => {
  console.error("Official PYQ import failed:", error.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
