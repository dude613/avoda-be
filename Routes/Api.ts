import express, { Router } from 'express';
// Import routers - Add .js extension for NodeNext compatibility
import { authRouter } from './Auth/AuthRoute.js';
import { OrgRoute } from './Organization/Organization.js';
import { timerRoutes } from './Timer/index.js';
import clientRoutes from './Client/ClientRoute.js';

export const apiRouter: Router = express.Router();

// Mount the specific routers
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", OrgRoute); // Consider renaming "/admin" if OrgRoute handles more general organization features
apiRouter.use("/timers", timerRoutes);
apiRouter.use("/clients", clientRoutes);
