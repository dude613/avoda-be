import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export const adminMiddleware = asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ success: false, message: "Unauthorized: Admin role required." });
  }
  next();
});
