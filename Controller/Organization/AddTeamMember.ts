import { prisma } from "../../Components/ConnectDatabase.js";
import { SendInvitation } from "../../Components/MailerComponents/SendInvitation.js";
import { generateAccessToken } from "../../Components/VerifyAccessToken.js";
import { Request, Response } from "express";

interface ValidationResponse {
  success: boolean;
  error?: string;
}

interface InvitationLink {
  orgName: string;
  name: string;
  email: string;
  role: string;
  resetLink: string;
}

export async function AddTeamMember(req: Request, res: Response) {
  try {
    const { members } = req.body;
    const validationResponse: ValidationResponse = validate(members);
    if (!validationResponse.success) {
      return res.status(400).send(validationResponse);
    }
    const addedMembers: any[] = [];
    const resetLinks: InvitationLink[] = [];

    for (let i = 0; i < members.length; i++) {
      let { name, email, role, orgId } = members[i];
      role = role ? role.toLowerCase() : '';

      const parsedOrgId = parseInt(orgId);
      if (isNaN(parsedOrgId)) {
        return res.status(400).send({ success: false, error: `Invalid organization ID: ${orgId}` });
      }

      const org = await prisma.organization.findUnique({
        where: {
          id: parsedOrgId,
        },
      });
      if (!org) {
        return res.status(404).send({ success: false, error: `Organization with ID ${orgId} not found!` });
      }

      // Check organization's team member capacity
      const currentMemberCount = await prisma.teamMember.count({
        where: {
          organizationId: parsedOrgId,
        },
      });

      if (currentMemberCount >= 1000) {
        return res.status(400).send({
          success: false,
          error: "Organization has reached maximum team member capacity!",
        });
      }

      const existingTeamMember = await prisma.teamMember.findFirst({
        where: {
          email: email,
          organizationId: parsedOrgId,
        },
      });
      if (existingTeamMember) {
        return res.status(400).send({ success: false, error: `User with email ${email} is already a member of this organization!` });
      }

      const user = { email, id: parsedOrgId };
      const accessToken = generateAccessToken(user);
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 7);

      const newTeamMember = await prisma.teamMember.create({
        data: {
          name,
          email,
          role,
          status: "pending",
          resetToken: accessToken,
          resetTokenExpiry,
          organizationId: parsedOrgId,
        },
      });

      try {
        await prisma.organization.update({
          where: {
            id: parsedOrgId,
          },
          data: {
            teamMembers: {
              connect: {
                id: newTeamMember.id,
              },
            },
          },
        });
      } catch (error: any) {
        await prisma.teamMember.delete({
          where: {
            id: newTeamMember.id,
          },
        });
        throw new Error("Failed to update organization with new team member");
      }

      const resetLink = `${process.env.FRONTEND_URL}/register/setPassword?email=${encodeURIComponent(
        newTeamMember.email
      )}&token=${newTeamMember.resetToken}`;
      resetLinks.push({
        orgName: org?.name ?? "Your Organization",
        name: newTeamMember?.name ?? "Team Member",
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

  } catch (error: any) {
    console.log("Error adding team members:", error.message);
    return res.status(500).send({ error: "Internal server error. Please try again!", details:
    process.env.NODE_ENV === "development" ? error.message : undefined });
  }
};

interface Member {
  email: string;
  role: string;
  orgId: string;
  name: string;
}

const validate = (members: Member[]): ValidationResponse => {
  if (!members || members.length === 0) {
    return { success: false, error: "At least one member is required!" };
  }
  if (members.length > 50) {
    return {
      success: false,
      error: "Cannot add more than 50 members at once!",
    };
  }
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  const nameRegex = /^[A-Za-z\s'-]+$/;
  const seenEmails = new Set<string>();

  for (let i = 0; i < members.length; i++) {
    const { email, role, orgId, name } = members[i];

    if (!name || name.trim().length === 0) {
      return { success: false, error: `Name is required for member ${i + 1}` };
    }
    if (name.length > 100) {
      return {
        success: false,
        error: `Name cannot exceed 100 characters for member ${i + 1}`,
      };
    }
    if (!nameRegex.test(name)) {
      return {
        success: false,
        error: `Valid name (only letters, spaces, hyphens and apostrophes) is required for member ${i + 1}!`,
      };
    }

    if (!email) {
      return {
        success: false,
        error: `Email is required for member ${i + 1}!`,
      };
    }
    if (email.length > 254) {
      return {
        success: false,
        error: `Email cannot exceed 254 characters for member ${i + 1}`,
      };
    }
    if (!emailRegex.test(email)) {
      return {
        success: false,
        error: `Invalid email format for member ${i + 1}!`,
      };
    }
    if (seenEmails.has(email.toLowerCase())) {
      return {
        success: false,
        error: `Duplicate email (${email}) found for multiple members!`,
      };
    }
    seenEmails.add(email.toLowerCase());

    if (
      !role ||
      !["employee", "manager", "admin"].includes(role.toLowerCase())
    ) {
      return {
        success: false,
        error: `Valid role is required (employee, manager, admin) for member ${i + 1}!`,
      };
    }

    if (!orgId || !String(orgId).match(/^\d+$/)) {
      return {
        success: false,
        error: `Valid organization ID is required for member ${i + 1}!`,
      };
    }
  }
  return { success: true };
};

export async function GetAllTeamMember(req: Request, res: Response) {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(404).send({ success: false, error: "user id is required" });
    }

    const org = await prisma.organization.findFirst({
      where: {
        userId: parseInt(userId),
      },
    });

    if (!org) {
      return res.status(404).send({ success: false, error: `Organization with the given user ID not found!` });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: org.id,
      },
    });

    return res.status(200).send({
      success: true,
      message: "Team members retrieved successfully!",
      teamMembers: teamMembers.map(member => ({
        ...member,
        organizationName: org.name,
      })),
    });
  } catch (error: any) {
    console.log("Error getting team members:", error.message);
    return res.status(500).send({ error: "Internal server error. Please try again!" });
  }
}

export const DeleteUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).send({ success: false, error: "User Id required!" });
    }

    const teamMember = await prisma.teamMember.update({
      where: {
        id: parseInt(userId),
      },
      data: {
        userDeleteStatus: "archive",
      },
    });

    return res.status(200).json({
      success: true,
      message: "User archived successfully!",
    });
  } catch (error: any) {
    console.log("Error deleting team members:", error.message);
    return res.status(500).send({ error: "Internal server error. Please try again!" });
  }
};

export async function EditTeamMember(req: Request, res: Response) {
  try {
    const { members } = req.body;

    const { id, name, email, role, orgId } = members;

    if (!id || !name || !email || !role || !orgId) {
      return res.status(400).send({
        success: false,
        error: "All fields (id, name, email, role, orgId) are required!",
      });
    }

    const org = await prisma.organization.findUnique({
      where: {
        id: parseInt(orgId),
      },
    });

    if (!org) {
      return res.status(404).send({
        success: false,
        error: `Organization with ID ${orgId} not found!`,
      });
    }

    const parsedOrgId = parseInt(orgId);

    const existingTeamMember = await prisma.teamMember.findUnique({
      where: {
        id: parseInt(id),
      },
      include: {
        organization: true,
      },
    });

    if (!existingTeamMember || existingTeamMember.organizationId !== parsedOrgId) {
      return res.status(404).send({
        success: false,
        error: `Team member with ID ${id} not found in this organization!`, // Use id here
      });
    }

    // Update fields
    const updatedTeamMember = await prisma.teamMember.update({
      where: {
        id: parseInt(id),
      },
      data: {
        name: name,
        email: email,
        role: role.toLowerCase(),
      },
    });

    return res.status(200).send({
      success: true,
      message: "Team member updated successfully!",
      updatedMember: updatedTeamMember,
    });
  } catch (error: any) {
    console.error("Error updating team member:", error.message);

    return res.status(500).send({
      success: false,
      error: "Internal server error. Please try again!",
    });
  }
}
