import express, { Router } from "express";
import {
  startTimer,
  stopTimer,
  getActiveTimer,
  getUserTimers,
  pauseTimer,
  resumeTimer,
  updateTimerNote,
  deleteTimerNote,
  editTimer,
  deleteTimer,
} from "../../Controller/Timer/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateTimerNote } from "../../middleware/validateTimerNote.js";

const router: Router = express.Router();

// Use the asyncHandler wrapper for all routes
router.post("/start", authenticate, validateTimerNote, asyncHandler(startTimer));
router.put("/stop/:timerId", authenticate, asyncHandler(stopTimer));
router.put("/pause/:timerId", authenticate, asyncHandler(pauseTimer));
router.put("/resume/:timerId", authenticate, asyncHandler(resumeTimer));
router.put("/note/:timerId", authenticate, validateTimerNote, asyncHandler(updateTimerNote));
router.delete("/note/:timerId", authenticate, asyncHandler(deleteTimerNote));
router.get("/active", authenticate, asyncHandler(getActiveTimer));
router.get("/", authenticate, asyncHandler(getUserTimers));

router.put("/edit/:timerId", authenticate, asyncHandler(editTimer));
router.delete("/delete/:timerId", authenticate, asyncHandler(deleteTimer));

export const timerRoutes: Router = router;
