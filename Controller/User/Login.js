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
exports.loginWithGoogle = void 0;
exports.Login = Login;
var bcryptjs_1 = require("bcryptjs");
var dotenv_1 = require("dotenv");
dotenv_1.default.config();
var google_auth_library_1 = require("google-auth-library");
var VerifyAccessToken_js_1 = require("../../Components/VerifyAccessToken.js");
var UserConstants_js_1 = require("../../Constants/UserConstants.js");
var ConnectDatabase_js_1 = require("../../Components/ConnectDatabase.js");
var _b = UserConstants_js_1.userContent.errors, EMAIL_NOT_FOUND_ERROR = _b.EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR = _b.EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR = _b.INVALID_EMAIL_FORMAT_ERROR, PASSWORD_REQUIRED_INCORRECT = _b.PASSWORD_REQUIRED_INCORRECT, GENERIC_ERROR_MESSAGE = _b.GENERIC_ERROR_MESSAGE, USER_LOGIN_SUCCESS = UserConstants_js_1.userContent.success.USER_LOGIN_SUCCESS, _c = UserConstants_js_1.userContent.messages, PASSWORD_REQUIRED_ERROR = _c.PASSWORD_REQUIRED_ERROR, PASSWORD_COMPLEXITY_ERROR = _c.PASSWORD_COMPLEXITY_ERROR, _d = UserConstants_js_1.userContent.validations, EMAIL_REGEX = _d.EMAIL, PASSWORD_REGEX = _d.PASSWORD_REGEX;
var CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
var AUTH_URL = process.env.AUTH_URL;
var client = new google_auth_library_1.OAuth2Client(CLIENT_ID);
function Login(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, email, password, validationResponse, user_1, isMatch, accessToken, refreshToken_1, otp_1, otpExpiry_1, saveError_1, onboardingSkipped, organization, orgError_1, error_1;
        var _this = this;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _b = req.body, email = _b.email, password = _b.password;
                    validationResponse = validate(req, res);
                    if (validationResponse !== true) {
                        return [2 /*return*/];
                    }
                    _c.label = 1;
                case 1:
                    _c.trys.push([1, 12, , 13]);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                email: email,
                            },
                        })];
                case 2:
                    user_1 = _c.sent();
                    if (!user_1) {
                        return [2 /*return*/, res
                                .status(400)
                                .send({ success: false, error: EMAIL_NOT_FOUND_ERROR })];
                    }
                    return [4 /*yield*/, bcryptjs_1.default.compare(password, user_1.password)];
                case 3:
                    isMatch = _c.sent();
                    if (!isMatch) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: PASSWORD_REQUIRED_INCORRECT })];
                    }
                    accessToken = (0, VerifyAccessToken_js_1.generateAccessToken)(user_1);
                    refreshToken_1 = (0, VerifyAccessToken_js_1.generateRefreshToken)(user_1);
                    if (!accessToken || !refreshToken_1) {
                        return [2 /*return*/, res.status(500).send({
                                success: false,
                                error: "Failed to generate authentication tokens"
                            })];
                    }
                    otp_1 = Math.floor(100000 + Math.random() * 900000).toString();
                    otpExpiry_1 = new Date(Date.now() + 10 * 60 * 1000);
                    _c.label = 4;
                case 4:
                    _c.trys.push([4, 6, , 7]);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.$transaction(function (prisma) { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0: return [4 /*yield*/, prisma.user.update({
                                            where: {
                                                id: user_1.id,
                                            },
                                            data: {
                                                refreshToken: refreshToken_1,
                                                otp: otp_1,
                                                otpExpiry: otpExpiry_1
                                            },
                                        })];
                                    case 1:
                                        _b.sent();
                                        return [2 /*return*/];
                                }
                            });
                        }); })];
                case 5:
                    _c.sent();
                    return [3 /*break*/, 7];
                case 6:
                    saveError_1 = _c.sent();
                    console.error("Error saving user:", saveError_1);
                    return [2 /*return*/, res.status(500).send({
                            success: false,
                            error: "Failed to update user session",
                        })];
                case 7:
                    onboardingSkipped = false;
                    _c.label = 8;
                case 8:
                    _c.trys.push([8, 10, , 11]);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.organization.findFirst({
                            where: {
                                userId: user_1.id,
                            },
                        })];
                case 9:
                    organization = _c.sent();
                    if (organization) {
                        onboardingSkipped = organization.onboardingSkipped;
                    }
                    return [3 /*break*/, 11];
                case 10:
                    orgError_1 = _c.sent();
                    console.error("Error fetching organization:", orgError_1);
                    return [3 /*break*/, 11];
                case 11:
                    res.status(200).send({
                        success: true,
                        message: USER_LOGIN_SUCCESS,
                        user: {
                            id: user_1.id,
                            email: user_1.email,
                            name: user_1.name,
                            picture: user_1.picture,
                            role: user_1.role
                            // Only send necessary user data
                        },
                        onboardingSkipped: onboardingSkipped,
                        accessToken: accessToken,
                    });
                    return [3 /*break*/, 13];
                case 12:
                    error_1 = _c.sent();
                    console.error("Error during login:", error_1);
                    if (error_1.name === 'MongoError') {
                        return [2 /*return*/, res.status(503).send({
                                success: false,
                                error: "Database service temporarily unavailable"
                            })];
                    }
                    res.status(500).send({
                        success: false,
                        error: GENERIC_ERROR_MESSAGE
                    });
                    return [3 /*break*/, 13];
                case 13: return [2 /*return*/];
            }
        });
    });
}
var loginWithGoogle = function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var idToken, response, payload, googleId, email, name_1, picture, user, saveError_2, accessToken, refreshToken, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                idToken = req.body.idToken;
                if (!idToken)
                    return [2 /*return*/, res
                            .status(400)
                            .send({ success: false, error: "ID token is required" })];
                _b.label = 1;
            case 1:
                _b.trys.push([1, 11, , 12]);
                client.setCredentials({ access_token: idToken });
                return [4 /*yield*/, client.request({ url: AUTH_URL })];
            case 2:
                response = _b.sent();
                payload = response.data;
                if (!payload || !payload.id || !payload.email) {
                    return [2 /*return*/, res
                            .status(401)
                            .send({ success: false, error: "Invalid Google authentication response" })];
                }
                googleId = payload.id, email = payload.email, name_1 = payload.name, picture = payload.picture;
                if (!googleId || !email) {
                    return [2 /*return*/, res
                            .status(400)
                            .send({ success: false, error: "Invalid Google authentication data" })];
                }
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                        where: {
                            email: email,
                        },
                    })];
            case 3:
                user = _b.sent();
                if (!user) return [3 /*break*/, 9];
                _b.label = 4;
            case 4:
                _b.trys.push([4, 6, , 7]);
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                        where: {
                            email: email,
                        },
                        data: {
                            googleId: googleId,
                            userName: name_1,
                            picture: picture,
                        },
                    })];
            case 5:
                _b.sent();
                return [3 /*break*/, 7];
            case 6:
                saveError_2 = _b.sent();
                console.error("Error saving user:", saveError_2);
                return [2 /*return*/, res.status(500).send({
                        success: false,
                        error: "Failed to update user profile"
                    })];
            case 7:
                accessToken = (0, VerifyAccessToken_js_1.generateAccessToken)(user);
                refreshToken = (0, VerifyAccessToken_js_1.generateRefreshToken)(user);
                if (!accessToken || !refreshToken) {
                    return [2 /*return*/, res.status(500).send({
                            success: false,
                            error: "Failed to generate authentication tokens"
                        })];
                }
                return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                        where: {
                            id: user.id,
                        },
                        data: {
                            refreshToken: refreshToken,
                        },
                    })];
            case 8:
                _b.sent();
                return [2 /*return*/, res.status(200).send({
                        success: true,
                        message: USER_LOGIN_SUCCESS,
                        user: {
                            id: user.id,
                            email: user.email,
                            name: user.name,
                            picture: user.picture,
                            role: user.role
                        },
                        accessToken: accessToken,
                    })];
            case 9: return [2 /*return*/, res.status(400).send({
                    success: false,
                    message: EMAIL_NOT_FOUND_ERROR,
                })];
            case 10: return [3 /*break*/, 12];
            case 11:
                error_2 = _b.sent();
                console.error("Error during Google Login:", error_2);
                if (error_2.name === 'MongoError') {
                    return [2 /*return*/, res.status(503).send({
                            success: false,
                            error: "Database service temporarily unavailable"
                        })];
                }
                return [2 /*return*/, res.status(500).send({
                        success: false,
                        error: GENERIC_ERROR_MESSAGE
                    })];
            case 12: return [2 /*return*/];
        }
    });
}); };
exports.loginWithGoogle = loginWithGoogle;
var validate = function (req, res) {
    var _b = req.body, email = _b.email, password = _b.password;
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
        return res.status(404).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
    }
    if (!PASSWORD_REGEX.test(password)) {
        return res.status(404).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
    }
    return true;
};
