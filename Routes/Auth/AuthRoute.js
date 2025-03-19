import express from "express";
import {
  Register,
  registerWithGoogle,
  ResetPassword,
} from "../../Controller/User/Register.js";
import { Login, loginWithGoogle } from "../../Controller/User/Login.js";
import { ResendOtp, VerifyOtp } from "../../Controller/User/VerifyOtp.js";
import { ForgotPasswordMail, SetNewPassword } from "../../Controller/User/ForgotPassword.js";
import { uploadImages } from "../../Components/Uploads/UploadImage.js";

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
authRouter.post(
  "/upload-image",
  uploadImages,
  (req, res) => {
    const uploadedFile = req.files?.images?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ message: "No image file uploaded." });
    }
    const image = {
      filename: uploadedFile.filename,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
    };
    return res.status(201).json({
      message: "Image uploaded successfully.",
      image,
    });
  }
);