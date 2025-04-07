import express from "express";
import {
  Register,
  registerWithGoogle,
  ResetPassword,
} from "../../Controller/User/Register"; // Removed .js
import { Login, loginWithGoogle } from "../../Controller/User/Login"; // Removed .js
import { ResendOtp, VerifyOtp } from "../../Controller/User/VerifyOtp"; // Removed .js
import {
  ForgotPasswordMail,
  SetNewPassword,
} from "../../Controller/User/ForgotPassword"; // Removed .js
import { uploadImages } from "../../Components/Uploads/UploadImage.js"; // Keep .js for JS imports
import {
  GetProfileData,
  UpdateProfileData,
  UpdateProfilePicture,
  GetAllUsers,
} from "../../Controller/User/UserProfile"; // Removed .js
import { verifyAccessToken } from "../../Components/VerifyAccessToken.js"; // Keep .js for JS imports
import { Logout } from "../../Controller/User/Logout"; // Removed .js

export const authRouter = express.Router();
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

authRouter.post(
  "/upload-image",
  uploadImages,
  UpdateProfilePicture,
  (err, req, res, next) => {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
    next();
  }
);
