ALTER TABLE "PyqQuestion"
  ADD COLUMN "answerStatus" TEXT DEFAULT 'UNVERIFIED',
  ADD COLUMN "answerConfidence" DECIMAL(5,4),
  ADD COLUMN "answerExplanation" TEXT,
  ADD COLUMN "verifiedAt" TIMESTAMP(3),
  ADD COLUMN "officialVerifiedAt" TIMESTAMP(3);
