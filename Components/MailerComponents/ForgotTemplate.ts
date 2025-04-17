import dotenv from "dotenv";
// Import constants - Keep .js extension as required by NodeNext
import { mailerContent } from "../../Constants/MailerConstants.js";
// Import transporter - Keep .js extension as required by NodeNext
import { Transporter } from "./Transporter.js";

dotenv.config();

// Destructure constants for easier access
const {
  reset: {
    PASSWORD_RESET_REQUEST_HEADING,
    RESET_PASSWORD_LINK_TEXT,
    RESET_PASSWORD_BUTTON_TEXT,
    RESET_YOUR_PASSWORD_SUBJECT,
  },
  messages: { IGNORE_RESET_EMAIL_MESSAGE },
  verification: { EMAIL_SENT_SUCCESSFULLY_MESSAGE },
} = mailerContent;

// Define a type for the function's return value
interface ForgotTemplateResult {
    success: boolean;
    message: string;
    error?: string; // Optional error message
}

/**
 * Sends a password reset email.
 * @param email - The recipient's email address.
 * @param resetLink - The password reset link.
 * @returns An object indicating success or failure.
 */
export async function ForgotTemplate(email: string, resetLink: string): Promise<ForgotTemplateResult> {
  try {
    // Construct email HTML content
    const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>${PASSWORD_RESET_REQUEST_HEADING}</h2>
                <p>${RESET_PASSWORD_LINK_TEXT}</p>
                <p><a href="${resetLink}" style="display:inline-block; padding:10px 20px; color:#fff; background-color:#007BFF; text-decoration:none; border-radius:5px;">${RESET_PASSWORD_BUTTON_TEXT}</a></p>
                <p>${IGNORE_RESET_EMAIL_MESSAGE}</p>
            </div>
        `;

    // Prepare mail options for the transporter
    const mailOptions = {
      to: email,
      subject: RESET_YOUR_PASSWORD_SUBJECT, // Use the constant directly
      htmlContent: emailContent,
    };

    // Send the email using the transporter
    await Transporter(mailOptions);

    // Return success object
    return { success: true, message: EMAIL_SENT_SUCCESSFULLY_MESSAGE };

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(
      `Error sending password reset email to ${email}:`,
      errorMessage
    );
    // Return failure object
    return {
      success: false,
      message: "Failed to send password reset email.",
      error: errorMessage, // Include the error message
    };
  }
}
