import { prisma } from "../../Components/ConnectDatabase.js";
import { broadcastToUser } from "../../services/webSocketService.js";
import { Request, Response } from "express";

export const startTimer = async (req: Request, res: Response) => {
  try {
    const { task, project, client, userId } = req.body;
    if (!task)
      return res
        .status(400)
        .json({ success: false, message: "Task field is required" });
    
    // Double-check for active timers (race condition protection)
    const existingActiveTimer = await prisma.timer.findFirst({
      where: {
        user: userId, // This is correct based on your schema
        isActive: true,
      },
    });
    
    if (existingActiveTimer) {
      return res.status(409).json({
        success: false,
        message: "You already have an active timer. Please stop the current timer before starting a new one.",
        activeTimer: existingActiveTimer,
      });
    }
    
    // Create a new timer
    const newTimer = await prisma.timer.create({
      data: {
        user: userId, // This is correct based on your schema
        task,
        project,
        client,
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
    });
  }
};

export const stopTimer = async (req: Request, res: Response) => {
  try {
    const { timerId } = req.params;
    const userId = parseInt(req.user.id || "", 10);
    const parsedTimerId = parseInt(timerId as string);
    
    if (isNaN(parsedTimerId)) {
      console.log("parsee", timerId);
      return res.status(400).json({ success: false, message: "Invalid timer ID" });
    }

    // Find the active timer
    const timer = await prisma.timer.findFirst({
      where: {
        id: parsedTimerId,
        user: userId,
        isActive: true,
      },
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "No active timer found with the provided ID",
      });
    }

    // Calculate duration and update timer
    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - timer.startTime.getTime()) / 1000); // Duration in seconds

    const updatedTimer = await prisma.timer.update({
      where: {
        id: parsedTimerId,
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
    });
  }
};

export const getActiveTimer = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const activeTimer = await prisma.timer.findFirst({
      where: {
        user: userId,
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
    });
  }
};

export const getUserTimers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    const { page = 1, limit = 10 } = req.query;

    const parsedPage = parseInt(page as string);
    if (isNaN(parsedPage)) {
      return res.status(400).json({ success: false, message: "Invalid page number" });
    }

    const parsedLimit = parseInt(limit as string);
    if (isNaN(parsedLimit)) {
      return res.status(400).json({ success: false, message: "Invalid limit number" });
    }

    const timers = await prisma.timer.findMany({
      where: {
        user: userId,
      },
      orderBy: [
        {
          startTime: 'desc',
        },
      ],
      skip: ((parsedPage - 1) * parsedLimit),
      take: parsedLimit,
    });

    const count = await prisma.timer.count({
      where: {
        user: userId, // This is correct based on your schema
      },
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
    });
  }
};
