#!/usr/bin/env tsx
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';

type ImportQuestion = {
  questionNumber: number;
  questionText: string;
  optionA?: string;
  optionB?: string;
  optionC?: string;
  optionD?: string;
  correctOption?: string | null;
  correctOptions?: string[] | null;
  marks: number;
  negativeMarks: number;
  category?: string;
  subject?: string;
  answerStatus?: string | null;
  answerSource?: string | null;
};

type ImportPaper = {
  year: number;
  title: string;
  paperType?: string | null;
  source: string;
  sourceUrl: string;
  durationMinutes: number;
  totalQuestions?: number;
  totalMarks?: number;
  config?: any;
  questions: ImportQuestion[];
};

async function main(){
  const args = process.argv.slice(2);
  if(args.length === 0){
    console.error('Usage: import-pyq <path-to-json>');
    process.exit(2);
  }
  const file = path.resolve(args[0]);
  if(!fs.existsSync(file)){
    console.error('File not found:', file);
    process.exit(2);
  }
  const raw = fs.readFileSync(file, 'utf8');
  let data: ImportPaper;
  try{ data = JSON.parse(raw); }catch(e){ console.error('Invalid JSON'); process.exit(2); }

  // Basic validation
  if(typeof data.year !== 'number' || !data.title || !data.source || !data.sourceUrl) {
    console.error('Missing required paper fields: year,title,source,sourceUrl');
    process.exit(2);
  }
  if(!Array.isArray(data.questions) || data.questions.length === 0){
    console.error('Paper must contain questions array');
    process.exit(2);
  }

  const prisma = new PrismaClient();
  try{
    // Upsert paper by unique key: year+title+paperType
    const paper = await prisma.pyqPaper.upsert({
      where: { year_title_paperType: { year: data.year, title: data.title, paperType: data.paperType ?? null } },
      update: { source: data.source, sourceUrl: data.sourceUrl, durationMinutes: data.durationMinutes, totalQuestions: data.totalQuestions ?? data.questions.length, totalMarks: data.totalMarks ?? null, isPublished: true, config: data.config ?? null },
      create: { year: data.year, title: data.title, paperType: data.paperType ?? null, source: data.source, sourceUrl: data.sourceUrl, durationMinutes: data.durationMinutes, totalQuestions: data.totalQuestions ?? data.questions.length, totalMarks: data.totalMarks ?? null, isPublished: true, config: data.config ?? null }
    });

    // Validate question numbers uniqueness
    const seen = new Set<number>();
    for(const q of data.questions){
      if(typeof q.questionNumber !== 'number') { throw new Error('Each question must have a questionNumber'); }
      if(seen.has(q.questionNumber)) throw new Error('Duplicate questionNumber: ' + q.questionNumber);
      seen.add(q.questionNumber);
    }

    // Upsert questions
    for(const q of data.questions){
      // validate options
      const options = [q.optionA,q.optionB,q.optionC,q.optionD];
      // ensure at least two options present
      const present = options.filter(Boolean).length;
      if(present < 2) throw new Error(`Question ${q.questionNumber} has insufficient options`);
      const normalizedCorrectOptions = Array.isArray(q.correctOptions) ? q.correctOptions.filter((option): option is string => Boolean(option && ['A','B','C','D'].includes(option.toUpperCase()))) : [];
      const resolvedCorrectOption = q.correctOption ?? normalizedCorrectOptions[0] ?? null;
      // correctOption validation if provided
      if(resolvedCorrectOption && !['A','B','C','D'].includes(resolvedCorrectOption.toUpperCase())) throw new Error(`Question ${q.questionNumber} has invalid correctOption`);
      if(normalizedCorrectOptions.some((option) => !['A','B','C','D'].includes(option.toUpperCase()))) throw new Error(`Question ${q.questionNumber} has invalid correctOptions`);

      await prisma.pyqQuestion.upsert({
        where: { paperId_questionNumber: { paperId: paper.id, questionNumber: q.questionNumber } },
        update: { questionText: q.questionText, optionA: q.optionA ?? null, optionB: q.optionB ?? null, optionC: q.optionC ?? null, optionD: q.optionD ?? null, correctOption: resolvedCorrectOption ?? null, correctOptions: normalizedCorrectOptions, marks: q.marks, negativeMarks: q.negativeMarks, category: q.category ?? null, source: data.source, answerStatus: q.answerStatus ?? "UNVERIFIED", answerSource: q.answerSource ?? data.source },
        create: { paperId: paper.id, questionNumber: q.questionNumber, questionText: q.questionText, optionA: q.optionA ?? null, optionB: q.optionB ?? null, optionC: q.optionC ?? null, optionD: q.optionD ?? null, correctOption: resolvedCorrectOption ?? null, correctOptions: normalizedCorrectOptions, marks: q.marks, negativeMarks: q.negativeMarks, category: q.category ?? null, subjectId: null, source: data.source, answerStatus: q.answerStatus ?? "UNVERIFIED", answerSource: q.answerSource ?? data.source }
      });
    }

    console.log('Import completed for', data.title, 'year', data.year);
  }catch(e:any){
    console.error('Import failed:', e.message ?? e);
    process.exit(1);
  }finally{
    await prisma.$disconnect();
  }
}

main();
