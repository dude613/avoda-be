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

  const validationResponse = validate(req, res);
  if (validationResponse !== true) {
    return;
  }

  try {
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, error: "We couldn't find an account with this email. Please sign up" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ success: false, error: "Your password is not correct!" });
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
      message: "User logged in successfully",
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

const validate = (req, res) => {
  const { email, password } = req.body;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex = /^(?=(.*[A-Z]))(?=(.*\d))(?=(.*[\W_]))[A-Za-z\d\W_]{8,16}$/;
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
    return res.status(404).send({ success: false, error: "Password is required!" });
  }
  if (!passwordRegex.test(password)) {
    return res.status(404).send({ success: false, error: "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character." })
  }
  return true;
};