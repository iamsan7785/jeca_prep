import { PrismaClient, Difficulty, QuestionType, SourceType } from "@prisma/client";
import { questionBank, supportedSubjects } from "@jeca/shared/questions";

const prisma = new PrismaClient();

async function main() {
  const studentRole = await prisma.role.upsert({ where: { name: "STUDENT" }, update: {}, create: { name: "STUDENT" } });
  await prisma.role.upsert({ where: { name: "ADMIN" }, update: {}, create: { name: "ADMIN" } });
  const subjectRows = new Map<string, string>();
  for (const name of supportedSubjects) {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    const subject = await prisma.subject.upsert({ where: { slug }, update: { name }, create: { name, slug } });
    subjectRows.set(name, subject.id);
  }
  for (const question of questionBank) {
    const subjectId = subjectRows.get(question.subject)!;
    const topicSlug = question.topic.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const topic = await prisma.topic.upsert({ where: { subjectId_slug: { subjectId, slug: topicSlug } }, update: { name: question.topic }, create: { subjectId, name: question.topic, slug: topicSlug } });
    await prisma.question.upsert({ where: { id: question.id }, update: {}, create: { id: question.id, questionText: question.questionText, questionType: question.questionType as QuestionType, category: question.category, subjectId, topicId: topic.id, difficulty: question.difficulty.toUpperCase() as Difficulty, options: question.options, correctAnswers: question.correctAnswers, explanation: question.explanation, marks: question.marks, negativeMarks: question.negativeMarks, source: question.source, sourceType: question.sourceType as SourceType, tags: question.tags, published: true } });
  }
  console.log(`Seeded ${questionBank.length} original practice questions for ${supportedSubjects.length} subjects. Student role: ${studentRole.id}`);
}

main().catch((error) => { console.error(error); process.exit(1); }).finally(() => prisma.$disconnect());
