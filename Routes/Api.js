import express from 'express';
import { authRouter } from './Auth/AuthRoute.js';
import { OrgRoute } from './Organization/Organization.js';

export const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", OrgRoute) 