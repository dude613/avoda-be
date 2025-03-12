import UserSchema from "../../Model/UserSchema.js";
import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { ForgotTemplate } from "../../Components/MailerComponents/ForgotTemplate.js";


dotenv.config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);
const FRONTEND_URL = process.env.FRONTEND_URL;


export async function ForgotPasswordMail(req, res) {
    try {
        const { email } = req.body;
        const validationResponse = validate(req, res);
        if (validationResponse !== true) {
            return;
        }
        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: "This email doesn't exist in our database. Please try another email." });
        }
        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiryTime = Date.now() + 15 * 60 * 1000;

        await UserSchema.findOneAndUpdate(
            { email },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: expiryTime,
                },
            },
            { upsert: true, new: true }
        );
        const resetLink = `http://localhost:5173/new-password?email=${encodeURIComponent(email)}&token=${resetToken}`;
        const decodedLink = decodeURIComponent(resetLink);
        await ForgotTemplate(email, decodedLink);
        res.status(200).send({ success: true, message: "A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password." })
        setTimeout(async () => {
            await UserSchema.updateOne(
                { email, resetPasswordExpires: { $lt: Date.now() } },
                { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
            );
        }, 15 * 60 * 1000);
    } catch (error) {
        console.log("error message forgot password:::", error.message);
        res.status(500).json({ success: false, error: error.message || "An error occurred while processing your request." });
    }
}

const validate = (req, res) => {
    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
        return res
            .status(400)
            .send({ success: false, error: "email is required!" });
    }
    if (!emailRegex.test(email)) {
        return res
            .status(400)
            .send({ success: false, error: "Invalid email format!" });
    }
    return true;
};

export async function SetNewPassword(req, res) {
    try {
        const { email, password } = req.body;
        const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

        const validationResponse = validate(req, res);
        if (validationResponse !== true) {
            return;
        }

        if (!password) {
            return res.status(404).send({ success: false, error: "Password is required!" });
        }
        if (!passwordRegex.test(password)) {
            return res.status(404).send({ success: false, error: "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character." })
        }

        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: "This email doesn't exist in our database. Please try another email." });
        }

        user.password = password;
        await user.save();

        return res.status(200).json({ success: true, message: "Password updated successfully!" });
    } catch (error) {
        console.log("error set new password:::", error.message)
    }
}