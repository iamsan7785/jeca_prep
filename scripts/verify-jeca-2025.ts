import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function main() {
  const paper = await prisma.pyqPaper.findFirst({
    where: { year: 2025, title: 'JECA 2025' },
    include: { questions: { orderBy: { questionNumber: 'asc' } } },
  });

  if (!paper) {
    throw new Error('JECA 2025 paper not found.');
  }

  const questions = paper.questions;
  const numbers = questions.map((question) => question.questionNumber);
  const expectedNumbers = Array.from({ length: 100 }, (_, index) => index + 1);
  const missing = expectedNumbers.filter((number) => !numbers.includes(number));
  const duplicates = [...new Set(numbers.filter((number, index) => numbers.indexOf(number) !== index))];
  const category1 = questions.filter((question) => question.category === 'Category-1').length;
  const category2 = questions.filter((question) => question.category === 'Category-2').length;

  if (questions.length !== 100) {
    throw new Error(`Expected 100 questions but found ${questions.length}.`);
  }

  if (missing.length) {
    throw new Error(`Missing question numbers: ${missing.join(', ')}`);
  }

  if (duplicates.length) {
    throw new Error(`Duplicate question numbers: ${duplicates.join(', ')}`);
  }

  if (numbers[0] !== 1 || numbers[numbers.length - 1] !== 100) {
    throw new Error(`Question ordering is wrong: first=${numbers[0]} last=${numbers[numbers.length - 1]}`);
  }

  if (category1 !== 80 || category2 !== 20) {
    throw new Error(`Expected Category-1=80 and Category-2=20, got Category-1=${category1}, Category-2=${category2}.`);
  }

  console.log(JSON.stringify({
    paperId: paper.id,
    title: paper.title,
    year: paper.year,
    totalQuestions: questions.length,
    category1,
    category2,
    missing: missing.length,
    duplicates: duplicates.length,
    firstQuestion: numbers[0],
    lastQuestion: numbers[numbers.length - 1],
    status: 'PASS',
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
