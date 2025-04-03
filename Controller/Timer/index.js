import Timer from "../../Model/Timer.js";
import { broadcastToUser } from "../../services/webSocketService.js";

export const startTimer = async (req, res) => {
  try {
    const { task, project, client } = req.body;
    if (!task)
      return res
        .status(400)
        .json({ success: false, message: "Task field is required" });
    const userId = req.user._id;
    // Double-check for active timers (race condition protection)
    const existingActiveTimer = await Timer.findOne({
      user: userId,
      isActive: true,
    });
    if (existingActiveTimer) {
      return res.status(409).json({
        success: false,
        message: "You already have an active timer.",
        activeTimer: existingActiveTimer,
      });
    }
    // Create a new timer
    const newTimer = new Timer({
      user: userId,
      task,
      project,
      client,
      startTime: new Date(),
      isActive: true,
    });

    await newTimer.save();

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
    const userId = req.user._id;

    // Find the active timer
    const timer = await Timer.findOne({
      _id: timerId,
      user: userId,
      isActive: true,
    });

    if (!timer) {
      return res.status(404).json({
        success: false,
        message: "No active timer found with the provided ID",
      });
    }

    // Calculate duration and update timer
    const endTime = new Date();

    if (!timer.startTime) {
      return res.status(500).json({
        success: false,
        message: "Timer start time is missing or invalid",
      });
    }
    const duration = Math.floor((endTime - timer.startTime) / 1000); // Duration in seconds

    timer.endTime = endTime;
    timer.isActive = false;
    timer.duration = duration;

    await timer.save();

    // Notify client via WebSocket
    broadcastToUser(userId, "timer:stopped", timer);

    res.status(200).json({
      success: true,
      message: "Timer stopped successfully",
      timer,
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
    const userId = req.user._id;

    const activeTimer = await Timer.findOne({
      user: userId,
      isActive: true,
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
    const userId = req.user._id;
    const { page = 1, limit = 10 } = req.query;

    const timers = await Timer.find({ user: userId })
      .sort({ startTime: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const count = await Timer.countDocuments({ user: userId });

    res.status(200).json({
      success: true,
      timers,
      totalPages: Math.ceil(count / limit),
      currentPage: page,
    });
  } catch (error) {
    console.error("Error fetching user timers:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch timers",
    });
  }
};
