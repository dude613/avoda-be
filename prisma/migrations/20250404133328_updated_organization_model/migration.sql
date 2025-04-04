/*
  Warnings:

  - You are about to drop the column `user` on the `organizations` table. All the data in the column will be lost.
  - Added the required column `userId` to the `organizations` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "organizations" DROP COLUMN "user",
ADD COLUMN     "userId" INTEGER NOT NULL;
