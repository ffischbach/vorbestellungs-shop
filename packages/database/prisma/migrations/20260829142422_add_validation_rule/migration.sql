-- CreateTable
CREATE TABLE "ValidationRule" (
    "id" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "rule" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ValidationRule_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ValidationRule_enabled_idx" ON "ValidationRule"("enabled");
