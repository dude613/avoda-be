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
exports.ForgotPasswordMail = ForgotPasswordMail;
exports.SetNewPassword = SetNewPassword;
var bcryptjs_1 = require("bcryptjs");
var dotenv_1 = require("dotenv");
var crypto_2 = require("crypto");
var google_auth_library_1 = require("google-auth-library");
var ForgotTemplate_js_1 = require("../../Components/MailerComponents/ForgotTemplate.js");
var UserConstants_js_1 = require("../../Constants/UserConstants.js");
var MailerConstants_js_1 = require("../../Constants/MailerConstants.js");
var ConnectDatabase_js_1 = require("../../Components/ConnectDatabase.js");
dotenv_1.default.config();
var _b = UserConstants_js_1.userContent.errors, EMAIL_NOT_FOUND_ERROR = _b.EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR = _b.EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR = _b.INVALID_EMAIL_FORMAT_ERROR, GENERIC_ERROR_MESSAGE = _b.GENERIC_ERROR_MESSAGE, GOOGLE_LOGIN_REQUIRED = _b.GOOGLE_LOGIN_REQUIRED, PASSWORD_UPDATED_SUCCESS = UserConstants_js_1.userContent.success.PASSWORD_UPDATED_SUCCESS, _c = UserConstants_js_1.userContent.messages, PASSWORD_REQUIRED_ERROR = _c.PASSWORD_REQUIRED_ERROR, PASSWORD_COMPLEXITY_ERROR = _c.PASSWORD_COMPLEXITY_ERROR, PASSWORD_RESET_EMAIL_SENT = _c.PASSWORD_RESET_EMAIL_SENT, _d = UserConstants_js_1.userContent.validations, EMAIL_REGEX = _d.EMAIL, PASSWORD_REGEX = _d.PASSWORD_REGEX;
var CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var AUTH_URL = process.env.AUTH_URL;
var client = new google_auth_library_1.OAuth2Client(CLIENT_ID);
var FRONTEND_URL = process.env.FRONTEND_URL;
var RESET_LINK_BASE = MailerConstants_js_1.mailerContent.RESET_LINK_BASE;
function ForgotPasswordMail(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var email_1, validationResponse, user, resetToken, expiryTime, updatedUser, resetLink, decodedLink, error_1;
        var _this = this;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 4, , 5]);
                    email_1 = req.body.email;
                    validationResponse = validate(req, res);
                    if (validationResponse !== true) {
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email_1,
                            },
                        })];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res
                                .status(404)
                                .json({ success: false, error: EMAIL_NOT_FOUND_ERROR })];
                    }
                    // Check if user has googleId (Google-based login)
                    if (user.googleId) {
                        return [2 /*return*/, res.status(400).json({
                                success: false,
                                error: GOOGLE_LOGIN_REQUIRED,
                            })];
                    }
                    resetToken = crypto_2.default.randomBytes(32).toString("hex");
                    expiryTime = new Date(Date.now() + 15 * 60 * 1000);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                email: email_1,
                            },
                            data: {
                                resetPasswordToken: resetToken,
                                resetPasswordExpires: expiryTime,
                            },
                        })];
                case 2:
                    updatedUser = _b.sent();
                    if (!updatedUser) {
                        throw new Error("Failed to update user with reset token");
                    }
                    resetLink = "".concat(RESET_LINK_BASE, "?email=").concat(encodeURIComponent(email_1), "&token=").concat(resetToken);
                    decodedLink = decodeURIComponent(resetLink);
                    return [4 /*yield*/, (0, ForgotTemplate_js_1.ForgotTemplate)(email_1, decodedLink)];
                case 3:
                    _b.sent();
                    res.status(200).send({ success: true, message: PASSWORD_RESET_EMAIL_SENT });
                    // Schedule token cleanup
                    setTimeout(function () { return __awaiter(_this, void 0, void 0, function () {
                        var cleanupError_1;
                        return __generator(this, function (_b) {
                            switch (_b.label) {
                                case 0:
                                    _b.trys.push([0, 2, , 3]);
                                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.updateMany({
                                            where: {
                                                email: email_1,
                                                resetPasswordExpires: {
                                                    lt: new Date(),
                                                },
                                            },
                                            data: {
                                                resetPasswordToken: null,
                                                resetPasswordExpires: null,
                                            },
                                        })];
                                case 1:
                                    _b.sent();
                                    return [3 /*break*/, 3];
                                case 2:
                                    cleanupError_1 = _b.sent();
                                    console.error("Error cleaning up reset token:", cleanupError_1);
                                    return [3 /*break*/, 3];
                                case 3: return [2 /*return*/];
                            }
                        });
                    }); }, 15 * 60 * 1000);
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _b.sent();
                    console.error("Error in ForgotPasswordMail:", error_1);
                    res
                        .status(500)
                        .json({ success: false, error: error_1.message || GENERIC_ERROR_MESSAGE });
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
var validate = function (req, res) {
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
    return true;
};
function SetNewPassword(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, email, password, user, isMatch, salt, hashedPassword, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 6, , 7]);
                    _b = req.body, email = _b.email, password = _b.password;
                    // Validate email
                    if (!email) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: EMAIL_REQUIRED_ERROR })];
                    }
                    if (!EMAIL_REGEX.test(email)) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR })];
                    }
                    // Validate password
                    if (!password) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: PASSWORD_REQUIRED_ERROR })];
                    }
                    if (!PASSWORD_REGEX.test(password)) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: PASSWORD_COMPLEXITY_ERROR })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 1:
                    user = _c.sent();
                    if (!user) {
                        return [2 /*return*/, res
                                .status(404)
                                .json({ success: false, error: EMAIL_NOT_FOUND_ERROR })];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.compare(password, user.password)];
                case 2:
                    isMatch = _c.sent();
                    if (isMatch) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: PASSWORD_ALREADY_EXIST })];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.genSalt(10)];
                case 3:
                    salt = _c.sent();
                    return [4 /*yield*/, bcryptjs_1.default.hash(password, salt)];
                case 4:
                    hashedPassword = _c.sent();
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                email: email,
                            },
                            data: {
                                password: hashedPassword,
                            },
                        })];
                case 5:
                    _c.sent();
                    return [2 /*return*/, res
                            .status(200)
                            .json({ success: true, message: PASSWORD_UPDATED_SUCCESS })];
                case 6:
                    error_2 = _c.sent();
                    console.error("Error in SetNewPassword:", error_2);
                    return [2 /*return*/, res
                            .status(500)
                            .json({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 7: return [2 /*return*/];
            }
        });
    });
}
