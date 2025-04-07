import { prisma } from "../Components/ConnectDatabase.js";

//  Middleware i created to check if a user already has an active timer
export const validateConcurrentTimers = async (req, res, next) => {
  try {
    const userId = parseInt(req.user.id);

    // Check if user has any active timers
    const activeTimer = await prisma.timer.findFirst({
      where: {
        user: userId,
        isActive: true,
      },
    });

    if (activeTimer) {
      return res.status(409).json({
        success: false,
        message: "You already have an active timer. Please stop the current timer before starting a new one.",
        activeTimer,
      })
    }
    next()
  } catch (error) {
    console.error("Timer validation error:", error)
    res.status(500).json({
      success: false,
      message: "Server error during timer validation",
    })
  }
}

