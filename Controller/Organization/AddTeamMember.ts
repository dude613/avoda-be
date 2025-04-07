import { prisma } from "../../Components/ConnectDatabase.js";
import { SendInvitation } from "../../Components/MailerComponents/SendInvitation.js";
import { generateAccessToken } from "../../Components/VerifyAccessToken.js";
import {
    AddTeamMemberRequest,
    GetAllTeamMemberRequest,
    DeleteUserRequest,
    EditTeamMemberRequest,
    OrganizationResponse, // Assuming a generic response type is sufficient
    ValidateMembersFunction,
    AddMemberInput,
    ResetLinkInfo,
    ValidationResult,
    TeamMemberRole // Import the role type
} from "../../types/organization.types.js";
import { TeamMember } from '@prisma/client'; // Import Prisma's generated type

// --- Controller Functions ---

export async function AddTeamMember(req: AddTeamMemberRequest, res: OrganizationResponse): Promise<void> {
  try {
    const { members } = req.body; // members is typed as AddMemberInput[]

    // Validate input using the typed function
    const validationResponse: ValidationResult = validate(members);
    if (!validationResponse.success) {
      // Send the error message from the validation result
      res.status(400).send(validationResponse);
      return;
    }

    const addedMembers: TeamMember[] = []; // Use Prisma's TeamMember type
    const resetLinks: ResetLinkInfo[] = [];

    for (let i = 0; i < members.length; i++) {
      // Destructure with type assertion (already validated)
      const memberInput = members[i]!; // Add non-null assertion
      const { name, email, role, orgId } = memberInput;
      // Role is already validated to be TeamMemberRole

      const parsedOrgId = parseInt(orgId, 10);
      // This check is technically redundant due to validation, but safe
      if (isNaN(parsedOrgId)) {
        res.status(400).send({ success: false, error: `Invalid organization ID format: ${orgId}` });
        return;
      }

      const org = await prisma.organization.findUnique({
        where: { id: parsedOrgId },
      });
      if (!org) {
        // Validation should ideally check orgId existence, but double-check here
        res.status(404).send({ success: false, error: `Organization with ID ${orgId} not found!` });
        return;
      }

      // Check capacity
      const currentMemberCount = await prisma.teamMember.count({
        where: { organizationId: parsedOrgId },
      });
      if (currentMemberCount >= 1000) { // Consider making limit configurable
        res.status(400).send({ success: false, error: "Organization has reached maximum team member capacity!" });
        return;
      }

      // Check if email already exists in this org
      const existingTeamMember = await prisma.teamMember.findFirst({
        where: {
          email: email, // Consider case-insensitivity: email.toLowerCase()
          organizationId: parsedOrgId,
        },
      });
      if (existingTeamMember) {
        // Validation should ideally check this too
        res.status(400).send({ success: false, error: `User with email ${email} is already a member of this organization!` });
        return;
      }

      // Generate token and expiry
      // Assuming generateAccessToken takes { email: string, id: number | string } - adjust if needed
      const userPayloadForToken = { email: email, id: parsedOrgId }; // Use parsedOrgId
      const accessToken: string = generateAccessToken(userPayloadForToken); // Assume returns string
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 7); // 7 days expiry

      // Create new team member
      const newTeamMember = await prisma.teamMember.create({
        data: {
          name,
          email,
          role, // Already validated as TeamMemberRole
          status: "pending",
          resetToken: accessToken,
          resetTokenExpiry,
          organizationId: parsedOrgId,
        },
      });

      // Note: Connecting the member via organization update might be redundant
      // if the relation is correctly defined in Prisma schema (m:n or 1:n).
      // Creating the teamMember with organizationId usually suffices.
      // Keeping the original logic for now, but review Prisma schema relations.
      try {
        await prisma.organization.update({
          where: { id: parsedOrgId },
          data: {
            teamMembers: { connect: { id: newTeamMember.id } },
          },
        });
      } catch (connectError: unknown) {
        // Rollback: Delete the created team member if connecting fails
        await prisma.teamMember.delete({ where: { id: newTeamMember.id } });
        // Rethrow or handle more specifically
        const errorMessage = connectError instanceof Error ? connectError.message : String(connectError);
        console.error("Failed to connect team member to organization:", errorMessage);
        throw new Error("Failed to update organization with new team member");
      }

      // Prepare invitation link data
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000'; // Provide a default
      const resetLink = `${frontendUrl}/register/setPassword?email=${encodeURIComponent(
        newTeamMember.email
      )}&token=${newTeamMember.resetToken}`;

      resetLinks.push({
        orgName: org.name,
        name: newTeamMember.name || 'Team Member', // Handle potential null name
        email: newTeamMember.email,
        role: newTeamMember.role as TeamMemberRole, // Assert role type
        resetLink
      });
      addedMembers.push(newTeamMember);
    }

    // Send invitations if any members were added
    if (resetLinks.length > 0) {
      // Assuming SendInvitation takes ResetLinkInfo[] and returns Promise<void>
      await SendInvitation(resetLinks);
    }

    res.status(200).send({
      success: true,
      message: `Team member(s) added successfully!`,
      addedMembers // Return the created members
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Error adding team members:", errorMessage);
    res.status(500).send({
        error: "Internal server error. Please try again!",
        details: process.env.NODE_ENV === "development" ? errorMessage : undefined
    });
  }
};

// --- Validation Function ---
const validate: ValidateMembersFunction = (members) => {
  if (!members || members.length === 0) {
    return { success: false, error: "At least one member is required!" };
  }
  if (members.length > 50) { // Consider making limit configurable
    return { success: false, error: "Cannot add more than 50 members at once!" };
  }

  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const nameRegex = /^[A-Za-z\s'-]+$/; // Allows letters, spaces, hyphens, apostrophes
  const seenEmails = new Set<string>(); // Set of lowercase emails

  for (let i = 0; i < members.length; i++) {
    const member = members[i]!; // Add non-null assertion
    const { email, role, orgId, name } = member;

    // Name validation
    if (!name || name.trim().length === 0) {
      return { success: false, error: `Name is required for member ${i + 1}` };
    }
    if (name.length > 100) {
      return { success: false, error: `Name cannot exceed 100 characters for member ${i + 1}` };
    }
    if (!nameRegex.test(name)) {
      return { success: false, error: `Valid name (letters, spaces, hyphens, apostrophes) required for member ${i + 1}!` };
    }

    // Email validation
    if (!email) {
      return { success: false, error: `Email is required for member ${i + 1}!` };
    }
    if (email.length > 254) { // Standard email length limit
      return { success: false, error: `Email cannot exceed 254 characters for member ${i + 1}` };
    }
    if (!emailRegex.test(email)) {
      return { success: false, error: `Invalid email format for member ${i + 1}!` };
    }
    const lowerCaseEmail = email.toLowerCase();
    if (seenEmails.has(lowerCaseEmail)) {
      return { success: false, error: `Duplicate email (${email}) found for multiple members!` };
    }
    seenEmails.add(lowerCaseEmail);

    // Role validation
    // The role type TeamMemberRole already enforces valid values if input is correctly typed.
    // This check is a runtime safeguard.
    if (!role || !["employee", "manager", "admin"].includes(role)) {
        return { success: false, error: `Valid role (employee, manager, admin) required for member ${i + 1}!` };
    }

    // OrgId validation
    if (!orgId || !/^\d+$/.test(orgId)) { // Check if it's a string containing only digits
      return { success: false, error: `Valid numeric organization ID is required for member ${i + 1}!` };
    }
    // Consider adding a check here to see if the orgId actually exists in the DB?
    // This would require an async validation function.
  }

  return { success: true }; // All members validated successfully
};


// --- Other Team Member Functions ---

export async function GetAllTeamMember(req: GetAllTeamMemberRequest, res: OrganizationResponse): Promise<void> {
  try {
    const { userId: userIdString } = req.params; // userId is owner/admin ID

    if (!userIdString) { // Should be guaranteed by routing, but check
      res.status(400).send({ success: false, error: "User ID parameter is required" });
      return;
    }

    const userId = parseInt(userIdString, 10);
    if (isNaN(userId)) {
      res.status(400).send({ success: false, error: "Invalid User ID format!" });
      return;
    }

    // Find the organization associated with the requesting user (owner/admin)
    // This assumes a user can only manage members of their *first* found organization.
    // If a user can own multiple orgs, the logic needs refinement (e.g., pass orgId).
    const org = await prisma.organization.findFirst({
      where: { userId: userId },
    });

    if (!org) {
      res.status(404).send({ success: false, error: `No organization found for the specified user ID!` });
      return;
    }

    // Get members of that specific organization
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: org.id,
        userDeleteStatus: { not: "archive" } // Exclude archived users
      },
      // Optionally select or exclude fields
      // select: { id: true, name: true, email: true, role: true, status: true }
    });

    // Add organizationName to each member object
    const membersWithOrgName = teamMembers.map(member => ({
      ...member,
      organizationName: org.name, // Add org name for context
    }));

    res.status(200).send({
      success: true,
      message: "Team members retrieved successfully!",
      teamMembers: membersWithOrgName,
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Error getting team members:", errorMessage);
    res.status(500).send({ error: "Internal server error. Please try again!" });
  }
}

export async function DeleteUser(req: DeleteUserRequest, res: OrganizationResponse): Promise<void> {
  try {
    const { userId: teamMemberIdString } = req.body; // This is the ID of the team member to archive

    if (!teamMemberIdString) {
      res.status(400).send({ success: false, error: "Team Member ID (userId) required!" });
      return;
    }

    const teamMemberId = parseInt(teamMemberIdString, 10);
    if (isNaN(teamMemberId)) {
      res.status(400).send({ success: false, error: "Invalid Team Member ID format!" });
      return;
    }

    // Use updateMany to avoid error if user not found, or findUnique first
    const updateResult = await prisma.teamMember.updateMany({
      where: {
        id: teamMemberId,
        userDeleteStatus: { not: "archive" } // Avoid re-archiving
      },
      data: {
        userDeleteStatus: "archive",
        // Optionally clear tokens or other sensitive info upon archiving
        // resetToken: null,
        // resetTokenExpiry: null,
      },
    });

    if (updateResult.count === 0) {
        // Could be because user doesn't exist or is already archived
        const existingMember = await prisma.teamMember.findUnique({ where: { id: teamMemberId } });
        if (!existingMember) {
            res.status(404).send({ success: false, error: "Team member not found!" });
        } else {
            // Already archived or some other condition prevented update
             res.status(400).send({ success: false, error: "User is already archived or could not be updated." });
        }
        return;
    }


    res.status(200).json({
      success: true,
      message: "User archived successfully!",
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.log("Error archiving team member:", errorMessage);
    // Check for specific Prisma errors if needed
    res.status(500).send({ error: "Internal server error. Please try again!" });
  }
};

export async function EditTeamMember(req: EditTeamMemberRequest, res: OrganizationResponse): Promise<void> {
  try {
    // Assuming body structure is { members: { id, name, email, role, orgId } }
    const { members: memberData } = req.body;

    // Validate the input structure
    if (!memberData || typeof memberData !== 'object') {
        res.status(400).send({ success: false, error: "Invalid request body format. Expected { members: { ... } }." });
        return;
    }

    const { id: memberIdString, name, email, role, orgId: orgIdString } = memberData;

    // Basic validation of required fields
    if (!memberIdString || !name || !email || !role || !orgIdString) {
      res.status(400).send({ success: false, error: "All fields (id, name, email, role, orgId) are required within 'members' object!" });
      return;
    }

     // --- Input Validation ---
    const memberId = parseInt(memberIdString, 10);
    const orgId = parseInt(orgIdString, 10);

    if (isNaN(memberId)) {
        res.status(400).send({ success: false, error: "Invalid Team Member ID format." });
        return;
    }
    if (isNaN(orgId)) {
        res.status(400).send({ success: false, error: "Invalid Organization ID format." });
        return;
    }

    // Validate name, email, role (similar to add validation, but without checking duplicates)
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    const nameRegex = /^[A-Za-z\s'-]+$/;
    if (name.trim().length === 0 || name.length > 100 || !nameRegex.test(name)) {
        res.status(400).send({ success: false, error: "Invalid name format or length." });
        return;
    }
    if (email.length > 254 || !emailRegex.test(email)) {
        res.status(400).send({ success: false, error: "Invalid email format or length." });
        return;
    }
    if (!["employee", "manager", "admin"].includes(role)) {
        res.status(400).send({ success: false, error: "Invalid role specified." });
        return;
    }
    // --- End Input Validation ---


    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: orgId },
    });
    if (!org) {
      res.status(404).send({ success: false, error: `Organization with ID ${orgId} not found!` });
      return;
    }

    // Verify team member exists within that organization
    // Use updateMany with where clause for atomicity or findUnique first
    const updateResult = await prisma.teamMember.updateMany({
      where: {
        id: memberId,
        organizationId: orgId, // Ensure member belongs to the specified org
        userDeleteStatus: { not: "archive" } // Can't edit archived users
      },
      data: {
        name: name,
        email: email, // Consider checking if new email conflicts with another user in the org
        role: role, // Already validated role type
      },
    });

     if (updateResult.count === 0) {
        // Could be member not found, wrong org, or archived
        const existingMember = await prisma.teamMember.findUnique({ where: { id: memberId } });
        if (!existingMember) {
            res.status(404).send({ success: false, error: `Team member with ID ${memberId} not found!` });
        } else if (existingMember.organizationId !== orgId) {
            res.status(403).send({ success: false, error: `Team member does not belong to organization ${orgId}.` });
        } else if (existingMember.userDeleteStatus === "archive") {
             res.status(400).send({ success: false, error: `Cannot edit an archived team member.` });
        } else {
             res.status(404).send({ success: false, error: `Team member with ID ${memberId} not found or could not be updated.` }); // Generic fallback
        }
        return;
    }

    // Fetch the updated member to return it (optional, updateMany doesn't return the record)
    const updatedTeamMember = await prisma.teamMember.findUnique({ where: { id: memberId }});

    res.status(200).send({
      success: true,
      message: "Team member updated successfully!",
      updatedMember: updatedTeamMember, // Return the updated member data
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("Error updating team member:", errorMessage);
    // Check for specific Prisma errors like unique constraint violation (P2002) if email is unique per org
    if (error instanceof Error && (error as any).code === 'P2002') {
         res.status(400).send({ success: false, error: "Email address is already in use by another member in this organization." });
    } else {
        res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
    }
  }
}
