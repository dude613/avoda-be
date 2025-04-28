import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * Sleep for a given number of milliseconds.
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Continuously attempts to connect to the PostgreSQL database using Prisma.
 * Retries every 60 seconds until successful.
 */
export async function ConnectDatabase(): Promise<void> {
  const RETRY_DELAY_MS = 60_000; // 60 seconds
  while (true) {
    try {
      await prisma.$connect();
      console.log("Connected to PostgreSQL database using Prisma");
      break;
    } catch (error: unknown) {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] Error connecting to PostgreSQL:`, error instanceof Error ? error.message : String(error));
      console.log(`Retrying in ${RETRY_DELAY_MS / 1000} seconds...`);
      await sleep(RETRY_DELAY_MS);
    }
  }
}


// Export the Prisma client instance for use in other modules
export { prisma };
