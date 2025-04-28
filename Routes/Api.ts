import express, { Router } from 'express';
// Import routers - Add .js extension for NodeNext compatibility
import { authRouter } from './Auth/AuthRoute.js';
import { OrgRoute } from './Organization/Organization.js';
import { timerRoutes } from './Timer/index.js';
import clientRoutes from './Client/ClientRoute.js';
import { permissionRoutes } from './Permissions/permissions.js';
import { projectRoutes } from './Project/Project.js';
import { taskRoutes } from './Task/task.js';

export const apiRouter: Router = express.Router();

// Mount the specific routers
apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", OrgRoute); // Consider renaming "/admin" if OrgRoute handles more general organization features
apiRouter.use("/timers", timerRoutes);
apiRouter.use("/clients", clientRoutes);
apiRouter.use("/permissions", permissionRoutes);
apiRouter.use('/projects', projectRoutes);
apiRouter.use('/tasks', taskRoutes);
