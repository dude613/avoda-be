import { verify, sign } from "jsonwebtoken";
import dotenv from "dotenv";
import { Request, Response, NextFunction } from 'express';
dotenv.config();

interface CustomRequest extends Request {
  user?: any;
}

export function verifyAccessToken(req: CustomRequest, res: Response, next: NextFunction) {
    const token = (req as any).header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send({ error: "Access denied, no token provided!" });
    }
    try {
        const decoded = verify(token, process.env.JWT_SECRET_KEY as string) as { [key: string]: any };
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).send({ error: "Invalid or expired token!" });
    }
}


export function generateAccessToken(user: any) {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return sign(payload, process.env.JWT_SECRET_KEY as string, { expiresIn: "1d" });
}

export function generateRefreshToken(user: any) {
    const payload = {
        userId: user.id,
        email: user.email
    };
    return sign(payload, process.env.JWT_REFRESH_SECRET_KEY as string, { expiresIn: "7d" });
}
