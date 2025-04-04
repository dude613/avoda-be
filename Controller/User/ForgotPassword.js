import dotenv from "dotenv";
import crypto from "crypto";
import { OAuth2Client } from "google-auth-library";
import { ForgotTemplate } from "../../Components/MailerComponents/ForgotTemplate.js";
import { userContent } from "../../Constants/UserConstants.js";
import { mailerContent } from "../../Constants/MailerConstants.js";
import { prisma } from "../../Components/ConnectDatabase.js";
dotenv.config();

const { EMAIL_NOT_FOUND_ERROR,
  EMAIL_REQUIRED_ERROR,
  INVALID_EMAIL_FORMAT_ERROR,
  PASSWORD_REQUIRED_ERROR,
  PASSWORD_COMPLEXITY_ERROR,
  GENERIC_ERROR_MESSAGE,
  PASSWORD_RESET_EMAIL_SENT,
  PASSWORD_UPDATED_SUCCESS,
  EMAIL_REGEX,
  PASSWORD_REGEX } = userContent;

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const AUTH_URL = process.env.AUTH_URL;
const client = new OAuth2Client(CLIENT_ID);
const FRONTEND_URL = process.env.FRONTEND_URL;
const { RESET_LINK_BASE } = mailerContent;

export async function ForgotPasswordMail(req, res) {
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
      return res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date(Date.now() + 15 * 60 * 1000);

    await prisma.user.update({
      where: {
        email: email,
      },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpires: expiryTime,
      },
    });

    const resetLink = `${RESET_LINK_BASE}?email=${encodeURIComponent(email)}&token=${resetToken}`;
    const decodedLink = decodeURIComponent(resetLink);
    await ForgotTemplate(email, decodedLink);
    res.status(200).send({ success: true, message: PASSWORD_RESET_EMAIL_SENT });

    setTimeout(async () => {
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
    }, 15 * 60 * 1000);
  } catch (error) {
    console.log("error message forgot password:::", error.message);
    res.status(500).json({ success: false, error: GENERIC_ERROR_MESSAGE });
  }
}

const validate = (req, res) => {
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

export async function SetNewPassword(req, res) {
    try {
        const { email, password } = req.body;
        const passwordRegex = /^(?=(.*[A-Z]))(?=(.*\d))(?=(.*[\W_]))[A-Za-z\d\W_]{8,16}$/;

        const validationResponse = validate(req, res);
        if (validationResponse !== true) {
            return;
        }

        if (!password) {
            return res.status(404).send({ success: false, error: PASSWORD_REQUIRED_ERROR });
        }
        if (!PASSWORD_REGEX.test(password)) {
            return res.status(404).send({ success: false, error: PASSWORD_COMPLEXITY_ERROR })
        }

        const user = await UserSchema.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, error: EMAIL_NOT_FOUND_ERROR });
        }

        user.password = password;
        await user.save();

        return res.status(200).json({ success: true, message: PASSWORD_UPDATED_SUCCESS });
    } catch (error) {
        console.log("error set new password:::", error.message);
        return res.status(500).json({ success: false, error: GENERIC_ERROR_MESSAGE });
    }
}
