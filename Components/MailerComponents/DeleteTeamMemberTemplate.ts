import dotenv from "dotenv";
// Import constants - Keep .js extension as required by NodeNext
import { mailerContent } from "../../Constants/MailerConstants.js";
// Import transporter - Keep .js extension as required by NodeNext
import { Transporter } from "./Transporter.js";

dotenv.config();

// Destructure constants
const {
    teamMember: {
        DELETE_TEAM_MEMBER_SUBJECT,
        DELETE_TEAM_MEMBER_HEADING,
        DELETE_TEAM_MEMBER_DETAILS,
    },
    verification: { EMAIL_SENT_SUCCESSFULLY_MESSAGE },
} = mailerContent;

interface DeleteTeamMemberTemplateResult {
    success: boolean;
    message: string;
    error?: string;
}

export async function DeleteTeamMemberTemplate(
    email: string,
    dateTime: string,
    orgName: string
): Promise<DeleteTeamMemberTemplateResult> {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>${DELETE_TEAM_MEMBER_HEADING}</h2>
                <p>${DELETE_TEAM_MEMBER_DETAILS}</p>
                <p>Organization: ${orgName}</p>
                <p>Date and Time: ${dateTime}</p>
            </div>
        `;

        const mailOptions = {
            to: email,
            subject: DELETE_TEAM_MEMBER_SUBJECT,
            htmlContent: emailContent,
        };

        await Transporter(mailOptions);

        return { success: true, message: EMAIL_SENT_SUCCESSFULLY_MESSAGE };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
            `Error sending delete team member email to ${email}:`,
            errorMessage
        );
        return {
            success: false,
            message: "Failed to send delete team member email.",
            error: errorMessage,
        };
    }
}
