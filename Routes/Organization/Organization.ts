import express, { Router } from 'express';
// Import controller functions
import {
    CreateOrganization,
    GetOrganization,
    SkipOrganization
} from '../../Controller/Organization/CreateOrganization.js';
import {
    AddTeamMember,
    ArchiveTeamMember,
    GetAllTeamMember,
    EditTeamMember,
    DeleteTeamMemberPermanently,
    GetArchivedTeamMembers,
    UnarchiveTeamMember
} from '../../Controller/Organization/AddTeamMember.js';

// Import middleware
import { verifyAccessToken } from '../../Components/VerifyAccessToken.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { adminMiddleware } from '../../middleware/adminMiddleware.js';


export const OrgRoute: Router = express.Router();

// Wrap all async controller functions with asyncHandler
OrgRoute.post("/create-organization", verifyAccessToken, asyncHandler(CreateOrganization));
OrgRoute.post("/skip-organization", verifyAccessToken, asyncHandler(SkipOrganization));
OrgRoute.get("/organization-list/:userId", verifyAccessToken, asyncHandler(GetOrganization));
OrgRoute.post("/add-teammember", verifyAccessToken, adminMiddleware, asyncHandler(AddTeamMember));
OrgRoute.get("/list-teammember/:userId", verifyAccessToken, adminMiddleware, asyncHandler(GetAllTeamMember));
OrgRoute.post("/user-archived/:organizationName", verifyAccessToken, adminMiddleware, asyncHandler(ArchiveTeamMember));
OrgRoute.put("/edit-teammember/:organizationName", verifyAccessToken, adminMiddleware, asyncHandler(EditTeamMember));
OrgRoute.delete("/delete-teammember/:userId/:organizationName", verifyAccessToken, adminMiddleware, asyncHandler(DeleteTeamMemberPermanently));
OrgRoute.get("/archived-teammembers/:userId", verifyAccessToken, adminMiddleware, asyncHandler(GetArchivedTeamMembers));
OrgRoute.put("/unarchive-teammember/:userId/:organizationName", verifyAccessToken, adminMiddleware, asyncHandler(UnarchiveTeamMember));
