-- CreateTable
CREATE TABLE "PyqPaper" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "paperType" TEXT,
    "source" TEXT NOT NULL,
    "sourceUrl" TEXT NOT NULL,
    "durationMinutes" INTEGER NOT NULL,
    "totalQuestions" INTEGER,
    "totalMarks" DECIMAL(8,2),
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "config" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PyqPaper_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PyqQuestion" (
    "id" TEXT NOT NULL,
    "paperId" TEXT NOT NULL,
    "questionNumber" INTEGER NOT NULL,
    "questionText" TEXT NOT NULL,
    "optionA" TEXT,
    "optionB" TEXT,
    "optionC" TEXT,
    "optionD" TEXT,
    "correctOption" TEXT,
    "marks" DECIMAL(6,2) NOT NULL,
    "negativeMarks" DECIMAL(6,2) NOT NULL,
    "category" TEXT,
    "subjectId" TEXT,
    "source" TEXT,
    "answerSource" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PyqQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "mockConfig" JSONB,
    "pyqPaperId" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "submittedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "totalQuestions" INTEGER NOT NULL,
    "totalMarks" DECIMAL(8,2),
    "result" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExamAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExamAttemptAnswer" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "questionRef" TEXT NOT NULL,
    "questionType" TEXT,
    "selectedOption" TEXT,
    "isCorrect" BOOLEAN,
    "marksObtained" DECIMAL(6,2),
    "answeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExamAttemptAnswer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PyqPaper_year_title_paperType_key" ON "PyqPaper"("year", "title", "paperType");

-- CreateIndex
CREATE INDEX "PyqQuestion_paperId_idx" ON "PyqQuestion"("paperId");

-- CreateIndex
CREATE UNIQUE INDEX "PyqQuestion_paperId_questionNumber_key" ON "PyqQuestion"("paperId", "questionNumber");

-- CreateIndex
CREATE INDEX "ExamAttemptAnswer_attemptId_idx" ON "ExamAttemptAnswer"("attemptId");

-- AddForeignKey
ALTER TABLE "PyqQuestion" ADD CONSTRAINT "PyqQuestion_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "PyqPaper"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttempt" ADD CONSTRAINT "ExamAttempt_pyqPaperId_fkey" FOREIGN KEY ("pyqPaperId") REFERENCES "PyqPaper"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamAttemptAnswer" ADD CONSTRAINT "ExamAttemptAnswer_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
