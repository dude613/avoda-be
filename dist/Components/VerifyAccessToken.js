import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import { prisma } from "./ConnectDatabase.js";
import * as Sentry from "@sentry/node";
import { error } from "console";
dotenv.config();
/**
 * Middleware to verify JWT access token and attach the full user object to req.user.
 * Similar to authenticate middleware but potentially used in different contexts.
 */
export const verifyAccessToken = async (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        res.status(401).send({ success: false, error: "Access denied, no token provided!" });
        return;
    }
    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
        console.error("JWT_SECRET_KEY is not defined");
        Sentry.captureException(error);
        res.status(500).send({ success: false, error: "Server configuration error." });
        return;
    }
    try {
        const decoded = jwt.verify(token, jwtSecret);
        // Validate payload structure
        if (!decoded.userId || !decoded.email) {
            res.status(401).send({ success: false, error: "Invalid token payload." });
            return;
        }
        // Fetch the full user object from the database
        const user = await prisma.user.findUnique({
            where: { id: decoded.userId }, // Use userId from token
        });
        if (!user) {
            res.status(401).send({ success: false, error: "Authentication failed: User not found." });
            return;
        }
        req.user = user;
        next();
    }
    catch (error) {
        console.error("Token verification error:", error.message);
        let message = "Invalid or expired token!";
        if (error instanceof jwt.TokenExpiredError) {
            message = "Token expired!";
        }
        else if (error instanceof jwt.JsonWebTokenError) {
            message = `Invalid token: ${error.message}`;
        }
        res.status(401).send({ success: false, error: message });
    }
};
/**
 * Generates a JWT access token.
 */
export function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
        // Add other relevant claims if needed
    };
    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
        throw new Error("JWT_SECRET_KEY is not defined for access token generation.");
    }
    return jwt.sign(payload, jwtSecret, { expiresIn: "1d" }); // Standard expiration
}
/**
 * Generates a JWT refresh token.
 */
export function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        email: user.email, // Keep payload minimal for refresh token
    };
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET_KEY;
    if (!jwtRefreshSecret) {
        throw new Error("JWT_REFRESH_SECRET_KEY is not defined for refresh token generation.");
    }
    return jwt.sign(payload, jwtRefreshSecret, { expiresIn: "7d" }); // Longer expiration
}
//# sourceMappingURL=VerifyAccessToken.js.map