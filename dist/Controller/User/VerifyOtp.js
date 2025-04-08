import { SendOTPInMail } from "../../Components/MailerComponents/SendOTPMail.js"; // Assuming JS is compatible
import { generateAccessToken, generateRefreshToken, } from "../../Components/VerifyAccessToken.js"; // Assuming JS is compatible
import { prisma } from "../../Components/ConnectDatabase.js";
import crypto from "crypto";
import { userContent } from "../../Constants/UserConstants.js"; // Assuming JS is compatible
import rateLimit from "express-rate-limit";
// Destructure constants with defaults
const { errors: { EMAIL_NOT_FOUND_ERROR = "Email address not found.", EMAIL_REQUIRED_ERROR = "Email address is required.", INVALID_EMAIL_FORMAT_ERROR = "Invalid email format.", USER_EMAIL_ALREADY_VERIFIED = "This email is already verified.", USER_INVALID_OTP = "Invalid OTP.", GENERIC_ERROR_MESSAGE = "An internal server error occurred.", TOO_MANY_REQUESTS_ERROR = "Too many requests, please try again later.", OTP_NOT_SENT = "Failed to send OTP.", OTP_REQUIRED_ERROR = "OTP is required.", // Added missing constant
INVALID_OTP_FORMAT_ERROR = "Invalid OTP format (must be 6 digits)." } = {}, success: { USER_EMAIL_VERIFIED = "Email verified successfully."
// USER_REGISTER_SUCCESS = "User registered successfully.", // Not used here
 } = {}, messages: { USER_SEND_OTP = "OTP has been sent to your registered email address.", // Moved here
USER_OTP_EXPIRE = "OTP expired. Please request a new one." } = {}, validations: { EMAIL: EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/ } = {} } = userContent || {};
// Type assertion for imported mailer function
const typedSendOTPInMail = SendOTPInMail;
// --- Rate Limiting Middleware ---
const verifyOtpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 requests per windowMs
    message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});
const resendOtpLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 3, // Limit each IP to 3 requests per windowMs
    message: { success: false, error: TOO_MANY_REQUESTS_ERROR },
    standardHeaders: true,
    legacyHeaders: false,
});
// --- Input Validation Middleware ---
const validateOtpInput = (req, res, next) => {
    // Use VerifyOtpRequest type for req body
    const { email, otp } = req.body;
    if (!email) {
        res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
        return;
    }
    if (!otp) {
        res.status(400).send({ success: false, error: OTP_REQUIRED_ERROR });
        return;
    }
    if (!/^\d{6}$/.test(otp)) { // Validate OTP is exactly 6 digits
        res.status(400).send({ success: false, error: INVALID_OTP_FORMAT_ERROR });
        return;
    }
    next(); // Proceed if validation passes
};
const validateEmailInput = (req, res, next) => {
    // Use ResendOtpRequest type for req body
    const { email } = req.body;
    if (!email) {
        res.status(400).send({ success: false, error: EMAIL_REQUIRED_ERROR });
        return;
    }
    if (!EMAIL_REGEX.test(email)) {
        res.status(400).send({ success: false, error: INVALID_EMAIL_FORMAT_ERROR });
        return;
    }
    next(); // Proceed if validation passes
};
// --- Verify OTP Controller ---
export async function VerifyOtp(req, res) {
    try {
        // Input already validated by middleware (validateOtpInput)
        const { email, otp } = req.body;
        const user = await prisma.user.findUnique({
            where: { email: email },
        });
        if (!user) {
            // Use 404 Not Found if user doesn't exist
            res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
            return;
        }
        if (user.verified === true) {
            // Use 409 Conflict if already verified
            res.status(409).send({ success: false, error: USER_EMAIL_ALREADY_VERIFIED });
            return;
        }
        // Find the OTP record associated with the user
        const otpRecord = await prisma.otp.findUnique({
            where: { userId: user.id },
        });
        // Validate OTP value (check if it's a number string is done by middleware)
        const otpNumber = parseInt(otp, 10);
        if (isNaN(otpNumber)) { // Should not happen if middleware is used, but defensive check
            res.status(400).send({ success: false, error: INVALID_OTP_FORMAT_ERROR });
            return;
        }
        //FIXME The OTP expiration check happens after the OTP value check. If the OTP is expired but matches, it will return an incorrect error message. Reorder the checks to validate expiration first.
        // Check if OTP record exists, matches, and is not expired
        if (!otpRecord || otpRecord.otp !== otpNumber) {
            res.status(400).send({ success: false, error: USER_INVALID_OTP });
            return;
        }
        if (otpRecord.expiresAt < new Date()) {
            // OTP expired, delete it
            await prisma.otp.delete({ where: { id: otpRecord.id } }); // Delete by unique id
            res.status(400).send({ success: false, error: USER_OTP_EXPIRE });
            return;
        }
        // OTP is valid, delete it
        await prisma.otp.delete({ where: { id: otpRecord.id } });
        // Generate tokens
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        // Update user: set verified, store refresh token, update last login
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                verified: true,
                refreshToken: refreshToken,
                lastLoginAt: new Date(),
            },
        });
        // Prepare response data
        const responseBody = {
            success: true,
            message: USER_EMAIL_VERIFIED,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                verified: updatedUser.verified, // Will be true
                role: updatedUser.role,
            },
            accessToken,
        };
        res.status(200).send(responseBody);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("OTP Verification Error:", errorMessage);
        res.status(500).send({
            success: false,
            error: GENERIC_ERROR_MESSAGE,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}
// --- Resend OTP Controller ---
export async function ResendOtp(req, res) {
    try {
        // Input already validated by middleware (validateEmailInput)
        const { email } = req.body;
        const user = await prisma.user.findUnique({
            where: { email: email },
        });
        if (!user) {
            res.status(404).send({ success: false, error: EMAIL_NOT_FOUND_ERROR });
            return;
        }
        if (user.verified === true) {
            // If already verified, maybe just send success without sending OTP?
            // Original code sent 201, let's use 200 OK.
            res.status(200).send({ success: true, message: USER_EMAIL_ALREADY_VERIFIED });
            return;
        }
        // Generate new OTP and expiry
        const newOtp = crypto.randomInt(100000, 999999).toString();
        const otpExpiration = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
        // Upsert OTP record (delete existing if any, then create new)
        // Using transaction for atomicity
        await prisma.$transaction(async (tx) => {
            await tx.otp.deleteMany({ where: { userId: user.id } });
            await tx.otp.create({
                data: {
                    userId: user.id,
                    otp: parseInt(newOtp, 10),
                    expiresAt: otpExpiration,
                }
            });
        });
        // Send the new OTP via email
        // Send the new OTP via email
        const sendOTPResponse = await typedSendOTPInMail(newOtp, email); // Response is 'any'
        // Check mailer response dynamically
        // Check for Resend success ({ id: string }) or custom error ({ success: false, error: string })
        if (sendOTPResponse && sendOTPResponse.id) { // Success case (has 'id')
            res.status(200).send({
                success: true,
                message: USER_SEND_OTP,
                // Optionally return email for confirmation, avoid returning OTP ID
                // data: { email: email }
            });
        }
        else { // Error case (check for custom error structure or assume failure)
            const errorMessage = sendOTPResponse?.error || 'Unknown mailer error';
            console.error("Failed to resend OTP mail:", errorMessage);
            res.status(500).send({ success: false, error: OTP_NOT_SENT });
        }
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error("OTP Resending Error:", errorMessage);
        res.status(500).send({
            success: false,
            error: GENERIC_ERROR_MESSAGE,
            details: process.env.NODE_ENV === 'development' ? errorMessage : undefined
        });
    }
}
// Export the rate limiters and validators
export { verifyOtpLimiter, resendOtpLimiter, validateOtpInput, validateEmailInput, };
//# sourceMappingURL=VerifyOtp.js.map