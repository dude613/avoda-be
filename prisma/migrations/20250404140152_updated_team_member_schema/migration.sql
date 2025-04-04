/*
  Warnings:

  - A unique constraint covering the columns `[email]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `email` to the `team_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "email" TEXT NOT NULL,
ADD COLUMN     "name" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");
