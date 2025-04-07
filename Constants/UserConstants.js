"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userContent = void 0;
exports.userContent = {
    errors: {
        EMAIL_NOT_FOUND_ERROR: "This email doesn't exist in our database. Please try another email.",
        EMAIL_REQUIRED_ERROR: "email is required!",
        INVALID_EMAIL_FORMAT_ERROR: "Invalid email format!",
        PASSWORD_REQUIRED_INCORRECT: "Your password is not correct!",
        GENERIC_ERROR_MESSAGE: "An error occurred while processing your request.",
        USER_EMAIL_ALREADY_EXIST: "This email is already registered. Please use a different email!",
        USER_EMAIL_ALREADY_VERIFIED: "This email already verified!",
        USER_INVALID_OTP: "Invalid OTP please check and try again.",
        OTP_NOT_SENT: "Failed to send OTP",
        USER_NOT_FOUND: "User not found",
        INVALID_USER_ID: "Invalid user ID",
        INVALID_FILE_TYPE: "Invalid file type. Only JPEG, PNG, and GIF images are allowed",
        FILE_SIZE_EXCEEDED: "File size exceeds the maximum limit of 5MB",
        NO_FILE_UPLOADED: "No file was uploaded",
        GOOGLE_LOGIN_REQUIRED: "This email is registered with Google. Please use Google login instead."
    },
    success: {
        USER_EMAIL_VERIFIED: "Email verified successfully!",
        PASSWORD_UPDATED_SUCCESS: "Password updated successfully!",
        USER_LOGIN_SUCCESS: "User logged in successfully",
        USER_REGISTER_SUCCESS: "User Registered successfully",
        USER_PROFILE_DATA_SUCCESS: "user details fetch successfully",
    },
    messages: {
        PASSWORD_REQUIRED_ERROR: "Password is required!",
        ROLE_REQUIRED_ERROR: "Role is required!",
        INVALID_ROLE_ERROR: "Role is invalid!",
        PASSWORD_COMPLEXITY_ERROR: "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.",
        USER_OTP_EXPIRE: "OTP expired. Please request a new one.",
        PASSWORD_RESET_EMAIL_SENT: "A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.",
        USER_SEND_OTP: "OTP has been sent to your registered email address!",
        USER_LOGOUT_SUCCESS: "User logged out successfully",
    },
    validations: {
        EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD_REGEX: /^(?=(.*[A-Z]))(?=(.*\d))(?=(.*[\W_]))[A-Za-z\d\W_]{8,16}$/,
    }
};
