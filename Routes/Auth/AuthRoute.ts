import express from "express";
import {
  Register,
  registerWithGoogle,
  ResetPassword,
} from "../../Controller/User/Register.js";
import { Login, loginWithGoogle } from "../../Controller/User/Login.js";
import { ResendOtp, VerifyOtp } from "../../Controller/User/VerifyOtp.js";
import {
  ForgotPasswordMail,
  SetNewPassword,
} from "../../Controller/User/ForgotPassword.js";
import { uploadImages } from "../../Components/Uploads/UploadImage.js";
import {
  GetProfileData,
  UpdateProfileData,
  UpdateProfilePicture,
  GetAllUsers,
} from "../../Controller/User/UserProfile.js";
import { verifyAccessToken } from "../../Components/VerifyAccessToken.js";
import { Logout } from "../../Controller/User/Logout.js";

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
  (err: { message: any; }, req: any, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: { message: string; error: any; }): void; new(): any; }; }; }, next: () => void) => {
    console.error(err);
    res
      .status(500)
      .json({ message: "Internal Server Error", error: err.message });
    next();
  }
);
