
import dotenv from "dotenv";
dotenv.config();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

export const mailerContent = {
    messages: {
        IGNORE_RESET_EMAIL_MESSAGE: "If you did not make this request, you can ignore this email.",
        IGNORE_EMAIL_MESSAGE: "If you didn't request this, please ignore this email.",
    },

    otp: {
        OTP_MESSAGE: "Your OTP code is: ",
        OTP_EXPIRATION_PREFIX: "This OTP will expire in ",
        OTP_EXPIRATION_SUFFIX: " minutes",
    },
    verification: {
    EMAIL_VERIFICATION_HEADING: "Email Verification",
        VERIFY_EMAIL_SUBJECT: "Verify Your Email",
        VERIFY_EMAIL_BUTTON_TEXT: "Verify Email",
        EMAIL_SENT_SUCCESSFULLY_MESSAGE: "Email sent successfully.",
        VERIFICATION_LINK_BASE: `${FRONTEND_URL}/register/verifyCode`,
    },
    reset: {
        PASSWORD_RESET_REQUEST_HEADING: "Password Reset Request",
        RESET_PASSWORD_LINK_TEXT: "Click the link below to reset your password:",
        RESET_PASSWORD_BUTTON_TEXT: "Reset Password",
        RESET_YOUR_PASSWORD_SUBJECT: "Reset Your Password",
        RESET_LINK_BASE: `${FRONTEND_URL}/new-password`,
    },
    invitation: {
        INVITATION_EMAIL_HEADING: "welcome to",
        INVITATION_EMAIL_TEXT: "We are excited to inform you that you've been added to the newly created organization",
        INVITATION_EMAIL_SUB_TEXT: "Here are some details about Organization:",
        INVITATION_EMAIL_SUBJECT: "Invitation to Join",
        INVITATION_EMAIL_NAME: "Organization Name:",
        INVITATION_EMAIL_ROLE: "Your Role:",
        INVITATION_EMAIL_BODY_TEXT: "Join Organization",
        INVITATION_EMAIL_FOOTER_TEXT: 'If you have any questions or need help getting started, feel free to reach out to our support team at.',
        INVITATION_EMAIL_SUPPORT_EMAIL: "support@gmail.com",
        INVITATION_EMAIL_FOOTER_SUB_TEXT: "We look forward to working with you!",
        INVITATION_EMAIL_FOOTER_LINK: `${FRONTEND_URL}/contact`,
    }

}