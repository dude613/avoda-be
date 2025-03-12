import nodemailer from "nodemailer";
import dotenv from "dotenv";
import { transporter } from "./Transporter.js";
dotenv.config();

export async function ForgotTemplate(email, resetLink) {
    try {
        const emailContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.5;">
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. Click the link below to set a new password:</p>
                <p><a href="${resetLink}" style="display:inline-block; padding:10px 20px; color:#fff; background-color:#007BFF; text-decoration:none; border-radius:5px;">Reset Password</a></p>
                <p>If you didn’t request this, please ignore this email.</p>
                <p>Thanks,</p>
                <p>Your Team</p>
            </div>
        `;

        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: "Reset Your Password",
            html: emailContent,
        };

        const info = await transporter.sendMail(mailOptions);
        return { success: true, message: "Email sent successfully." };
    } catch (error) {
        return { success: false, error: error.message };
    }
}