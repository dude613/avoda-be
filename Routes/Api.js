import express from 'express';
import { authRouter } from './Auth/AuthRoute.js';

export const apiRouter = express.Router();

apiRouter.use("/auth",authRouter)