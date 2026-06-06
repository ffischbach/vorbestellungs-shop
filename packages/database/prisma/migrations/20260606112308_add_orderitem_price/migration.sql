/*
  Warnings:
  - Added the required column `price` to the `OrderItem` table without a default value. This is not possible if the table is not empty.
*/
-- AlterTable: temporärer Default 0 für Seed-Daten, danach entfernen
ALTER TABLE "OrderItem" ADD COLUMN "price" DECIMAL(65,30) NOT NULL DEFAULT 0;
ALTER TABLE "OrderItem" ALTER COLUMN "price" DROP DEFAULT;
