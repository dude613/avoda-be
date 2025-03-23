import { Resend } from "resend";
import dotenv from "dotenv";
dotenv.config();


const resend = new Resend(process.env.RESEND_API_KEY);

export const Transporter = async ({ to, subject, html }) => {
  try {
    const result = await resend.emails.send({
      from: process.env.RESEND_EMAIL_USER,
      to: to,
      subject: subject,
      html: html,
    });
  } catch (error) {
    console.error("Error sending email:",error);
  }
};
