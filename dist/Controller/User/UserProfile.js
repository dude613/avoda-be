import { userContent } from "../../Constants/UserConstants.js";
import dotenv from "dotenv";
import { prisma } from "../../Components/ConnectDatabase.js";
dotenv.config();
const { errors: { EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR, GENERIC_ERROR_MESSAGE, USER_NOT_FOUND, INVALID_USER_ID, INVALID_FILE_TYPE, FILE_SIZE_EXCEEDED, NO_FILE_UPLOADED, }, success: { USER_PROFILE_DATA_SUCCESS }, validations: { EMAIL: EMAIL_REGEX }, } = userContent;
const BACKEND_URL = process.env.BASE_URL || "http://localhost:8001";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ["image/jpeg", "image/png", "image/gif"];
export async function GetProfileData(req, res) {
    try {
        const { userId } = req.params;
        if (!userId || isNaN(Number(userId))) {
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
    }
    catch (error) {
        console.error("Error fetching user data: ", error);
        return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}
export async function UpdateProfileData(req, res) {
    try {
        const { userId, name, email, role } = req.body;
        if (!userId || isNaN(Number(userId))) {
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
    }
    catch (error) {
        console.error("Error updating user profile: ", error);
        return res
            .status(500)
            .send({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}
export async function UpdateProfilePicture(req, res) {
    try {
        const { userId } = req.body;
        if (!userId || isNaN(Number(userId))) {
            return res.status(400).send({ success: false, error: "Invalid user ID" });
        }
        const files = req.files;
        const uploadedFile = files?.images;
        if (!uploadedFile) {
            return res.status(400).json({ success: false, error: NO_FILE_UPLOADED });
        }
        let file;
        if (Array.isArray(uploadedFile)) {
            file = uploadedFile[0];
        }
        else {
            file = uploadedFile;
        }
        if (!ALLOWED_FILE_TYPES.includes(file.mimetype)) {
            return res.status(400).json({ success: false, error: INVALID_FILE_TYPE });
        }
        if (file.size > MAX_FILE_SIZE) {
            return res
                .status(400)
                .json({ success: false, error: FILE_SIZE_EXCEEDED });
        }
        // Use file.name instead of file.filename
        const imagePath = `${BACKEND_URL}/uploads/${file.name}`;
        try {
            await prisma.user.update({
                where: {
                    id: parseInt(userId),
                },
                data: {
                    picture: imagePath,
                },
            });
        }
        catch (error) {
            console.error("Error updating profile picture: ", error);
            return res
                .status(404)
                .send({ success: false, error: USER_NOT_FOUND });
        }
        return res.status(201).send({
            success: true,
            message: "Image uploaded and profile updated successfully.",
            image: {
                filename: file.name,
                path: imagePath,
            },
        });
    }
    catch (error) {
        console.error("Error updating user profile picture:", error);
        return res
            .status(500)
            .json({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}
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
                error: `No user found!`,
            });
        }
        return res.status(200).send({
            success: true,
            message: "Team members retrieved successfully!",
            allUserDetails: allUserDetails,
        });
    }
    catch (error) {
        console.error("Error getting team members:", error);
        return res
            .status(500)
            .send({ success: false, error: "Internal server error. Please try again!" });
    }
}
