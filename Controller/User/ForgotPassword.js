import UserSchema from "../../Model/UserSchema.js";
import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { ForgotTemplate } from "../../Components/MailerComponents/ForgotTemplate.js";
import { userContent } from "../../Constants/UserConstants.js";
import { mailerContent } from "../../Constants/MailerConstants.js";
dotenv.config();

const { 
    errors: {
        EMAIL_NOT_FOUND_ERROR,
        EMAIL_REQUIRED_ERROR,
        INVALID_EMAIL_FORMAT_ERROR,
        GENERIC_ERROR_MESSAGE
    },
    success: {
        PASSWORD_UPDATED_SUCCESS
    },
    messages: {
        PASSWORD_REQUIRED_ERROR,
        PASSWORD_COMPLEXITY_ERROR,
        PASSWORD_RESET_EMAIL_SENT
    },
    validations: {
        EMAIL: EMAIL_REGEX,
        PASSWORD_REGEX
    }
} = userContent;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);
const FRONTEND_URL = process.env.FRONTEND_URL;
const { RESET_LINK_BASE } = mailerContent;

export async function ForgotPasswordMail(req, res) {
    try {
        const { email } = req.body;
        
        // Validate email
        if (!email) {
            return res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
        }

        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
        }

        const resetToken = crypto.randomBytes(32).toString("hex");
        const expiryTime = Date.now() + 15 * 60 * 1000;

        const updatedUser = await UserSchema.findOneAndUpdate(
            { email },
            {
                $set: {
                    resetPasswordToken: resetToken,
                    resetPasswordExpires: expiryTime,
                },
            },
            { new: true }
        );

        if (!updatedUser) {
            throw new Error("Failed to update user with reset token");
        }

        const resetLink = `${RESET_LINK_BASE}?email=${encodeURIComponent(email)}&token=${resetToken}`;
        const decodedLink = decodeURIComponent(resetLink);
        
        await ForgotTemplate(email, decodedLink);
        
        res.status(200).send({ success: true, message: PASSWORD_RESET_EMAIL_SENT });

        // Schedule token cleanup
        setTimeout(async () => {
            try {
                await UserSchema.updateOne(
                    { email, resetPasswordExpires: { $lt: Date.now() } },
                    { $unset: { resetPasswordToken: 1, resetPasswordExpires: 1 } }
                );
            } catch (cleanupError) {
                console.error("Error cleaning up reset token:", cleanupError);
            }
        }, 15 * 60 * 1000);
    } catch (error) {
        console.error("Error in ForgotPasswordMail:", error);
        res.status(500).json({ success: false, error: error.message || GENERIC_ERROR_MESSAGE });
    }
}

const validate = (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res
            .status(400)
            .send({ success: false, error: EMAIL_REQUIRED_ERROR });
    }
    if (!EMAIL_REGEX.test(email)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    }
    return true;
};

export async function SetNewPassword(req, res) {
    try {
        const { email, password } = req.body;

        // Validate email
        if (!email) {
            return res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
        }
        if (!EMAIL_REGEX.test(email)) {
            return res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
        }

        // Validate password
        if (!password) {
            return res.status(400).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
        }
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(400).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
        }

        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
        }

        user.password = password;
        await user.save();

        return res.status(200).json({ success: true, message: PASSWORD_UPDATED_SUCCESS });
    } catch (error) {
        console.error("Error in SetNewPassword:", error);
        return res.status(500).json({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}
