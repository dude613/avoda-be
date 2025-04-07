import { prisma } from "../../Components/ConnectDatabase.js";
import { userContent } from "../../Constants/UserConstants.js";
const { USER_NOT_FOUND } = userContent.errors;
const { USER_LOGOUT_SUCCESS } = userContent.messages;
const { GENERIC_ERROR_MESSAGE } = userContent.errors;
export const Logout = async (req, res) => {
    try {
        const { userId } = req.body;
        if (!userId || isNaN(userId)) {
            return res.status(400).json({ success: false, error: "Invalid user ID" });
        }
        const user = await prisma.user.update({
            where: { id: parseInt(userId) },
            data: { refreshToken: null, otp: null, otpExpiry: null }
        });
        if (!user) {
            return res.status(400).json({ success: false, error: USER_NOT_FOUND });
        }
        return res.status(200).json({
            success: true,
            message: USER_LOGOUT_SUCCESS,
        });
    }
    catch (error) {
        console.log(error);
        return res.status(500).json({
            success: false,
            error: GENERIC_ERROR_MESSAGE,
        });
    }
};
