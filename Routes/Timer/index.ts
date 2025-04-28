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
import { authenticate } from "../../middleware/authMiddleware.js";
import { validateTimerNote } from "../../middleware/validateTimerNote.js";
import { hasTimerPermission } from "../../middleware/permissionMiddleware.js";
import { asyncHandler } from "../../utils/asyncHandler.js";

const router: Router = express.Router();

// Use the permission middleware with specific permission names
router.post("/start", authenticate, validateTimerNote, hasTimerPermission("CREATE_TIMER"), asyncHandler(startTimer));
router.put("/stop/:timerId", authenticate, hasTimerPermission("UPDATE_TIMER"), asyncHandler(stopTimer));
router.put("/pause/:timerId", authenticate, hasTimerPermission("UPDATE_TIMER"), asyncHandler(pauseTimer));
router.put("/resume/:timerId", authenticate, hasTimerPermission("UPDATE_TIMER"), asyncHandler(resumeTimer));
router.put("/note/:timerId", authenticate, validateTimerNote, hasTimerPermission("UPDATE_TIMER"), asyncHandler(updateTimerNote));
router.delete("/note/:timerId", authenticate, hasTimerPermission("DELETE_TIMER_NOTE"), asyncHandler(deleteTimerNote));
router.get("/active", authenticate, hasTimerPermission("READ_TIMER"), asyncHandler(getActiveTimer));
router.get("/", authenticate, hasTimerPermission("READ_TIMER"), asyncHandler(getUserTimers));

// These routes require higher permissions
router.put("/edit/:timerId", authenticate, hasTimerPermission("UPDATE_TIMER"), asyncHandler(editTimer));
router.delete("/delete/:timerId", authenticate, hasTimerPermission("DELETE_TIMER"), asyncHandler(deleteTimer));

export const timerRoutes: Router = router;
