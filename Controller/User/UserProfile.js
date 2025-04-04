import UserSchema from "../../Model/UserSchema.js";
import * as constants from "../../Constants/UserConstants.js";
import dotenv from "dotenv";
dotenv.config();
const {
    errors: {
        EMAIL_NOT_FOUND_ERROR,
        EMAIL_REQUIRED_ERROR,
        INVALID_EMAIL_FORMAT_ERROR,
        GENERIC_ERROR_MESSAGE
    },
    success: {
        USER_PROFILE_DATA_SUCCESS
    },
    validations: {
        EMAIL,
        PASSWORD
    }
} = constants;
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';

export async function GetProfileData(req, res) {
    try {
        const { userId } = req.params;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
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

        const validationResponse = validate(req, res);
        if (validationResponse !== true) {
            return;
        }

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: "User not found" });
        }

        user.userName = name || user.userName;
        user.email = email || user.email;
        user.role = role || user.role;

        await user.save();

        return res.status(200).send({
            success: true,
            message: "User profile updated successfully",
            data: {
                userName: user.userName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error("Error updating user profile: ", error);
        return res.status(500).send({ success: false, error: "Server error" });
    }
}

export async function UpdateProfilePicture(req, res) {
    try {
        const uploadedFile = req.files?.images?.[0];
        if (!uploadedFile) {
            return res.status(400).json({ message: "No image file uploaded." });
        }
        const imagePath = `${BACKEND_URL}/uploads/${uploadedFile.filename}`;
        const userId = req.body.userId;
        const user = await UserSchema.findById(userId);

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        user.picture = imagePath;
        await user.save();

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
        return res.status(500).json({ message: "Error updating user profile." });
    }
}
const validate = (req, res) => {
    const { email, role } = req.body;
    if (!email) {
        return res
            .status(400)
            .send({ success: false, error: EMAIL_REQUIRED_ERROR });
    }
    if (!EMAIL.test(email)) {
        return res
            .status(400)
            .send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    }
    const validRoles = ['user', 'admin', 'employee', 'manager'];
    if (role && !validRoles.includes(role)) {
        return res
            .status(400)
            .send({ success: false, error: "Invalid role. Valid roles are: user, admin, employee, manager." });
    }
    return true;
};