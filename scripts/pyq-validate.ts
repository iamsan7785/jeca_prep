import { PrismaClient } from "@prisma/client";
import { validatePyqQuestions } from "../backend/src/services/pyqValidation.js";

const prisma = new PrismaClient();

async function main() {
  const papers = await prisma.pyqPaper.findMany({
    orderBy: [{ year: "asc" }],
    include: { questions: { orderBy: { questionNumber: "asc" } } },
  });

  console.log("PYQ VALIDATION");
  console.log("=".repeat(80));

  if (!papers.length) {
    console.log("No official PYQ papers found in the database.");
    return;
  }

  for (const paper of papers) {
    const summary = validatePyqQuestions(paper.questions.map((question) => ({
      questionNumber: question.questionNumber,
      questionText: question.questionText,
      optionA: question.optionA,
      optionB: question.optionB,
      optionC: question.optionC,
      optionD: question.optionD,
      correctOption: question.correctOption,
      marks: Number(question.marks),
      negativeMarks: Number(question.negativeMarks),
    })));

    console.log(`\n${paper.title}`);
    console.log(`Questions: ${summary.totalQuestions}`);
    console.log(`Verified answers: ${summary.verifiedAnswers}`);
    console.log(`Unresolved: ${summary.unresolved}`);
    console.log(`Invalid question numbers: ${summary.invalidQuestionNumbers}`);
    console.log(`Duplicate question numbers: ${summary.duplicateQuestionNumbers.length}`);
    console.log(`Missing options: ${summary.missingOptions}`);
    console.log(`Malformed questions: ${summary.malformedQuestions}`);
    console.log(`Status: ${summary.status}`);

    if (summary.reasons.length > 0) {
      console.log("Reasons:");
      for (const reason of summary.reasons) {
        console.log(`- ${reason}`);
      }
    }
  }
}

main().catch((error: Error) => {
  console.error("PYQ validation failed:", error.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
