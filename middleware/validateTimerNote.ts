import { Request, Response, NextFunction } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";

export const validateTimerNote = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    const { note } = req.body;

    if (note && typeof note === 'string' && note.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Note cannot be longer than 200 characters",
      });
    }

    next();
  }
);
