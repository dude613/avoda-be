import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerfiyAccessToken.js";
import UserOtpSchema from "../../Model/UserOtpSchema.js";
import UserSchema from "../../Model/UserSchema.js";
import crypto from "crypto";

export async function VerifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "This email doesn't exist in database. Please use a different email!" });
    }
    if (user.verified === "true") {
      return res.status(201).send({
        success: false,
        error: "This email already verified!",
      });
    }
    const otpRecord = await UserOtpSchema.findOne({ userId: user._id });

    if (!otpRecord || otpRecord.otp !== String(otp)) {
      return res.status(400).send({ success: false, message: "Invalid OTP." });
    }

    if (otpRecord.expiresAt < new Date()) {
      return res.status(400).send({
        success: false,
        message: "OTP expired. Please request a new one.",
      });
    }

    await UserOtpSchema.deleteOne({ userId: user._id });
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.verified = true;
    user.refreshToken = refreshToken;
    await user.save();
    return res.status(200).send({
      success: true,
      message: "Email verified successfully!",
      user,
      accessToken,
    });
  } catch (error) {
    console.log("OTP Verification Error:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
}

export async function ResendOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res
        .status(400)
        .send({ success: false, message: "User not found." });
    }

    if (user.verified === "true") {
      return res.status(201).send({
        success: true,
        message: "Email already verified!",
      });
    }

    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    let otp;

    const existingOtp = await UserOtpSchema.findOne({ userId: user._id });
    if (existingOtp && existingOtp.expiresAt > new Date()) {
      otp = existingOtp.otp;
    } else {
      otp = crypto.randomInt(100000, 999999).toString();
      await UserOtpSchema.findOneAndUpdate(
        { userId: user._id },
        { otp, expiresAt: otpExpiration },
        { upsert: true, new: true }
      );
    }

    await SendOTPInMail(otp, email);

    return res.status(200).send({
      success: true,
      message: "User has been registered successfully!",
    });
  } catch (error) {
    console.log("OTP Resending Error:", error.message);
    return res.status(500).send({ success: false, error: error.message });
  }
}
