// Import transporter - Keep .js extension as required by NodeNext
import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
// Import constants - Keep .js extension as required by NodeNext
import { mailerContent } from "../../Constants/MailerConstants.js";
// Import the response type from resend
import type { CreateEmailResponse } from 'resend';

dotenv.config();

// Destructure constants for easier access
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
    // EMAIL_SENT_SUCCESSFULLY_MESSAGE is unused here
  },
} = mailerContent;

// Define a type for the potential error return structure
interface SendOtpError {
    success: false;
    error: string;
}

/**
 * Sends an OTP verification email.
 * @param otp - The One-Time Password.
 * @param toEmail - The recipient's email address.
 * @returns The result from the Resend API or an error object.
 */
export async function SendOTPInMail(otp: string, toEmail: string): Promise<CreateEmailResponse | SendOtpError> {
  console.log("Sending OTP email to:", toEmail); // Log the recipient
  try {
    // Construct the verification link
    const verificationLink = `${VERIFICATION_LINK_BASE}?email=${encodeURIComponent(
      toEmail
    )}&otp=${otp}`;

    // Construct email HTML content
    const emailContent = `
          <h2>${EMAIL_VERIFICATION_HEADING}</h2>
          <p>${OTP_MESSAGE}<strong>${otp}</strong></p>
          <p>${OTP_EXPIRATION_PREFIX}<strong>30${OTP_EXPIRATION_SUFFIX}</strong>.</p>
          <a href="${verificationLink}" style="padding: 10px 15px; background-color: blue; color: white; text-decoration: none; border-radius: 5px;">
            ${VERIFY_EMAIL_BUTTON_TEXT}
          </a>
          <p>${IGNORE_EMAIL_MESSAGE}</p>
        `;

    // Prepare mail options for the transporter
    const mailOptions = {
      to: toEmail,
      subject: VERIFY_EMAIL_SUBJECT,
      htmlContent: emailContent,
    };

    // Send the email using the transporter and return the result
    const data: CreateEmailResponse = await Transporter(mailOptions);
    // Log success (Resend response object might contain details, but ID is not guaranteed)
    console.log(`OTP Email sent successfully via Resend.`);
    return data; // Return the successful Resend response

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`Error sending OTP email to ${toEmail}:`, errorMessage);
    // Return a structured error object
    return { success: false, error: errorMessage };
  }
}
