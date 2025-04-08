import { PrismaClient } from '@prisma/client';

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * Connects to the PostgreSQL database using Prisma.
 * Logs success or throws an error on failure.
 */
export async function ConnectDatabase(): Promise<void> {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL database using Prisma");
  } catch (error: unknown) { // Type the error
    // Log the specific error
    console.error("Error connecting to PostgreSQL:", error instanceof Error ? error.message : String(error));
    // Re-throw the error to be handled by the caller or crash the app if critical
    throw error;
  }
}

// Export the Prisma client instance for use in other modules
export { prisma };
