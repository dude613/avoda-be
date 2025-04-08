import { userContent } from "../../Constants/UserConstants.js"; // Keep .js extension as required by NodeNext
import dotenv from "dotenv";
import { prisma } from "../../Components/ConnectDatabase.js"; // Keep .js extension as required by NodeNext
import {
    GetProfileDataRequest,
    UpdateProfileDataRequest,
    UpdateProfilePictureRequest,
    GetAllUsersRequest,
    UserResponse,
    ValidateProfileUpdateFunction,
    UserRole, // Import role type
    validUserRoles // Import valid roles array
} from "../../types/user.types.js"; // Adjust path/extension if needed
import { User as PrismaUser } from '@prisma/client'; // Import Prisma User type
import { Request } from 'express'; // Import base Request type
// Import Multer file type via Express namespace
import { Express } from 'express';
type MulterFile = Express.Multer.File;


dotenv.config();

// Destructure constants with defaults
const {
  errors: {
    EMAIL_REQUIRED_ERROR = "Email address is required.",
    INVALID_EMAIL_FORMAT_ERROR = "Invalid email format.",
    GENERIC_ERROR_MESSAGE = "An internal server error occurred.",
    USER_NOT_FOUND = "User not found.",
    INVALID_USER_ID = "Invalid user ID.",
    INVALID_FILE_TYPE = "Invalid file type. Only JPEG, PNG, and GIF images are allowed.",
    FILE_SIZE_EXCEEDED = "File size exceeds the maximum limit of 5MB.",
    NO_FILE_UPLOADED = "No file was uploaded.",
  } = {},
  success: {
      USER_PROFILE_DATA_SUCCESS = "User profile data fetched successfully."
  } = {},
  validations: {
      EMAIL: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  } = {}
} = userContent || {};

const BACKEND_URL = process.env.BASE_URL || "http://localhost:8001"; // Default if not set
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];

// --- Get Profile Data ---
export async function GetProfileData(req: GetProfileDataRequest, res: UserResponse): Promise<void> {
  try {
    const { userId: userIdString } = req.params;
    console.log(req.params, "gettt");

    if (!userIdString) { // Should be caught by route definition, but good practice
        res.status(400).send({ success: false, error: "User ID parameter is required." });
        return;
    }

    const user: PrismaUser | null = await prisma.user.findUnique({
      where: { id: userIdString },
      // Optionally select only needed fields
      // select: { id: true, email: true, userName: true, picture: true, role: true, createdAt: true, verified: true, lastLoginAt: true }
    });

    if (!user) {
      // Use 404 for resource not found
      res.status(404).send({ success: false, error: USER_NOT_FOUND });
      return;
    }

    // Return the full user object (or selected fields)
    res.status(200).send({ success: true, message: USER_PROFILE_DATA_SUCCESS, data: user });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error fetching user data: ", errorMessage);
    res.status(500).send({
        success: false,
        error: GENERIC_ERROR_MESSAGE,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// --- Update Profile Data ---
export async function UpdateProfileData(req: UpdateProfileDataRequest, res: UserResponse): Promise<void> {
  try {
    // Use typed internal validation function
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
        return; // Validation failed and sent response
    }

    // Destructure validated body data
    const { userId: userIdString, name, email, role } = req.body;

    // Prepare data for update, only including provided fields
    const updateData: { userName?: string; email?: string; role?: UserRole } = {};
    if (name !== undefined) updateData.userName = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;

    // Check if there's anything to update
    if (Object.keys(updateData).length === 0) {
        res.status(400).send({ success: false, error: "No profile data provided for update." });
        return;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userIdString },
      data: updateData,
    });

    // Return only the updated fields (or a standard user profile object)
    res.status(200).send({
      success: true,
      message: "User profile updated successfully",
      data: { // Return a subset of user data
        id: updatedUser.id,
        userName: updatedUser.userName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating user profile: ", errorMessage);
     // Check for specific Prisma errors like unique constraint violation (P2002) if email is updated
    if (error instanceof Error && (error as any).code === 'P2002') {
         res.status(400).send({ success: false, error: "Email address is already in use by another user." });
    } else if (error instanceof Error && (error as any).code === 'P2025') {
         // Record to update not found
         res.status(404).send({ success: false, error: USER_NOT_FOUND });
    } else {
        res.status(500).send({
          success: false,
          error: GENERIC_ERROR_MESSAGE,
          details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
  }
}

// --- Update Profile Picture ---
export async function UpdateProfilePicture(req: UpdateProfilePictureRequest, res: UserResponse): Promise<void> {
  try {
    const { userId: userIdString } = req.body;

    // Validate userId
    if (!userIdString) {
      res.status(400).send({ success: false, error: "User ID is required in the request body." });
      return;
    }
    // Access uploaded file using the correct structure (assuming 'images' fieldname from Multer setup)
    let uploadedFile: MulterFile | undefined = undefined;

    // Check if req.files exists and is the object form (not an array)
    if (req.files && !Array.isArray(req.files) && req.files['images']) {
        // Access the first file associated with the 'images' field
        uploadedFile = req.files['images'][0];
    }

    if (!uploadedFile) {
      res.status(400).json({ success: false, error: NO_FILE_UPLOADED });
      return;
    }

    // Validate file type and size
    if (!ALLOWED_FILE_TYPES.includes(uploadedFile.mimetype)) {
      res.status(400).json({ success: false, error: INVALID_FILE_TYPE });
      return;
    }
    if (uploadedFile.size > MAX_FILE_SIZE) {
      res.status(400).json({ success: false, error: FILE_SIZE_EXCEEDED });
      return;
    }

    // Construct the public URL for the image
    const imagePath = `${BACKEND_URL}/uploads/${uploadedFile.filename}`;

    // Update user's picture path in the database
    try {
      await prisma.user.update({
        where: { id: userIdString },
        data: { picture: imagePath },
      });
    } catch (dbError: unknown) {
       // Handle case where user doesn't exist (Prisma P2025)
       if (dbError instanceof Error && (dbError as any).code === 'P2025') {
            res.status(404).send({ success: false, error: USER_NOT_FOUND });
       } else {
           const errorMsg = dbError instanceof Error ? dbError.message : String(dbError);
           console.error("Error updating profile picture in DB: ", errorMsg);
           // Consider deleting the uploaded file if DB update fails
           // fs.unlinkSync(uploadedFile.path); // Requires 'fs' import and error handling
           res.status(500).send({ success: false, error: "Failed to update profile picture record." });
       }
       return; // Exit after handling DB error
    }

    // Send success response
    res.status(200).send({ // Use 200 OK for update, 201 is for resource creation
      success: true,
      message: "Image uploaded and profile updated successfully.",
      image: {
        filename: uploadedFile.filename,
        path: imagePath, // Send the public URL
      },
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating user profile picture:", errorMessage);
    res.status(500).json({
        success: false,
        error: GENERIC_ERROR_MESSAGE,
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}

// --- Internal Validation Function (for UpdateProfileData) ---
const validate: ValidateProfileUpdateFunction = (req, res) => {
  // Destructure directly from req.body as it's typed
  const { userId: userIdString, name, email, role } = req.body;

  if (!userIdString) { // Check if userId is provided in the body
    res.status(400).send({ success: false, error: "User ID is required in the request body." });
    return false;
  }
  // Validate email format only if email is provided
  if (email && !EMAIL_REGEX.test(email)) {
    res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    return false;
  }

  // Validate name length only if name is provided
  if (name && name.length < 2) {
    res.status(400).send({
      success: false,
      error: "Name must be at least 2 characters long",
    });
    return false;
  }

  // Validate role only if role is provided
  if (role && !validUserRoles.includes(role)) {
    res.status(400).send({
      success: false,
      error: `Invalid role. Valid roles are: ${validUserRoles.join(', ')}.`,
    });
    return false;
  }

  return true; // Validation passed
};

// --- Get All Users ---
// Note: This function fetches details for ALL users, not just team members.
// Consider security implications - should only admins be able to call this?
// Also, the original JS had inconsistent indentation and status codes.
export async function GetAllUsers(req: GetAllUsersRequest, res: UserResponse): Promise<void> {
  try {
    // The userId from params seems unused in the actual logic fetching all users.
    // It was only used to check if the *requesting* user exists.
    // This might be a security check placeholder. Let's keep it for now.
    const { userId: requestingUserIdString } = req.params;

    if (!requestingUserIdString) {
      res.status(400).send({ success: false, error: "Requesting user ID parameter is required." });
      return;
    }
    const requestingUserId = parseInt(requestingUserIdString, 10);

    // Check if the requesting user exists (basic authorization check)
    const requestingUser = await prisma.user.findUnique({
      where: { id: requestingUserIdString },
    });
    if (!requestingUser) {
      // Use 403 Forbidden if the user exists but isn't authorized,
      // or 404 if the requesting user themselves isn't found.
      res.status(404).send({ success: false, error: `Requesting user with ID ${requestingUserId} not found!` });
      return;
    }
    // Add role-based authorization here if needed (e.g., only allow 'admin')
    // if (requestingUser.role !== 'admin') {
    //     res.status(403).send({ success: false, error: "Forbidden: You do not have permission to view all users." });
    //     return;
    // }


    // Fetch all users with selected fields
    const allUserDetails = await prisma.user.findMany({
      select: {
        // Select fields appropriate to return - avoid sensitive data like password/refreshToken
        id: true,
        userName: true, // Use userName from schema
        email: true,
        role: true,
        picture: true,
        createdAt: true,
        verified: true,
        lastLoginAt: true
      },
      // Add ordering if desired
      // orderBy: { createdAt: 'desc' }
    });

    // findMany returns [], so no need to check !allUserDetails
    if (allUserDetails.length === 0) {
      // Return 200 OK with empty array, not 404
      res.status(200).send({ success: true, message: "No users found.", allUserDetails: [] });
      return;
    }

    res.status(200).send({
      success: true,
      message: "All users retrieved successfully!", // Adjusted message
      allUserDetails: allUserDetails,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Log specific error message
    console.error("Error getting all users:", errorMessage);
    res.status(500).send({
        success: false,
        error: "Internal server error. Please try again!", // Use generic message for client
        details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    });
  }
}
