import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
dotenv.config();

export async function SendInvitation(resetLinks) {
    try {
        for (const { orgName, name, email, role, resetLink } of resetLinks) {
            const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Welcome to ${orgName}!</h2>
                <p>Hi ${name},</p>
                <p>We are excited to inform you that you've been added to the newly created organization, <strong>${orgName}</strong>.</p>
                <p>Here are some details about Organization:</p>
                <ul>
                    <li><strong>Organization Name:</strong> ${orgName}</li>
                    <li><strong>Your Role:</strong> ${role}</li>
                </ul>
                  <a href="${resetLink}" style="marginTop:10px; padding: 10px 15px; background-color: black; color: white; text-decoration: none; border-radius: 5px;">
                    Join Organization
                  </a>
                <p>If you have any questions or need help getting started, feel free to reach out to our support team at. support@gmail.com</p>
                <p>We look forward to working with you!</p>
                <p>Thanks,</p>
                <p>The ${orgName} Team</p>
            </div>
        `;
            const mailOptions = {
                to: email,
                subject: `Invitation to Join ${orgName} – Get Started Now!`,
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
