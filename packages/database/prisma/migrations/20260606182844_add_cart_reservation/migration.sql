-- CreateTable
CREATE TABLE "CartReservation" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CartReservation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CartReservation_productId_expiresAt_idx" ON "CartReservation"("productId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "CartReservation_sessionId_productId_key" ON "CartReservation"("sessionId", "productId");

-- AddForeignKey
ALTER TABLE "CartReservation" ADD CONSTRAINT "CartReservation_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
