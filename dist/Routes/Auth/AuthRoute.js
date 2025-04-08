import express from "express";
// Import controller functions - Add .js extension for NodeNext compatibility
import { Register, registerWithGoogle, ResetPassword, } from "../../Controller/User/Register.js";
import { Login, loginWithGoogle } from "../../Controller/User/Login.js";
import { ResendOtp, VerifyOtp } from "../../Controller/User/VerifyOtp.js";
import { ForgotPasswordMail, SetNewPassword, } from "../../Controller/User/ForgotPassword.js";
import { GetProfileData, UpdateProfileData, UpdateProfilePicture, GetAllUsers, } from "../../Controller/User/UserProfile.js";
import { Logout } from "../../Controller/User/Logout.js";
// Import JS components/middleware - Keep .js extension
import { uploadImages } from "../../Components/Uploads/UploadImage.js"; // Keep .js extension
import { verifyAccessToken } from "../../Components/VerifyAccessToken.js"; // Keep .js extension
export const authRouter = express.Router();
// Assuming Controller functions are compatible Express route handlers
// Assuming verifyAccessToken and uploadImages are compatible Express middleware
authRouter.post("/register", Register);
authRouter.post("/verify-otp", VerifyOtp);
authRouter.post("/resend-otp", ResendOtp);
authRouter.post("/google-register", registerWithGoogle);
authRouter.post("/login", Login);
authRouter.post("/google-login", loginWithGoogle);
authRouter.post("/forgot-password", ForgotPasswordMail);
authRouter.post("/reset-password", ResetPassword);
authRouter.post("/new-password", SetNewPassword);
authRouter.get("/get-profile/:userId", verifyAccessToken, GetProfileData);
authRouter.put("/update-profile/", verifyAccessToken, UpdateProfileData);
authRouter.post("/logout", Logout);
authRouter.get("/allUserInfo/:userId", verifyAccessToken, GetAllUsers);
// Define the error handler specifically for the upload route
const uploadErrorHandler = (err, req, res, next) => {
    // Log the actual error for debugging
    console.error("Upload Error:", err.message || err);
    // Send a generic error response to the client
    res.status(500).json({
        success: false, // Added success field for consistency
        message: "Image upload failed",
        // Optionally include error details in development
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
    // next() is typically not called after sending a response in an error handler unless you want further error handling
};
authRouter.post("/upload-image", verifyAccessToken, // Added verifyAccessToken for consistency, assuming uploads require auth
uploadImages, UpdateProfilePicture, uploadErrorHandler // Use the typed error handler
);
//# sourceMappingURL=AuthRoute.js.map