import nodemailer from "nodemailer";
import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
dotenv.config();

export async function SendOTPInMail(otp, toEmail) {
  try {
    const verificationLink = `${process.env.FRONTEND_URL}/register/verifyCode?email=${encodeURIComponent(
      toEmail
    )}&otp=${otp}`;
    const emailContent = `
          <h2>Email Verification</h2>
          <p>Your OTP code is: <strong>${otp}</strong></p>
          <p>This OTP will expire in <strong>30 minutes</strong>.</p>
          <p>Click the button below to verify your email:</p>
          <a href="${verificationLink}" style="padding: 10px 15px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">
            Verify Email
          </a>
          <p>If you didn't request this, please ignore this email.</p>
        `;

    const mailOptions = {
      to: toEmail,
      subject: "Verify Your Email",
      html: emailContent,
    };

    await Transporter(mailOptions);
  } catch (e) {
    return;
  }
}