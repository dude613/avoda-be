import express, { Router } from 'express';
import {
  createProject,
  getProject,
  getAllProjects,
  updateProject,
  deleteProject,
  getAssignedProjects
} from '../../Controller/Project/Project.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hasProjectPermission, hasPermission } from '../../middleware/permissionMiddleware.js';

const router = express.Router();

// Project routes
router.post('/', authenticate, hasPermission('CREATE_PROJECT'), asyncHandler(createProject));
router.get('/:id', authenticate, hasProjectPermission('READ_PROJECT'), asyncHandler(getProject));
router.get('/', authenticate, hasPermission('READ_PROJECT'), asyncHandler(getAllProjects));
router.put('/:id', authenticate, hasProjectPermission('UPDATE_PROJECT'), asyncHandler(updateProject));
router.delete('/:id', authenticate, hasProjectPermission('DELETE_PROJECT'), asyncHandler(deleteProject));
router.get('/assigned', authenticate, hasPermission('READ_PROJECT'), asyncHandler(getAssignedProjects));

export const projectRoutes: Router = router;