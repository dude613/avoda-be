import mongoose, { Schema } from "mongoose";

const organizationSchema = new Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    name: {
        type: String,
        required: true,
        unique: true
    },
    industry: {
        type: String,
        enum: ['technology', 'healthCare', 'finance', 'education', 'retail', 'manufacturing', 'other'],
    },
    size: {
        type: String,
        enum: ['startup (1-10 employees)', 'small (11-50 employees)', 'medium (51-200 employees)', 'large (201-500 employees)'],
    },
    onboardingSkipped: {
        type: Boolean,
        default: false
    },
    teamMembers: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TeamMember'
    }]
}, { versionKey: false });

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
