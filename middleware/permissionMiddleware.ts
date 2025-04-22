import { Request, Response, NextFunction } from "express";
import { prisma } from "../Components/ConnectDatabase.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { TeamMemberRole } from "@prisma/client";

// Middleware to check if a user has a specific permission
export const hasPermission = (permissionName: string) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Admin always has all permissions
      if (userRole === 'admin') {
        return next();
      }
      
      // Get the team member record for this user
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
      });
      
      if (!teamMember) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: You are not a member of any organization" 
        });
      }
      
      // Get the permission
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });
      
      if (!permission) {
        return res.status(500).json({ 
          success: false, 
          message: `Permission not defined in system: ${permissionName}` 
        });
      }
      
      // Check if the user's role has the required permission
      const hasRequiredPermission = permission.roles.includes(teamMember.role);
      
      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `Unauthorized: Your role (${teamMember.role}) doesn't have the ${permissionName} permission` 
        });
      }
      
      // User has the required permission
      next();
    } catch (error: any) {
      console.error(`Error checking permission ${permissionName}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking permissions",
        error: error.message,
      });
    }
  });
};

// Special middleware for timer operations that also checks resource ownership
export const hasTimerPermission = (permissionName: string) => {
  return asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.id;
      const userRole = req.user?.role;
      
      if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized" });
      }
      
      // Admin always has all permissions
      if (userRole === 'admin') {
        return next();
      }
      
      // Get the team member record for this user
      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
      });
      
      if (!teamMember) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: You are not a member of any organization" 
        });
      }
      
      // Get the permission
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      });

      if (!permission) {
        return res.status(500).json({ 
          success: false, 
          message: `Permission not defined in system: ${permissionName}` 
        });
      }
      
      // Check if the user's role has the required permission
      const hasRequiredPermission = permission.roles.includes(teamMember.role);
      
      if (!hasRequiredPermission) {
        return res.status(403).json({ 
          success: false, 
          message: `Unauthorized: Your role (${teamMember.role}) doesn't have the ${permissionName} permission` 
        });
      }
      
      // For timer operations, also check if the user owns the timer or has permission for the associated task
      if (req.params.timerId) {
        const { timerId } = req.params;
        
        // Check if the timer exists and get its details
        const timer = await prisma.timer.findUnique({
          where: { id: timerId },
        });
        
        if (!timer) {
          return res.status(404).json({ success: false, message: "Timer not found" });
        }
        
        // If it's the user's own timer, they can always modify it regardless of permissions
        if (timer.userId === userId) {
          return next();
        }
        
        // If it's not their timer, they need the specific permission to modify others' timers
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to ${permissionName.toLowerCase()} other users' timers` 
          });
        }
      }
      
      // User has the required permission
      next();
    } catch (error: any) {
      console.error(`Error checking timer permission ${permissionName}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking permissions",
        error: error.message,
      });
    }
  });
};