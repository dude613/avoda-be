import TeamMember from "../../Model/TeamMemberSchema.js";
import Organization from "../../Model/OrganizationSchema.js";
import { SendInvitation } from "../../Components/MailerComponents/SendInvitation.js";
import { generateAccessToken } from "../../Components/VerfiyAccessToken.js";

export async function AddTeamMember(req, res) {
    try {

        const { members } = req.body;
        if (!members || members.length === 0) {
            return res.status(400).send({ success: false, error: "At least one member is required!" });
        }

        const addedMembers = [];
        const resetLinks = [];

        for (let i = 0; i < members.length; i++) {
            let { email, role, orgId } = members[i];
            role = role ? role.toLowerCase() : '';
            if (!email) {
                return res.status(400).send({ success: false, error: `Email is required for member!` });
            }
            if (!role || !["employee", "manager", "admin"].includes(role)) {
                return res.status(400).send({ success: false, error: `Valid role is required (employee, manager, admin) for member ${i + 1}!` });
            }
            if (!orgId) {
                return res.status(400).send({ success: false, error: `Organization ID is required for member !` });
            }

            const org = await Organization.findById(orgId);
            if (!org) {
                return res.status(404).send({ success: false, error: `Organization with ID ${orgId} not found!` });
            }

            // const user = await UserSchema.findOne({ email });
            // if (!user) {
            //     return res.status(404).send({ success: false, error: `User with email ${email} doesn't exist!` });
            // }

            const existingTeamMember = await TeamMember.findOne({ email, organization: orgId });
            if (existingTeamMember) {
                return res.status(400).send({ success: false, error: `User with email ${email} is already a member of this organization!` });
            }
            const user = { email, _id: orgId };
            const accessToken = generateAccessToken(user);

            const resetTokenExpiry = new Date();
            resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 7);

            const newTeamMember = new TeamMember({
                email,
                role,
                status: "pending",
                resetToken: accessToken,
                resetTokenExpiry,
                organization: orgId
            });

            await newTeamMember.save();

            org.teamMembers.push(newTeamMember._id);
            await org.save();

            const resetLink = `${process.env.FRONTEND_URL}/register/setPassword?email=${encodeURIComponent(
                newTeamMember.email
            )}&token=${newTeamMember.resetToken}`;
            resetLinks.push({ email: newTeamMember.email, resetLink });
            addedMembers.push(newTeamMember);
        }

        if (resetLinks.length > 0) {
            await SendInvitation(resetLinks);
        }

        return res.status(200).send({
            success: true,
            message: `Team member(s) added successfully!`,
            addedMembers
        });

    } catch (error) {
        console.log("Error adding team members:", error.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}
