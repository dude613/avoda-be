import express from 'express';
import { CreateOrganization, GetOrganization, SkipOrganization } from '../../Controller/Organization/CreateOrganization'; // Removed .js
import { verifyAccessToken } from '../../Components/VerifyAccessToken.js'; // Keep .js for JS imports
import { AddTeamMember, DeleteUser, GetAllTeamMember, EditTeamMember } from '../../Controller/Organization/AddTeamMember'; // Removed .js

export const OrgRoute = express.Router();

OrgRoute.post("/create-organization", verifyAccessToken, CreateOrganization);
OrgRoute.post("/skip-organization", verifyAccessToken, SkipOrganization);
OrgRoute.get("/organization-list/:userId", verifyAccessToken, GetOrganization)
OrgRoute.post("/add-teammember", verifyAccessToken, AddTeamMember)
OrgRoute.get("/list-teammember/:userId", verifyAccessToken, GetAllTeamMember);
OrgRoute.post("/user-archived", verifyAccessToken, DeleteUser)
OrgRoute.put("/edit-teammember", verifyAccessToken, EditTeamMember);
