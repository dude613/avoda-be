import jwt, { JwtPayload } from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { prisma } from "../Components/ConnectDatabase.js"; // Keep .js extension as required by NodeNext

// Define a type for the decoded JWT payload
interface DecodedToken extends JwtPayload {
  email: string;
  // Add other properties expected in your token payload if any
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No token provided",
      });
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      console.error("JWT secret key is not defined");
      return res.status(500).json({
        success: false,
        message: "Server configuration error: JWT_SECRET_KEY missing",
      });
    }

    // jwt.verify throws an error if verification fails (invalid token, expired, etc.)
    // So, we can directly use the result if it doesn't throw.
    const decoded = jwt.verify(token, jwtSecret) as DecodedToken;

    // Check if email exists in the decoded token
    if (!decoded.email) {
        return res.status(401).json({
            success: false,
            message: "Authentication failed: Token payload is missing email",
        });
    }

    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      // Although the token was valid, the user associated with it no longer exists
      return res.status(401).json({
        success: false,
        message: "Authentication failed: User associated with token not found",
      });
    }

    // Attach user to the request object (using the extended Request type from types/express.d.ts)
    req.user = user;
    next();
  } catch (error: any) { // Catch specific JWT errors if needed
    console.error("Authentication error:", error.message);
    // Provide a generic error message for security
    let message = "Authentication failed: Invalid token";
    if (error instanceof jwt.TokenExpiredError) {
        message = "Authentication failed: Token expired";
    } else if (error instanceof jwt.JsonWebTokenError) {
        message = `Authentication failed: ${error.message}`; // Or keep generic
    }

    return res.status(401).json({
      success: false,
      message: message,
    });
  }
};
