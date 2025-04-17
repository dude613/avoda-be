import dotenv from "dotenv";
dotenv.config();

// Define types for the nested structure
interface MailerMessages {
    readonly IGNORE_RESET_EMAIL_MESSAGE: string;
    readonly IGNORE_EMAIL_MESSAGE: string;
}

interface MailerTeamMember {
    readonly EDIT_TEAM_MEMBER_SUBJECT: string;
    readonly EDIT_TEAM_MEMBER_HEADING: string;
    readonly EDIT_TEAM_MEMBER_DETAILS: string;
    readonly DELETE_TEAM_MEMBER_SUBJECT: string;
    readonly DELETE_TEAM_MEMBER_HEADING: string;
    readonly DELETE_TEAM_MEMBER_DETAILS: string;
    readonly UNARCHIVE_TEAM_MEMBER_SUBJECT: string;
    readonly UNARCHIVE_TEAM_MEMBER_HEADING: string;
    readonly UNARCHIVE_TEAM_MEMBER_DETAILS: string;
}


interface MailerOtp {
    readonly OTP_MESSAGE: string;
    readonly OTP_EXPIRATION_PREFIX: string;
    readonly OTP_EXPIRATION_SUFFIX: string;
}

interface MailerVerification {
    readonly EMAIL_VERIFICATION_HEADING: string;
    readonly VERIFY_EMAIL_SUBJECT: string;
    readonly VERIFY_EMAIL_BUTTON_TEXT: string;
    readonly EMAIL_SENT_SUCCESSFULLY_MESSAGE: string;
    readonly VERIFICATION_LINK_BASE: string;
}

interface MailerReset {
    readonly PASSWORD_RESET_REQUEST_HEADING: string;
    readonly RESET_PASSWORD_LINK_TEXT: string;
    readonly RESET_PASSWORD_BUTTON_TEXT: string;
    readonly RESET_YOUR_PASSWORD_SUBJECT: string;
    readonly RESET_LINK_BASE: string;
}

interface MailerInvitation {
    readonly INVITATION_EMAIL_HEADING: string;
    readonly INVITATION_EMAIL_TEXT: string;
    readonly INVITATION_EMAIL_SUB_TEXT: string;
    readonly INVITATION_EMAIL_SUBJECT: string;
    readonly INVITATION_EMAIL_NAME: string;
    readonly INVITATION_EMAIL_ROLE: string;
    readonly INVITATION_EMAIL_BODY_TEXT: string;
    readonly INVITATION_EMAIL_FOOTER_TEXT: string;
    readonly INVITATION_EMAIL_SUPPORT_EMAIL: string;
    readonly INVITATION_EMAIL_FOOTER_SUB_TEXT: string;
    readonly INVITATION_EMAIL_FOOTER_LINK: string;
}

// Define the main type
interface MailerContent {
    readonly messages: MailerMessages;
    readonly otp: MailerOtp;
    readonly verification: MailerVerification;
    readonly reset: MailerReset;
    readonly invitation: MailerInvitation;
    readonly teamMember: MailerTeamMember;
}

// Use environment variable with a default
const FRONTEND_URL: string = process.env.FRONTEND_URL || 'http://localhost:5173';

// Export the typed constant object using 'as const'
export const mailerContent: MailerContent = {
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
    },
    teamMember: {
        EDIT_TEAM_MEMBER_SUBJECT: "Team Member Edited",
        EDIT_TEAM_MEMBER_HEADING: "Team Member Edited",
        EDIT_TEAM_MEMBER_DETAILS: "Your account details have been edited by the admin of your organization. Kindly find the changes below:",
        DELETE_TEAM_MEMBER_SUBJECT: "Team Member Deleted",
        DELETE_TEAM_MEMBER_HEADING: "Team Member Deleted",
        DELETE_TEAM_MEMBER_DETAILS: "Your account has been deleted by the admin of your organization.",
        UNARCHIVE_TEAM_MEMBER_SUBJECT: "Team Member unarchived",
        UNARCHIVE_TEAM_MEMBER_HEADING: "Team Member unarchived",
        UNARCHIVE_TEAM_MEMBER_DETAILS: "Your account has been unarchived by the admin of your organization.",
    }
} as const; // Use 'as const' for immutability and literal types
