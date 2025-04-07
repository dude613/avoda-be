"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
function verifyAccessToken(req, res, next) {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send({ error: "Access denied, no token provided!" });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(400).send({ error: "Invalid or expired token!" });
    }
}
function generateAccessToken(user) {
    const payload = {
        userId: user.id,
        email: user.email,
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
}
function generateRefreshToken(user) {
    const payload = {
        userId: user.id,
        email: user.email
    };
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: "7d" });
}
