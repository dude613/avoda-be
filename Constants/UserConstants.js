// Constants related to user actions and messages

// Error messages
export const EMAIL_NOT_FOUND_ERROR = "This email doesn't exist in our database. Please try another email.";
export const EMAIL_REQUIRED_ERROR = "email is required!";
export const INVALID_EMAIL_FORMAT_ERROR = "Invalid email format!";
export const PASSWORD_REQUIRED_ERROR = "Password is required!";
export const PASSWORD_COMPLEXITY_ERROR = "Password must be at least 8 characters long, include an uppercase letter, a number, and a special character.";
export const GENERIC_ERROR_MESSAGE = "An error occurred while processing your request.";

// Success messages
export const PASSWORD_RESET_EMAIL_SENT = "A password reset link has been sent to your email. Please check your inbox and follow the instructions to reset your password.";
export const PASSWORD_UPDATED_SUCCESS = "Password updated successfully!";

// Regex patterns
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
