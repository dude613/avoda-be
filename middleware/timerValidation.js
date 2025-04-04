import Timer from "../Model/Timer.js"

//  Middleware i created to check if a user already has an active timer
export const validateConcurrentTimers = async (req, res, next) => {
  try {
    const userId = req.user._id

    // Check if user has any active timers
    const activeTimer = await Timer.findOne({
      user: userId,
      isActive: true,
    })

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

