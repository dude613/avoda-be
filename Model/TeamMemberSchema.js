import mongoose, { Schema } from "mongoose";

const teamMemberSchema = new Schema({
    name: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    role: {
        type: String,
        enum: ["employee", "manager", "admin"],
        required: true,
    },
    status: {
        type: String,
        enum: ["pending", "active"],
        default: "pending"
    },
    userDeleteStatus : {
        type: String,
        enum : ["active","archive"],
        default : "active"
    },
    organization: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Organization',
        required: true
    },
    resetToken: {
        type: String,
        required: false
    },
    resetTokenExpiry: {
        type: Date,
        required: false
    }
}, { versionKey: false });

const TeamMember = mongoose.model("TeamMember", teamMemberSchema);

export default TeamMember;
