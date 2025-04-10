import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client, Credentials } from "google-auth-library"; // Import Credentials
import bcrypt from "bcryptjs";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js"; // Assuming JS is compatible
import { prisma } from "../../Components/ConnectDatabase.js";
import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js"; // Assuming JS is compatible
import { userContent } from "../../Constants/UserConstants.js"; // Assuming JS is compatible
import {
    RegisterRequest,
    RegisterWithGoogleRequest,
    ResetPasswordRequest, // For the misplaced function
    UserResponse,
    ValidateRegisterFunction,
    SendOtpFunction, // Type for mailer
    RegisterWithGoogleSuccessData, // Type for Google reg success data
    GooglePayload, // Type for Google payload
    UserRole, // Type for roles
    validUserRoles // Constant array for roles
} from "../../types/user.types.js"; // Adjust path/extension if needed
import { User as PrismaUser, Otp as PrismaOtp } from '@prisma/client'; // Import Prisma types

dotenv.config();

// Destructure constants with defaults
const {
  errors: {
    EMAIL_NOT_FOUND_ERROR = "Email address not found.",
    EMAIL_REQUIRED_ERROR = "Email address is required.",
    INVALID_EMAIL_FORMAT_ERROR = "Invalid email format.",
    GENERIC_ERROR_MESSAGE = "An internal server error occurred.",
    USER_EMAIL_ALREADY_EXIST = "This email is already registered.",
    USER_EMAIL_ALREADY_VERIFIED = "This email is already verified.", // Not used in original JS but good to have
    OTP_NOT_SENT = "Failed to send OTP." // Moved from messages
  } = {},
  messages: {
    PASSWORD_REQUIRED_ERROR = "Password is required.",
    PASSWORD_COMPLEXITY_ERROR = "Password does not meet complexity requirements.",
    USER_SEND_OTP = "OTP has been sent to your registered email address.",
    // OTP_NOT_SENT removed from here
    ROLE_REQUIRED_ERROR = "Role is required.",
    INVALID_ROLE_ERROR = "Invalid role specified."
  } = {},
  success: {
    USER_REGISTER_SUCCESS = "User registered successfully."
  } = {},
  validations: {
    EMAIL: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ // Example complexity
  } = {}
} = userContent || {};

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL; // e.g., 'https://www.googleapis.com/oauth2/v3/userinfo'

// Validate essential environment variables
if (!CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID environment variable is not set.");
}
if (!AUTH_URL) {
    console.error("AUTH_URL environment variable is not set.");
}

const client = new OAuth2Client(CLIENT_ID);

// Type assertion for imported mailer function
const typedSendOTPInMail: SendOtpFunction = SendOTPInMail;

// --- Register Function ---
export async function Register(req: RegisterRequest, res: UserResponse): Promise<void> {
  try {
    const { email, password, role } = req.body;
    let { userName } = req.body; // userName is optional in body

    // Derive userName from email if not provided
    if (!userName || userName.trim().length === 0) {
      userName = email.split('@')[0];
      // Optionally update req.body if needed by validation, though validate uses destructured vars
      // req.body.userName = userName;
    }

    // Use typed internal validation function
    // Need to pass the potentially derived userName to validate
    const validationResponse = validate({ body: { email, password, role, userName } } as RegisterRequest, res);
    if (validationResponse !== true) {
      return; // Validation failed and sent response
    }

    let user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    let isNewUser = false;
    if (user) {
      // User exists
      if (user.verified === true) {
        // Already verified, cannot re-register
        res.status(400).send({ success: false, error: USER_EMAIL_ALREADY_EXIST });
        return;
      }
      // User exists but is not verified, proceed to send OTP again
    } else {
      // User does not exist, create new user
      isNewUser = true;
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await prisma.user.create({
        data: {
          userName, // Use derived or provided userName
          email,
          password: hashedPassword,
          role, // Use validated role
          verified: false // New users start as unverified
        },
      });
    }

    // Ensure user object is available (should be after find or create)
    if (!user) {
        throw new Error("User record could not be found or created.");
    }

    // Generate OTP and expiry
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes expiry

    // Upsert OTP record
 await prisma.otp.upsert({
   where: { userId: user.id },
   update: {
    otp: otp, // Store OTP as string to preserve all digits
    expiresAt: otpExpiration,
   },
   create: {
    userId: user.id,
    otp: otp, // Store OTP as string to preserve all digits
    expiresAt: otpExpiration,
   },
 });

    // Send OTP email
    const otpResponse = await typedSendOTPInMail(otp, email, user.id);

    // Check response from mailer: Success is indicated by presence of 'id' from Resend
    if (otpResponse?.data?.id) {
      res.status(isNewUser ? 201 : 200).send({ // 201 for new user, 200 if re-sending OTP
        success: true,
        message: USER_SEND_OTP,
      });
    } else {
      // Log the specific mailer error if available
      console.error("Failed to send OTP mail:", otpResponse);
      res.status(500).send({
        success: false,
        message: OTP_NOT_SENT,
      });
    }

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("User Register Error:", errorMessage);
    // Check for specific Prisma errors like unique constraint violation (P2002)
    if (error instanceof Error && (error as any).code === 'P2002') {
         res.status(400).send({ success: false, error: "An account with this email already exists." });
    } else {
        res.status(500).send({
          success: false,
          error: GENERIC_ERROR_MESSAGE,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
  }
}

// --- Google Registration Function ---
export const registerWithGoogle = async (req: RegisterWithGoogleRequest, res: UserResponse): Promise<void> => {
  try {
    const { idToken, role } = req.body;

    if (!idToken) {
      res.status(400).send({ success: false, error: "ID token is required" });
      return;
    }
    if (!role) {
      res.status(400).send({ success: false, error: ROLE_REQUIRED_ERROR });
      return;
    }
    if (!validUserRoles.includes(role)) {
      res.status(400).send({ success: false, error: INVALID_ROLE_ERROR });
      return;
    }
    if (!AUTH_URL || !client) {
        console.error("Google Auth client or AUTH_URL not initialized.");
        res.status(500).send({ success: false, error: "Server configuration error." });
        return;
    }

    // Verify Google token
    client.setCredentials({ access_token: idToken } as Credentials);
    const response = await client.request<GooglePayload>({ url: AUTH_URL });
    const payload = response.data;

    if (!payload || !payload.id || !payload.email) {
      console.error("Invalid Google payload structure:", payload);
      res.status(401).send({ success: false, error: "Invalid Google authentication response" });
      return;
    }

    const { id: googleId, email, name, picture } = payload;

    // Check if user already exists
    let user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (user) {
      // User exists, cannot register again with Google if already exists
      res.status(400).send({ success: false, error: USER_EMAIL_ALREADY_EXIST });
      return;
    }

    // User does not exist, create new user with Google details
    user = await prisma.user.create({
      data: {
        googleId,
        email,
        userName: name || email.split('@')[0], // Use Google name or derive from email
        picture: picture || null, // Use Google picture or null
        role, // Use role provided in request
        verified: true, // Google accounts are considered verified
        lastLoginAt: new Date(), // Set last login time on registration
      },
    });

    // Generate tokens for the new user
    const accessToken: string = generateAccessToken(user);
    const refreshToken: string = generateRefreshToken(user);

    // Store refresh token
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: refreshToken },
    });

    // Prepare response data
    const responseData: RegisterWithGoogleSuccessData = {
      user: {
        id: user.id,
        email: user.email,
        userName: user.userName,
        picture: user.picture,
        verified: user.verified,
        role: user.role
      },
      accessToken,
      refreshToken // Include refresh token in response as per original JS
    };

    res.status(201).send({
      success: true,
      message: USER_REGISTER_SUCCESS,
      data: responseData
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Google Registration Error:", errorMessage);
     if (error instanceof Error && (error as any).code === 'P2002') {
         // Handle potential unique constraint violation if somehow user was created concurrently
         res.status(400).send({ success: false, error: "An account with this email already exists." });
    } else {
        res.status(500).send({
          success: false,
          error: GENERIC_ERROR_MESSAGE,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
  }
}

// --- Internal Validation Function ---
// NOTE: This validates fields for standard registration.
// The ResetPassword function below reuses it, which is incorrect as ResetPassword only needs email/password.
const validate: ValidateRegisterFunction = (req, res) => {
  // Type guard to check which request type it is might be needed if validation differs significantly
  const { email, password, userName, role } = req.body;

  if (!email) {
    res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
    return false;
  }
  if (!EMAIL_REGEX.test(email)) {
    res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    return false;
  }
  if (!password) {
    res.status(400).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
    return false;
  }
  if (!PASSWORD_REGEX.test(password)) {
    res.status(400).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
    return false;
  }
  // userName is derived if missing, so check should pass if derivation logic works
  if (!userName || userName.trim().length === 0) {
    // This check might be redundant if userName is always derived before validation
    res.status(400).send({ success: false, error: "Username is required!" });
    return false;
  }
  if (!role) {
    res.status(400).send({ success: false, error: ROLE_REQUIRED_ERROR });
    return false;
  }
  if (!validUserRoles.includes(role)) {
    res.status(400).send({ success: false, error: INVALID_ROLE_ERROR });
    return false;
  }

  return true; // Validation passed
};

// --- Reset Password Function (Misplaced from original Register.js) ---
// Separate validation function specifically for ResetPassword
const validateResetPassword: (req: ResetPasswordRequest, res: UserResponse) => boolean | void = (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
        return false;
    }
    if (!EMAIL_REGEX.test(email)) {
        res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
        return false;
    }
    if (!password) {
        res.status(400).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
        return false;
    }
    // Consider adding password complexity check here if desired for reset
    // if (!PASSWORD_REGEX.test(password)) {
    //     res.status(400).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
    //     return false;
    // }
    return true;
};

// --- Reset Password Function (Misplaced from original Register.js) ---
// NOTE: Still misplaced, but now uses its own validation.
export async function ResetPassword(req: ResetPasswordRequest, res: UserResponse): Promise<void> {
  try {
    const { email, password } = req.body;

    // Use the correct validation function for ResetPassword
    const validationResponse = validateResetPassword(req, res);
    if (validationResponse !== true) {
      return; // Validation failed and sent response
    }

    let user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
      return;
    }

     // Check if user has a password (might be Google-only user) - Reuse check from SetNewPassword
    if (!user.password) {
         res.status(400).json({ success: false, error: "Password cannot be reset for this account type." });
         return;
    }

    // Check if new password is same as old - Reuse check from SetNewPassword
    const isMatch = await bcrypt.compare(password, user.password);
    if (isMatch) {
      // Use the constant defined earlier
      const { PASSWORD_ALREADY_EXIST = "New password cannot be the same as the old password." } = userContent?.errors || {};
      res.status(400).send({ success: false, error: PASSWORD_ALREADY_EXIST });
      return;
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password
    user = await prisma.user.update({
      where: { email: email },
      data: {
        password: hashedPassword,
        // Clear reset tokens if they exist?
        // resetPasswordToken: null,
        // resetPasswordExpires: null,
      },
    });

    // --- OTP Logic (Seems out of place for password reset) ---
    // This logic sends an OTP after resetting the password, which is unusual.
    // Usually, OTP is for verification *before* reset or during registration.
    // Keeping original logic for now.
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 mins

    await prisma.otp.upsert({
      where: { userId: user.id },
      update: { otp: otp, expiresAt: otpExpiration },
      create: { userId: user.id, otp: otp, expiresAt: otpExpiration },
    });

    // Send OTP email and check response
    const otpResetResponse = await typedSendOTPInMail(otp, email, user.id);
    if (!('id' in otpResetResponse)) { // Check for failure
        console.error("Failed to send OTP mail after password reset:", otpResetResponse?.error);
        // Decide how to handle: maybe still return success for password reset but log OTP failure?
        // Original code didn't check the response here, proceeding with success regardless.
    }
    // --- End OTP Logic ---

    // Use the correct success message constant
    const { PASSWORD_UPDATED_SUCCESS = "Password updated successfully." } = userContent?.success || {};
    res.status(200).send({
      success: true,
      // Message should probably indicate password was reset, not OTP sent.
      message: PASSWORD_UPDATED_SUCCESS, // Changed from USER_SEND_OTP
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Password Reset Error (from Register.js):", errorMessage);
    res.status(500).send({
      success: false,
      error: GENERIC_ERROR_MESSAGE,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
