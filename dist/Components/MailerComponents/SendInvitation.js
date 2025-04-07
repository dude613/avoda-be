import { mailerContent } from "../../Constants/MailerConstants.js";
import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
dotenv.config();
const { invitation: { INVITATION_EMAIL_HEADING, INVITATION_EMAIL_TEXT, INVITATION_EMAIL_SUB_TEXT, INVITATION_EMAIL_SUBJECT, INVITATION_EMAIL_NAME, INVITATION_EMAIL_ROLE, INVITATION_EMAIL_BODY_TEXT, INVITATION_EMAIL_FOOTER_TEXT, INVITATION_EMAIL_SUPPORT_EMAIL, INVITATION_EMAIL_FOOTER_SUB_TEXT } } = mailerContent;
export async function SendInvitation(resetLinks) {
    const results = { success: [], failed: [] };
    for (const { orgName, name, email, role, resetLink } of resetLinks) {
        try {
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
                    <a href="${resetLink}" style="margin-top:10px; padding: 10px 15px; background-color: black; color: white; text-decoration: none; border-radius: 5px;">
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
            results.success.push(email);
        }
        catch (error) {
            console.error(`Error sending email to ${email}:`, error.message);
            results.failed.push({ email, error: error.message });
        }
    }
    if (results.failed.length > 0) {
        return { success: false, message: "Some emails failed to send.", details: results };
    }
    return { success: true, message: "All emails sent successfully." };
}
