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
exports.GetProfileData = GetProfileData;
exports.UpdateProfileData = UpdateProfileData;
exports.UpdateProfilePicture = UpdateProfilePicture;
exports.GetAllUsers = GetAllUsers;
var UserConstants_js_1 = require("../../Constants/UserConstants.js");
var dotenv_1 = require("dotenv");
var ConnectDatabase_js_1 = require("../../Components/ConnectDatabase.js");
dotenv_1.default.config();
var _b = UserConstants_js_1.userContent.errors, EMAIL_REQUIRED_ERROR = _b.EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR = _b.INVALID_EMAIL_FORMAT_ERROR, GENERIC_ERROR_MESSAGE = _b.GENERIC_ERROR_MESSAGE, USER_NOT_FOUND = _b.USER_NOT_FOUND, INVALID_USER_ID = _b.INVALID_USER_ID, INVALID_FILE_TYPE = _b.INVALID_FILE_TYPE, FILE_SIZE_EXCEEDED = _b.FILE_SIZE_EXCEEDED, NO_FILE_UPLOADED = _b.NO_FILE_UPLOADED, USER_PROFILE_DATA_SUCCESS = UserConstants_js_1.userContent.success.USER_PROFILE_DATA_SUCCESS, EMAIL_REGEX = UserConstants_js_1.userContent.validations.EMAIL;
var BACKEND_URL = process.env.BASE_URL || "http://localhost:8001";
var MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
var ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];
function GetProfileData(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, user, error_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 2, , 3]);
                    userId = req.params.userId;
                    if (!userId || isNaN(Number(userId))) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: "Invalid user ID" })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                id: parseInt(userId),
                            },
                        })];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: INVALID_USER_ID })];
                    }
                    return [2 /*return*/, res.status(200).send({ success: true, message: USER_PROFILE_DATA_SUCCESS, data: user })];
                case 2:
                    error_1 = _b.sent();
                    console.error("Error fetching user data: ", error_1);
                    return [2 /*return*/, res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function UpdateProfileData(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var _b, userId, name_1, email, role, updatedUser, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    _b = req.body, userId = _b.userId, name_1 = _b.name, email = _b.email, role = _b.role;
                    if (!userId || isNaN(Number(userId))) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: "Invalid user ID" })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                id: parseInt(userId),
                            },
                            data: {
                                userName: name_1,
                                email: email,
                                role: role,
                            },
                        })];
                case 1:
                    updatedUser = _c.sent();
                    return [2 /*return*/, res.status(200).send({
                            success: true,
                            message: "User profile updated successfully",
                            data: {
                                userName: updatedUser.userName,
                                email: updatedUser.email,
                                role: updatedUser.role,
                            },
                        })];
                case 2:
                    error_2 = _c.sent();
                    console.error("Error updating user profile: ", error_2);
                    return [2 /*return*/, res
                            .status(500)
                            .send({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function UpdateProfilePicture(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, uploadedFile, imagePath, error_3, error_4;
        var _b, _c;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 5, , 6]);
                    userId = req.body.userId;
                    if (!userId || isNaN(Number(userId))) {
                        return [2 /*return*/, res.status(400).send({ success: false, error: "Invalid user ID" })];
                    }
                    uploadedFile = (_c = (_b = req.files) === null || _b === void 0 ? void 0 : _b.images) === null || _c === void 0 ? void 0 : _c[0];
                    if (!uploadedFile) {
                        return [2 /*return*/, res.status(400).json({ success: false, error: NO_FILE_UPLOADED })];
                    }
                    if (!ALLOWED_FILE_TYPES.includes(uploadedFile.mimetype)) {
                        return [2 /*return*/, res.status(400).json({ success: false, error: INVALID_FILE_TYPE })];
                    }
                    if (uploadedFile.size > MAX_FILE_SIZE) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ success: false, error: FILE_SIZE_EXCEEDED })];
                    }
                    imagePath = "".concat(BACKEND_URL, "/uploads/").concat(uploadedFile.filename);
                    _d.label = 1;
                case 1:
                    _d.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.update({
                            where: {
                                id: parseInt(userId),
                            },
                            data: {
                                picture: imagePath,
                            },
                        })];
                case 2:
                    _d.sent();
                    return [3 /*break*/, 4];
                case 3:
                    error_3 = _d.sent();
                    console.error("Error updating profile picture: ", error_3);
                    return [2 /*return*/, res
                            .status(404)
                            .send({ success: false, error: USER_NOT_FOUND })];
                case 4: return [2 /*return*/, res.status(201).send({
                        success: true,
                        message: "Image uploaded and profile updated successfully.",
                        image: {
                            filename: uploadedFile.filename,
                            path: imagePath,
                        },
                    })];
                case 5:
                    error_4 = _d.sent();
                    console.error("Error updating user profile picture:", error_4);
                    return [2 /*return*/, res
                            .status(500)
                            .json({ success: false, error: GENERIC_ERROR_MESSAGE })];
                case 6: return [2 /*return*/];
            }
        });
    });
}
var validate = function (req, res) {
    var _b = req.body, email = _b.email, role = _b.role, name = _b.name, userId = _b.userId;
    if (!userId) {
        return res.status(400).send({ success: false, error: INVALID_USER_ID });
    }
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
    if (name && name.length < 2) {
        return res.status(400).send({
            success: false,
            error: "Name must be at least 2 characters long",
        });
    }
    var validRoles = ["user", "admin", "employee", "manager"];
    if (role && !validRoles.includes(role)) {
        return res.status(400).send({
            success: false,
            error: "Invalid role. Valid roles are: user, admin, employee, manager.",
        });
    }
    return true;
};
function GetAllUsers(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var userId, user, allUserDetails, error_5;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    _b.trys.push([0, 3, , 4]);
                    userId = req.params.userId;
                    if (!userId) {
                        return [2 /*return*/, res
                                .status(404)
                                .send({ success: false, error: "user id is required" })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findUnique({
                            where: {
                                id: parseInt(userId),
                            },
                        })];
                case 1:
                    user = _b.sent();
                    if (!user) {
                        return [2 /*return*/, res.status(404).send({
                                success: false,
                                error: "User with the given user ID not found!",
                            })];
                    }
                    return [4 /*yield*/, ConnectDatabase_js_1.prisma.user.findMany({
                            select: {
                                name: true,
                                email: true,
                                role: true,
                                picture: true,
                            },
                        })];
                case 2:
                    allUserDetails = _b.sent();
                    if (!allUserDetails || allUserDetails.length === 0) {
                        return [2 /*return*/, res.status(404).send({
                                success: false,
                                error: "No user found !",
                            })];
                    }
                    return [2 /*return*/, res.status(200).send({
                            success: true,
                            message: "Team members retrieved successfully!",
                            allUserDetails: allUserDetails,
                        })];
                case 3:
                    error_5 = _b.sent();
                    console.log("Error getting team members:", error_5.message);
                    return [2 /*return*/, res
                            .status(500)
                            .send({ error: "Internal server error. Please try again!" })];
                case 4: return [2 /*return*/];
            }
        });
    });
}
