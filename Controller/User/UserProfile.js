import UserSchema from "../../Model/UserSchema.js";
import { userContent } from "../../Constants/UserConstants.js";
import dotenv from "dotenv";
dotenv.config();

const {
    errors: {
        EMAIL_NOT_FOUND_ERROR,
        EMAIL_REQUIRED_ERROR,
        INVALID_EMAIL_FORMAT_ERROR,
        GENERIC_ERROR_MESSAGE,
        USER_EMAIL_ALREADY_EXIST,
        USER_EMAIL_ALREADY_VERIFIED,
        USER_INVALID_OTP,
        USER_NOT_FOUND,
        INVALID_USER_ID,
        INVALID_FILE_TYPE,
        FILE_SIZE_EXCEEDED,
        NO_FILE_UPLOADED
    },
    success: {
        USER_EMAIL_VERIFIED,
        USER_REGISTER_SUCCESS,
        USER_PROFILE_DATA_SUCCESS
    },
    messages: {
        USER_OTP_EXPIRE,
        USER_SEND_OTP
    },
    validations: {
        EMAIL: EMAIL_REGEX
    }
} = userContent;

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8001';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export async function GetProfileData(req, res) {
    try {
        const { userId } = req.params;
        
        if (!userId) {
            return res.status(400).send({ success: false, error: INVALID_USER_ID });
        }

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: USER_NOT_FOUND });
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

        if (!userId) {
            return res.status(400).send({ success: false, error: INVALID_USER_ID });
        }

        const validationResponse = validate(req, res);
        if (validationResponse !== true) {
            return;
        }

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: USER_NOT_FOUND });
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
        return res.status(500).send({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}

export async function UpdateProfilePicture(req, res) {
    try {
        const { userId } = req.body;
        
        if (!userId) {
            return res.status(400).send({ success: false, error: INVALID_USER_ID });
        }

        const uploadedFile = req.files?.images?.[0];
        if (!uploadedFile) {
            return res.status(400).json({ success: false, error: NO_FILE_UPLOADED });
        }

        if (!ALLOWED_FILE_TYPES.includes(uploadedFile.mimetype)) {
            return res.status(400).json({ success: false, error: INVALID_FILE_TYPE });
        }

        if (uploadedFile.size > MAX_FILE_SIZE) {
            return res.status(400).json({ success: false, error: FILE_SIZE_EXCEEDED });
        }

        const imagePath = `${BACKEND_URL}/uploads/${uploadedFile.filename}`;
        const user = await UserSchema.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, error: USER_NOT_FOUND });
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
        return res.status(500).json({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}

const validate = (req, res) => {
    const { email, role, name, userId } = req.body;
    
    if (!userId) {
        return res.status(400).send({ success: false, error: INVALID_USER_ID });
    }

    if (!email) {
        return res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
    }

    if (!EMAIL_REGEX.test(email)) {
        return res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
    }

    if (name && name.length < 2) {
        return res.status(400).send({ success: false, error: "Name must be at least 2 characters long" });
    }

    const validRoles = ['user', 'admin', 'employee', 'manager'];
    if (role && !validRoles.includes(role)) {
        return res.status(400).send({ success: false, error: "Invalid role. Valid roles are: user, admin, employee, manager." });
    }
    
    return true;
};