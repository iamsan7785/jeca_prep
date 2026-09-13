import "dotenv/config";
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function main(){
  const paper = await prisma.pyqPaper.findFirst({ where: { title: { contains: 'TEST SAMPLE 2026' } } });
  if(!paper){
    console.error('Test paper not found');
    process.exit(2);
  }
  // publish if not
  if(!paper.isPublished){
    await prisma.pyqPaper.update({ where: { id: paper.id }, data: { isPublished: true } });
    console.log('Published test paper');
  }

  // find or create a DB user for testing
  const email = 'pyq.tester@example.com';
  let user = await prisma.user.findUnique({ where: { email } });
  if(!user){
    const role = await prisma.role.findFirst({ where: { name: 'STUDENT' } });
    if(!role){ console.error('STUDENT role not found'); process.exit(2); }
    const passwordHash = await bcrypt.hash('password123', 12);
    user = await prisma.user.create({ data: { name: 'PYQ Tester', email, passwordHash, roleId: role.id } });
    console.log('Created DB user');
  }

  // create token
  const token = jwt.sign({ userId: user.id, role: 'STUDENT' }, process.env.JWT_SECRET as string, { expiresIn: '7d' });

  // call start endpoint
  const res = await fetch(`http://localhost:4000/api/exams/pyq/${paper.id}/start`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: '{}' });
  const body = await res.text();
  console.log('Start attempt response status:', res.status);
  console.log(body);
  await prisma.$disconnect();
}

main().catch((e)=>{ console.error(e); process.exit(1); });
