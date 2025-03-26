import bcrypt from "bcryptjs";
import UserSchema from "../../Model/UserSchema.js";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import { userContent } from "../../Constants/UserConstants.js";
import Organization from "../../Model/OrganizationSchema.js";

const {
  EMAIL_NOT_FOUND_ERROR, EMAIL_REQUIRED_ERROR, INVALID_EMAIL_FORMAT_ERROR, PASSWORD_REQUIRED_ERROR
  , PASSWORD_COMPLEXITY_ERROR, GENERIC_ERROR_MESSAGE, EMAIL_REGEX, PASSWORD_REGEX,
  PASSWORD_REQUIRED_INCORRECT,
  USER_LOGIN_SUCCESS
} = userContent;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);

export async function Login(req, res) {
  const { email, password } = req.body;

  const validationResponse = validate(req, res);
  if (validationResponse !== true) {
    return;
  }

  try {
    const user = await UserSchema.findOne({ email });
    if (!user) {
      return res
        .status(400)
        .send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ success: false, error: PASSWORD_REQUIRED_INCORRECT });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    user.refreshToken = refreshToken;
    user.otp = otp;
    user.otpExpiry = otpExpiry;
    await user.save();
    let onboardingSkipped = false;
    const organization = await Organization.findOne({ user: user._id });

    if (organization) {
      onboardingSkipped = organization.onboardingSkipped;
    }

    res.status(201).send({
      success: true,
      message: USER_LOGIN_SUCCESS,
      user,
      onboardingSkipped,
      accessToken,
    });

  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(500)
      .send({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

export const loginWithGoogle = async (req, res) => {
  const { idToken } = req.body;
  if (!idToken)
    return res
      .status(400)
      .send({ success: false, error: "ID token is required" });
  try {
    client.setCredentials({ access_token: idToken });
    const response = await client.request({ url: AUTH_URL });
    const payload = response.data;
    if (!payload)
      return res
        .status(401)
        .send({ success: false, error: "Invalid ID token" });
    const { id: googleId, email, name, picture } = payload;
    if (!googleId) {
      return res
        .status(400)
        .send({ success: false, error: "Invalid Google ID" });
    }
    let user = await UserSchema.findOne({ email });

    if (user) {
      user.googleId = googleId;
      user.name = name;
      user.picture = picture;
      await user.save();
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      user.refreshToken = refreshToken;
      await user.save();
      return res.status(200).send({
        success: true,
        message: USER_LOGIN_SUCCESS,
        user,
        accessToken,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: EMAIL_NOT_FOUND_ERROR,
      });
    }
  } catch (error) {
    console.error("Error during Login:", error);
    return res
      .status(500)
      .send({ success: false, ERROR: GENERIC_ERROR_MESSAGE });
  }
};

const validate = (req, res) => {
  const { email, password } = req.body;
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
  if (!password) {
    return res.status(404).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
  }
  if (!PASSWORD_REGEX.test(password)) {
    return res.status(404).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR })
  }
  return true;
};