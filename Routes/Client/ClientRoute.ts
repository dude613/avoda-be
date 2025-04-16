import express from 'express';
import { createClient, updateClient, deleteClient, getAllClients } from '../../Controller/Client/ClientController.js';
import { adminMiddleware } from '../../middleware/adminMiddleware.js';
import { authenticate as authMiddleware } from '../../middleware/authMiddleware.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

const router = express.Router();

router.post('/', authMiddleware, adminMiddleware, asyncHandler(createClient));
router.put('/:id', authMiddleware, adminMiddleware, asyncHandler(updateClient));
router.delete('/:id', authMiddleware, adminMiddleware, asyncHandler(deleteClient));
router.get('/', authMiddleware, asyncHandler(getAllClients));

export default router;
