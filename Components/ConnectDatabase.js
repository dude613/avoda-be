import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ConnectDatabase() {
  try {
    await prisma.$connect();
    console.log("Connected to PostgreSQL database using Prisma");
  } catch (error) {
    console.error("Error connecting to PostgreSQL:", error);
    throw error;
  }
}

export { prisma };
