import { userContent } from "../../Constants/UserConstants.js";
import dotenv from "dotenv";
import { prisma } from "../../Components/ConnectDatabase.js";
dotenv.config();

const {
  errors: {
    EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR,
    GENERIC_ERROR_MESSAGE,
    USER_NOT_FOUND,
    INVALID_USER_ID,
    INVALID_FILE_TYPE,
    FILE_SIZE_EXCEEDED,
    NO_FILE_UPLOADED,
  },
  success: { USER_PROFILE_DATA_SUCCESS },
  validations: { EMAIL: EMAIL_REGEX },
} = userContent;

const BACKEND_URL = process.env.BASE_URL || "http://localhost:8001";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];

export async function GetProfileData(req, res) {
  try {
    const { userId } = req.params;

    if (!userId || isNaN(userId)) {
      return res.status(400).send({ success: false, error: "Invalid user ID" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      return res.status(400).send({ success: false, error: INVALID_USER_ID });
    }
    return res.status(200).send({ success: true, message: USER_PROFILE_DATA_SUCCESS, data: user });
  } catch (error) {
        console.error("Error fetching user data: ", error);
        return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
  }

export async function UpdateProfileData(req, res) {
  try {
    const { userId, name, email, role } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).send({ success: false, error: "Invalid user ID" });
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        userName: name,
        email: email,
        role: role,
      },
    });

    return res.status(200).send({
      success: true,
      message: "User profile updated successfully",
      data: {
        userName: updatedUser.userName,
        email: updatedUser.email,
        role: updatedUser.role,
      },
    });
  } catch (error) {
        console.error("Error updating user profile: ", error);
        return res
          .status(500)
          .send({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
  }

export async function UpdateProfilePicture(req, res) {
  try {
    const { userId } = req.body;

    if (!userId || isNaN(userId)) {
      return res.status(400).send({ success: false, error: "Invalid user ID" });
    }
    const uploadedFile = req.files?.images?.[0];
    if (!uploadedFile) {
      return res.status(400).json({ success: false, error: NO_FILE_UPLOADED });
    }

    if (!ALLOWED_FILE_TYPES.includes(uploadedFile.mimetype)) {
      return res.status(400).json({ success: false, error: INVALID_FILE_TYPE });
    }

    if (uploadedFile.size > MAX_FILE_SIZE) {
      return res
        .status(400)
        .json({ success: false, error: FILE_SIZE_EXCEEDED });
    }

    const imagePath = `${BACKEND_URL}/uploads/${uploadedFile.filename}`;

    try {
      await prisma.user.update({
        where: {
          id: parseInt(userId),
        },
        data: {
          picture: imagePath,
        },
      });
    } catch (error) {
      console.error("Error updating profile picture: ", error);
      return res
        .status(404)
        .send({ success: false, error: USER_NOT_FOUND });
    }


    return res.status(201).send({
      success: true,
      message: "Image uploaded and profile updated successfully.",
      image: {
        filename: uploadedFile.filename,
        path: imagePath,
      },
    });
  } catch (error) {
        console.error("Error updating user profile picture:", error);
        return res
      .status(500)
      .json({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
  }

const validate = (req, res) => {
  const { email, role, name, userId } = req.body;

  if (!userId) {
    return res.status(400).send({ success: false, error: INVALID_USER_ID });
  }

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

  if (name && name.length < 2) {
    return res.status(400).send({
      success: false,
      error: "Name must be at least 2 characters long",
    });
  }

  const validRoles = ["user", "admin", "employee", "manager"];
  if (role && !validRoles.includes(role)) {
    return res.status(400).send({
      success: false,
      error: "Invalid role. Valid roles are: user, admin, employee, manager.",
    });
  }

  return true;
};

export async function GetAllUsers(req, res) {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res

        .status(404)

        .send({ success: false, error: "user id is required" });
    }

    const user = await prisma.user.findUnique({
      where: {
        id: parseInt(userId),
      },
    });

    if (!user) {
      return res.status(404).send({
        success: false,

        error: `User with the given user ID not found!`,
      });
    }

    const allUserDetails = await prisma.user.findMany({
      select: {
        name: true,
        email: true,
        role: true,
        picture: true,
      },
    });

    if (!allUserDetails || allUserDetails.length === 0) {
      return res.status(404).send({
        success: false,

        error: `No user found !`,
      });
    }

    return res.status(200).send({
      success: true,

      message: "Team members retrieved successfully!",

      allUserDetails: allUserDetails,
    });
  } catch (error) {
    console.log("Error getting team members:", error.message);

    return res

      .status(500)

      .send({ error: "Internal server error. Please try again!" });
  }
}
