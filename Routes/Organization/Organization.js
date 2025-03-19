import express from 'express';
import { CreateOrganization, GetOrganization } from '../../Controller/Organization/CreateOrganization.js';
import { verifyAccessToken } from '../../Components/VerfiyAccessToken.js';
import { AddTeamMember } from '../../Controller/Organization/AddTeamMember.js';

export const OrgRoute = express.Router();

OrgRoute.post("/create-Organization", verifyAccessToken, CreateOrganization);
OrgRoute.get("/organization-list/:userId", verifyAccessToken , GetOrganization)
OrgRoute.post("/add-teammeber",verifyAccessToken , AddTeamMember)