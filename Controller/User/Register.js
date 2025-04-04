import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import UserSchema from "../../Model/UserSchema.js";
import UserOtpSchema from "../../Model/UserOtpSchema.js";
import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js";
import { userContent } from "../../Constants/UserConstants.js";
import bcrypt from "bcryptjs";

const {
  errors: {
    EMAIL_NOT_FOUND_ERROR,
    EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR,
    GENERIC_ERROR_MESSAGE,
    USER_EMAIL_ALREADY_EXIST,
    USER_EMAIL_ALREADY_VERIFIED
  },
  messages: {
    PASSWORD_REQUIRED_ERROR,
    PASSWORD_COMPLEXITY_ERROR,
    USER_SEND_OTP
  },
  success: {
    USER_REGISTER_SUCCESS
  },
  validations: {
    EMAIL: EMAIL_REGEX,
    PASSWORD_REGEX
  }
} = userContent;

dotenv.config();
const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);

export async function Register(req, res) {
  try {
    const { email, password, role } = req.body;
    let { userName } = req.body;
    
    // If userName is not provided, create it from email
    if (!userName || userName.trim().length === 0) {
      userName = email.split('@')[0];
      req.body.userName = userName;
    }

    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }

    let user = await UserSchema.findOne({ email });
    if (user) {
      if (user.verified === "true") {
        return res.status(400).send({
          success: false,
          error: USER_EMAIL_ALREADY_EXIST,
        });
      }
      return res.status(400).send({
        success: false,
        error: USER_EMAIL_ALREADY_VERIFIED,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user = new UserSchema({ 
      userName, 
      email, 
      password: hashedPassword,
      role,
      verified: false 
    });
    await user.save();

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    
    await UserOtpSchema.findOneAndUpdate(
      { userId: user._id },
      { otp, expiresAt: otpExpiration },
      { upsert: true, new: true }
    );

    await SendOTPInMail(otp, email);
    
    return res.status(201).send({
      success: true,
      message: USER_SEND_OTP,
    });
  } catch (error) {
    console.error("User Register Error:", error);
    return res.status(500).send({ 
      success: false, 
      error: GENERIC_ERROR_MESSAGE 
    });
  }
}

export const registerWithGoogle = async (req, res) => {
  try {
    const { idToken, role } = req.body;
    if (!idToken) {
      return res.status(400).send({ 
        success: false, 
        error: "ID token is required" 
      });
    }

    client.setCredentials({ access_token: idToken });
    const response = await client.request({ url: AUTH_URL });
    const payload = response.data;
    
    if (!payload) {
      return res.status(401).send({ 
        success: false, 
        error: "Invalid ID token" 
      });
    }

    const { id: googleId, email, name, picture } = payload;
    if (!googleId || !email || !name) {
      return res.status(400).send({ 
        success: false, 
        error: "Invalid Google profile data" 
      });
    }

    if (!role) {
      return res.status(400).send({ 
        success: false, 
        error: ROLE_REQUIRED_ERROR 
      });
    }

    const validRoles = ['user', 'admin', 'employee', 'manager'];
    if (!validRoles.includes(role)) {
      return res.status(400).send({ 
        success: false, 
        error: INVALID_ROLE_ERROR 
      });
    }

    let user = await UserSchema.findOne({ email });
    if (user) {
      return res.status(400).send({ 
        success: false, 
        error: USER_EMAIL_ALREADY_EXIST 
      });
    }

    user = new UserSchema({
      googleId,
      email,
      userName: name,
      picture,
      verified: true,
      role: role
    });
    
    await user.save();
    
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(201).send({
      success: true,
      message: USER_REGISTER_SUCCESS,
      data: {
        user: {
          _id: user._id,
          email: user.email,
          userName: user.userName,
          picture: user.picture,
          verified: user.verified,
          role:user.role
        },
        accessToken,
        refreshToken
      }
    });
  } catch (error) {
    console.error("Google Registration Error:", error);
    return res.status(500).send({ 
      success: false, 
      error: GENERIC_ERROR_MESSAGE 
    });
  }
};

const validate = (req, res) => {
  const { email, password, userName, role } = req.body;
  
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
    return res
      .status(400)
      .send({ success: false, error: PASSWORD_REQUIRED_ERROR });
  }
  
  if (!PASSWORD_REGEX.test(password)) {
    return res
      .status(400)
      .send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
  }
  
  if (!userName || userName.trim().length === 0) {
    return res
      .status(400)
      .send({ success: false, error: "Username is required!" });
  }

  if (!role) {
    return res
      .status(400)
      .send({ success: false, error: ROLE_REQUIRED_ERROR });
  }

  const validRoles = ['user', 'admin', 'employee', 'manager'];
  if (!validRoles.includes(role)) {
    return res
      .status(400)
      .send({ success: false, error: INVALID_ROLE_ERROR });
  }
  
  return true;
};

export async function ResetPassword(req, res) {
  try {
    const { email, password } = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }

    let user = await UserSchema.findOne({ email });
    if (!user) {
      return res.status(404).send({
        success: false,
        error: EMAIL_NOT_FOUND_ERROR,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    const otp = crypto.randomInt(100000, 999999).toString();
    const otpExpiration = new Date(Date.now() + 30 * 60 * 1000);
    
    await UserOtpSchema.findOneAndUpdate(
      { userId: user._id },
      { otp, expiresAt: otpExpiration },
      { upsert: true, new: true }
    );

    await SendOTPInMail(otp, email);
    
    return res.status(200).send({
      success: true,
      message: USER_SEND_OTP,
    });
  } catch (error) {
    console.error("Password Reset Error:", error);
    return res.status(500).send({ 
      success: false, 
      error: GENERIC_ERROR_MESSAGE 
    });
  }
}
