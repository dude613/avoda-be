import express from "express"
import { startTimer, stopTimer, getActiveTimer, getUserTimers } from "../../Controller/Timer/index.js"
import { validateConcurrentTimers } from "../../middleware/timerValidation.js"
import { authenticate } from "../../middleware/authMiddleware.js"

const router = express.Router()

// All routes require authentication
router.use(authenticate)

// Start a new timer (with validation to prevent concurrent timers)
router.post("/start", validateConcurrentTimers, startTimer)

// Stop an active timer
router.put("/stop/:timerId", stopTimer)

// Get user's active timer (if any)
router.get("/active", getActiveTimer)

// Get user's timer history
router.get("/", getUserTimers)

export const TimerRoute = router;

