import express, { Router } from "express";
// Import controller functions - TS will resolve .ts extension
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getUserTimers,
} from "../../Controller/Timer/index.js"; // Add .js extension
// Import middleware - TS will resolve .ts extension, but NodeNext requires .js for runtime
import { validateConcurrentTimers } from "../../middleware/timerValidation.js"; // Add .js extension
import { authenticate } from "../../middleware/authMiddleware.js"; // Add .js extension

const router: Router = express.Router();

// All routes require authentication - applies authenticate middleware to all subsequent routes in this router
router.use(authenticate); // Remove cast

// Start a new timer (with validation to prevent concurrent timers)
// Applies validateConcurrentTimers middleware specifically to this route
router.post("/start", validateConcurrentTimers, startTimer); // Remove casts

// Stop an active timer
// Note: Ensure stopTimer controller handles potential errors if timerId is not found or doesn't belong to the user
router.put("/stop/:timerId", stopTimer); // Remove cast

// Get user's active timer (if any)
router.get("/active", getActiveTimer); // Remove cast

// Get user's timer history
router.get("/", getUserTimers); // Remove cast

export const timerRoutes: Router = router;
