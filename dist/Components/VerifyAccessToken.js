import { verify, sign } from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
export function verifyAccessToken(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send({ error: "Access denied, no token provided!" });
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(400).send({ error: "Invalid or expired token!" });
    }
}
export function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
}
export function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        email: user.email
    };
    return sign(payload, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: "7d" });
}
