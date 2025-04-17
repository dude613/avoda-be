-- AlterTable
ALTER TABLE "timers" ADD COLUMN     "isPaused" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pauseTime" TIMESTAMP(3);
