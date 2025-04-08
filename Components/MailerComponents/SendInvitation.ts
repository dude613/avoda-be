// Import constants - Keep .js extension as required by NodeNext
import { mailerContent } from "../../Constants/MailerConstants.js";
// Import transporter - Keep .js extension as required by NodeNext
import { Transporter } from "./Transporter.js";
import dotenv from "dotenv";
// Import types from organization types (assuming ResetLinkInfo is defined there)
import { ResetLinkInfo, TeamMemberRole } from "../../types/organization.types.js"; // Keep .js extension

dotenv.config();

// Destructure constants for easier access
const {
    invitation: {
        INVITATION_EMAIL_HEADING, INVITATION_EMAIL_TEXT,
        INVITATION_EMAIL_SUB_TEXT, INVITATION_EMAIL_SUBJECT,
        INVITATION_EMAIL_NAME, INVITATION_EMAIL_ROLE,
        INVITATION_EMAIL_BODY_TEXT, INVITATION_EMAIL_FOOTER_TEXT,
        INVITATION_EMAIL_SUPPORT_EMAIL, INVITATION_EMAIL_FOOTER_SUB_TEXT
        // INVITATION_EMAIL_FOOTER_LINK is unused in the original function
    }
} = mailerContent;

// Define types for the results structure
interface FailedEmailResult {
    email: string;
    error: string;
}

interface SendInvitationResults {
    success: string[];
    failed: FailedEmailResult[];
}

// Define the overall return type for the function
interface SendInvitationResponse {
    success: boolean;
    message: string;
    details?: SendInvitationResults; // Include details only on partial failure
}

/**
 * Sends invitation emails to multiple recipients.
 * @param resetLinks - An array of objects containing invitation details.
 * @returns An object indicating overall success or failure, potentially with details.
 */
export async function SendInvitation(resetLinks: ResetLinkInfo[]): Promise<SendInvitationResponse> {
    const results: SendInvitationResults = { success: [], failed: [] };

    // Use Promise.allSettled for better concurrency and error handling
    const emailPromises = resetLinks.map(async (linkInfo) => {
        const { orgName, name, email, role, resetLink } = linkInfo;
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
            return { status: 'fulfilled', email: email } as const; // Indicate success
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error sending invitation email to ${email}:`, errorMessage);
            return { status: 'rejected', email: email, reason: errorMessage } as const; // Indicate failure
        }
    });

    // Process results after all promises settle
    const settledResults = await Promise.allSettled(emailPromises);

    settledResults.forEach(result => {
        // Check if the promise inside allSettled was fulfilled
        if (result.status === 'fulfilled') {
            // Access the custom result object from the fulfilled promise
            if (result.value.status === 'fulfilled') {
                 results.success.push(result.value.email);
            } else if (result.value.status === 'rejected') {
                 results.failed.push({ email: result.value.email, error: result.value.reason });
            }
        } else {
            // Handle cases where the promise passed to allSettled itself rejected (less likely here)
            console.error("Unexpected error processing email promise:", result.reason);
            // Decide how to handle this - perhaps add to failed with a generic error
            // results.failed.push({ email: 'unknown', error: 'Processing error' });
        }
    });

    // Determine overall success and message
    if (results.failed.length > 0) {
        return {
            success: false,
            message: `Failed to send invitations to ${results.failed.length} recipient(s).`,
            details: results // Provide details of successes and failures
        };
    }

    return { success: true, message: "All invitation emails sent successfully." };
}
