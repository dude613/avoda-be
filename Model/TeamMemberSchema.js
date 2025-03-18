import mongoose, { Schema } from "mongoose";

const teamMemberSchema = new Schema({
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
        enum: ["pending", "join"],
        default: "pending"
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
