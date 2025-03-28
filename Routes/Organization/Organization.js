import express from 'express';
import { CreateOrganization, GetOrganization, SkipOrganization } from '../../Controller/Organization/CreateOrganization.js';
import { verifyAccessToken } from '../../Components/VerifyAccessToken.js';
import { AddTeamMember, DeleteUser, GetAllTeamMember } from '../../Controller/Organization/AddTeamMember.js';

export const OrgRoute = express.Router();

OrgRoute.post("/create-Organization", verifyAccessToken, CreateOrganization);
OrgRoute.post("/skip-organization", verifyAccessToken, SkipOrganization);
OrgRoute.get("/organization-list/:userId", verifyAccessToken, GetOrganization)
OrgRoute.post("/add-teammeber", verifyAccessToken, AddTeamMember)
OrgRoute.get("/list-teammeber/:userId", verifyAccessToken, GetAllTeamMember);
OrgRoute.post("/user-archived",verifyAccessToken , DeleteUser)

