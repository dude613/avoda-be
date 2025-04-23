import { prisma } from "../../Components/ConnectDatabase.js";
import { broadcastToUser } from "../../services/webSocketService.js";
import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { TeamMemberRole } from "@prisma/client";

// Extend Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        [key: string]: any;
      };
    }
  }
}

// Helper function to check if a user has a specific permission
const hasPermission = async (userId: string, permissionName: string): Promise<boolean> => {
  // Admin always has all permissions
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (user?.role === "admin") {
    return true;
  }

  // Get the team member record for this user
  const teamMember = await prisma.teamMember.findUnique({
    where: { userId },
  });

  if (!teamMember) {
    return false;
  }

  // Get the permission
  const permission = await prisma.permission.findUnique({
    where: { name: permissionName },
  });

  if (!permission) {
    return false;
  }

  // Check if the user's role has the required permission
  return permission.roles.includes(teamMember.role as TeamMemberRole);
};

// Helper function to check if a user can manage another user's timer
const canManageOthersTimer = async (userId: string, permissionName: string): Promise<boolean> => {
  const otherPermissionName = `${permissionName}_OTHERS`;
  return hasPermission(userId, otherPermissionName);
};

const startTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "Unauthorized" });
    }

    // Check if the user is archived
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (user?.isArchived) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You cannot start a timer. Please contact your admin",
      });
    }

    // Check if user has permission to create timers
    const canCreateTimer = await hasPermission(userId, "CREATE_TIMER");
    if (!canCreateTimer) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: You don't have permission to create timers"
      });
    }

    const { task, note } = req.body;
    if (!task) {
      return res
        .status(400)
        .json({ success: false, message: "task field is required" });
    }

    // Double-check for active timers
    const existingActiveTimer = await prisma.timer.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    if (existingActiveTimer) {
      return res.status(409).json({
        success: false,
        message:
          "You already have an active timer. Please stop the current timer before starting a new one.",
        activeTimer: existingActiveTimer,
      });
    }

    // Create a new timer
    const newTimer = await prisma.timer.create({
      data: {
        userId: userId,
        task,
        note,
        startTime: new Date(),
        isActive: true,
      },
    });

    // Notify client via WebSocket
    broadcastToUser(userId, "timer:started", newTimer);

    return res.status(201).json({
      success: true,
      message: "Timer started successfully",
      timer: newTimer,
    });
  } catch (error: any) {
    console.error("Error starting timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to start timer",
      error: error.message,
    });
  }
});

const stopTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;

    // Get the timer
    const timer = await prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "UPDATE_TIMER");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to stop other users' timers",
        });
      }
    } else {
      // Even for their own timer, check if they have update permission
      const canUpdateTimer = await hasPermission(userId, "UPDATE_TIMER");
      if (!canUpdateTimer) {
        return res.status(403).json({ 
          success: false, 
          message: "Unauthorized: You don't have permission to update timers" 
        });
      }
    }

    // Calculate duration and update timer
    const endTime = new Date();
    const duration = Math.floor(
      (endTime.getTime() - timer.startTime.getTime()) / 1000
    ); // Duration in seconds

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        client: timer.client,
        startTime: timer.startTime,
        endTime: timer.endTime,
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        totalPausedTime: timer.totalPausedTime,
        pauseTime: timer.pauseTime,
        duration: timer.duration,
        note: timer.note,
        createdAt: timer.createdAt,
      },
    });

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        endTime: endTime,
        isActive: false,
        duration: duration,
      },
    });

    // Notify client via WebSocket
    broadcastToUser(userId, "timer:stopped", updatedTimer);

    return res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error stopping timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to stop timer",
      error: error.message,
    });
  }
});

const getActiveTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to read timers
    const canReadTimer = await hasPermission(userId, "READ_TIMER");
    if (!canReadTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to view timers" 
      });
    }

    const activeTimer = await prisma.timer.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    return res.status(200).json({
      success: true,
      hasActiveTimer: !!activeTimer,
      timer: activeTimer,
    });
  } catch (error: any) {
    console.error("Error getting active timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to get active timer",
      error: error.message,
    });
  }
});

const getUserTimers = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to read timers
    const canReadTimer = await hasPermission(userId, "READ_TIMER");
    if (!canReadTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to view timers" 
      });
    }

    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      startDate,
      endDate,
    } = req.query;

    const parsedPage = parseInt(page as string);
    if (isNaN(parsedPage)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid page number" });
    }

    const parsedLimit = parseInt(limit as string);
    if (isNaN(parsedLimit)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid limit number" });
    }

    let where: any = {
      isActive: false,
    };

    // Check if user can view others' timers
    const canViewOthersTimers = await canManageOthersTimer(userId, "READ_TIMER");
    
    if (canViewOthersTimers) {
      // Get the organizations managed by the user
      const organizations = await prisma.organization.findMany({
        where: {
          userId: userId,
        },
      });

      // Get the team members for those organizations
      const teamMembers = await prisma.teamMember.findMany({
        where: {
          organizationId: {
            in: organizations.map((org) => org.id),
          },
        },
      });

      // Extract the user IDs of the team members
      const teamMemberIds = teamMembers.map((member) => member.userId);

      // Fetch timers for all team members
      where = {
        OR: [{ userId: userId }, { userId: { in: teamMemberIds } }],
        isActive: false,
      };
    } else {
      // Fetch only the user's own timers
      where = {
        userId: userId,
        isActive: false,
      };
    }

    if (startDate && endDate) {
      if (startDate === endDate) {
        const startOfDay = new Date(startDate as string);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(startDate as string);
        endOfDay.setHours(23, 59, 59, 999);
        where.startTime = {
          gte: startOfDay,
          lte: endOfDay,
        };
      } else {
        where.startTime = {
          gte: new Date(startDate as string),
          lte: new Date(endDate as string),
        };
      }
    } else if (startDate) {
      where.startTime = {
        gte: new Date(startDate as string),
      };
    } else if (endDate) {
      where.startTime = {
        lte: new Date(endDate as string),
      };
    }

    const orderBy: any = {};
    if (sortBy) {
      orderBy[sortBy as string] = sortOrder === "asc" ? "asc" : "desc";
    } else {
      orderBy.startTime = "desc";
    }

    const timers = await prisma.timer.findMany({
      where,
      orderBy: [orderBy],
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    });

    const count = await prisma.timer.count({
      where,
    });

    return res.status(200).json({
      success: true,
      timers,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (error: any) {
    console.error("Error fetching user timers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch timers",
      error: error.message,
    });
  }
});

const pauseTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to update timers
    const canUpdateTimer = await hasPermission(userId, "UPDATE_TIMER");
    if (!canUpdateTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to update timers" 
      });
    }

    const { timerId } = req.params;

    const timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        isActive: true,
        isPaused: false,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message:
          "No active timer found with the provided ID that is not already paused",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "UPDATE_TIMER");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to pause other users' timers",
        });
      }
    }

    const pauseTime = new Date();

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        isPaused: true,
        pauseTime: pauseTime,
      },
    });

    broadcastToUser(userId, "timer:paused", updatedTimer);

    return res.status(200).json({
      success: true,
      message: "Timer paused successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error pausing timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to pause timer",
      error: error.message,
    });
  }
});

const resumeTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to update timers
    const canUpdateTimer = await hasPermission(userId, "UPDATE_TIMER");
    if (!canUpdateTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to update timers" 
      });
    }

    const { timerId } = req.params;

    const timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        isActive: true,
        isPaused: true,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "No paused timer found with the provided ID",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "UPDATE_TIMER");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to resume other users' timers",
        });
      }
    }

    if (!timer.pauseTime) {
      return res.status(500).json({
        success: false,
        message: "Pause time is missing, cannot resume timer",
      });
    }

    const resumeTime = new Date();
    const pauseDuration = Math.floor(
      (resumeTime.getTime() - timer.pauseTime.getTime()) / 1000
    );

    // Calculate the total paused time (existing + current pause duration)
    const existingPausedTime =
      timer.totalPausedTime === null ? 0 : timer.totalPausedTime;
    const totalPausedTime = existingPausedTime + pauseDuration;

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        isPaused: false,
        pauseTime: null,
        totalPausedTime: totalPausedTime,
      },
    });

    broadcastToUser(userId, "timer:resumed", updatedTimer);

    return res.status(200).json({
      success: true,
      message: "Timer resumed successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error resuming timer:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred in resuming timer",
      error: error.message,
    });
  }
});

const updateTimerNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to update timers
    const canUpdateTimer = await hasPermission(userId, "UPDATE_TIMER");
    if (!canUpdateTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to update timers" 
      });
    }

    const { timerId } = req.params;
    const { note } = req.body;

    let timer = await prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "UPDATE_TIMER");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to update other users' timers",
        });
      }
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        client: timer.client,
        startTime: timer.startTime,
        endTime: timer.endTime,
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        totalPausedTime: timer.totalPausedTime,
        pauseTime: timer.pauseTime,
        duration: timer.duration,
        note: note,
        createdAt: timer.createdAt,
      },
    });

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        note: note,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timer note updated successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error updating timer note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update timer note",
      error: error.message,
    });
  }
});

const deleteTimerNote = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to delete timer notes
    const canDeleteTimerNote = await hasPermission(userId, "DELETE_TIMER_NOTE");
    if (!canDeleteTimerNote) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to delete timer notes" 
      });
    }

    const { timerId } = req.params;

    let timer = await prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "DELETE_TIMER_NOTE");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to delete other users' timer notes",
        });
      }
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        client: timer.client,
        startTime: timer.startTime,
        endTime: timer.endTime,
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        totalPausedTime: timer.totalPausedTime,
        pauseTime: timer.pauseTime,
        duration: timer.duration,
        note: timer.note,
        createdAt: timer.createdAt,
      },
    });

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        note: null,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timer note deleted successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error deleting timer note:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete timer note",
      error: error.message,
    });
  }
});

const editTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to update timers
    const canUpdateTimer = await hasPermission(userId, "UPDATE_TIMER");
    if (!canUpdateTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to update timers" 
      });
    }

    const { timerId } = req.params;
    const { task, client, project, note } = req.body;

    const timer = await prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Check if it's the user's own timer or if they have permission to update others' timers
    if (timer.userId !== userId) {
      const canUpdateOthers = await canManageOthersTimer(userId, "UPDATE_TIMER");
      if (!canUpdateOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to edit other users' timers",
        });
      }
    }

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        task,
        client,
        project,
        note,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timer updated successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error updating timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update timer",
      error: error.message,
    });
  }
});

const deleteTimer = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    // Check if user has permission to delete timers
    const canDeleteTimer = await hasPermission(userId, "DELETE_TIMER");
    if (!canDeleteTimer) {
      return res.status(403).json({ 
        success: false, 
        message: "Unauthorized: You don't have permission to delete timers" 
      });
    }

    const { timerId } = req.params;

    const timer = await prisma.timer.findUnique({
      where: { id: timerId },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Check if it's the user's own timer or if they have permission to delete others' timers
    if (timer.userId !== userId) {
      const canDeleteOthers = await canManageOthersTimer(userId, "DELETE_TIMER");
      if (!canDeleteOthers) {
        return res.status(403).json({
          success: false,
          message: "Unauthorized: You don't have permission to delete other users' timers",
        });
      }
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        client: timer.client || null,
        startTime: timer.startTime,
        endTime: timer.endTime || null,
        isActive: timer.isActive,
        isPaused: timer.isPaused,
        totalPausedTime: timer.totalPausedTime,
        pauseTime: timer.pauseTime,
        duration: timer.duration,
        note: timer.note,
        createdAt: timer.createdAt,
      },
    });

    await prisma.timer.delete({
      where: {
        id: timerId,
      },
    });

    return res.status(200).json({
      success: true,
      message: "Timer deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting timer:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete timer",
      error: error.message,
    });
  }
});

export {
  startTimer,
  stopTimer,
  getActiveTimer,
  getUserTimers,
  pauseTimer,
  resumeTimer,
  updateTimerNote,
  deleteTimerNote,
  editTimer,
  deleteTimer,
};
