ALTER TABLE "ExamAttemptAnswer" ADD COLUMN "markedForReview" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "ExamAttemptAnswer" ADD COLUMN "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0;
CREATE UNIQUE INDEX "ExamAttemptAnswer_attemptId_questionRef_key" ON "ExamAttemptAnswer"("attemptId", "questionRef");