import express, { Router } from 'express';
import {
  createTask,
  getTask,
  getAllTasks,
  updateTask,
  deleteTask,
  getAssignedTasks
} from '../../Controller/Task/Task.js';
import { hasPermission, hasTaskPermission } from '../../middleware/permissionMiddleware.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();

// Task routes
router.post('/', authenticate, hasPermission('CREATE_TASK'), asyncHandler(createTask));
router.get('/:id', authenticate, hasTaskPermission('READ_TASK'), asyncHandler(getTask));
router.get('/', authenticate, hasPermission('READ_TASK'), asyncHandler(getAllTasks));
router.put('/:id', authenticate, hasTaskPermission('UPDATE_TASK'), asyncHandler(updateTask));
router.delete('/:id', authenticate, hasTaskPermission('DELETE_TASK'), asyncHandler(deleteTask));
router.get('/assigned', authenticate, hasPermission('READ_TASK'), asyncHandler(getAssignedTasks));

export const taskRoutes: Router = router;