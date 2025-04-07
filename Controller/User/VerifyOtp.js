"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateEmailInput = exports.validateOtpInput = exports.resendOtpLimiter = exports.verifyOtpLimiter = void 0;
exports.VerifyOtp = VerifyOtp;
exports.ResendOtp = ResendOtp;
var SendOTPMail_js_1 = require("../../Components/MailerComponents/SendOTPMail.js");
var VerifyAccessToken_js_1 = require("../../Components/VerifyAccessToken.js");
var ConnectDatabase_js_1 = require("../../Components/ConnectDatabase.js");
var crypto_2 = require("crypto");
var UserConstants_js_1 = require("../../Constants/UserConstants.js");
var express_rate_limit_1 = require("express-rate-limit");
var _b = UserConstants_js_1.userContent.errors, EMAIL_NOT_FOUND_ERROR = _b.EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR = _b.EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR = _b.INVALID_EMAIL_FORMAT_ERROR, USER_EMAIL_ALREADY_VERIFIED = _b.USER_EMAIL_ALREADY_VERIFIED, USER_INVALID_OTP = _b.USER_INVALID_OTP, GENERIC_ERROR_MESSAGE = _b.GENERIC_ERROR_MESSAGE, TOO_MANY_REQUESTS_ERROR = _b.TOO_MANY_REQUESTS_ERROR, OTP_NOT_SENT = _b.OTP_NOT_SENT, _c = UserConstants_js_1.userContent.success, USER_EMAIL_VERIFIED = _c.USER_EMAIL_VERIFIED, USER_REGISTER_SUCCESS = _c.USER_REGISTER_SUCCESS, USER_SEND_OTP = _c.USER_SEND_OTP, USER_OTP_EXPIRE = UserConstants_js_1.userContent.messages.USER_OTP_EXPIRE, EMAIL_REGEX = UserConstants_js_1.userContent.validations.EMAIL;
// Rate limiting configuration
var verifyOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 attempts per windowMs
    message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
});
exports.verifyOtpLimiter = verifyOtpLimiter;
var resendOtpLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // 3 attempts per windowMs
    message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
});
exports.resendOtpLimiter = resendOtpLimiter;
// Input validation middleware
var validateOtpInput = function (req, res, next) {
    var _b = req.body, email = _b.email, otp = _b.otp;
    if (!email) {
        return res
            .status(400)
            .send({ success: false, error: EMAIL_REQUIRED_ERROR });
    }
    if (!EMAIL_REGEX.test(email)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    }
    if (!otp) {
        return res.status(400).send({ success: false, error: OTP_REQUIRED_ERROR });
    }
    if (!/^\d{6}$/.test(otp)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_OTP_FORMAT_ERROR });
    }
    next();
};
exports.validateOtpInput = validateOtpInput;
var validateEmailInput = function (req, res, next) {
    var email = req.body.email;
    if (!email) {
        return res
            .status(400)
            .send({ success: false, error: EMAIL_REQUIRED_ERROR });
    }
    if (!EMAIL_REGEX.test(email)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    }
    next();
};
exports.validateEmailInput = validateEmailInput;
function VerifyOtp(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, email, otp, user, otpRecord, otpToDelete, accessToken, refreshToken, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    _b = req.body, email = _b.email, otp = _b.otp;
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: EMAIL_NOT_FOUND_ERROR })];
                    }
                    if (user.verified === true) {
                        return [2 /*return*/, res.status(404).send({
                                success: false,
                                error: USER_EMAIL_ALREADY_VERIFIED,
                            })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.findFirst({
                            where: {
                                userId: user.id,
                            },
                        })];
                case 2:
                    otpRecord = _c.sent();
                    if (!otp || isNaN(otp)) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: USER_INVALID_OTP })];
                    }
                    if (!otpRecord || otpRecord.otp !== parseInt(otp, 10)) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: USER_INVALID_OTP })];
                    }
                    if (!(otpRecord.expiresAt < new Date())) return [3 /*break*/, 4];
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.deleteMany({
                            where: {
                                userId: user.id,
                            },
                        })];
                case 3:
                    _c.sent();
                    return [2 /*return*/, res.status(400).send({
                            success: false,
                            error: USER_OTP_EXPIRE,
                        })];
                case 4: return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.findFirst({
                        where: {
                            userId: user.id,
                        },
                    })];
                case 5:
                    otpToDelete = _c.sent();
                    if (!otpToDelete) return [3 /*break*/, 7];
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.delete({
                            where: {
                                id: otpToDelete.id,
                            },
                        })];
                case 6:
                    _c.sent();
                    _c.label = 7;
                case 7:
                    accessToken = (0, VerifyAccessToken_js_1.generateAccessToken)(user);
                    refreshToken = (0, VerifyAccessToken_js_1.generateRefreshToken)(user);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                id: user.id,
                            },
                            data: {
                                verified: true,
                                refreshToken: refreshToken,
                                lastLoginAt: new Date(),
                            },
                        })];
                case 8:
                    _c.sent();
                    return [2 /*return*/, res.status(200).send({
                            success: true,
                            message: USER_EMAIL_VERIFIED,
                            user: {
                                id: user.id,
                                email: user.email,
                                verified: user.verified,
                                role: user.role,
                            },
                            accessToken: accessToken,
                        })];
                case 9:
                    error_1 = _c.sent();
                    console.error("OTP Verification Error:", {
                        message: error_1.message,
                        stack: error_1.stack,
                        timestamp: new Date().toISOString(),
                    });
                    return [2 /*return*/, res
                            .status(500)
                            .send({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
function ResendOtp(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var email, user, otpExpiration, otp, existingOtp, sendOTP, error_2;
        var _b;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 8, , 9]);
                    email = req.body.email;
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: EMAIL_NOT_FOUND_ERROR })];
                    }
                    if (user.verified === true) {
                        return [2 /*return*/, res.status(201).send({
                                success: true,
                                message: USER_EMAIL_VERIFIED,
                            })];
                    }
                    // Delete any existing OTPs for this user
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.deleteMany({
                            where: {
                                userId: user.id,
                            },
                        })];
                case 2:
                    // Delete any existing OTPs for this user
                    _c.sent();
                    otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
                    otp = crypto_2.default.randomInt(100000, 999999).toString();
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.findFirst({
                            where: {
                                userId: user.id,
                                expiresAt: {
                                    gt: new Date(),
                                },
                            },
                        })];
                case 3:
                    existingOtp = _c.sent();
                    if (!existingOtp) return [3 /*break*/, 4];
                    otp = existingOtp.otp;
                    return [3 /*break*/, 6];
                case 4:
                    otp = crypto_2.default.randomInt(100000, 999999).toString();
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.otp.upsert({
                            where: {
                                userId: user.id,
                            },
                            update: {
                                otp: parseInt(otp),
                                expiresAt: otpExpiration,
                            },
                            create: {
                                userId: user.id,
                                otp: parseInt(otp),
                                expiresAt: otpExpiration,
                            },
                        })];
                case 5:
                    _c.sent();
                    _c.label = 6;
                case 6: return [4 /*yield*/, (0, SendOTPMail_js_1.SendOTPInMail)(otp, email)];
                case 7:
                    sendOTP = _c.sent();
                    if (!sendOTP || sendOTP.error) {
                        return [2 /*return*/, res.status(400).send({
                                success: false,
                                error: OTP_NOT_SENT,
                            })];
                    }
                    return [2 /*return*/, res.status(200).send({
                            success: true,
                            message: USER_SEND_OTP,
                            data: {
                                email: email,
                                otpId: (_b = sendOTP.data) === null || _b === void 0 ? void 0 : _b.id,
                            },
                        })];
                case 8:
                    error_2 = _c.sent();
                    console.error("OTP Resending Error:", {
                        message: error_2.message,
                        stack: error_2.stack,
                        timestamp: new Date().toISOString(),
                    });
                    return [2 /*return*/, res
                            .status(500)
                            .send({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 9: return [2 /*return*/];
            }
        });
    });
}
