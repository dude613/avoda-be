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

// Middleware to check client-related permissions
export const hasClientPermission = (permissionName: string) => {
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
      
      // For client operations, check if the user is assigned to the client or has permission to manage others' clients
      if (req.params.id && permissionName !== 'CREATE_CLIENT') {
        const { id } = req.params;
        
        // Check if the client exists
        const client = await prisma.client.findUnique({
          where: { id },
          include: {
            ClientAssignment: {
              where: { userId }
            }
          }
        });
        
        if (!client) {
          return res.status(404).json({ success: false, message: "Client not found" });
        }
        
        // If the user is assigned to this client, they can access it
        if (client.ClientAssignment.length > 0) {
          return next();
        }
        
        // If not assigned, they need the specific permission to manage others' clients
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to ${permissionName.toLowerCase()} other clients` 
          });
        }
      }
      
      // User has the required permission
      next();
    } catch (error: any) {
      console.error(`Error checking client permission ${permissionName}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking permissions",
        error: error.message,
      });
    }
  });
};

// Middleware to check project-related permissions
export const hasProjectPermission = (permissionName: string) => {
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
      
      // For project operations, check if the user is assigned to the client or has permission to manage others' projects
      if (req.params.id && permissionName !== 'CREATE_PROJECT') {
        const { id } = req.params;
        
        // Check if the project exists
        const project = await prisma.project.findUnique({
          where: { id },
          include: {
            client: {
              include: {
                ClientAssignment: {
                  where: { userId }
                }
              }
            }
          }
        });
        
        if (!project) {
          return res.status(404).json({ success: false, message: "Project not found" });
        }
        
        // If the user is assigned to this client, they can access its projects
        if (project.client.ClientAssignment.length > 0) {
          return next();
        }
        
        // If not assigned, they need the specific permission to manage others' projects
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to ${permissionName.toLowerCase()} other projects` 
          });
        }
      }
      
      // For creating a project, check if the user is assigned to the client
      if (permissionName === 'CREATE_PROJECT' && req.body.clientId) {
        const { clientId } = req.body;
        
        // Check if the client exists
        const client = await prisma.client.findUnique({
          where: { id: clientId },
          include: {
            ClientAssignment: {
              where: { userId }
            }
          }
        });
        
        if (!client) {
          return res.status(404).json({ success: false, message: "Client not found" });
        }
        
        // If the user is assigned to this client, they can create projects for it
        if (client.ClientAssignment.length > 0) {
          return next();
        }
        
        // If not assigned, they need the specific permission to create projects for others' clients
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to create projects for other clients` 
          });
        }
      }
      
      // User has the required permission
      next();
    } catch (error: any) {
      console.error(`Error checking project permission ${permissionName}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking permissions",
        error: error.message,
      });
    }
  });
};

// Middleware to check task-related permissions
export const hasTaskPermission = (permissionName: string) => {
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
      
      // For task operations, check if the user is assigned to the client or has permission to manage others' tasks
      if (req.params.id && permissionName !== 'CREATE_TASK') {
        const { id } = req.params;
        
        // Check if the task exists
        const task = await prisma.task.findUnique({
          where: { id },
          include: {
            project: {
              include: {
                client: {
                  include: {
                    ClientAssignment: {
                      where: { userId }
                    }
                  }
                }
              }
            }
          }
        });
        
        if (!task) {
          return res.status(404).json({ success: false, message: "Task not found" });
        }
        
        // If the user is assigned to this client, they can access its tasks
        if (task.project.client.ClientAssignment.length > 0) {
          return next();
        }
        
        // If the user is assigned to this task, they can access it
        if (task.assignedTo === userId) {
          return next();
        }
        
        // If not assigned, they need the specific permission to manage others' tasks
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to ${permissionName.toLowerCase()} other tasks` 
          });
        }
      }
      
      // For creating a task, check if the user is assigned to the client
      if (permissionName === 'CREATE_TASK' && req.body.projectId) {
        const { projectId } = req.body;
        
        // Check if the project exists
        const project = await prisma.project.findUnique({
          where: { id: projectId },
          include: {
            client: {
              include: {
                ClientAssignment: {
                  where: { userId }
                }
              }
            }
          }
        });
        
        if (!project) {
          return res.status(404).json({ success: false, message: "Project not found" });
        }
        
        // If the user is assigned to this client, they can create tasks for its projects
        if (project.client.ClientAssignment.length > 0) {
          return next();
        }
        
        // If not assigned, they need the specific permission to create tasks for others' projects
        const otherPermission = await prisma.permission.findUnique({
          where: { name: `${permissionName}_OTHERS` },
        });
        
        if (!otherPermission || !otherPermission.roles.includes(teamMember.role)) {
          return res.status(403).json({ 
            success: false, 
            message: `Unauthorized: Your role (${teamMember.role}) doesn't have permission to create tasks for other projects` 
          });
        }
      }
      
      // User has the required permission
      next();
    } catch (error: any) {
      console.error(`Error checking task permission ${permissionName}:`, error);
      return res.status(500).json({
        success: false,
        message: "An error occurred while checking permissions",
        error: error.message,
      });
    }
  });
};