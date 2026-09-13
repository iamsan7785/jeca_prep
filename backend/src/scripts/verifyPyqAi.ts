#!/usr/bin/env tsx
import { PrismaClient } from "@prisma/client";
import { verifyPyqPaperAi } from "../services/pyqAiVerification.js";

const prisma = new PrismaClient();

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const paperIdArg = args.find((arg) => arg.startsWith("--paperId="))?.split("=")[1];
  const yearArg = args.find((arg) => arg.startsWith("--year="))?.split("=")[1];
  const thresholdArg = args.find((arg) => arg.startsWith("--threshold="))?.split("=")[1];
  const minConfidence = thresholdArg ? Number(thresholdArg) : undefined;

  const papers = paperIdArg
    ? await prisma.pyqPaper.findMany({ where: { id: paperIdArg } })
    : yearArg
      ? await prisma.pyqPaper.findMany({ where: { year: Number(yearArg) } })
      : await prisma.pyqPaper.findMany({});

  if (!papers.length) {
    console.log("No PYQ papers found.");
    return;
  }

  for (const paper of papers) {
    const result = await verifyPyqPaperAi(paper.id, { force, minConfidence });
    console.log(`${paper.year} | ${result.report.aiVerified} AI verified | ${result.report.officialVerified} official verified | ${result.report.unverified} unresolved`);
  }
}

main().catch((error: Error) => {
  console.error("PYQ AI verification failed:", error.message);
  process.exit(1);
}).finally(async () => {
  await prisma.$disconnect();
});
