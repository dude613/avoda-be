import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
// import { OAuth2Client } from "google-auth-library"; // Not used in these specific functions
import { ForgotTemplate } from "../../Components/MailerComponents/ForgotTemplate.js";
import { userContent } from "../../Constants/UserConstants.js"; // Assuming this JS file is compatible or will be typed
import { mailerContent } from "../../Constants/MailerConstants.js"; // Assuming this JS file is compatible or will be typed
import { prisma } from "../../Components/ConnectDatabase.js";
import {
    ForgotPasswordMailRequest,
    SetNewPasswordRequest,
    UserResponse,
    ValidateEmailFunction // Import the type for the internal function
} from "../../types/user.types.js"; // Adjust path/extension if needed
import { User as PrismaUser } from '@prisma/client'; // Import Prisma User type

dotenv.config();

// Destructure constants - consider defining these in a typed constants file later
const {
  errors: {
    EMAIL_NOT_FOUND_ERROR = "Email address not found.", // Provide defaults
    EMAIL_REQUIRED_ERROR = "Email address is required.",
    INVALID_EMAIL_FORMAT_ERROR = "Invalid email format.",
    GENERIC_ERROR_MESSAGE = "An internal server error occurred.",
    GOOGLE_LOGIN_REQUIRED = "Password reset is not available for Google accounts. Please log in with Google.",
    PASSWORD_ALREADY_EXIST = "New password cannot be the same as the old password.", // Added missing constant
  } = {}, // Default empty object
  success: {
      PASSWORD_UPDATED_SUCCESS = "Password updated successfully."
  } = {},
  messages: {
    PASSWORD_REQUIRED_ERROR = "Password is required.",
    PASSWORD_COMPLEXITY_ERROR = "Password does not meet complexity requirements.", // Provide default
    PASSWORD_RESET_EMAIL_SENT = "Password reset email sent successfully.",
  } = {},
  validations: {
      EMAIL: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, // Provide default regex
      PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ // Example complexity
  } = {}
} = userContent || {}; // Ensure userContent exists

// const CLIENT_ID = process.env.GOOGLE_CLIENT_ID; // Not used here
// const AUTH_URL = process.env.AUTH_URL; // Not used here
// const client = new OAuth2Client(CLIENT_ID); // Not used here
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000'; // Default frontend URL
// Correctly destructure from mailerContent.reset
const { reset: { RESET_LINK_BASE = `${FRONTEND_URL}/reset-password` } = {} } = mailerContent || {};

// Type assertion for imported mailer function - reflecting its actual return type
const typedForgotTemplate: (email: string, link: string) => Promise<{ success: boolean; message: string; error?: string; }> = ForgotTemplate;

export async function ForgotPasswordMail(req: ForgotPasswordMailRequest, res: UserResponse): Promise<void> {
  try {
    const { email } = req.body;

    // Use the typed internal validate function
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return; // Validation failed and sent response
    }

    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
      return;
    }

    // Check if user has googleId (Google-based login)
    if (user.googleId) {
      res.status(400).json({ success: false, error: GOOGLE_LOGIN_REQUIRED });
      return;
    }

    // Generate token and expiry
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    const updatedUser = await prisma.user.update({
      where: { email: email },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiryTime,
      },
    });

    // Check if update was successful (though Prisma throws error if user not found)
    if (!updatedUser) {
      // This case might be unlikely if findUnique succeeded, but good practice
      throw new Error("Failed to update user with reset token");
    }

    // Send reset email
    const resetLink = `${RESET_LINK_BASE}?email=${encodeURIComponent(email)}&token=${resetToken}`;
    // No need to decode the link before sending to the template
    await typedForgotTemplate(email, resetLink);

    res.status(200).send({ success: true, message: PASSWORD_RESET_EMAIL_SENT });

    // Schedule token cleanup (consider using a more robust job scheduler for production)
    setTimeout(async () => {
      try {
        const now = new Date();
        await prisma.user.updateMany({
          where: {
            resetPasswordToken: { not: null }, // Only target users with a token
            resetPasswordExpires: { lt: now }, // Where expiry is in the past
          },
          data: {
            resetPasswordToken: null,
            resetPasswordExpires: null,
          },
        });
        console.log(`Cleaned up expired reset tokens older than ${now.toISOString()}`);
      } catch (cleanupError: unknown) {
        const errorMsg = cleanupError instanceof Error ? cleanupError.message : String(cleanupError);
        console.error("Error cleaning up reset token:", errorMsg);
      }
    }, 15 * 60 * 1000 + 1000); // Run slightly after 15 mins

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in ForgotPasswordMail:", errorMessage);
    res.status(500).json({
        success: false,
        error: GENERIC_ERROR_MESSAGE,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// Internal validation function (typed)
const validate: ValidateEmailFunction = (req, res) => {
  const { email } = req.body;
  if (!email) {
    res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
    return false; // Indicate failure
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    return false; // Indicate failure
  }
  return true; // Indicate success
};

export async function SetNewPassword(req: SetNewPasswordRequest, res: UserResponse): Promise<void> {
  try {
    const { email, password } = req.body;

    // Validate email
    if (!email) {
      res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
      return;
    }
    if (!EMAIL_REGEX.test(email)) {
      res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
      return;
    }

    // Validate password
    if (!password) {
      res.status(400).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
      return;
    }
    if (!PASSWORD_REGEX.test(password)) {
      res.status(400).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
      return;
    }

    // Find user
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });
    if (!user) {
      res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
      return;
    }

    // Check if user has a password (might be Google-only user)
    if (!user.password) {
         res.status(400).json({ success: false, error: "Password cannot be set for this account type." });
         return;
    }

    // Check if the new password is the same as the old one
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      res.status(400).send({ success: false, error: PASSWORD_ALREADY_EXIST });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update user's password
    await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        // Optionally clear reset tokens here as well, although ForgotPasswordMail should handle expiry
        resetPasswordToken: null,
        resetPasswordExpires: null,
      },
    });

    res.status(200).json({ success: true, message: PASSWORD_UPDATED_SUCCESS });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error in SetNewPassword:", errorMessage);
    res.status(500).json({
        success: false,
        error: GENERIC_ERROR_MESSAGE,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
