import { prisma } from "../../Components/ConnectDatabase.js";
import { broadcastToUser } from "../../services/webSocketService.js";

export const startTimer = async (req, res) => {
  try {
    const { task, project, client } = req.body;
    if (!task)
      return res
        .status(400)
        .json({ success: false, message: "Task field is required" });
    const userId = req.user.id;
    // Double-check for active timers (race condition protection)
    const existingActiveTimer = await prisma.timer.findFirst({
      where: {
        user: parseInt(userId),
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
        user: parseInt(userId),
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
  } catch (error) {
    console.error("Error starting timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start timer",
    });
  }
};

export const stopTimer = async (req, res) => {
  try {
    const { timerId } = req.params;
    const userId = req.user.id;

    // Find the active timer
    const timer = await prisma.timer.findUnique({
      where: {
        id: parseInt(timerId),
        user: parseInt(userId),
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
        id: parseInt(timerId),
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
  } catch (error) {
    console.error("Error stopping timer:", error);
    res.status(500).json({
      success: false,
      message: "An error occurred in stopping timer",
    });
  }
};

export const getActiveTimer = async (req, res) => {
  try {
    const userId = req.user.id;

    const activeTimer = await prisma.timer.findFirst({
      where: {
        user: parseInt(userId),
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      hasActiveTimer: !!activeTimer,
      timer: activeTimer,
    });
  } catch (error) {
    console.error("Error fetching active timer:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active timer",
    });
  }
};

export const getUserTimers = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;

    const timers = await prisma.timer.findMany({
      where: {
        user: parseInt(userId),
      },
      orderBy: [
        {
          startTime: 'desc',
        },
      ],
      skip: ((page - 1) * limit),
      take: parseInt(limit),
    });

    const count = await prisma.timer.count({
      where: {
        user: parseInt(userId),
      },
    });

    res.status(200).json({
      success: true,
      timers,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
    });
  } catch (error) {
    console.error("Error fetching user timers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timers",
    });
  }
};
