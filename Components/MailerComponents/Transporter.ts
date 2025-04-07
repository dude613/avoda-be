import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();


const resend = new Resend(process.env.RESEND_API_KEY);

interface TransporterProps {
  to: string | string[];
  subject: string;
  htmlContent: string;
}

export const Transporter = async ({ to, subject, htmlContent }: TransporterProps) => {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_EMAIL_USER as string,
      to: to,
      subject: subject,
      html: htmlContent,
    });
    return result;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};
