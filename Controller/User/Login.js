import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import UserSchema from "../../Model/UserSchema.js";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerfiyAccessToken.js";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);

export async function Login(req, res) {
  const { email, password } = req.body;

  if (!email) {
    return res
      .status(400)
      .send({ success: false, error: "Email are required!" });
  }
  if (!password) {
    return res
      .status(400)
      .send({ success: false, error: "Password are required!" });
  }
  try {
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, error: "Email not found!" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ success: false, error: "wrong password!" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    user.refreshToken = refreshToken;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();

    const fullName = `${user.firstName} ${user.lastName}`.trim();

    res.status(201).send({
      success: true,
      message: "OTP has been successfully sent to your email address.",
      user,
      accessToken,
    });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .send({ success: false, error: "Server error, please try again later." });
  }
}

export const loginWithGoogle = async (req, res) => {
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

    if (user) {
      user.googleId = googleId;
      user.name = name;
      user.picture = picture;
      await user.save();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await user.save();
      return res.status(200).json({
        success: true,
        message: "User Login successfully",
        user,
        accessToken,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }
  } catch (error) {
    console.error("Error during Login:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
};
