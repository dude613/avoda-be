import { Resend } from "resend";
// Import the specific response type from resend
import type { CreateEmailResponse } from "resend";
import dotenv from "dotenv";

dotenv.config();

// Validate essential environment variables
const resendApiKey = process.env.RESEND_API_KEY;
const resendEmailUser = process.env.RESEND_EMAIL_USER;

if (!resendApiKey) {
    throw new Error("RESEND_API_KEY environment variable is not defined.");
}
if (!resendEmailUser) {
    throw new Error("RESEND_EMAIL_USER environment variable is not defined.");
}

// Initialize Resend client
const resend = new Resend(resendApiKey);

// Define an interface for the function parameters for clarity and type safety
interface TransporterParams {
    to: string | string[]; // Allow single or multiple recipients
    subject: string;
    htmlContent: string;
}


/**
 * @returns The result from the Resend API (CreateEmailResponse).
 * @throws Throws an error if sending fails.
 */
export const Transporter = async (params: TransporterParams): Promise<CreateEmailResponse> => {
  const { to, subject, htmlContent } = params;
  const maxRetries = 3;
  let retryCount = 0;
  let lastError: unknown;

  while (retryCount < maxRetries) {
    try {
      // The result type is inferred from resend.emails.send
      const result: CreateEmailResponse = await resend.emails.send({
        from: resendEmailUser, // Use validated env var
        to: to,
        subject: subject,
        html: htmlContent,
      });

      // Check for errors returned in the response payload
      if (result.error) {
        console.error("Resend API returned an error:", result.error);
        // Throw an error using the message from the Resend error object
        throw new Error(`Resend API Error: ${result.error.message}`);
      }
      if (!result.data?.id) {
        console.error("Resend API did not return an id:", result);
        throw new Error(`Resend API Error: No id returned`);
      }
      // Return the successful response object
      return result;
    } catch (error: unknown) {
      retryCount++;
      lastError = error;
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Attempt ${retryCount} failed: Error sending email via Resend:`, errorMessage);
      // Exponential backoff: wait 2^retryCount * 100 milliseconds
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 100));
    }
  }

  // If all retries failed, throw the last error
  const errorMessage = lastError instanceof Error ? lastError.message : String(lastError);
  console.error("Max retries reached. Email sending failed:", errorMessage);
  throw new Error(`Failed to send email after ${maxRetries} attempts: ${errorMessage}`);
};
