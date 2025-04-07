import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { ForgotTemplate } from "../../Components/MailerComponents/ForgotTemplate.js";
import { userContent } from "../../Constants/UserConstants.js";
import { mailerContent } from "../../Constants/MailerConstants.js";
import { prisma } from "../../Components/ConnectDatabase.js";
import { Request, Response } from "express";

dotenv.config();

const {
  errors: {
    EMAIL_NOT_FOUND_ERROR,
    EMAIL_REQUIRED_ERROR,
    INVALID_EMAIL_FORMAT_ERROR,
    GENERIC_ERROR_MESSAGE,
    GOOGLE_LOGIN_REQUIRED,
  },
  success: { PASSWORD_UPDATED_SUCCESS },
  messages: {
    PASSWORD_REQUIRED_ERROR,
    PASSWORD_COMPLEXITY_ERROR,
    PASSWORD_RESET_EMAIL_SENT,
  },
  validations: { EMAIL: EMAIL_REGEX, PASSWORD_REGEX },
} = userContent;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);
const FRONTEND_URL = process.env.FRONTEND_URL;
const { RESET_LINK_BASE } = mailerContent.reset;

interface MulterRequest extends Request {
  file: any;
}

export async function ForgotPasswordMail(req: Request, res: Response) {
  try {
    const { email } = req.body;
    const validationResponse = validate(req, res);
    if (validationResponse !== true) {
      return;
    }

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    // Check if user has googleId (Google-based login)
    if (user.googleId) {
      return res.status(400).json({
        success: false,
        error: GOOGLE_LOGIN_REQUIRED,
      });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    const updatedUser = await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiryTime,
      },
    });

    if (!updatedUser) {
      throw new Error("Failed to update user with reset token");
    }

    const resetLink = `${RESET_LINK_BASE}?email=${encodeURIComponent(email)}&token=${resetToken}`;
    const decodedLink = decodeURIComponent(resetLink);
    await ForgotTemplate(email, decodedLink);
    res.status(200).send({ success: true, message: PASSWORD_RESET_EMAIL_SENT });

    // Schedule token cleanup
    setTimeout(
      async () => {
        try {
          await prisma.user.updateMany({
            where: {
              email: email,
              resetPasswordExpires: {
                lt: new Date(),
              },
            },
            data: {
              resetPasswordToken: null,
              resetPasswordExpires: null,
            },
          });
        } catch (cleanupError: any) {
          console.error("Error cleaning up reset token:", cleanupError);
        }
      },
      15 * 60 * 1000
    );
  } catch (error: any) {
    console.error("Error in ForgotPasswordMail:", error);
    res
      .status(500)
      .json({ success: false, error: error.message || GENERIC_ERROR_MESSAGE });
  }
}

const validate = (req: Request, res: Response) => {
  const { email } = req.body;
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
  return true;
};

export async function SetNewPassword(req: Request, res: Response) {
  try {
    const { email, password } = req.body;

    // Validate email
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

    // Validate password
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

    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });
    if (!user) {
      return res
        .status(404)
        .json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      return res

        .status(400)

        .send({ success: false, error: PASSWORD_ALREADY_EXIST });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        password: hashedPassword,
      },
    });

    return res
      .status(200)
      .json({ success: true, message: PASSWORD_UPDATED_SUCCESS });
  } catch (error: any) {
    console.error("Error in SetNewPassword:", error);
    return res
      .status(500)
      .json({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}
