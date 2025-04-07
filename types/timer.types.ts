// types/timer.types.ts
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { Timer } from '@prisma/client'; // Import Prisma's generated Timer type

// --- Custom Request Interface to include 'user' property ---
// Assuming authMiddleware adds a user object to the request
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string; // Assuming user ID is a string initially from the token payload
    // Add other user properties if available/needed from the token
  };
}

// --- Request Body Interfaces ---

export interface StartTimerBody {
  task: string;
  project?: string; // Optional
  client?: string;  // Optional
}

// --- Request Params Interfaces ---

export interface StopTimerParams extends ParsedQs {
  timerId: string; // Params are always strings initially
}

// --- Request Query Interfaces ---

export interface GetUserTimersQuery extends ParsedQs {
  page?: string; // Queries are strings initially
  limit?: string;
}

// --- Typed Express Request Interfaces ---
// Using AuthenticatedRequest as the base

export type StartTimerRequest = AuthenticatedRequest & {
    body: StartTimerBody;
};

export type StopTimerRequest = AuthenticatedRequest & {
    params: StopTimerParams;
};

export type GetActiveTimerRequest = AuthenticatedRequest; // No specific body, params, or query needed beyond auth

export type GetUserTimersRequest = AuthenticatedRequest & {
    query: GetUserTimersQuery;
};

// --- Generic Response Type ---
// Define more specific response types if needed (e.g., for success/error structures)
export type TimerResponse = Response<any>;

// --- WebSocket Service Type (Placeholder) ---
// Define the type for broadcastToUser if its signature is known
// Example: type BroadcastFunction = (userId: string, event: string, payload: any) => void;
// For now, use 'any' for payload, refine if possible
export type BroadcastFunction = (userId: string, event: string, payload: any) => void;
