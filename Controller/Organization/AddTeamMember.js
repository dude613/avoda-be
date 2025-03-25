import TeamMember from "../../Model/TeamMemberSchema.js";
import Organization from "../../Model/OrganizationSchema.js";
import { SendInvitation } from "../../Components/MailerComponents/SendInvitation.js";
import { generateAccessToken } from "../../Components/VerifyAccessToken.js";

export async function AddTeamMember(req, res) {
    try {
        const { members } = req.body;
        const validationResponse = validate(members);
        if (!validationResponse.success) {
            return res.status(400).send(validationResponse);
        }
        const addedMembers = [];
        const resetLinks = [];

        for (let i = 0; i < members.length; i++) {
            let { name, email, role, orgId } = members[i];
            role = role ? role.toLowerCase() : '';

            const org = await Organization.findById(orgId);
            if (!org) {
                return res.status(404).send({ success: false, error: `Organization with ID ${orgId} not found!` });
            }
            const existingTeamMember = await TeamMember.findOne({ email, organization: orgId });
            if (existingTeamMember) {
                return res.status(400).send({ success: false, error: `User with email ${email} is already a member of this organization!` });
            }
            const user = { email, _id: orgId };
            const accessToken = generateAccessToken(user);
            const resetTokenExpiry = new Date();
            resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 7);

            const newTeamMember = new TeamMember({
                name,
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
            resetLinks.push({
                orgName: org.name,
                name: newTeamMember.name,
                email: newTeamMember.email,
                role: newTeamMember.role,
                resetLink
            });
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

const validate = (members) => {
    if (!members || members.length === 0) {
        return { success: false, error: "At least one member is required!" };
    }
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const nameRegex = /^[A-Za-z ]+$/;
    const seenEmails = new Set();

    for (let i = 0; i < members.length; i++) {
        const { email, role, orgId, name } = members[i];
        if (!name) {
            return { success: false, error: `Name is required for member ${i + 1}` }
        }
        if (!nameRegex.test(name)) {
            return { success: false, error: `Valid name (only letters and spaces) is required for member ${i + 1}!` };
        }

        if (!email) {
            return { success: false, error: `Email is required for member ${i + 1}!` };
        }
        if (!emailRegex.test(email)) {
            return { success: false, error: `Invalid email format for member ${i + 1}!` };
        }
        if (seenEmails.has(email)) {
            return { success: false, error: `Duplicate email (${email}) found for multiple members!` };
        }
        seenEmails.add(email);

        if (!role || !["employee", "manager", "admin"].includes(role.toLowerCase())) {
            return { success: false, error: `Valid role is required (employee, manager, admin) for member ${i + 1}!` };
        }

        if (!orgId) {
            return { success: false, error: `Organization not found please create organization first` };
        }
    }
    return { success: true };
};

export async function GetAllTeamMember(req, res) {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(404).send({ success: false, error: "user id is required" })
        }
        const org = await Organization.findOne({ user: userId });
        if (!org) {
            return res.status(404).send({ success: false, error: `Organization with the given user ID not found!` });
        }
        const teamMembersWithOrg = await TeamMember.find({ _id: { $in: org.teamMembers } });
        if (!teamMembersWithOrg || teamMembersWithOrg.length === 0) {
            return res.status(404).send({ success: false, error: `No team members found for this organization!` });
        }

        const teamMembers = teamMembersWithOrg.map(member => ({
            ...member.toObject(),
            organizationName: org.name,
        }));

        return res.status(200).send({
            success: true,
            message: "Team members retrieved successfully!",
            teamMembers: teamMembers
        });
    } catch (error) {
        console.log("Error getting team members:", error.message);
        return res.status(500).send({ error: "Internal server error. Please try again!" });
    }
}
