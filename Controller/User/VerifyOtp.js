import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import { prisma } from "../../Components/ConnectDatabase.js";
import crypto from "crypto";
import { userContent } from "../../Constants/UserConstants.js";
import rateLimit from "express-rate-limit";

const {
  errors: {
    EMAIL_NOT_FOUND_ERROR,
    EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR,
    USER_EMAIL_ALREADY_VERIFIED,
    USER_INVALID_OTP,
    GENERIC_ERROR_MESSAGE,
    TOO_MANY_REQUESTS_ERROR,
    OTP_NOT_SENT,
  },
  success: { USER_EMAIL_VERIFIED, USER_REGISTER_SUCCESS, USER_SEND_OTP },
  messages: { USER_OTP_EXPIRE },
  validations: { EMAIL: EMAIL_REGEX },
} = userContent;

// Rate limiting configuration
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per windowMs
  message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
});

const resendOtpLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per windowMs
  message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
});

// Input validation middleware
const validateOtpInput = (req, res, next) => {
  const { email, otp } = req.body;

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

  if (!otp) {
    return res.status(400).send({ success: false, error: OTP_REQUIRED_ERROR });
  }

  if (!/^\d{6}$/.test(otp)) {
    return res
      .status(400)
      .send({ success: false, error: INVALID_OTP_FORMAT_ERROR });
  }

  next();
};

const validateEmailInput = (req, res, next) => {
  const { email } = req.body;

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

  next();
};

export async function VerifyOtp(req, res) {
  try {
    const { email, otp } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    if (user.verified === true) {
      return res.status(404).send({
        success: false,
        error: USER_EMAIL_ALREADY_VERIFIED,
      });
    }

    const otpRecord = await prisma.otp.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (!otp || isNaN(otp)) {
      return res.status(400).send({ success: false, error: USER_INVALID_OTP });
    }

    if (!otpRecord || String(otpRecord.otp) !== String(parseInt(otp))) {
      return res.status(400).send({ success: false, error: USER_INVALID_OTP });
    }
    if (otpRecord.expiresAt < new Date()) {
      await prisma.otp.deleteMany({
        where: {
          userId: user.id,
        },
      });
      return res.status(400).send({
        success: false,
        error: USER_OTP_EXPIRE,
      });
    }

    const otpToDelete = await prisma.otp.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (otpToDelete) {
      await prisma.otp.delete({
        where: {
          id: otpToDelete.id,
        },
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        verified: true,
        refreshToken: refreshToken,
        lastLoginAt: new Date(),
      },
    });

    return res.status(200).send({
      success: true,
      message: USER_EMAIL_VERIFIED,
      user: {
        id: user.id,
        email: user.email,
        verified: user.verified,
        role: user.role,
      },
      accessToken,
    });
  } catch (error) {
    console.error("OTP Verification Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return res
      .status(500)
      .send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

export async function ResendOtp(req, res) {
  try {
    const { email } = req.body;
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (!user) {
      return res
        .status(400)
        .send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    if (user.verified === true) {
      return res.status(201).send({
        success: true,
        message: USER_EMAIL_VERIFIED,
      });
    }

    // Delete any existing OTPs for this user
    await prisma.otp.deleteMany({
      where: {
        userId: user.id,
      },
    });

    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    const otp = crypto.randomInt(100000, 999999).toString();
    const existingOtp = await prisma.otp.findFirst({
      where: {
        userId: user.id,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
    if (existingOtp) {
      otp = existingOtp.otp;
    } else {
      otp = crypto.randomInt(100000, 999999).toString();
      await prisma.otp.upsert({
        where: {
          userId: user.id,
        },
        update: {
          otp: parseInt(otp),
          expiresAt: otpExpiration,
        },
        create: {
          userId: user.id,
          otp: parseInt(otp),
          expiresAt: otpExpiration,
        },
      });
    }

    const sendOTP = await SendOTPInMail(otp, email);

    if (!sendOTP || sendOTP.error) {
      return res.status(400).send({
        success: false,
        error: OTP_NOT_SENT,
      });
    }

    return res.status(200).send({
      success: true,
      message: USER_SEND_OTP,
      data: {
        email: email,
        otpId: sendOTP.data?.id,
      },
    });
  } catch (error) {
    console.error("OTP Resending Error:", {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
    return res
      .status(500)
      .send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

// Export the rate limiters and validators
export {
  verifyOtpLimiter,
  resendOtpLimiter,
  validateOtpInput,
  validateEmailInput,
};
