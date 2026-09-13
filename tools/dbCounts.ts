import { PrismaClient } from '@prisma/client';
async function main(){
  const prisma = new PrismaClient();
  try{
    const q = await prisma.question.count();
    const pyqP = await prisma.pyqPaper.count();
    const pyqQ = await prisma.pyqQuestion.count();
    const attempts = await prisma.examAttempt.count();
    console.log('counts:', { Question: q, PyqPaper: pyqP, PyqQuestion: pyqQ, ExamAttempt: attempts });
  }catch(e){
    console.error('error', e);
    process.exit(1);
  }finally{ await prisma.$disconnect(); }
}
main();
