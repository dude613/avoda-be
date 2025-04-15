import { prisma } from "../../Components/ConnectDatabase.js";
import { SendInvitation } from "../../Components/MailerComponents/SendInvitation.js";
import { EditTeamMemberTemplate } from "../../Components/MailerComponents/EditTeamMemberTemplate.js";
import { DeleteTeamMemberTemplate } from "../../Components/MailerComponents/DeleteTeamMemberTemplate.js";
import { generateAccessToken } from "../../Components/VerifyAccessToken.js";
import { Request, Response } from "express";

interface ValidationResponse {
  success: boolean;
  error?: string;
}

import {
  AddMemberInput,
  ResetLinkInfo,
  TeamMemberRole,
} from "../../types/organization.types.js";
import { UnarchiveTeamMemberTemplate } from "../../Components/MailerComponents/UnarchiveTeamMember.js";

export async function AddTeamMember(req: Request, res: Response) {
  try {
    const { members } = req.body;
    const validationResponse: ValidationResponse = validate(
      members as AddMemberInput[]
    );
    if (!validationResponse.success) {
      return res.status(400).send(validationResponse);
    }
    const addedMembers: any[] = [];
    const resetLinks: ResetLinkInfo[] = [];

    interface User {
      email: string;
      id: number;
    }

    for (let i = 0; i < members.length; i++) {
      const member = members[i];
      if (!member) continue;

      let { name, email, role, orgId } = member;
      role = role ? role.toLowerCase() : "";

      const parsedOrgId = parseInt(orgId);
      if (isNaN(parsedOrgId)) {
        return res
          .status(400)
          .send({ success: false, error: `Invalid organization ID: ${orgId}` });
      }

      const org = await prisma.organization.findUnique({
        where: {
          id: parsedOrgId,
        },
      });
      if (!org) {
        return res
          .status(404)
          .send({
            success: false,
            error: `Organization with ID ${orgId} not found!`,
          });
      }

      // Check organization's team member capacity - Avi said there should be no limit
      // const currentMemberCount = await prisma.teamMember.count({
      //   where: {
      //     organizationId: parsedOrgId,
      //   },
      // });

      // if (currentMemberCount >= 1000) {
      //   return res.status(400).send({
      //     success: false,
      //     error: "Organization has reached maximum team member capacity!",
      //   });
      // }

      const existingTeamMember = await prisma.teamMember.findFirst({
        where: {
          email: email,
          organizationId: parsedOrgId,
        },
      });
      if (existingTeamMember) {
        return res
          .status(400)
          .send({
            success: false,
            error: `User with email ${email} is already a member of this organization!`,
          });
      }

      // Create a new user for the team member
      const newUser = await prisma.user.create({
        data: {
          email: email,
          userName: name,
          role: role,
        },
      });

      const accessToken = generateAccessToken({ email: email, id: newUser.id });
      const resetTokenExpiry = new Date();
      resetTokenExpiry.setDate(resetTokenExpiry.getDate() + 7);

      const newTeamMember = await prisma.teamMember.create({
        data: {
          userId: newUser.id,
          organizationId: parsedOrgId,
          name,
          email,
          role,
          status: "pending",
          resetToken: accessToken,
          resetTokenExpiry,
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
      )}&token=${newTeamMember.resetToken}&role=${newTeamMember.role}`;
      resetLinks.push({
        orgName: org?.name ?? "Your Organization",
        name: newTeamMember?.name ?? "Team Member",
        email: newTeamMember.email,
        role: newTeamMember.role as TeamMemberRole,
        resetLink,
      });
      addedMembers.push(newTeamMember);
    }

    if (resetLinks.length > 0) {
      await SendInvitation(resetLinks);
    }

    return res.status(200).send({
      success: true,
      message: `Team member(s) added successfully!`,
      addedMembers,
    });
  } catch (error: any) {
    console.log("Error adding team members:", error.message);
    return res
      .status(500)
      .send({
        error: "Internal server error. Please try again!",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
  }
};

export const DeleteTeamMemberPermanently = async (req: Request, res: Response) => {
  try {
    const { userId, organizationName } = req.params;

    if (!userId) {
      return res.status(400).send({ success: false, error: "User ID is required!" });
    }
    if (!organizationName) {
      return res.status(400).send({ success: false, error: "Organization  name is required!" });
    }

    // Find the team member
    const teamMember = await prisma.teamMember.findUnique({
      where: {
        userId: userId,
      },
    });

    if (!teamMember) {
      return res.status(404).send({ success: false, error: "Team member not found!" });
    }

    // Delete the team member
    await prisma.teamMember.delete({
      where: {
        userId: userId,
      },
    });

    const dateTime = new Date().toLocaleString();
    await DeleteTeamMemberTemplate(teamMember.email, dateTime, organizationName);

    return res.status(200).send({ success: true, message: "Team member deleted successfully!" });
  } catch (error: any) {
    console.error("Error deleting team member:", error.message);
    return res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
  }
};

const validate = (members: AddMemberInput[]): ValidationResponse => {
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
    const member = members[i];
    if (!member) continue;
    const { email, role, orgId, name } = member;

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
      return res
        .status(404)
        .send({ success: false, error: "user id is required" });
    }

    const org = await prisma.organization.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!org) {
      return res
        .status(404)
        .send({
          success: false,
          error: `Organization with the given user ID not found!`,
        });
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: org.id,
      },
    });

    return res.status(200).send({
      success: true,
      message: "Team members retrieved successfully!",
      teamMembers: teamMembers.map((member) => ({
        ...member,
        organizationName: org.name,
      })),
    });
  } catch (error: any) {
    console.log("Error getting team members:", error.message);
    return res
      .status(500)
      .send({ error: "Internal server error. Please try again!" });
  }
};

export const GetArchivedTeamMembers = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).send({ success: false, error: "User ID is required!" });
    }

    const org = await prisma.organization.findFirst({
      where: {
        userId: userId,
      },
    });

    if (!org) {
      return res.status(404).send({ success: false, error: "Organization not found!" });
    }

    const archivedTeamMembers = await prisma.teamMember.findMany({
      where: {
        organizationId: org.id,
        userDeleteStatus: "archive",
      },
    });

    return res.status(200).send({ success: true, archivedTeamMembers });
  } catch (error: any) {
    console.error("Error getting archived team members:", error.message);
    return res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
  }
};

export const UnarchiveTeamMember = async (req: Request, res: Response) => {
  try {
    const { userId, organizationName } = req.params;

    if (!userId) {
      return res.status(400).send({ success: false, error: "User ID is required!" });
    }

    if (!organizationName) {
      return res.status(400).send({ success: false, error: "Organization  name is required!" });
    }

    const teamMember = await prisma.teamMember.update({
      where: {
        userId: userId,
      },
      data: {
        userDeleteStatus: "active",
      },
    });

    const dateTime = new Date().toLocaleString();
    await UnarchiveTeamMemberTemplate(teamMember.email, dateTime, organizationName);


    return res.status(200).send({ success: true, message: "Team member unarchived successfully!" });
  } catch (error: any) {
    console.error("Error unarchiving team member:", error.message);
    return res.status(500).send({ success: false, error: "Internal server error. Please try again!" });
  }
};

export const ArchiveTeamMember = async (req: Request, res: Response) => {
  try {
    console.log(req.body, 'req');
    const { userId, organizationName } = req.body;
    if (!userId) {
      return res
        .status(400)
        .send({ success: false, error: "User Id required!" });
    }
    if (!organizationName) {
      return res.status(400).send({ success: false, error: "Organization  name is required!" });
    }

    const teamMember = await prisma.teamMember.update({
      where: {
        userId: userId,
      },
      data: {
        userDeleteStatus: "archive",
      },
    });

    const dateTime = new Date().toLocaleString();
    await DeleteTeamMemberTemplate(teamMember.email, dateTime, organizationName);

    return res.status(200).json({
      success: true,
      message: "User archived successfully!",
    });
  } catch (error: any) {
    console.log("Error deleting team members:", error.message);
    return res
      .status(500)
      .send({ error: "Internal server error. Please try again!" });
  }
};

export async function EditTeamMember(req: Request, res: Response) {
  try {
    const { userId, name, email, role, orgId, organizationName } = req.body;
    console.log(req.body, "members");


    if (!userId || !name || !email || !role || !orgId || !organizationName) {
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
        userId: userId,
      },
      include: {
        organization: true,
      },
    });

    if (
      !existingTeamMember ||
      existingTeamMember.organizationId !== parsedOrgId
    ) {
      return res.status(404).send({
        success: false,
        error: `Team member with ID ${userId} not found in this organization!`, // Use id here
      });
    }

    // Check if email already exists for another member in this organization
    const emailExists = await prisma.teamMember.findFirst({
      where: {
        email: email,
        organizationId: parsedOrgId,
        userId: { not: userId }, // Exclude current member
      },
    });

    if (emailExists) {
      return res.status(400).send({
        success: false,
        error: `Email ${email} is already used by another member in this organization!`,
      });
    }

    // Update fields
    const updatedTeamMember = await prisma.teamMember.update({
      where: {
        userId: userId,
      },
      data: {
        name: name,
        email: email,
        role: role.toLowerCase(),
      },
    });

    const dateTime = new Date().toLocaleString();
    const changes = `Name: ${name}, Email: ${email}, Role: ${role}`;
    await EditTeamMemberTemplate(updatedTeamMember.email, changes, dateTime, organizationName);

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
