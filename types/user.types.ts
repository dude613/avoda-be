// types/user.types.ts
import { Request, Response } from 'express';
import { ParsedQs } from 'qs';
import { User as PrismaUser } from '@prisma/client'; // Import Prisma's generated User type

// --- Reusable Base Request/Response ---
// Using AuthenticatedRequest from timer.types.ts might be better if these routes are protected
// For now, defining a basic request/response structure.
export type UserRequest = Request<any, any, any, ParsedQs>; // Generic base
export type UserResponse = Response<any>; // Generic base

// --- Request Body Interfaces ---

export interface ForgotPasswordMailBody {
    email: string;
}

export interface SetNewPasswordBody {
    email: string;
    password: string;
}

// --- Typed Express Request Interfaces ---

export type ForgotPasswordMailRequest = Request<Record<string, never>, any, ForgotPasswordMailBody, ParsedQs>;
export type SetNewPasswordRequest = Request<Record<string, never>, any, SetNewPasswordBody, ParsedQs>;

// --- Type for internal validation function (example) ---
// Not strictly needed as it's not exported, but good for illustration
export type ValidateEmailFunction = (req: ForgotPasswordMailRequest, res: UserResponse) => boolean | void;

// --- Login Types ---

export interface LoginBody {
    email: string;
    password: string;
}

export interface LoginWithGoogleBody {
    idToken: string;
}

// Define the structure of the user object returned in the login response
export interface LoginResponseUser {
    id: string;
    email: string;
    name: string | null; // Assuming name can be null
    picture: string | null; // Assuming picture can be null
    role: string | null; // Assuming role can be null
}

// Define the structure of the successful login response body
export interface LoginSuccessResponse {
    success: true;
    message: string;
    user: LoginResponseUser;
    onboardingSkipped?: boolean; // Optional, only for standard login
    accessToken: string;
    // refreshToken is generated but not sent back in the original code
}

// Define the structure of the Google OAuth payload (adjust based on actual data)
export interface GooglePayload {
    id: string; // Typically 'sub'
    email: string;
    name?: string;
    picture?: string;
    // Add other fields if needed (e.g., email_verified)
}


// --- Typed Express Request Interfaces (Login) ---

export type LoginRequest = Request<Record<string, never>, any, LoginBody, ParsedQs>;
export type LoginWithGoogleRequest = Request<Record<string, never>, any, LoginWithGoogleBody, ParsedQs>;

// --- Type for internal login validation function ---
export type ValidateLoginFunction = (req: LoginRequest, res: UserResponse) => boolean | void;


// --- Logout Types ---

export interface LogoutBody {
    userId: string; // Assuming userId comes as string in body, parse to number
}

export type LogoutRequest = Request<Record<string, never>, any, LogoutBody, ParsedQs>;


// --- Registration Types ---

// Define valid roles (consider moving to a shared location if used elsewhere)
export const validUserRoles = ['user', 'admin', 'employee', 'manager'] as const;
export type UserRole = typeof validUserRoles[number];

export interface RegisterBody {
    email: string;
    password: string;
    role: UserRole;
    userName?: string; // Optional in body, derived from email if missing
}

export interface RegisterWithGoogleBody {
    idToken: string;
    role: UserRole; // Role is required for Google registration in the original code
}

// Define the structure of the successful Google registration response data
export interface RegisterWithGoogleSuccessData {
    user: {
        id: string;
        email: string;
        userName: string | null;
        picture: string | null;
        verified: boolean;
        role: string | null;
    };
    accessToken: string;
    refreshToken: string; // Included in original response
}

// --- Reset Password Types (from Register.js) ---
// Note: This function seems misplaced, might belong with ForgotPassword logic.
export interface ResetPasswordBody {
    email: string;
    password: string;
}


// --- Typed Express Request Interfaces (Registration & Reset) ---

export type RegisterRequest = Request<Record<string, never>, any, RegisterBody, ParsedQs>;
export type RegisterWithGoogleRequest = Request<Record<string, never>, any, RegisterWithGoogleBody, ParsedQs>;
export type ResetPasswordRequest = Request<Record<string, never>, any, ResetPasswordBody, ParsedQs>; // For the misplaced function


// --- Type for internal registration validation function ---
export type ValidateRegisterFunction = (req: RegisterRequest, res: UserResponse) => boolean | void; // Only handles RegisterRequest now


// --- Type for SendOTPInMail ---
// Using 'any' for now as the exact return type from SendOTPInMail (combining Resend and custom errors) is complex.
export type SendOtpFunction = (otp: string, email: string, userId: string) => Promise<any>;


// --- User Profile Types ---

// Params for GetProfileData and GetAllUsers should extend ParamsDictionary
import { ParamsDictionary } from 'express-serve-static-core';
export interface GetUserProfileParams extends ParamsDictionary {
    userId: string; // Params are always strings initially
}

// Body for UpdateProfileData
export interface UpdateProfileDataBody {
    userId: string; // Assuming ID comes as string, parse to number
    name?: string; // Optional fields for update
    email?: string;
    role?: UserRole; // Use the existing UserRole type
}

// Body for UpdateProfilePicture
export interface UpdateProfilePictureBody {
    userId: string; // Assuming ID comes as string, parse to number
}

// Define a structure for the uploaded file (from multer)
// This might need adjustment based on your specific multer setup
export interface UploadedFile {
    fieldname: string;
    originalname: string;
    encoding: string;
    mimetype: string;
    destination: string;
    filename: string;
    path: string;
    size: number;
}

// Import Multer file type via Express namespace (if needed within this file, otherwise controller handles it)
// import { Express } from 'express';
// type MulterFile = Express.Multer.File;

// --- Typed Express Request Interfaces (Profile) ---
// Rely on global augmentation from @types/multer for req.file and req.files

export type GetProfileDataRequest = Request<GetUserProfileParams, any, any, ParsedQs>;
export type UpdateProfileDataRequest = Request<Record<string, never>, any, UpdateProfileDataBody, ParsedQs>;
// Base Request + specific body. Controller will handle req.files using augmented type.
export type UpdateProfilePictureRequest = Request<Record<string, never>, any, UpdateProfilePictureBody, ParsedQs>;
export type GetAllUsersRequest = Request<GetUserProfileParams, any, any, ParsedQs>;


// --- Type for internal profile validation function ---
// This validation seems intended for UpdateProfileData
export type ValidateProfileUpdateFunction = (req: UpdateProfileDataRequest, res: UserResponse) => boolean | void;


// --- Verify OTP Types ---

export interface VerifyOtpBody {
    email: string;
    otp: string; // OTP comes as string from body
}

export interface ResendOtpBody {
    email: string;
}

// Define structure for successful OTP verification response
export interface VerifyOtpSuccessResponse {
    success: true;
    message: string;
    user: { // Define the user subset returned
        id: string;
        email: string;
        verified: boolean; // Should be true after verification
        role: string | null;
    };
    accessToken: string;
    // refreshToken is generated but not sent back
}


// --- Typed Express Request Interfaces (OTP) ---

export type VerifyOtpRequest = Request<Record<string, never>, any, VerifyOtpBody, ParsedQs>;
export type ResendOtpRequest = Request<Record<string, never>, any, ResendOtpBody, ParsedQs>;


// --- Types for Middleware (exported from VerifyOtp.js) ---
// Import types from express-rate-limit if installed, otherwise use 'any' or basic function type
// Run: pnpm install -D @types/express-rate-limit
import { RateLimitRequestHandler } from 'express-rate-limit';
import { RequestHandler } from 'express'; // Base Express middleware type

export type VerifyOtpLimiter = RateLimitRequestHandler;
export type ResendOtpLimiter = RateLimitRequestHandler;
export type ValidateOtpInputMiddleware = RequestHandler; // Basic middleware type
export type ValidateEmailInputMiddleware = RequestHandler; // Basic middleware type


// --- Potentially add types for other User controller functions later ---
