import {
    INVITATION_EMAIL_HEADING, INVITATION_EMAIL_TEXT,
    INVITATION_EMAIL_SUB_TEXT, INVITATION_EMAIL_SUBJECT,
    INVITATION_EMAIL_NAME, INVITATION_EMAIL_ROLE,
    INVITATION_EMAIL_BODY_TEXT, INVITATION_EMAIL_FOOTER_TEXT,
    INVITATION_EMAIL_SUPPORT_EMAIL, INVITATION_EMAIL_FOOTER_SUB_TEXT
} from "../../Constants/MailerConstants.js";

import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
dotenv.config();

export async function SendInvitation(resetLinks) {
    try {
        for (const { orgName, name, email, role, resetLink } of resetLinks) {
            const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>${INVITATION_EMAIL_HEADING} ${orgName}!</h2>
                <p>Hi ${name},</p>
                <p>${INVITATION_EMAIL_TEXT}, <strong>${orgName}</strong>.</p>
                <p>${INVITATION_EMAIL_SUB_TEXT}</p>
                <ul>
                    <li><strong>${INVITATION_EMAIL_NAME}</strong> ${orgName}</li>
                    <li><strong>${INVITATION_EMAIL_ROLE}</strong> ${role}</li>
                </ul>
                  <a href="${resetLink}" style="marginTop:10px; padding: 10px 15px; background-color: black; color: white; text-decoration: none; border-radius: 5px;">
                   ${INVITATION_EMAIL_BODY_TEXT}
                  </a>
                <p>${INVITATION_EMAIL_FOOTER_TEXT} ${INVITATION_EMAIL_SUPPORT_EMAIL}</p>
                <p>${INVITATION_EMAIL_FOOTER_SUB_TEXT}</p>
                <p>Thanks,</p>
                <p>The ${orgName} Team</p>
            </div>
        `;
            const mailOptions = {
                to: email,
                subject: `${INVITATION_EMAIL_SUBJECT} ${orgName}`,
                htmlContent: emailContent,
            };

            await Transporter(mailOptions);
        }

        return { success: true, message: "Emails sent successfully." };
    } catch (error) {
        console.error("Error sending invitation emails:", error.message);
        return { success: false, error: error.message };
    }
}
