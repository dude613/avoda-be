import mongoose, { Schema } from "mongoose";

const OtpSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    otp: { type: Number, required: true },
    expiresAt: { type: Date, required: true },
  },
  { versionKey: false }
);

const UserOtpSchema = mongoose.model("Otp", OtpSchema);
export default UserOtpSchema;
