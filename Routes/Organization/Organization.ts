import express, { Router } from 'express';
// Import controller functions - Add .js extension for NodeNext compatibility
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
// Import JS middleware - Keep .js extension
import { verifyAccessToken } from '../../Components/VerifyAccessToken.js'; // Keep .js extension

export const OrgRoute: Router = express.Router();

// Assuming verifyAccessToken is compatible Express middleware
// Assuming Controller functions are compatible Express route handlers

OrgRoute.post("/create-organization", verifyAccessToken, CreateOrganization);
OrgRoute.post("/skip-organization", verifyAccessToken, SkipOrganization);
OrgRoute.get("/organization-list/:userId", verifyAccessToken, GetOrganization);
OrgRoute.post("/add-teammember", verifyAccessToken, AddTeamMember);
OrgRoute.get("/list-teammember/:userId", verifyAccessToken, GetAllTeamMember);
OrgRoute.post("/user-archived", verifyAccessToken, DeleteUser);
OrgRoute.put("/edit-teammember", verifyAccessToken, EditTeamMember);
