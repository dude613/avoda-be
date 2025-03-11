import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerfiyAccessToken.js";
import { SendOTPInMail } from "../../Components/Transporter.js";
import UserSchema from "../../Model/UserSchema.js";
import UserOtpSchema from "../../Model/UserOtpSchema.js";

dotenv.config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);

export async function Register(req, res) {
  try {
    const { email, password } = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }
    let user = await UserSchema.findOne({ email });

    if (user) {
      return res.status(400).send({
        success: false,
        error:
          "This email is already registered. Please use a different email!",
      });
    }
    user = new UserSchema({ email, password });
    await user.save();

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    await UserOtpSchema.findOneAndUpdate(
      { userId: user._id },
      { otp, expiresAt: otpExpiration },
      { upsert: true, new: true }
    );
    await SendOTPInMail(otp, email);
    res.status(201).send({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    console.log("User Register Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export const registerWithGoogle = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken)
    return res
      .status(400)
      .json({ success: false, error: "ID token is required" });
  try {
    client.setCredentials({ access_token: idToken });
    const response = await client.request({ url: AUTH_URL });
    const payload = response.data;
    if (!payload)
      return res
        .status(401)
        .json({ success: false, error: "Invalid ID token" });
    const { id: googleId, email, name, picture } = payload;
    if (!googleId) {
      return res
        .status(400)
        .json({ success: false, error: "Invalid Google ID" });
    }
    let user = await UserSchema.findOne({ email });
    if (!user) {
      user = new UserSchema({
        googleId,
        email,
        name,
        picture,
        verified: true,
      });
      await user.save();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await user.save();
      return res.status(201).json({
        success: true,
        message: "User Registered successfully",
        user,
        accessToken,
      });
    } else {
      res.status(404).send({ success: false, msg: "User already exists" });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};

const validate = (req, res) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email) {
    return res
      .status(400)
      .send({ success: false, error: "email is required!" });
  }
  if (!emailRegex.test(email)) {
    return res
      .status(400)
      .send({ success: false, error: "Invalid email format!" });
  }
  if (!password) {
    return res
      .status(400)
      .send({ success: false, error: "password is required!" });
  }
  return true;
};


export async function ForgotPasswordMail(req, res) {
  try {
    const { email} = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }
    let user = await UserSchema.findOne({ email });

    if (user) {
      return res.status(400).send({
        success: false,
        error:
          "This email is already registered. Please use a different email!",
      });
    }
    user = new UserSchema({ email, password });
    await user.save();

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    await UserOtpSchema.findOneAndUpdate(
      { userId: user._id },
      { otp, expiresAt: otpExpiration },
      { upsert: true, new: true }
    );
    await SendOTPInMail(otp, email);
    res.status(201).send({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    console.log("User Register Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}

export async function ResetPassword(req, res) {
  try {
    const { email, password } = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }
    let user = await UserSchema.findOne({ email });

    if (user) {
      return res.status(400).send({
        success: false,
        error:
          "This email is already registered. Please use a different email!",
      });
    }
    user = new UserSchema({ email, password });
    await user.save();

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    await UserOtpSchema.findOneAndUpdate(
      { userId: user._id },
      { otp, expiresAt: otpExpiration },
      { upsert: true, new: true }
    );
    await SendOTPInMail(otp, email);
    res.status(201).send({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    console.log("User Register Error:", error.message);
    return res.status(500).json({ success: false, error: error.message });
  }
}
