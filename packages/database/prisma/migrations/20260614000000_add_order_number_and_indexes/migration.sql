-- Add orderNumber as nullable first to allow backfilling existing rows
ALTER TABLE "Order" ADD COLUMN "orderNumber" TEXT;

-- Backfill existing rows using the same VB-XXXXXX derivation
UPDATE "Order" SET "orderNumber" = 'VB-' || UPPER(RIGHT(id, 6)) WHERE "orderNumber" IS NULL;

-- Set NOT NULL after backfill
ALTER TABLE "Order" ALTER COLUMN "orderNumber" SET NOT NULL;

-- CreateIndex for unique orderNumber
CREATE UNIQUE INDEX "Order_orderNumber_key" ON "Order"("orderNumber");

-- CreateIndex for query performance
CREATE INDEX "Order_status_idx" ON "Order"("status");
CREATE INDEX "Order_reminderSent_status_idx" ON "Order"("reminderSent", "status");
CREATE INDEX "Order_pickupSlotId_idx" ON "Order"("pickupSlotId");
