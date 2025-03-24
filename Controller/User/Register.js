import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import UserSchema from "../../Model/UserSchema.js";
import UserOtpSchema from "../../Model/UserOtpSchema.js";
import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import {
  EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR, PASSWORD_REQUIRED_ERROR
  ,EMAIL_REGEX,  
  USER_SEND_OTP,
  USER_REGISTER_SUCCESS,
  USER_EMAIL_ALREADY_EXIST
} from "../../Constants/UserConstants.js";

dotenv.config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);

export async function Register(req, res) {
  try {
    const { userName, email, password } = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }
    let user = await UserSchema.findOne({ email });
    if (user) {
      if (user.verified === "true") {
        return res.status(400).send({
          success: false,
          error: EMAIL_NOT_FOUND_ERROR,
        });
      }
    } else {
      user = new UserSchema({ userName, email, password });
      await user.save();
    }

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
      message: USER_SEND_OTP,
    });
  } catch (error) {
    console.log("User Register Error:", error.message);
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

export const registerWithGoogle = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken)
    return res
      .status(400)
      .send({ success: false, error: "ID token is required" });
  try {
    client.setCredentials({ access_token: idToken });
    const response = await client.request({ url: AUTH_URL });
    const payload = response.data;
    if (!payload)
      return res
        .status(401)
        .send({ success: false, error: "Invalid ID token" });
    const { id: googleId, email, name, picture } = payload;
    if (!googleId) {
      return res
        .status(400)
        .send({ success: false, error: "Invalid Google ID" });
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
      return res.status(201).send({
        success: true,
        message: USER_REGISTER_SUCCESS,
        user,
        accessToken,
      });
    } else {
      res.status(404).send({ success: false, error: USER_EMAIL_ALREADY_EXIST });
    }
  } catch (error) {
    console.error("Error during registration:", error);
    return res
      .status(500)
      .send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
};

const validate = (req, res) => {
  const { email, password } = req.body;
  
  if (!email) {
    return res
      .status(400)
      .send({ success: false, error: EMAIL_REQUIRED_ERROR });
  }
  if (!EMAIL_REGEX.test(email)) {
    return res
      .status(400)
      .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
  }
  if (!password) {
    return res
      .status(400)
      .send({ success: false, error: PASSWORD_REQUIRED_ERROR });
  }
  return true;
};

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
          USER_EMAIL_ALREADY_EXIST,
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
      message: USER_REGISTER_SUCCESS,
    });
  } catch (error) {
    console.log("User Register Error:", error.message);
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}
