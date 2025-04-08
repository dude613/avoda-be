import express, { Router } from 'express';
// Import controller functions
import {
    CreateOrganization,
    GetOrganization,
    SkipOrganization
} from '../../Controller/Organization/CreateOrganization.js';
import {
    AddTeamMember,
    DeleteUser,
    GetAllTeamMember,
    EditTeamMember
} from '../../Controller/Organization/AddTeamMember.js';

// Import middleware
import { verifyAccessToken } from '../../Components/VerifyAccessToken.js';
import { asyncHandler } from '../../utils/asyncHandler.js';


export const OrgRoute: Router = express.Router();

// Wrap all async controller functions with asyncHandler
OrgRoute.post("/create-organization", verifyAccessToken, asyncHandler(CreateOrganization));
OrgRoute.post("/skip-organization", verifyAccessToken, asyncHandler(SkipOrganization));
OrgRoute.get("/organization-list/:userId", verifyAccessToken, asyncHandler(GetOrganization));
OrgRoute.post("/add-teammember", verifyAccessToken, asyncHandler(AddTeamMember));
OrgRoute.get("/list-teammember/:userId", verifyAccessToken, asyncHandler(GetAllTeamMember));
OrgRoute.post("/user-archived", verifyAccessToken, asyncHandler(DeleteUser));
OrgRoute.put("/edit-teammember", verifyAccessToken, asyncHandler(EditTeamMember));