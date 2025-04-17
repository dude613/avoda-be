import { prisma } from "../../Components/ConnectDatabase.js";
import { broadcastToUser } from "../../services/webSocketService.js";
import { Request, Response } from "express";

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

//Reusable function to check if the timer belongs to the user or to any of his team members
const isTimerOwnerOrTeamMember = async (
  timerId?: string,
  userId?: string,
  userRole?: string
) => {
  if (!userId || !userRole || !timerId) {
    return false;
  }

  if (userRole === "admin") {
    // Check if the timer belongs to a team member
    const organizations = await prisma.organization.findMany({
      where: {
        userId: userId,
      },
    });

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: {
          in: organizations.map((org) => org.id),
        },
      },
    });

    const teamMemberIds = teamMembers.map((member) => member.userId);

    let timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        OR: [{ userId: userId }, { userId: { in: teamMemberIds } }],
      },
    });
    if (!timer) {
      return false;
    }
    return true;
  } else {
    let timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        userId: userId,
      },
    });
    if (!timer) {
      return false;
    }
    return true;
  }
};

const editTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;
    const userRole = req.user?.role;

    const isAuthorized = await isTimerOwnerOrTeamMember(
      timerId,
      userId,
      userRole
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Timer not found or unauthorized",
      });
    }

    const timer = await prisma.timer.findUnique({
      where: {
        id: timerId,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        project: timer.project,
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

    const { task, project, client, note } = req.body;

    const updatedTimer = await prisma.timer.update({
      where: {
        id: timerId,
      },
      data: {
        task,
        project,
        client,
        note,
      },
    });

    res.status(200).json({
      success: true,
      message: "Timer updated successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error updating timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update timer",
      error: error.message,
    });
  }
};

const deleteTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;
    const userRole = req.user?.role;

    const isAuthorized = await isTimerOwnerOrTeamMember(
      timerId,
      userId,
      userRole
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Timer not found or unauthorized",
      });
    }

    const timer = await prisma.timer.findUnique({
      where: {
        id: timerId,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        project: timer.project,
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

    await prisma.timer.delete({
      where: {
        id: timerId,
      },
    });

    res.status(200).json({
      success: true,
      message: "Timer deleted successfully",
    });
  } catch (error: any) {
    console.error("Error deleting timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete timer",
      error: error.message,
    });
  }
};

const startTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { task, project, client, note } = req.body;
    if (!task) {
      return res
        .status(400)
        .json({ success: false, message: "Task field is required" });
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
        project,
        client,
        note,
        startTime: new Date(),
        isActive: true,
      },
    });

    // Notify client via WebSocket
    broadcastToUser(userId, "timer:started", newTimer);

    res.status(201).json({
      success: true,
      message: "Timer started successfully",
      timer: newTimer,
    });
  } catch (error: any) {
    console.error("Error starting timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start timer",
      error: error.message,
    });
  }
};

const stopTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;
    const userRole = req.user?.role;

    const isAuthorized = await isTimerOwnerOrTeamMember(
      timerId,
      userId,
      userRole
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Timer not found or unauthorized",
      });
    }

    const timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "Timer not found",
      });
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
        project: timer.project,
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

    res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error stopping timer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in stopping timer",
      error: error.message,
    });
  }
};

const getActiveTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activeTimer = await prisma.timer.findFirst({
      where: {
        userId: userId,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      hasActiveTimer: !!activeTimer,
      timer: activeTimer,
    });
  } catch (error: any) {
    console.error("Error fetching active timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active timer",
      error: error.message,
    });
  }
};

const getUserTimers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      page = 1,
      limit = 10,
      sortBy,
      sortOrder,
      project,
      client,
      startDate,
      endDate,
      task,
    } = req.query;

    // Validate sortBy parameter
    const validSortFields = [
      "startTime",
      "endTime",
      "task",
      "project",
      "client",
      "duration",
      "createdAt",
    ];
    if (sortBy && !validSortFields.includes(sortBy as string)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid sort field" });
    }

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

    let where: any = {};

    if (userRole === "admin") {
      // Get the organizations managed by the admin
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

    if (project) {
      where.project = project as string;
    }

    if (client) {
      where.client = client as string;
    }

    if (task) {
      where.task = {
        contains: task as string,
        mode: "insensitive",
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
        where.OR = [
          {
            startTime: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          },
          {
            endTime: {
              gte: new Date(startDate as string),
              lte: new Date(endDate as string),
            },
          },
        ];
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
      where: where,
      orderBy: [orderBy],
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    });

    const count = await prisma.timer.count({
      where: where,
    });

    res.status(200).json({
      success: true,
      timers,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
    });
  } catch (error: any) {
    console.error("Error fetching user timers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timers",
      error: error.message,
    });
  }
};

const pauseTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;

    const timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        userId: userId,
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

    res.status(200).json({
      success: true,
      message: "Timer paused successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error pausing timer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in pausing timer",
      error: error.message,
    });
  }
};

const updateTimerNote = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;
    const { note } = req.body;
    const userRole = req.user?.role;

    const isAuthorized = await isTimerOwnerOrTeamMember(
      timerId,
      userId,
      userRole
    );

    if (!isAuthorized) {
      return res.status(403).json({
        success: false,
        message: "Timer not found or unauthorized",
      });
    }

    let timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        userId: userId,
      },
    });

    if (!timer) {
      if (userRole === "admin") {
        // Check if the timer belongs to a team member
        const organizations = await prisma.organization.findMany({
          where: {
            userId: userId,
          },
        });

        const teamMembers = await prisma.teamMember.findMany({
          where: {
            organizationId: {
              in: organizations.map((org) => org.id),
            },
          },
        });

        const teamMemberIds = teamMembers.map((member) => member.userId);

        timer = await prisma.timer.findFirst({
          where: {
            id: timerId,
            userId: {
              in: teamMemberIds,
            },
          },
        });

        if (!timer) {
          return res.status(404).json({
            success: false,
            message: "Timer not found for any team member",
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "Timer not found",
        });
      }
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        project: timer.project,
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

    res.status(200).json({
      success: true,
      message: "Timer note updated successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error updating timer note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update timer note",
      error: error.message,
    });
  }
};

const deleteTimerNote = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;
    const userRole = req.user?.role;

    let timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        userId: userId,
      },
    });

    if (!timer) {
      if (userRole === "admin") {
        // Check if the timer belongs to a team member
        const organizations = await prisma.organization.findMany({
          where: {
            userId: userId,
          },
        });

        const teamMembers = await prisma.teamMember.findMany({
          where: {
            organizationId: {
              in: organizations.map((org) => org.id),
            },
          },
        });

        const teamMemberIds = teamMembers.map((member) => member.userId);

        timer = await prisma.timer.findFirst({
          where: {
            id: timerId,
            userId: {
              in: teamMemberIds,
            },
          },
        });

        if (!timer) {
          return res.status(404).json({
            success: false,
            message: "Timer not found for any team member",
          });
        }
      } else {
        return res.status(404).json({
          success: false,
          message: "Timer not found",
        });
      }
    }

    // Create a timer history record
    await prisma.timerHistory.create({
      data: {
        timerId: timer.id,
        userId: timer.userId,
        task: timer.task,
        project: timer.project,
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

    res.status(200).json({
      success: true,
      message: "Timer note deleted successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error deleting timer note:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete timer note",
      error: error.message,
    });
  }
};

const resumeTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { timerId } = req.params;

    const timer = await prisma.timer.findFirst({
      where: {
        id: timerId,
        userId: userId,
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

    res.status(200).json({
      success: true,
      message: "Timer resumed successfully",
      timer: updatedTimer,
    });
  } catch (error: any) {
    console.error("Error resuming timer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in resuming timer",
      error: error.message,
    });
  }
};
