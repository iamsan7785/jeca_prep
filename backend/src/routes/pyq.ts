import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
export const pyqRouter = Router();

const isDemoPaper = (paper: { title: string | null; source: string | null; paperType?: string | null }) => {
  const haystack = `${paper.title ?? ""} ${paper.source ?? ""} ${paper.paperType ?? ""}`.toLowerCase();
  return /(test data|test sample|demo|example|sample)/.test(haystack);
};

const normalizePaperRecord = (paper: {
  id: string;
  year: number;
  title: string;
  paperType: string | null;
  source: string;
  sourceUrl: string;
  durationMinutes: number;
  totalQuestions: number | null;
  totalMarks: number | string | null;
  isPublished: boolean;
  config?: any;
}) => ({
  ...paper,
  totalMarks: paper.totalMarks ?? null,
  playable: !isDemoPaper(paper),
  status: "AVAILABLE",
  availabilityText: "Available for Practice",
} as const);

// List official PYQ papers with explicit availability state.
pyqRouter.get("/", async (_request, response) => {
  const papers = await prisma.pyqPaper.findMany({
    orderBy: [{ year: "desc" }, { title: "asc" }],
    select: {
      id: true,
      year: true,
      title: true,
      paperType: true,
      totalQuestions: true,
      totalMarks: true,
      durationMinutes: true,
      isPublished: true,
      source: true,
      sourceUrl: true,
      config: true,
    },
  });

  const officialPapers = papers.filter((paper) => !isDemoPaper(paper) && paper.isPublished);
  return response.json({ papers: officialPapers.map((paper) => normalizePaperRecord(paper as any)) });
});

// Get paper metadata by id, even when unpublished, but never expose playable status unless verified.
pyqRouter.get("/:id", async (request, response) => {
  const id = String(request.params.id);
  const paper = await prisma.pyqPaper.findUnique({
    where: { id },
    select: { id: true, year: true, title: true, paperType: true, totalQuestions: true, totalMarks: true, durationMinutes: true, isPublished: true, source: true, sourceUrl: true, config: true },
  });
  if (!paper || isDemoPaper(paper) || !paper.isPublished) return response.status(404).json({ message: "Official paper not found." });
  return response.json({ paper: normalizePaperRecord(paper as any) });
});

// Get questions for an official paper in the development AI-practice mode.
pyqRouter.get("/:id/questions", async (request, response) => {
  const id = String(request.params.id);
  const paper = await prisma.pyqPaper.findUnique({ where: { id } });
  if (!paper || isDemoPaper(paper) || !paper.isPublished) return response.status(404).json({ message: "Official paper not found." });
  const questions = await prisma.pyqQuestion.findMany({ where: { paperId: id }, orderBy: { questionNumber: "asc" }, select: { id: true, questionNumber: true, questionText: true, optionA: true, optionB: true, optionC: true, optionD: true, marks: true, negativeMarks: true, category: true } });
  return response.json({ paper: { id: paper.id, title: paper.title, year: paper.year, durationMinutes: paper.durationMinutes }, questions });
});
