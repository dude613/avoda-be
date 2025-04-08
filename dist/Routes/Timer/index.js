import express from "express";
import { startTimer, stopTimer, getActiveTimer, getUserTimers, } from "../../Controller/Timer/index.js";
import { asyncHandler } from "../../utils/asyncHandler.js";
import { authenticate } from "../../middleware/authMiddleware.js";
const router = express.Router();
// Use the asyncHandler wrapper for all routes
router.post("/start", authenticate, asyncHandler(startTimer));
router.put("/stop/:timerId", authenticate, asyncHandler(stopTimer));
router.get("/active", authenticate, asyncHandler(getActiveTimer));
router.get("/", authenticate, asyncHandler(getUserTimers));
export const timerRoutes = router;
//# sourceMappingURL=index.js.map