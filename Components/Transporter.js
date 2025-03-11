import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

export const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export async function SendOTPInMail(otp, toEmail) {
  try {
    const verificationLink = `http://localhost:5173/register/verifyCode?email=${encodeURIComponent(
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
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: "Verify Your Email",
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (e) {
    return;
  }
}
