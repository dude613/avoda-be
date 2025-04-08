import jwt from "jsonwebtoken";
import { prisma } from "../Components/ConnectDatabase.js";
export const authenticate = async (req, res, next) => {
    try {
        const token = req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            res.status(401).json({
                success: false,
                message: "Authentication required: No token provided",
            });
            return; // Return without calling next()
        }
        const jwtSecret = process.env.JWT_SECRET_KEY;
        if (!jwtSecret) {
            console.error("JWT secret key is not defined");
            res.status(500).json({
                success: false,
                message: "Server configuration error: JWT_SECRET_KEY missing",
            });
            return; // Return without calling next()
        }
        // jwt.verify throws an error if verification fails
        const decoded = jwt.verify(token, jwtSecret);
        // Check if email exists in the decoded token
        if (!decoded.email) {
            res.status(401).json({
                success: false,
                message: "Authentication failed: Token payload is missing email",
            });
            return; // Return without calling next()
        }
        const user = await prisma.user.findUnique({
            where: { email: decoded.email },
        });
        if (!user) {
            res.status(401).json({
                success: false,
                message: "Authentication failed: User associated with token not found",
            });
            return; // Return without calling next()
        }
        // Attach user to the request object
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Authentication error:", error.message);
        let message = "Authentication failed: Invalid token";
        if (error instanceof jwt.TokenExpiredError) {
            message = "Authentication failed: Token expired";
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            message = `Authentication failed: ${error.message}`;
        }
        res.status(401).json({
            success: false,
            message: message,
        });
        // Don't call next() here - we've already sent a response
    }
};
//# sourceMappingURL=authMiddleware.js.map