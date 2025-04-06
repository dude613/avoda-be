import bcrypt from "bcryptjs";
import dotenv from "dotenv";
dotenv.config();
import { OAuth2Client } from "google-auth-library";
import {
  generateAccessToken,
  generateRefreshToken,
} from "../../Components/VerifyAccessToken.js";
import { userContent } from "../../Constants/UserConstants.js";
import { prisma } from "../../Components/ConnectDatabase.js";

const {
  errors: {
    EMAIL_NOT_FOUND_ERROR,
    EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR,
    PASSWORD_REQUIRED_INCORRECT,
    GENERIC_ERROR_MESSAGE
  },
  success: {
    USER_LOGIN_SUCCESS
  },
  messages: {
    PASSWORD_REQUIRED_ERROR,
    PASSWORD_COMPLEXITY_ERROR
  },
  validations: {
    EMAIL: EMAIL_REGEX,
    PASSWORD_REGEX
  }
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
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
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

if (!accessToken || !refreshToken) {
  return res.status(500).send({ 
    success: false, 
    error: "Failed to generate authentication tokens" 
  });
}
const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    
 try {
      await prisma.$transaction(async (prisma) => {
        await prisma.user.update({
          where: {
            id: user.id,
          },
          data: {
            refreshToken: refreshToken,
            otp: otp,
            otpExpiry: otpExpiry
          },
        });
      });
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      return res.status(500).send({
        success: false,
        error: "Failed to update user session",
      });
    }

    let onboardingSkipped = false;
    try {
    const organization = await prisma.organization.findFirst({
      where: {
        userId: user.id,
      },
    });

    if (organization) {
      onboardingSkipped = organization.onboardingSkipped;
    }

    } catch (orgError) {
      console.error("Error fetching organization:", orgError);
      // Continue with default onboardingSkipped value
    }

    res.status(200).send({
      success: true,
      message: USER_LOGIN_SUCCESS,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        role:user.role
        // Only send necessary user data
      },
      onboardingSkipped,
      accessToken,
    });

  } catch (error) {
    console.error("Error during login:", error);
    if (error.name === 'MongoError') {
      return res.status(503).send({ 
        success: false, 
        error: "Database service temporarily unavailable" 
      });
    }
    res.status(500).send({ 
      success: false, 
      error: GENERIC_ERROR_MESSAGE 
    });
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
    
    if (!payload || !payload.id || !payload.email) {
      return res
        .status(401)
        .send({ success: false, error: "Invalid Google authentication response" });
    }

    const { id: googleId, email, name, picture } = payload;
    
    if (!googleId || !email) {
      return res
        .status(400)
        .send({ success: false, error: "Invalid Google authentication data" });
    }

    let user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    if (user) {
      try {
      await prisma.user.update({
        where: {
          email: email,
        },
        data: {
          googleId: googleId,
          userName: name,
          picture: picture,
        },
      });
    } catch (saveError) {
      console.error("Error saving user:", saveError);
      return res.status(500).send({ 
        success: false, 
        error: "Failed to update user profile" 
      });
    }

      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);

      if (!accessToken || !refreshToken) {
        return res.status(500).send({ 
          success: false, 
          error: "Failed to generate authentication tokens" 
        });
      }
      await prisma.user.update({
        where: {
          id: user.id,
        },
        data: {
          refreshToken: refreshToken,
        },
      });
      return res.status(200).send({
        success: true,
        message: USER_LOGIN_SUCCESS,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          picture: user.picture,
          role:user.role
        },
        accessToken,
      });
    } else {
      return res.status(400).send({
        success: false,
        message: EMAIL_NOT_FOUND_ERROR,
      });
    }
  } catch (error) {
    console.error("Error during Google Login:", error);
    if (error.name === 'MongoError') {
      return res.status(503).send({ 
        success: false, 
        error: "Database service temporarily unavailable" 
      });
    }
    return res.status(500).send({ 
      success: false, 
      error: GENERIC_ERROR_MESSAGE 
    });
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
    return res.status(404).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR });
  }
  return true;
};