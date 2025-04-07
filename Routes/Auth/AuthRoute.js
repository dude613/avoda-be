"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRouter = void 0;
var express_1 = require("express");
var Register_js_1 = require("../../Controller/User/Register.js");
var Login_js_1 = require("../../Controller/User/Login.js");
var VerifyOtp_js_1 = require("../../Controller/User/VerifyOtp.js");
var ForgotPassword_js_1 = require("../../Controller/User/ForgotPassword.js");
var UploadImage_js_1 = require("../../Components/Uploads/UploadImage.js");
var UserProfile_js_1 = require("../../Controller/User/UserProfile.js");
var VerifyAccessToken_js_1 = require("../../Components/VerifyAccessToken.js");
var Logout_js_1 = require("../../Controller/User/Logout.js");
exports.authRouter = express_1.default.Router();
exports.authRouter.post("/register", Register_js_1.Register);
exports.authRouter.post("/verify-otp", VerifyOtp_js_1.VerifyOtp);
exports.authRouter.post("/resend-otp", VerifyOtp_js_1.ResendOtp);
exports.authRouter.post("/google-register", Register_js_1.registerWithGoogle);
exports.authRouter.post("/login", Login_js_1.Login);
exports.authRouter.post("/google-login", Login_js_1.loginWithGoogle);
exports.authRouter.post("/forgot-password", ForgotPassword_js_1.ForgotPasswordMail);
exports.authRouter.post("/reset-password", Register_js_1.ResetPassword);
exports.authRouter.post("/new-password", ForgotPassword_js_1.SetNewPassword);
exports.authRouter.get("/get-profile/:userId", VerifyAccessToken_js_1.verifyAccessToken, UserProfile_js_1.GetProfileData);
exports.authRouter.put("/update-profile/", VerifyAccessToken_js_1.verifyAccessToken, UserProfile_js_1.UpdateProfileData);
exports.authRouter.post("/logout", Logout_js_1.Logout);
exports.authRouter.get("/allUserInfo/:userId", VerifyAccessToken_js_1.verifyAccessToken, UserProfile_js_1.GetAllUsers);
exports.authRouter.post("/upload-image", UploadImage_js_1.uploadImages, UserProfile_js_1.UpdateProfilePicture, function (err, req, res, next) {
    console.error(err);
    res
        .status(500)
        .json({ message: "Internal Server Error", error: err.message });
    next();
});
