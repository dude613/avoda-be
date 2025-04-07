import { prisma } from "../../Components/ConnectDatabase.js";
import { broadcastToUser } from "../../services/webSocketService.js";
import {
    StartTimerRequest,
    StopTimerRequest,
    GetActiveTimerRequest,
    GetUserTimersRequest,
    TimerResponse,
    BroadcastFunction // Import the placeholder type
} from "../../types/timer.types.js"; // Adjust path/extension if needed
import { Timer } from '@prisma/client'; // Import Prisma's Timer type

// Type assertion for the imported broadcast function (if needed, or define properly)
const typedBroadcastToUser: BroadcastFunction = broadcastToUser;

export const startTimer = async (req: StartTimerRequest, res: TimerResponse): Promise<void> => {
  try {
    const { task, project, client } = req.body;

    // Validate required fields (task is required by StartTimerBody type)
    // The check `if (!task)` is redundant if types are enforced by middleware/validation layer
    // but kept here for robustness matching original code.
    if (!task) {
        res.status(400).json({ success: false, message: "Task field is required" });
        return;
    }

    // Safely access and parse user ID from authenticated request
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Authentication required (user ID missing)" });
        return;
    }
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID format in token" });
      return;
    }

    // Check for existing active timer
    const existingActiveTimer = await prisma.timer.findFirst({
      where: {
        user: userId, // Use the parsed numeric userId
        isActive: true,
      },
    });
    if (existingActiveTimer) {
      res.status(409).json({
        success: false,
        message: "You already have an active timer. Please stop the current timer before starting a new one.",
        activeTimer: existingActiveTimer,
      });
      return;
    }

    // Create new timer
    const newTimer: Timer = await prisma.timer.create({
      data: {
        user: userId, // Use parsed numeric userId
        task,
        project: project || null, // Use null if optional and not provided
        client: client || null,  // Use null if optional and not provided
        startTime: new Date(),
        isActive: true,
        // endTime and duration will be null/default upon creation
      },
    });

    // Notify client via WebSocket - Use the original string ID from the request
    typedBroadcastToUser(req.user.id, "timer:started", newTimer);

    res.status(201).json({
      success: true,
      message: "Timer started successfully",
      timer: newTimer,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error starting timer:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to start timer",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const stopTimer = async (req: StopTimerRequest, res: TimerResponse): Promise<void> => {
  try {
    const { timerId: timerIdString } = req.params;

    // Safely access and parse user ID
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Authentication required (user ID missing)" });
        return;
    }
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID format in token" });
      return;
    }

    // Parse timer ID
    const parsedTimerId = parseInt(timerIdString, 10);
    if (isNaN(parsedTimerId)) {
      res.status(400).json({ success: false, message: "Invalid timer ID format in URL parameter" });
      return;
    }

    // Find the active timer for this user
    const timer = await prisma.timer.findFirst({
      where: {
        id: parsedTimerId,
        user: userId, // Ensure the timer belongs to the authenticated user
        isActive: true,
      },
    });

    if (!timer) {
      // Could be timer doesn't exist, doesn't belong to user, or isn't active
      res.status(404).json({
        success: false,
        message: "No active timer found with the provided ID for this user",
      });
      return;
    }

    // Calculate duration and update timer
    const endTime = new Date();
    // Ensure startTime is a Date object before getTime()
    const startTime = timer.startTime instanceof Date ? timer.startTime : new Date(timer.startTime);
    const duration = Math.floor((endTime.getTime() - startTime.getTime()) / 1000); // Duration in seconds

    const updatedTimer: Timer = await prisma.timer.update({
      where: {
        id: parsedTimerId, // Use the parsed ID
      },
      data: {
        endTime: endTime,
        isActive: false,
        duration: duration,
      },
    });

    // Notify client via WebSocket - Use the original string ID from the request
    typedBroadcastToUser(req.user.id, "timer:stopped", updatedTimer);

    res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      timer: updatedTimer,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error stopping timer:", errorMessage);
    // Check for Prisma P2025 if record not found during update (though findFirst should prevent this)
    res.status(500).json({
      success: false,
      message: "An error occurred while stopping the timer",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const getActiveTimer = async (req: GetActiveTimerRequest, res: TimerResponse): Promise<void> => {
  try {
    // Safely access and parse user ID
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Authentication required (user ID missing)" });
        return;
    }
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID format in token" });
      return;
    }

    const activeTimer = await prisma.timer.findFirst({
      where: {
        user: userId,
        isActive: true,
      },
    });

    res.status(200).json({
      success: true,
      hasActiveTimer: !!activeTimer, // Convert timer object (or null) to boolean
      timer: activeTimer, // Send the timer object or null
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching active timer:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to fetch active timer",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

export const getUserTimers = async (req: GetUserTimersRequest, res: TimerResponse): Promise<void> => {
  try {
    // Safely access and parse user ID
    if (!req.user?.id) {
        res.status(401).json({ success: false, message: "Authentication required (user ID missing)" });
        return;
    }
    const userId = parseInt(req.user.id, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, message: "Invalid user ID format in token" });
      return;
    }

    // Get and validate pagination parameters from query
    const { page = '1', limit = '10' } = req.query; // Default to strings

    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      res.status(400).json({ success: false, message: "Invalid page number (must be 1 or greater)" });
      return;
    }

    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) { // Add upper bound for limit
      res.status(400).json({ success: false, message: "Invalid limit number (must be between 1 and 100)" });
      return;
    }

    // Calculate skip value for pagination
    const skip = (parsedPage - 1) * parsedLimit;

    // Fetch timers and total count concurrently
    const [timers, count] = await Promise.all([
        prisma.timer.findMany({
            where: { user: userId },
            orderBy: { startTime: 'desc' },
            skip: skip,
            take: parsedLimit,
        }),
        prisma.timer.count({
            where: { user: userId },
        })
    ]);

    res.status(200).json({
      success: true,
      timers,
      totalPages: Math.ceil(count / parsedLimit),
      currentPage: parsedPage,
      totalTimers: count
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching user timers:", errorMessage);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timers",
      error: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};
