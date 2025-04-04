import UserSchema from "../../Model/UserSchema.js";
import { userContent } from "../../Constants/UserConstants.js";

const { USER_NOT_FOUND, USER_LOGOUT_SUCCESS } = userContent;

export const Logout = async (req, res) => {
  try {
    const { userId } = req.body;

    const user = await UserSchema.findById({ _id: userId });
    if (!user) {
      return res.status(400).json({ success: false, error: USER_NOT_FOUND });
    }

    user.refreshToken = null;
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: USER_LOGOUT_SUCCESS,
    });
  } catch (error) {
    console.log(error)
    return res.status(500).json({
      success: false,
      error: GENERIC_ERROR_MESSAGE,
    });
  }
};
