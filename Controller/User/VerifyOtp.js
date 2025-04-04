import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import UserOtpSchema from "../../Model/UserOtpSchema.js";
import UserSchema from "../../Model/UserSchema.js";
import crypto from "crypto";
import { userContent } from "../../Constants/UserConstants.js";
import rateLimit from "express-rate-limit";

const {
  EMAIL_NOT_FOUND_ERROR,
  USER_REGISTER_SUCCESS,
  USER_EMAIL_ALREADY_VERIFIED,
  USER_INVALID_OTP,
  USER_OTP_EXPIRE,
  USER_EMAIL_VERIFIED,
  GENERIC_ERROR_MESSAGE,
  EMAIL_REQUIRED_ERROR,
  INVALID_EMAIL_FORMAT_ERROR,
  OTP_REQUIRED_ERROR,
  INVALID_OTP_FORMAT_ERROR,
  TOO_MANY_REQUESTS_ERROR,
  EMAIL_REGEX
} = userContent;

// Rate limiting configuration
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: { success: false, error: TOO_MANY_REQUESTS_ERROR }
});

const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per windowMs
  message: { success: false, error: TOO_MANY_REQUESTS_ERROR }
});

// Input validation middleware
const validateOtpInput = (req, res, next) => {
  const { email, otp } = req.body;

  if (!email) {
    return res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
  }

  if (!otp) {
    return res.status(400).send({ success: false, error: OTP_REQUIRED_ERROR });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res.status(400).send({ success: false, error: INVALID_OTP_FORMAT_ERROR });
  }

  next();
};

const validateEmailInput = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
  }

  next();
};

export async function VerifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await UserSchema.findOne({ email });
    
    if (!user) {
      return res.status(400).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    if (user.verified === "true") {
      return res.status(404).send({
        success: false,
        error: USER_EMAIL_ALREADY_VERIFIED,
      });
    }

    const otpRecord = await UserOtpSchema.findOne({ userId: user._id });

    if (!otpRecord || otpRecord.otp !== otp) {
      return res.status(400).send({ success: false, error: USER_INVALID_OTP });
    }

    if (otpRecord.expiresAt < new Date()) {
      await UserOtpSchema.deleteOne({ userId: user._id });
      return res.status(400).send({
        success: false,
        error: USER_OTP_EXPIRE,
      });
    }

    // Delete the used OTP
    await UserOtpSchema.deleteOne({ userId: user._id });
    
    // Generate new tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    
    // Update user verification status and tokens
    user.verified = true;
    user.refreshToken = refreshToken;
    user.lastLoginAt = new Date();
    await user.save();

    return res.status(200).send({
      success: true,
      message: USER_EMAIL_VERIFIED,
      user: {
        id: user._id,
        email: user.email,
        verified: user.verified,
        role:user.role
      },
      accessToken,
    });
  } catch (error) {
    console.error("OTP Verification Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

export async function ResendOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await UserSchema.findOne({ email });

    if (!user) {
      return res.status(400).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    if (user.verified === "true") {
      return res.status(201).send({
        success: true,
        message: USER_EMAIL_VERIFIED,
      });
    }

    // Delete any existing OTPs for this user
    await UserOtpSchema.deleteMany({ userId: user._id });

    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const otp = crypto.randomInt(100000, 999999).toString();

    await UserOtpSchema.create({
      userId: user._id,
      otp,
      expiresAt: otpExpiration,
      createdAt: new Date()
    });

    await SendOTPInMail(otp, email);

    return res.status(200).send({
      success: true,
      message: USER_REGISTER_SUCCESS,
    });
  } catch (error) {
    console.error("OTP Resending Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

// Export the rate limiters and validators
export { verifyOtpLimiter, resendOtpLimiter, validateOtpInput, validateEmailInput };
