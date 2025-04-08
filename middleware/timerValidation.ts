import { Request, Response, NextFunction } from "express";
import { prisma } from "../Components/ConnectDatabase.js"; // Keep .js extension as required by NodeNext
import { Timer } from "@prisma/client"; // Import Timer type from Prisma

// Middleware to check if a user already has an active timer
export const validateConcurrentTimers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Ensure req.user and req.user.id exist before proceeding
    if (!req.user || typeof req.user.id === 'undefined') {
      // This should ideally not happen if authenticate middleware runs first
      console.error("User not found on request in validateConcurrentTimers");
      return res.status(401).json({
        success: false,
        message: "Authentication required: User context missing.",
      });
    }
    const userId = req.user.id;

    // Check if user has any active timers
    const activeTimer: Timer | null = await prisma.timer.findFirst({
      where: {
        user: {
          id: userId,
        },
        isActive: true,
      },
    });

    if (activeTimer) {
      return res.status(409).json({ // 409 Conflict is appropriate here
        success: false,
        message:
          "You already have an active timer. Please stop the current timer before starting a new one.",
        activeTimer, // Send back the conflicting timer info
      });
    }
    next(); // No active timer found, proceed
  } catch (error: any) {
    console.error("Timer validation error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during timer validation",
    });
  }
};
