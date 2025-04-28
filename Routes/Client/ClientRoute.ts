import express from 'express';
import { 
  createClient, 
  updateClient, 
  deleteClient, 
  getAllClients, 
  archiveClient, 
  unarchiveClient, 
  getArchivedClients, 
  getClient,
  assignEmployeesToClient,
  getAssignedClients,
  getClientEmployees
} from '../../Controller/Client/ClientController.js';
import { authenticate } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { hasClientPermission, hasPermission } from '../../middleware/permissionMiddleware.js';

const router = express.Router();

// Client routes
router.post('/', authenticate, hasPermission('CREATE_CLIENT'), asyncHandler(createClient));
router.put('/:id', authenticate, hasClientPermission('UPDATE_CLIENT'), asyncHandler(updateClient));
router.delete('/:id', authenticate, hasClientPermission('DELETE_CLIENT'), asyncHandler(deleteClient));
router.get('/', authenticate, hasPermission('READ_CLIENT'), asyncHandler(getAllClients));
router.get('/client/:id', authenticate, hasClientPermission('READ_CLIENT'), asyncHandler(getClient));
router.put('/:id/archive', authenticate, hasClientPermission('UPDATE_CLIENT'), asyncHandler(archiveClient));
router.put('/:id/unarchive', authenticate, hasClientPermission('UPDATE_CLIENT'), asyncHandler(unarchiveClient));
router.get('/archived', authenticate, hasPermission('READ_CLIENT'), asyncHandler(getArchivedClients));

// New routes for client assignments
router.post('/employees/:clientId', authenticate, hasPermission('UPDATE_TEAM_MEMBER'), asyncHandler(assignEmployeesToClient));
router.get('/employees/:clientId', authenticate, hasClientPermission('READ_CLIENT'), asyncHandler(getClientEmployees));
router.get('/assigned', authenticate, hasPermission('READ_CLIENT'), asyncHandler(getAssignedClients));

export default router;
