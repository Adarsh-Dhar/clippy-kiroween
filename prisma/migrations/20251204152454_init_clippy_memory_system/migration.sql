-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MistakeRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "errorType" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "file" TEXT NOT NULL,
    "line" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "count" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "MistakeRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodePattern" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "frequency" INTEGER NOT NULL,
    "lastSeen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "examples" TEXT[],

    CONSTRAINT "CodePattern_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InteractionRecord" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "angerLevel" INTEGER,
    "errorCount" INTEGER,

    CONSTRAINT "InteractionRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AngerEvent" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "level" INTEGER NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "trigger" TEXT,

    CONSTRAINT "AngerEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AngerStats" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "totalDeaths" INTEGER NOT NULL DEFAULT 0,
    "highestLevel" INTEGER NOT NULL DEFAULT 0,
    "averageLevel" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "levelCounts" JSONB NOT NULL,
    "timeAtLevel" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AngerStats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_userId_key" ON "User"("userId");

-- CreateIndex
CREATE INDEX "User_userId_idx" ON "User"("userId");

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_errorType_idx" ON "MistakeRecord"("userId", "errorType");

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_timestamp_idx" ON "MistakeRecord"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "MistakeRecord_userId_file_line_idx" ON "MistakeRecord"("userId", "file", "line");

-- CreateIndex
CREATE INDEX "CodePattern_userId_name_idx" ON "CodePattern"("userId", "name");

-- CreateIndex
CREATE INDEX "CodePattern_userId_frequency_idx" ON "CodePattern"("userId", "frequency");

-- CreateIndex
CREATE INDEX "CodePattern_userId_lastSeen_idx" ON "CodePattern"("userId", "lastSeen");

-- CreateIndex
CREATE INDEX "InteractionRecord_userId_type_idx" ON "InteractionRecord"("userId", "type");

-- CreateIndex
CREATE INDEX "InteractionRecord_userId_timestamp_idx" ON "InteractionRecord"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "AngerEvent_userId_level_idx" ON "AngerEvent"("userId", "level");

-- CreateIndex
CREATE INDEX "AngerEvent_userId_timestamp_idx" ON "AngerEvent"("userId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "AngerStats_userId_key" ON "AngerStats"("userId");

-- AddForeignKey
ALTER TABLE "MistakeRecord" ADD CONSTRAINT "MistakeRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CodePattern" ADD CONSTRAINT "CodePattern_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InteractionRecord" ADD CONSTRAINT "InteractionRecord_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AngerEvent" ADD CONSTRAINT "AngerEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AngerStats" ADD CONSTRAINT "AngerStats_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
