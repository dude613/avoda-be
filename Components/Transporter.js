import nodemailer from "nodemailer";
import dotenv from "dotenv"
dotenv.config();


export default async function SendOTPInMail(options) {
    const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: options.to,
        subject: options.subject,
        html: options.message,
    };
    await transporter.sendMail(mailOptions);
}