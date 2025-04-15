/*
  Warnings:

  - You are about to alter the column `note` on the `timers` table. The data in that column could be lost. The data in that column will be cast from `VarChar(500)` to `VarChar(200)`.

*/
-- AlterTable
ALTER TABLE "timers" ALTER COLUMN "note" SET DATA TYPE VARCHAR(200);
