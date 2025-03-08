import mongoose, { Schema } from "mongoose";
import bcrypt from "bcryptjs";

const userSchema = new Schema({
  firstName: {
    type: String,
  },
  lastName: {
    type: String,
  },
  email: {
    type: String,
    unique: true
  },
  password: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ["user", "employ", "management"]
  },
  refreshToken: {
    type: String
  },
  googleId: {
    type: String,
    sparse: true,
    default: null,
  },
  picture: {
    type: String
  },
  otp: {
    type: String, 
    default: null,
  },
  otpExpiry: {
    type: Date,
    default: () => new Date(Date.now() + 10 * 60 * 1000), 
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
}, { versionKey: false })

userSchema.index({ googleId: 1 }, { unique: true, sparse: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(this.password, salt);
    this.password = hashedPassword;
    next();
  } catch (error) {
    next(error);
  }
});
userSchema.methods.comparePassword = async function (password) {
  try {
    return await bcrypt.compare(password, this.password);
  } catch (error) {
    throw new Error("Error comparing password");
  }
};

const UserSchema = mongoose.model("User", userSchema);
export default UserSchema;