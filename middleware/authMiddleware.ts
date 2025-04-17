import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../Components/ConnectDatabase.js";

// Define a type for the decoded JWT payload
interface DecodedToken extends JwtPayload {
  email: string;
  // Add other properties expected in your token payload if any
}

// Extend Express Request to include user property
declare global {
  namespace Express {
    interface Request {
      user?: { [key: string]: any; id: string; } | undefined;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => { // Add return type Promise<void>
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required: No token provided",
      });
      return;
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      console.error("JWT secret key is not defined");
      res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET_KEY missing",
      });
      return;
    }

    // jwt.verify throws an error if verification fails
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Check if email exists in the decoded token
    if (!decoded.email) {
      res.status(401).json({
        success: false,
        message: "Authentication failed: Token payload is missing email",
      });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: "Authentication failed: User associated with token not found",
      });
      return;
    }

    // Attach user to the request object
    req.user = user;
    next();
  } catch (error: any) {
    console.error("Authentication error:", error.message);
    
    let message = "Authentication failed: Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
      message = "Authentication failed: Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
      message = `Authentication failed: ${error.message}`;
    }

    res.status(401).json({
      success: false,
      message: message,
    });
    // Don't call next() here - we've already sent a response
  }
};