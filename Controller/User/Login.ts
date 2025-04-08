import bcrypt from "bcryptjs";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client, Credentials } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import { userContent } from "../../Constants/UserConstants.js";
import { prisma } from "../../Components/ConnectDatabase.js";
import {
    LoginRequest,
    LoginWithGoogleRequest,
    UserResponse,
    ValidateLoginFunction,
    LoginSuccessResponse, 
    LoginResponseUser, 
    GooglePayload 
} from "../../types/user.types.js"; 
import { User as PrismaUser } from '@prisma/client'; 


const {
  errors: {
    EMAIL_NOT_FOUND_ERROR = "Email address not found.",
    EMAIL_REQUIRED_ERROR = "Email address is required.",
    INVALID_EMAIL_FORMAT_ERROR = "Invalid email format.",
    PASSWORD_REQUIRED_INCORRECT = "Incorrect password.",
    GENERIC_ERROR_MESSAGE = "An internal server error occurred."
  } = {},
  success: {
    USER_LOGIN_SUCCESS = "User logged in successfully."
  } = {},
  messages: {
    PASSWORD_REQUIRED_ERROR = "Password is required.",
    PASSWORD_COMPLEXITY_ERROR = "Password does not meet complexity requirements." // Used in validation
  } = {},
  validations: {
    EMAIL: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/ // Example complexity
  } = {}
} = userContent || {};

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL; // Ensure this is the correct URL (e.g., 'https://www.googleapis.com/oauth2/v3/userinfo')

// Validate essential environment variables
if (!CLIENT_ID) {
    console.error("GOOGLE_CLIENT_ID environment variable is not set.");
    // Optionally throw an error or exit if critical
}
if (!AUTH_URL) {
    console.error("AUTH_URL environment variable is not set.");
    // Optionally throw an error or exit if critical
}

const client = new OAuth2Client(CLIENT_ID);

// --- Login Function ---
export async function Login(req: LoginRequest, res: UserResponse): Promise<void> {
  const { email, password } = req.body;

  // Use typed internal validation
  const validationResponse = validate(req, res);
  if (validationResponse !== true) {
    return; // Validation failed and sent response
  }

  try {
    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      res.status(400).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
      return;
    }

    // Check if the user has a password set (might be a Google-only account)
    if (!user.password) {
        res.status(400).send({ success: false, error: "Password login not available for this account. Try Google login." });
        return;
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(400).send({ success: false, error: PASSWORD_REQUIRED_INCORRECT });
      return;
    }

    // Generate tokens (assuming functions return string or throw error)
    const accessToken: string = generateAccessToken(user);
    const refreshToken: string = generateRefreshToken(user);

    // Check if tokens were generated successfully (belt-and-suspenders)
    if (!accessToken || !refreshToken) {
      console.error("Token generation failed for user:", user.id);
      res.status(500).send({ success: false, error: "Failed to generate authentication tokens" });
      return;
    }

    // Generate OTP (consider if OTP is needed for standard login)
    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Update user with refreshToken, OTP, and lastLoginAt
    try {
      await prisma.user.update({
        where: { id: user.id },
        data: {
          refreshToken: refreshToken,
          otp: otp, // Store OTP if needed for 2FA or verification on login
          otpExpiry: otpExpiry,
          lastLoginAt: new Date(), // Update last login time
        },
      });
    } catch (saveError: unknown) {
      const errorMsg = saveError instanceof Error ? saveError.message : String(saveError);
      console.error("Error updating user session data:", errorMsg);
      // Don't necessarily fail the login, but log the error
      // Consider if failing login is appropriate if session data can't be saved
    }

    // Check organization onboarding status
    let onboardingSkipped = false;
    try {
      const organization = await prisma.organization.findFirst({
        where: { userId: user.id },
      });
      if (organization) {
        onboardingSkipped = organization.onboardingSkipped;
      }
    } catch (orgError: unknown) {
      const errorMsg = orgError instanceof Error ? orgError.message : String(orgError);
      console.error("Error fetching organization during login:", errorMsg);
      // Continue login even if org check fails, default onboardingSkipped is false
    }

    // Prepare user data for response (omit sensitive fields)
    const responseUser: LoginResponseUser = {
      id: parseInt(user.id),
      email: user.email,
      name: user.userName, // Use userName field from schema
      picture: user.picture,
      role: user.role
    };

    // Send successful response
    const responseBody: LoginSuccessResponse = {
        success: true,
        message: USER_LOGIN_SUCCESS,
        user: responseUser,
        onboardingSkipped,
        accessToken,
    };
    res.status(200).send(responseBody);

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error during login:", errorMessage);
    // Check for specific error types if needed (e.g., Prisma errors)
    res.status(500).send({
      success: false,
      error: GENERIC_ERROR_MESSAGE,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// --- Google Login Function ---
export const loginWithGoogle = async (req: LoginWithGoogleRequest, res: UserResponse): Promise<void> => {
  const { idToken } = req.body;

  if (!idToken) {
    res.status(400).send({ success: false, error: "ID token is required" });
    return;
  }
  if (!AUTH_URL || !client) {
     console.error("Google Auth client or AUTH_URL not initialized.");
     res.status(500).send({ success: false, error: "Server configuration error." });
     return;
  }

  try {
    // Set credentials and make request to Google's userinfo endpoint
    client.setCredentials({ access_token: idToken } as Credentials); // Type assertion
    const response = await client.request<GooglePayload>({ url: AUTH_URL }); // Specify expected payload type
    const payload = response.data;

    // Validate payload structure
    if (!payload || !payload.id || !payload.email) {
      console.error("Invalid Google payload structure:", payload);
      res.status(401).send({ success: false, error: "Invalid Google authentication response" });
      return;
    }

    // Destructure validated payload
    const { id: googleId, email, name, picture } = payload;

    // Find user by email
    let user: PrismaUser | null = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
        // If user doesn't exist, send error (registration should handle creation)
        res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
        return;
    }

    // User exists, update with Google info if necessary
    try {
      // Only update if googleId is missing or different, or if name/picture changed
      if (user.googleId !== googleId || user.userName !== name || user.picture !== picture) {
          await prisma.user.update({
            where: { email: email },
            data: {
              googleId: googleId,
              userName: name || user.userName, // Keep existing name if Google doesn't provide one
              picture: picture || user.picture, // Keep existing picture if Google doesn't provide one
              lastLoginAt: new Date(), // Update last login time
              // Ensure 'verified' is true for Google logins if applicable
              // verified: true,
            },
          });
          // Re-fetch user data if needed after update, or merge updates into 'user' variable
          user = { ...user, googleId, userName: name || user.userName, picture: picture || user.picture, lastLoginAt: new Date() };
      } else if (!user.lastLoginAt || (new Date().getTime() - new Date(user.lastLoginAt).getTime() > 60000)) {
          // Update lastLoginAt if it's null or older than a minute ago
           await prisma.user.update({
                where: { email: email },
                data: { lastLoginAt: new Date() }
           });
           user.lastLoginAt = new Date();
      }
    } catch (updateError: unknown) {
      const errorMsg = updateError instanceof Error ? updateError.message : String(updateError);
      console.error("Error updating user profile during Google login:", errorMsg);
      // Log error but potentially continue login if update fails? Or return 500?
      res.status(500).send({ success: false, error: "Failed to update user profile" });
      return;
    }

    // Generate tokens for the existing/updated user
    const accessToken: string = generateAccessToken(user);
    const refreshToken: string = generateRefreshToken(user);

    if (!accessToken || !refreshToken) {
      console.error("Token generation failed for Google user:", user.id);
      res.status(500).send({ success: false, error: "Failed to generate authentication tokens" });
      return;
    }

    // Update refresh token in DB
    try {
        await prisma.user.update({
            where: { id: user.id },
            data: { refreshToken: refreshToken },
        });
    } catch (tokenUpdateError: unknown) {
         const errorMsg = tokenUpdateError instanceof Error ? tokenUpdateError.message : String(tokenUpdateError);
         console.error("Error updating refresh token during Google login:", errorMsg);
         // Log error, but login can still proceed with the generated tokens
    }

     // Check organization onboarding status (same as standard login)
    let onboardingSkipped = false;
    try {
      const organization = await prisma.organization.findFirst({
        where: { userId: user.id },
      });
      if (organization) {
        onboardingSkipped = organization.onboardingSkipped;
      }
    } catch (orgError: unknown) {
      const errorMsg = orgError instanceof Error ? orgError.message : String(orgError);
      console.error("Error fetching organization during Google login:", errorMsg);
    }

    // Prepare user data for response
    const responseUser: LoginResponseUser = {
      id: parseInt(user.id),
      email: user.email,
      name: user.userName,
      picture: user.picture,
      role: user.role
    };

    // Send successful response
    const responseBody: LoginSuccessResponse = {
        success: true,
        message: USER_LOGIN_SUCCESS,
        user: responseUser,
        onboardingSkipped, // Include onboarding status
        accessToken,
    };
    res.status(200).send(responseBody);


  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error during Google Login:", errorMessage);
    // Handle potential errors from client.request or token verification
    res.status(500).send({
      success: false,
      error: GENERIC_ERROR_MESSAGE,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};

// --- Internal Validation Function ---
const validate: ValidateLoginFunction = (req, res) => {
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
    // Changed status to 400 as per original JS
    res.status(400).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
    return false;
  }
  // Password complexity validation during login might not be ideal UX,
  // usually done at registration/password change. Kept for consistency with original JS.
  // if (!PASSWORD_REGEX.test(password)) {
  //   res.status(400).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
  //   return false;
  // }
  return true; // Validation passed
}; // Added missing closing brace
