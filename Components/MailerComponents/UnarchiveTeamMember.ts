import dotenv from "dotenv";
import { mailerContent } from "../../Constants/MailerConstants.js";
import { Transporter } from "./Transporter.js";

dotenv.config();

const {
    teamMember: {
        UNARCHIVE_TEAM_MEMBER_SUBJECT,
        UNARCHIVE_TEAM_MEMBER_HEADING,
        UNARCHIVE_TEAM_MEMBER_DETAILS,
    },
    verification: { EMAIL_SENT_SUCCESSFULLY_MESSAGE },
} = mailerContent;

interface UnarchiveTeamMemberTemplateResult {
    success: boolean;
    message: string;
    error?: string;
}

export async function UnarchiveTeamMemberTemplate(
    email: string,
    dateTime: string,
    orgName: string
): Promise<UnarchiveTeamMemberTemplateResult> {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>${UNARCHIVE_TEAM_MEMBER_HEADING}</h2>
                <p>${UNARCHIVE_TEAM_MEMBER_DETAILS}</p>
                <p>Organization: ${orgName}</p>
                <p>Date and Time: ${dateTime}</p>
            </div>
        `;

        const mailOptions = {
            to: email,
            subject: UNARCHIVE_TEAM_MEMBER_SUBJECT,
            htmlContent: emailContent,
        };

        await Transporter(mailOptions);

        return { success: true, message: EMAIL_SENT_SUCCESSFULLY_MESSAGE };
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(
            `Error sending unarchive team member email to ${email}:`,
            errorMessage
        );
        return {
            success: false,
            message: "Failed to send unarchive team member email.",
            error: errorMessage,
        };
    }
}
