import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import { prisma } from "../../Components/ConnectDatabase.js";
import crypto from "crypto";
import { userContent } from "../../Constants/UserConstants.js";

const {
  EMAIL_NOT_FOUND_ERROR,
  USER_EMAIL_ALREADY_VERIFIED,
  USER_INVALID_OTP,
  USER_OTP_EXPIRE,
  USER_EMAIL_VERIFIED,
  GENERIC_ERROR_MESSAGE,
  OTP_NOT_SENT,
  USER_SEND_OTP
} = userContent

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

    if (!otpRecord || otpRecord.otp !== parseInt(otp)) {
      return res.status(400).send({ success: false, error: USER_INVALID_OTP });
    }
    if (otpRecord.expiresAt < new Date()) {
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
      },
    });

    return res.status(200).send({
      success: true,
      message: USER_EMAIL_VERIFIED,
      user,
      accessToken,
    });
  } catch (error) {
    console.log("OTP Verification Error:", error.message);
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
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

    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    let otp;

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

    const data = await SendOTPInMail(otp, email);

    if(data?.data){
      return res.status(200).send({
        success: true,
        message: USER_SEND_OTP,
        data: data,
      });
    }
    else{
      return res.status(500).send({
        success: false,
        message: OTP_NOT_SENT,
        data:data?.error
      });
    }

   
  } catch (error) {
    console.log("OTP Resending Error:", error.message);
    return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}
