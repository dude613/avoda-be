import jwt from "jsonwebtoken";
import { prisma } from "../Components/ConnectDatabase.js";

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Authentication required: No token provided",
      });
    }
    if (!process.env.JWT_SECRET_KEY) {
      console.error("JWT secret key is not defined");
      return res.status(500).json({
        success: false,
        message: "Server configuration error",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    //FIXME jwt.verify throws an error if verification fails, so no need to check decoded
    
    if (!decoded) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: User not found in token",
      });
    }
    
    const user = await prisma.user.findUnique({
      where: { email: decoded.email },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Authentication failed: Invalid token",
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Authentication error:", error.message, error);
    return res.status(401).json({
      success: false,
      message: "Authentication failed: Invalid token",
    });
  }
};