import dotenv from "dotenv";
import { mailerContent } from "../../Constants/MailerConstants.js";
import { Transporter } from "./Transporter.js";
dotenv.config();

const {
    PASSWORD_RESET_REQUEST_HEADING,
    RESET_PASSWORD_LINK_TEXT,
    RESET_PASSWORD_BUTTON_TEXT,
    RESET_YOUR_PASSWORD_SUBJECT,
} = mailerContent.reset;
const { EMAIL_SENT_SUCCESSFULLY_MESSAGE } = mailerContent.verification;
const { IGNORE_RESET_EMAIL_MESSAGE } = mailerContent.messages;

export async function ForgotTemplate(email: string, resetLink: string) {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>${PASSWORD_RESET_REQUEST_HEADING}</h2>
                <p>${RESET_PASSWORD_LINK_TEXT}</p>
                <p><a href="${resetLink}" style="display:inline-block; padding:10px 20px; color:#fff; background-color:#007BFF; text-decoration:none; border-radius:5px;">${RESET_PASSWORD_BUTTON_TEXT}</a></p>
                <p>${IGNORE_RESET_EMAIL_MESSAGE}</p>
            </div>
        `;

        const mailOptions = {
            to: email,
            subject: `${RESET_YOUR_PASSWORD_SUBJECT}`,
            htmlContent: emailContent,
        };

        await Transporter(mailOptions);
        return { success: true, message: EMAIL_SENT_SUCCESSFULLY_MESSAGE };
    } catch (error: any) {
        console.error(`Error sending password reset email to ${email}:`, error.message);
        return { success: false, message: "Failed to send password reset email.", error: error.message };
    }
}
