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
        const { userId } = req.body;

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
        const { userId, name, profilePicture, address } = req.body;

        const user = await UserSchema.findById(userId);
        if (!user) {
            return res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
        }

        return res.status(200).send({
            success: true,
            message: "User profile updated successfully",
            data: user
        });
    } catch (error) {
        console.error("Error updating user profile: ", error);
        return res.status(500).send({ success: false, error: "Server error" });
    }
}
