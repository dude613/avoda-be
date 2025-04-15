-- CreateTable
CREATE TABLE "timer_history" (
    "id" TEXT NOT NULL,
    "timerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "task" TEXT NOT NULL,
    "project" TEXT,
    "client" TEXT,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPaused" BOOLEAN NOT NULL DEFAULT false,
    "totalPausedTime" INTEGER NOT NULL DEFAULT 0,
    "pauseTime" TIMESTAMP(3),
    "duration" INTEGER NOT NULL DEFAULT 0,
    "note" VARCHAR(200),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "timer_history_pkey" PRIMARY KEY ("id")
);
