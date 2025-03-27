import UserSchema from "../../Model/UserSchema.js";
import { userContent } from "../../Constants/UserConstants.js";

const {
    EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR, PASSWORD_REQUIRED_ERROR,
    EMAIL_REGEX,
    USER_SEND_OTP,
    USER_REGISTER_SUCCESS,
    USER_EMAIL_ALREADY_EXIST,
    USER_EMAIL_ALREADY_VERIFIED,
    USER_INVALID_OTP,
    USER_OTP_EXPIRE,
    USER_EMAIL_VERIFIED,
    USER_PROFILE_DATA_SUCCESS
} = userContent;

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

const validate = (req, res) => {
    const { email, role } = req.body;
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
    const validRoles = ['user', 'admin', 'employee', 'manager'];
    if (role && !validRoles.includes(role)) {
        return res
            .status(400)
            .send({ success: false, error: "Invalid role. Valid roles are: user, admin, employee, manager." });
    }
    return true;
};