import { Request, Response, NextFunction } from "express";
import { prisma } from "../../Components/ConnectDatabase.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TeamMemberRole } from "@prisma/client";

// Get all permissions
const getPermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const permissions = await prisma.permission.findMany({
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      permissions,
    });
  } catch (error: any) {
    console.error("Error getting permissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get permissions",
      error: error.message,
    });
  }
});

// Get permissions for a role
const getRolePermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { role } = req.params;

    // Validate role
    if (!role || !Object.values(TeamMemberRole).includes(role as TeamMemberRole)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role: ${role}. Must be one of: ${Object.values(TeamMemberRole).join(', ')}` 
      });
    }

    // Get all permissions for this role
    const permissions = await prisma.permission.findMany({
      where: {
        roles: {
          has: role as TeamMemberRole,
        },
      },
      orderBy: { name: 'asc' }
    });

    return res.status(200).json({
      success: true,
      role,
      permissions,
    });
  } catch (error: any) {
    console.error("Error getting role permissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get role permissions",
      error: error.message,
    });
  }
});

// Set permissions for a role
const setRolePermissions = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = req.user?.id;
    if (!adminId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Verify the user is an admin
    const admin = await prisma.user.findUnique({
      where: { id: adminId },
    });

    if (!admin || admin.role !== "admin") {
      return res.status(403).json({ success: false, message: "Unauthorized: Admin role required" });
    }

    const { role, permissionNames } = req.body;

    // Validate role
    if (!role || !Object.values(TeamMemberRole).includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: `Invalid role: ${role}. Must be one of: ${Object.values(TeamMemberRole).join(', ')}` 
      });
    }

    if (!permissionNames || !Array.isArray(permissionNames)) {
      return res.status(400).json({ success: false, message: "Permission names array is required" });
    }

    // Get all permissions
    const allPermissions = await prisma.permission.findMany();
    
    // Validate permission names
    for (const name of permissionNames) {
      if (!allPermissions.some(p => p.name === name)) {
        return res.status(400).json({ success: false, message: `Permission not found: ${name}` });
      }
    }

    // Update permissions to include this role
    const updates = await Promise.all(
      allPermissions.map(permission => {
        const shouldHaveRole = permissionNames.includes(permission.name);
        const hasRole = permission.roles.includes(role as TeamMemberRole);
        
        // If the permission should have the role but doesn't, add it
        if (shouldHaveRole && !hasRole) {
          return prisma.permission.update({
            where: { id: permission.id },
            data: {
              roles: [...permission.roles, role],
            },
          });
        }
        
        // If the permission shouldn't have the role but does, remove it
        if (!shouldHaveRole && hasRole) {
          return prisma.permission.update({
            where: { id: permission.id },
            data: {
              roles: permission.roles.filter(r => r !== role),
            },
          });
        }
        
        // Otherwise, no change needed
        return permission;
      })
    );

    return res.status(200).json({
      success: true,
      message: `Permissions updated for role: ${role}`,
      updatedCount: updates.length,
    });
  } catch (error: any) {
    console.error("Error setting role permissions:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to set role permissions",
      error: error.message,
    });
  }
});

// Get permissions grouped by category
// const getPermissionsByCategory = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) {
//       return res.status(401).json({ success: false, message: "Unauthorized" });
//     }

//     const permissions = await prisma.permission.findMany({
//       orderBy: { name: 'asc' }
//     });

//     // Group permissions by category based on their name prefix
//     const categories: Record<string, any[]> = {};
    
//     permissions.forEach(permission => {
//       const category = permission.name.split('_')[0];
//       if (!categories[category]) {
//         categories[category] = [];
//       }
//       categories[category].push(permission);
//     });

//     return res.status(200).json({
//       success: true,
//       categories,
//     });
//   } catch (error: any) {
//     console.error("Error getting permissions by category:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Failed to get permissions by category",
//       error: error.message,
//     });
//   }
// });

export {
  getPermissions,
  getRolePermissions,
  setRolePermissions,
  // getPermissionsByCategory,
};