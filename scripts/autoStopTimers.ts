import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AUTO-STOP TIMERS SCRIPT
 * 
 * This script finds all active timers that have been running for longer than the MAX_HOURS limit
 * and stops them automatically. This ensures that users don't have timers running indefinitely
 * if they forget to clock out and close their browser.
 */

const MAX_HOURS = 12; // Default limit of 12 hours

async function autoStopTimers() {
  console.log(`[${new Date().toISOString()}] Starting auto-stop timers check...`);
  
  const limitDate = new Date();
  limitDate.setHours(limitDate.getHours() - MAX_HOURS);

  try {
    // Find active timers started before the limit date
    const overlimitTimers = await prisma.timer.findMany({
      where: {
        isActive: true,
        startTime: {
          lt: limitDate,
        },
      },
    });

    console.log(`Found ${overlimitTimers.length} timers running longer than ${MAX_HOURS} hours.`);

    for (const timer of overlimitTimers) {
      const endTime = new Date();
      
      // Calculate duration
      let totalPausedTime = timer.totalPausedTime || 0;
      if (timer.isPaused && timer.pauseTime) {
        const currentPauseDuration = Math.floor(
          (endTime.getTime() - timer.pauseTime.getTime()) / 1000
        );
        totalPausedTime += currentPauseDuration;
      }

      let duration = Math.floor(
        (endTime.getTime() - timer.startTime.getTime()) / 1000
      );
      duration = Math.max(0, duration - totalPausedTime);

      // Create history record
      await prisma.timerHistory.create({
        data: {
          timerId: timer.id,
          userId: timer.userId,
          task: timer.task,
          project: timer.project,
          client: timer.client,
          startTime: timer.startTime,
          endTime: endTime,
          isActive: false,
          isPaused: false,
          totalPausedTime: totalPausedTime,
          pauseTime: null,
          duration: duration,
          note: timer.note ? `${timer.note} (Auto-stopped)` : 'Auto-stopped due to hour limit',
          createdAt: new Date(),
        },
      });

      // Update timer to stopped
      await prisma.timer.update({
        where: { id: timer.id },
        data: {
          isActive: false,
          isPaused: false,
          pauseTime: null,
          totalPausedTime: totalPausedTime,
          endTime: endTime,
          duration: duration,
          note: timer.note ? `${timer.note} (Auto-stopped)` : 'Auto-stopped due to hour limit',
        },
      });

      console.log(`Stopped timer ${timer.id} for user ${timer.userId}`);
    }

    if (overlimitTimers.length > 0) {
      console.log(`Successfully auto-stopped ${overlimitTimers.length} timers.`);
    } else {
      console.log('No over-limit timers found.');
    }

  } catch (error) {
    console.error('Error during auto-stop timers process:', error);
  } finally {
    await prisma.$disconnect();
  }
}

autoStopTimers();
