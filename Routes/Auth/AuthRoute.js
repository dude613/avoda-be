import express from "express";
import {
  Register,
  registerWithGoogle,
  ResetPassword,
} from "../../Controller/User/Register.js";
import { Login, loginWithGoogle } from "../../Controller/User/Login.js";
import { ResendOtp, VerifyOtp } from "../../Controller/User/VerifyOtp.js";
import { ForgotPasswordMail, SetNewPassword } from "../../Controller/User/ForgotPassword.js";

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

// Hi Avi! These details are also not working, and I am facing the same issue. So, can we connect on a call?