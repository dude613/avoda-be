// types/express.d.ts
import { User as PrismaUser } from '@prisma/client';

// To make this file a module
export {};

declare global {
  namespace Express {
    export interface Request {
      // Add the user property based on your Prisma User model
      user?: PrismaUser;
    }

    // Augment Response to include Sentry event ID property
    export interface Response {
      sentry?: string;
    }
  }
}
