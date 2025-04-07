"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyAccessToken = verifyAccessToken;
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
var jsonwebtoken_1 = require("jsonwebtoken");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
function verifyAccessToken(req, res, next) {
    var _b;
    var token = (_b = req.header("Authorization")) === null || _b === void 0 ? void 0 : _b.replace("Bearer ", "");
    if (!token) {
        return res.status(403).send({ error: "Access denied, no token provided!" });
    }
    try {
        var decoded = (0, jsonwebtoken_1.verify)(token, process.env.JWT_SECRET_KEY);
        req.user = decoded;
        next();
    }
    catch (error) {
        res.status(400).send({ error: "Invalid or expired token!" });
    }
}
function generateAccessToken(user) {
    var payload = {
        userId: user.id,
        email: user.email,
    };
    return (0, jsonwebtoken_1.sign)(payload, process.env.JWT_SECRET_KEY, { expiresIn: "1d" });
}
function generateRefreshToken(user) {
    var payload = {
        userId: user.id,
        email: user.email
    };
    return (0, jsonwebtoken_1.sign)(payload, process.env.JWT_REFRESH_SECRET_KEY, { expiresIn: "7d" });
}
