import express, { Router } from "express";
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getUserTimers,
  pauseTimer,
  resumeTimer,
} from "../../Controller/Timer/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/authMiddleware.js";

const router: Router = express.Router();

// Use the asyncHandler wrapper for all routes
router.post("/start", authenticate, asyncHandler(startTimer));
router.put("/stop/:timerId", authenticate, asyncHandler(stopTimer));
router.put("/pause/:timerId", authenticate, asyncHandler(pauseTimer));
router.put("/resume/:timerId", authenticate, asyncHandler(resumeTimer));
router.get("/active", authenticate, asyncHandler(getActiveTimer));
router.get("/", authenticate, asyncHandler(getUserTimers));

export const timerRoutes: Router = router;
