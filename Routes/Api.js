import express from 'express';
import { authRouter } from './Auth/AuthRoute.js';
import { OrgRoute } from './Organization/Organization.js';
import { TimerRoute } from './Timer/index.js';

export const apiRouter = express.Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", OrgRoute);
apiRouter.use("/timers", TimerRoute);