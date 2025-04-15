/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `team_members` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `userId` to the `team_members` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "userId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "team_members_userId_key" ON "team_members"("userId");

-- AddForeignKey
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
