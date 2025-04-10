// types/timer.types.ts
import { Request, Response } from 'express';
import { ParamsDictionary } from 'express-serve-static-core'; // Import from correct package
import { ParsedQs } from 'qs';
import { Timer } from '@prisma/client'; // Import Prisma's generated Timer type

// --- Request Body Interfaces ---

export interface StartTimerBody {
  task: string;
  project?: string; // Optional
  client?: string;  // Optional
  isPaused?: boolean; // Optional
  pauseTime?: Date; // Optional
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
// Using Express generics: Request<P = core.ParamsDictionary, ResBody = any, ReqBody = any, ReqQuery = qs.ParsedQs, Locals extends Record<string, any> = Record<string, any>>
// Relying on global augmentation for req.user

// Request with specific Body
export interface StartTimerRequest extends Request<ParamsDictionary, any, StartTimerBody> {}

// Request with specific Params
export interface StopTimerRequest extends Request<StopTimerParams> {}

// Base Request is sufficient if only req.user is needed and no specific params/body/query
export type GetActiveTimerRequest = Request;

// Request with specific Query
export interface GetUserTimersRequest extends Request<ParamsDictionary, any, any, GetUserTimersQuery> {}

// --- Generic Response Type ---
// Define more specific response types if needed (e.g., for success/error structures)
export type TimerResponse = Response<any>;

// --- WebSocket Service Type (Placeholder) ---
// Define the type for broadcastToUser if its signature is known
// Example: type BroadcastFunction = (userId: string, event: string, payload: any) => void;
// For now, use 'any' for payload, refine if possible
export type BroadcastFunction = (userId: string, event: string, payload: any) => void;
