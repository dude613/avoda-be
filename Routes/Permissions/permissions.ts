import express, { Router } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { adminMiddleware } from "../../middleware/adminMiddleware.js";
import { getPermissions, getRolePermissions, setRolePermissions } from "../../Controller/Permissions/index.js";
import { hasPermission } from "../../middleware/permissionMiddleware.js";

const router: Router = express.Router();

router.get("/", authenticate, asyncHandler(getPermissions));
router.get("/role/:role", authenticate, asyncHandler(getRolePermissions));
router.post("/role", authenticate, adminMiddleware, hasPermission("MANAGE_PERMISSIONS"), asyncHandler(setRolePermissions));

export const permissionRoutes: Router = router;