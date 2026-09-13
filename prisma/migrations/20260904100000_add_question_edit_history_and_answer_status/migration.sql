ALTER TABLE "Question"
  ADD COLUMN "answerStatus" TEXT NOT NULL DEFAULT 'UNVERIFIED';

CREATE TABLE "QuestionEditHistory" (
  "id" TEXT NOT NULL,
  "questionId" TEXT,
  "pyqQuestionId" TEXT,
  "adminUserId" TEXT NOT NULL,
  "previousData" JSONB NOT NULL,
  "newData" JSONB NOT NULL,
  "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "QuestionEditHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "QuestionEditHistory_questionId_changedAt_idx" ON "QuestionEditHistory"("questionId", "changedAt");
CREATE INDEX "QuestionEditHistory_pyqQuestionId_changedAt_idx" ON "QuestionEditHistory"("pyqQuestionId", "changedAt");
CREATE INDEX "QuestionEditHistory_adminUserId_idx" ON "QuestionEditHistory"("adminUserId");
ALTER TABLE "QuestionEditHistory" ADD CONSTRAINT "QuestionEditHistory_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionEditHistory" ADD CONSTRAINT "QuestionEditHistory_pyqQuestionId_fkey" FOREIGN KEY ("pyqQuestionId") REFERENCES "PyqQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "QuestionEditHistory" ADD CONSTRAINT "QuestionEditHistory_adminUserId_fkey" FOREIGN KEY ("adminUserId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;