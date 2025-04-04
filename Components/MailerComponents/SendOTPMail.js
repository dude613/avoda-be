import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
import { mailerContent } from "../../Constants/MailerConstants.js";
dotenv.config();

const {
  otp: { OTP_MESSAGE, OTP_EXPIRATION_PREFIX, OTP_EXPIRATION_SUFFIX },
  messages: {
    IGNORE_EMAIL_MESSAGE
  },
  verification: {
    EMAIL_VERIFICATION_HEADING,
    VERIFY_EMAIL_SUBJECT,
    VERIFY_EMAIL_BUTTON_TEXT,
    VERIFICATION_LINK_BASE,
    EMAIL_SENT_SUCCESSFULLY_MESSAGE
  },
} = mailerContent;


export async function SendOTPInMail(otp, toEmail) {
  console.log("VERIFY_EMAIL_SUBJECT>>>>>",VERIFY_EMAIL_SUBJECT);
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
      to: toEmail,
      subject: VERIFY_EMAIL_SUBJECT,
      htmlContent: emailContent,
    };

   const data = await Transporter(mailOptions);
    return data;
  } catch (e) {
    return { success: false, error: e.message };
  }
}
