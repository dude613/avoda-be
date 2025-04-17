// Define interfaces for the nested structure
interface UserErrors {
    readonly EMAIL_NOT_FOUND_ERROR: string;
    readonly EMAIL_REQUIRED_ERROR: string;
    readonly INVALID_EMAIL_FORMAT_ERROR: string;
    readonly PASSWORD_REQUIRED_INCORRECT: string;
    readonly GENERIC_ERROR_MESSAGE: string;
    readonly USER_EMAIL_ALREADY_EXIST: string;
    readonly USER_EMAIL_ALREADY_VERIFIED: string;
    readonly USER_INVALID_OTP: string;
    readonly OTP_NOT_SENT: string;
    readonly USER_NOT_FOUND: string;
    readonly INVALID_USER_ID: string;
    readonly INVALID_FILE_TYPE: string;
    readonly FILE_SIZE_EXCEEDED: string;
    readonly NO_FILE_UPLOADED: string;
    readonly GOOGLE_LOGIN_REQUIRED: string;
    readonly PASSWORD_ALREADY_EXIST: string;
    readonly TOO_MANY_REQUESTS_ERROR: string;
    readonly OTP_REQUIRED_ERROR: string;
    readonly INVALID_OTP_FORMAT_ERROR: string;
}

interface UserSuccess {
    readonly USER_EMAIL_VERIFIED: string;
    readonly PASSWORD_UPDATED_SUCCESS: string;
    readonly USER_LOGIN_SUCCESS: string;
    readonly USER_REGISTER_SUCCESS: string;
    readonly USER_PROFILE_DATA_SUCCESS: string;
}

interface UserMessages {
    readonly PASSWORD_REQUIRED_ERROR: string;
    readonly ROLE_REQUIRED_ERROR: string;
    readonly INVALID_ROLE_ERROR: string;
    readonly PASSWORD_COMPLEXITY_ERROR: string;
    readonly USER_OTP_EXPIRE: string;
    readonly PASSWORD_RESET_EMAIL_SENT: string;
    readonly USER_SEND_OTP: string;
    readonly USER_LOGOUT_SUCCESS: string;
    readonly PASSWORD_ALREADY_EXIST: string;
}

interface UserValidations {
    readonly EMAIL: RegExp;
    readonly PASSWORD_REGEX: RegExp;
}

// Define the main type
interface UserContent {
    readonly errors: UserErrors;
    readonly success: UserSuccess;
    readonly messages: UserMessages;
    readonly validations: UserValidations;
}

// Export the typed constant object using 'as const'
export const userContent: UserContent = {
    errors:{
        EMAIL_NOT_FOUND_ERROR : "This email doesn't exist in our database. Please try another email.",
        EMAIL_REQUIRED_ERROR : "email is required!",
        INVALID_EMAIL_FORMAT_ERROR : "Invalid email format!",
        PASSWORD_REQUIRED_INCORRECT : "Your password is not correct!",
        GENERIC_ERROR_MESSAGE : "An error occurred while processing your request.",
        USER_EMAIL_ALREADY_EXIST : "This email is already registered. Please use a different email!",
        USER_EMAIL_ALREADY_VERIFIED :  "This email already verified!",
        USER_INVALID_OTP : "Invalid OTP please check and try again.",
        OTP_NOT_SENT : "Failed to send OTP",
        USER_NOT_FOUND : "User not found",
        INVALID_USER_ID : "Invalid user ID",
        INVALID_FILE_TYPE : "Invalid file type. Only JPEG, PNG, and GIF images are allowed",
        FILE_SIZE_EXCEEDED : "File size exceeds the maximum limit of 5MB",
        NO_FILE_UPLOADED : "No file was uploaded",
        GOOGLE_LOGIN_REQUIRED : "This email is registered with Google. Please use Google login instead.",
        PASSWORD_ALREADY_EXIST : "New password cannot be the same as the old password.",
        TOO_MANY_REQUESTS_ERROR : "Too many requests, please try again later.",
        OTP_REQUIRED_ERROR : "OTP is required.",
        INVALID_OTP_FORMAT_ERROR : "Invalid OTP format (must be 6 digits)."
    },
    success:{
        USER_EMAIL_VERIFIED : "Email verified successfully!",
        PASSWORD_UPDATED_SUCCESS : "Password updated successfully!",
        USER_LOGIN_SUCCESS : "User logged in successfully",
        USER_REGISTER_SUCCESS : "User Registered successfully",
        USER_PROFILE_DATA_SUCCESS : "user details fetch successfully",
    },
    messages: {
        PASSWORD_REQUIRED_ERROR : "Password is required!",
        ROLE_REQUIRED_ERROR : "Role is required!",
        INVALID_ROLE_ERROR : "Role is invalid!",
        PASSWORD_COMPLEXITY_ERROR : "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.",
        USER_OTP_EXPIRE : "OTP expired. Please request a new one.",
        PASSWORD_RESET_EMAIL_SENT : "A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.",
        USER_SEND_OTP : "OTP has been sent to your registered email address!",
        USER_LOGOUT_SUCCESS: "User logged out successfully",
        PASSWORD_ALREADY_EXIST:"Password is the same as your previous one."
    },
    validations: {
        EMAIL : /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        PASSWORD_REGEX : /^(?=(.*[A-Z]))(?=(.*\d))(?=(.*[\W_]))[A-Za-z\d\W_]{8,16}$/,
    }
} as const; // Use 'as const' for immutability and literal types
