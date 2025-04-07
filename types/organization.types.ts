// types/organization.types.ts
import { Request, Response } from 'express';
import { ParsedQs } from 'qs'; // You might need to run `pnpm install -D @types/qs`

// Define valid industry and size values using 'as const' for literal types
export const validIndustries = [
  "technology",
  "healthCare",
  "finance",
  "education",
  "retail",
  "manufacturing",
  "other",
] as const;

// Create a union type from the array values
export type Industry = typeof validIndustries[number]; // "technology" | "healthCare" | ...

export const validCompanySizes = [
    "startup (1-10 employees)",
    "small (11-50 employees)",
    "medium (51-200 employees)",
    "large (201-500 employees)",
] as const;

export type CompanySizeString = typeof validCompanySizes[number];

// Assuming Prisma schema uses these short names for the 'size' field (e.g., enum OrganizationSize { startup small medium large })
// Adjust this type if your Prisma schema uses different values or types
export type OrganizationSize = 'startup' | 'small' | 'medium' | 'large';

// Mapping from the descriptive string in the request to the Prisma schema value
export const sizeMapping: Record<CompanySizeString, OrganizationSize> = {
    "startup (1-10 employees)": "startup",
    "small (11-50 employees)": "small",
    "medium (51-200 employees)": "medium",
    "large (201-500 employees)": "large"
};


// --- Request Body Interfaces ---

export interface CreateOrganizationBody {
  userId: string; // Keep as string from req.body, parse to number in handler
  organizationName: string;
  industry?: Industry; // Optional, validation checks if provided
  companySize?: CompanySizeString; // Optional, validation checks if provided
}

export interface SkipOrganizationBody {
  OrgId: string; // Keep as string from req.body, parse to number in handler
}

export interface UpdateOrganizationBody {
  // userId: string; // userId from body seems unused in the original UpdateOrganization logic
  OrgId: string; // Keep as string from req.body, parse to number in handler
  name?: string; // Fields are optional for update
  industry?: Industry;
  size?: OrganizationSize; // Use the mapped OrganizationSize type expected by Prisma
}

// --- Request Params Interface ---

export interface GetOrganizationParams extends ParsedQs {
    userId: string; // Params are always strings initially, parse to number in handler
}

// --- Typed Express Request Interfaces ---
// Structure: Request<ParamsDictionary, ResponseBody, RequestBody, RequestQuery>

export type CreateOrganizationRequest = Request<Record<string, never>, any, CreateOrganizationBody, ParsedQs>;
export type SkipOrganizationRequest = Request<Record<string, never>, any, SkipOrganizationBody, ParsedQs>;
// Note: The original `validate` function is called within `UpdateOrganization`, but its checks
// (e.g., for organizationName, companySize) might not align perfectly with an update operation's
// typical optional fields. This might require refactoring the validation logic later.
// For now, we type UpdateOrganizationRequest based on its body structure.
export type UpdateOrganizationRequest = Request<Record<string, never>, any, UpdateOrganizationBody, ParsedQs>;
export type GetOrganizationRequest = Request<GetOrganizationParams, any, any, ParsedQs>;


// --- Generic Response Type ---
// Use a generic Response type or define specific success/error response body types if needed
export type OrganizationResponse = Response<any>;


// --- Type for the internal validate function ---
// Based on the original code, `validate` seems designed for creation.
// Using it directly in `UpdateOrganization` might lead to unexpected validation failures
// if required creation fields (like organizationName) aren't provided during an update.
// Consider refactoring `validate` or creating a separate validator for updates.
// We type it based on CreateOrganizationRequest for now.
export type ValidateFunction = (req: CreateOrganizationRequest, res: OrganizationResponse) => Promise<boolean | void>;


// --- Team Member Types ---

// Assuming Prisma generates TeamMember type. If not, define properties manually.
// import { TeamMember as PrismaTeamMember } from '@prisma/client'; // If using Prisma generated types

// Define valid roles
export const validTeamMemberRoles = ["employee", "manager", "admin"] as const;
export type TeamMemberRole = typeof validTeamMemberRoles[number];

// Input structure for adding a single member in the AddTeamMember request
export interface AddMemberInput {
    name: string;
    email: string;
    role: TeamMemberRole; // Use the defined role type
    orgId: string; // Keep as string from req.body, parse to number in handler
}

// Input structure for editing a single member in the EditTeamMember request
export interface EditMemberInput {
    id: string; // ID of the team member to edit
    name: string;
    email: string;
    role: TeamMemberRole;
    orgId: string; // Org ID for verification
}

// Structure for the data sent to SendInvitation
export interface ResetLinkInfo {
    orgName: string;
    name: string;
    email: string;
    role: TeamMemberRole;
    resetLink: string;
}

// Return type for the internal validation function
export interface ValidationResult {
    success: boolean;
    error?: string; // Optional error message
}


// --- Request Body Interfaces (Team Member) ---

export interface AddTeamMemberBody {
    members: AddMemberInput[];
}

export interface DeleteUserBody {
    userId: string; // ID of the team member to archive
}

export interface EditTeamMemberBody {
    members: EditMemberInput; // Assuming the body structure is { members: { ...details... } }
                               // If it's just { ...details... }, adjust accordingly.
                               // Based on the JS code `const { members } = req.body; const { id, ... } = members;`
                               // it seems the structure is indeed { members: { ... } }
}

// --- Request Params Interface (Team Member) ---

export interface GetAllTeamMemberParams extends ParsedQs {
    userId: string; // User ID of the organization owner/admin to fetch members for
}


// --- Typed Express Request Interfaces (Team Member) ---

export type AddTeamMemberRequest = Request<Record<string, never>, any, AddTeamMemberBody, ParsedQs>;
export type GetAllTeamMemberRequest = Request<GetAllTeamMemberParams, any, any, ParsedQs>;
export type DeleteUserRequest = Request<Record<string, never>, any, DeleteUserBody, ParsedQs>;
export type EditTeamMemberRequest = Request<Record<string, never>, any, EditTeamMemberBody, ParsedQs>;


// --- Type for internal team member validation function ---
export type ValidateMembersFunction = (members: AddMemberInput[]) => ValidationResult;
