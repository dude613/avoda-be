import nodemailer from "nodemailer";
import { transporter } from "./Transporter.js";
import dotenv from "dotenv";
import {
  EMAIL_VERIFICATION_HEADING,
  OTP_MESSAGE,
  OTP_EXPIRATION_PREFIX,
  OTP_EXPIRATION_SUFFIX,
  VERIFY_EMAIL_SUBJECT,
  IGNORE_EMAIL_MESSAGE,
  VERIFY_EMAIL_BUTTON_TEXT,
  VERIFICATION_LINK_BASE
} from "../../Constants/MailerConstants.js";
dotenv.config();



export async function SendOTPInMail(otp, toEmail) {
  try {
    const verificationLink = `${VERIFICATION_LINK_BASE}?email=${encodeURIComponent(
      toEmail
    )}&otp=${otp}`;
    const emailContent = `
          <h2>${EMAIL_VERIFICATION_HEADING}</h2>
          <p>${OTP_MESSAGE}<strong>${otp}</strong></p>
          <p>${OTP_EXPIRATION_PREFIX}<strong>30${OTP_EXPIRATION_SUFFIX}</strong>.</p>
          <a href="${verificationLink}" style="padding: 10px 15px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">
            ${VERIFY_EMAIL_BUTTON_TEXT}
          </a>
          <p>${IGNORE_EMAIL_MESSAGE}</p>
        `;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: toEmail,
      subject: VERIFY_EMAIL_SUBJECT,
      html: emailContent,
    };

    await transporter.sendMail(mailOptions);
  } catch (e) {
    return;
  }
}
