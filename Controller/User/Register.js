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
exports.registerWithGoogle = void 0;
exports.Register = Register;
exports.ResetPassword = ResetPassword;
var dotenv_1 = require("dotenv");
var crypto_2 = require("crypto");
var google_auth_library_1 = require("google-auth-library");
var VerifyAccessToken_js_1 = require("../../Components/VerifyAccessToken.js");
var ConnectDatabase_js_1 = require("../../Components/ConnectDatabase.js");
var SendOTPMail_js_1 = require("../../Components/MailerComponents/SendOTPMail.js");
var UserConstants_js_1 = require("../../Constants/UserConstants.js");
var bcryptjs_1 = require("bcryptjs");
var _b = UserConstants_js_1.userContent.errors, EMAIL_NOT_FOUND_ERROR = _b.EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR = _b.EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR = _b.INVALID_EMAIL_FORMAT_ERROR, GENERIC_ERROR_MESSAGE = _b.GENERIC_ERROR_MESSAGE, USER_EMAIL_ALREADY_EXIST = _b.USER_EMAIL_ALREADY_EXIST, USER_EMAIL_ALREADY_VERIFIED = _b.USER_EMAIL_ALREADY_VERIFIED, _c = UserConstants_js_1.userContent.messages, PASSWORD_REQUIRED_ERROR = _c.PASSWORD_REQUIRED_ERROR, PASSWORD_COMPLEXITY_ERROR = _c.PASSWORD_COMPLEXITY_ERROR, USER_SEND_OTP = _c.USER_SEND_OTP, OTP_NOT_SENT = _c.OTP_NOT_SENT, ROLE_REQUIRED_ERROR = _c.ROLE_REQUIRED_ERROR, INVALID_ROLE_ERROR = _c.INVALID_ROLE_ERROR, USER_REGISTER_SUCCESS = UserConstants_js_1.userContent.success.USER_REGISTER_SUCCESS, _d = UserConstants_js_1.userContent.validations, EMAIL_REGEX = _d.EMAIL, PASSWORD_REGEX = _d.PASSWORD_REGEX;
dotenv_1.default.config();
var CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var AUTH_URL = process.env.AUTH_URL;
var client = new google_auth_library_1.OAuth2Client(CLIENT_ID);
function Register(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, email, password, role, userName, validationResponse, user, salt, hashedPassword, otp, otpExpiration, data, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 9, , 10]);
                    _b = req.body, email = _b.email, password = _b.password, role = _b.role;
                    userName = req.body.userName;
                    // If userName is not provided, create it from email
                    if (!userName || userName.trim().length === 0) {
                        userName = email.split('@')[0];
                        req.body.userName = userName;
                    }
                    validationResponse = validate(req, res);
                    if (validationResponse !== true) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) return [3 /*break*/, 2];
                    if (user.verified === true) {
                        return [2 /*return*/, res.status(400).send({
                                success: false,
                                error: USER_EMAIL_ALREADY_EXIST,
                            })];
                    }
                    return [3 /*break*/, 6];
                case 2: return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 3:
                    salt = _c.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, salt)];
                case 4:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.create({
                            data: {
                                userName: userName,
                                email: email,
                                password: hashedPassword,
                                role: role,
                                verified: false
                            },
                        })];
                case 5:
                    user = _c.sent();
                    _c.label = 6;
                case 6:
                    otp = crypto_2.default.randomInt(100000, 999999).toString();
                    otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
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
                case 7:
                    _c.sent();
                    return [4 /*yield*/, (0, SendOTPMail_js_1.SendOTPInMail)(otp, email)];
                case 8:
                    data = _c.sent();
                    if (data === null || data === void 0 ? void 0 : data.data) {
                        res.status(201).send({
                            success: true,
                            message: USER_SEND_OTP,
                            data: data,
                        });
                    }
                    else {
                        res.status(500).send({
                            success: false,
                            message: OTP_NOT_SENT,
                            data: data === null || data === void 0 ? void 0 : data.error,
                        });
                    }
                    return [3 /*break*/, 10];
                case 9:
                    error_1 = _c.sent();
                    console.error("User Register Error:", error_1);
                    return [2 /*return*/, res.status(500).send({
                            success: false,
                            error: GENERIC_ERROR_MESSAGE
                        })];
                case 10: return [2 /*return*/];
            }
        });
    });
}
var registerWithGoogle = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _b, idToken, role, response, payload, googleId, email, name_1, picture, validRoles, user, accessToken, refreshToken, error_2;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 7, , 8]);
                _b = req.body, idToken = _b.idToken, role = _b.role;
                if (!idToken) {
                    return [2 /*return*/, res.status(400).send({
                            success: false,
                            error: "ID token is required"
                        })];
                }
                client.setCredentials({ access_token: idToken });
                return [4 /*yield*/, client.request({ url: AUTH_URL })];
            case 1:
                response = _c.sent();
                payload = response.data;
                if (!payload) {
                    return [2 /*return*/, res.status(401).send({
                            success: false,
                            error: "Invalid ID token"
                        })];
                }
                googleId = payload.id, email = payload.email, name_1 = payload.name, picture = payload.picture;
                if (!googleId || !email || !name_1) {
                    return [2 /*return*/, res.status(400).send({
                            success: false,
                            error: "Invalid Google profile data"
                        })];
                }
                if (!role) {
                    return [2 /*return*/, res.status(400).send({
                            success: false,
                            error: ROLE_REQUIRED_ERROR
                        })];
                }
                validRoles = ['user', 'admin', 'employee', 'manager'];
                if (!validRoles.includes(role)) {
                    return [2 /*return*/, res.status(400).send({
                            success: false,
                            error: INVALID_ROLE_ERROR
                        })];
                }
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                        where: {
                            email: email,
                        },
                    })];
            case 2:
                user = _c.sent();
                if (!!user) return [3 /*break*/, 5];
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.create({
                        data: {
                            googleId: googleId,
                            email: email,
                            userName: name_1,
                            picture: picture,
                            verified: true,
                        },
                    })];
            case 3:
                user = _c.sent();
                accessToken = (0, VerifyAccessToken_js_1.generateAccessToken)(user);
                refreshToken = (0, VerifyAccessToken_js_1.generateRefreshToken)(user);
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                        where: {
                            id: user.id,
                        },
                        data: {
                            refreshToken: refreshToken,
                        },
                    })];
            case 4:
                _c.sent();
                return [2 /*return*/, res.status(201).send({
                        success: true,
                        message: USER_REGISTER_SUCCESS,
                        data: {
                            user: {
                                id: user.id,
                                email: user.email,
                                userName: user.userName,
                                picture: user.picture,
                                verified: user.verified,
                                role: user.role
                            },
                            accessToken: accessToken,
                            refreshToken: refreshToken
                        }
                    })];
            case 5:
                res.status(404).send({ success: false, error: USER_EMAIL_ALREADY_EXIST });
                _c.label = 6;
            case 6: return [3 /*break*/, 8];
            case 7:
                error_2 = _c.sent();
                console.error("Google Registration Error:", error_2);
                return [2 /*return*/, res.status(500).send({
                        success: false,
                        error: GENERIC_ERROR_MESSAGE
                    })];
            case 8: return [2 /*return*/];
        }
    });
}); };
exports.registerWithGoogle = registerWithGoogle;
var validate = function (req, res) {
    var _b = req.body, email = _b.email, password = _b.password, userName = _b.userName, role = _b.role;
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
    if (!password) {
        return res
            .status(400)
            .send({ success: false, error: PASSWORD_REQUIRED_ERROR });
    }
    if (!PASSWORD_REGEX.test(password)) {
        return res
            .status(400)
            .send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
    }
    if (!userName || userName.trim().length === 0) {
        return res
            .status(400)
            .send({ success: false, error: "Username is required!" });
    }
    if (!role) {
        return res
            .status(400)
            .send({ success: false, error: ROLE_REQUIRED_ERROR });
    }
    var validRoles = ['user', 'admin', 'employee', 'manager'];
    if (!validRoles.includes(role)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_ROLE_ERROR });
    }
    return true;
};
function ResetPassword(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, email, password, validationResponse, user, salt, hashedPassword, otp, otpExpiration, error_3;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 7, , 8]);
                    _b = req.body, email = _b.email, password = _b.password;
                    validationResponse = validate(req, res);
                    if (validationResponse !== true) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send({
                                success: false,
                                error: EMAIL_NOT_FOUND_ERROR,
                            })];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 2:
                    salt = _c.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, salt)];
                case 3:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                email: email,
                            },
                            data: {
                                password: hashedPassword,
                            },
                        })];
                case 4:
                    user = _c.sent();
                    otp = crypto_2.default.randomInt(100000, 999999).toString();
                    otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
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
                    return [4 /*yield*/, (0, SendOTPMail_js_1.SendOTPInMail)(otp, email)];
                case 6:
                    _c.sent();
                    return [2 /*return*/, res.status(200).send({
                            success: true,
                            message: USER_SEND_OTP,
                        })];
                case 7:
                    error_3 = _c.sent();
                    console.error("Password Reset Error:", error_3);
                    return [2 /*return*/, res.status(500).send({
                            success: false,
                            error: GENERIC_ERROR_MESSAGE
                        })];
                case 8: return [2 /*return*/];
            }
        });
    });
}
