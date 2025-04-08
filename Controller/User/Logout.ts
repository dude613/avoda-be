import { prisma } from "../../Components/ConnectDatabase.js";
import { userContent } from "../../Constants/UserConstants.js"; // Assuming JS is compatible
import { LogoutRequest, UserResponse } from "../../types/user.types.js"; // Adjust path/extension if needed

// Destructure constants with defaults
const {
    errors: {
        USER_NOT_FOUND = "User not found.",
        GENERIC_ERROR_MESSAGE = "An internal server error occurred."
    } = {},
    messages: {
        USER_LOGOUT_SUCCESS = "User logged out successfully."
    } = {}
} = userContent || {};

export const Logout = async (req: LogoutRequest, res: UserResponse): Promise<void> => {
  try {
    const { userId: userIdString } = req.body;

    // Validate userId presence and format
    if (!userIdString) {
      res.status(400).json({ success: false, error: "User ID is required in the request body." });
      return;
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      res.status(400).json({ success: false, error: "Invalid user ID format. Must be a number." });
      return;
    }

    // Use updateMany to avoid error if user not found, or findUnique first
    const updateResult = await prisma.user.updateMany({
      where: {
          id: userId,
          // Optionally check if refreshToken is already null to avoid unnecessary updates
          // refreshToken: { not: null }
      },
      data: {
          refreshToken: null,
          otp: null, // Clear OTP as well
          otpExpiry: null // Clear OTP expiry
      }
    });

    // Check if any user was actually updated
    if (updateResult.count === 0) {
        // Check if the user exists at all to give a more specific error
        const userExists = await prisma.user.findUnique({ where: { id: userId } });
        if (!userExists) {
            res.status(404).json({ success: false, error: USER_NOT_FOUND }); // Use 404 for not found
        } else {
            // User exists but wasn't updated (maybe already logged out / token was null)
            // Consider sending success or a specific message like "User already logged out"
            res.status(200).json({ success: true, message: "User session already cleared or user not found." });
        }
        return;
    }

    // Successfully updated (cleared tokens)
    res.status(200).json({
      success: true,
      message: USER_LOGOUT_SUCCESS,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error during logout:", errorMessage); // Log the actual error
    res.status(500).json({
      success: false,
      error: GENERIC_ERROR_MESSAGE,
      details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
};
