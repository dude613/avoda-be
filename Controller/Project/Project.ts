import { Request, Response } from "express";
import { prisma } from "../../Components/ConnectDatabase.js";

export const createProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { name, description, clientId, startDate, endDate, budget, status } = req.body;

    // Validate required fields
    if (!name || !clientId) {
      return res.status(400).json({
        success: false,
        message: "Name and client ID are required",
        data: null
      });
    }

    const newProject = await prisma.project.create({
      data: {
        name,
        description,
        clientId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget: budget ? Number(budget) : undefined,
        status: status || "active",
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      message: "Project created successfully",
      data: newProject
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create project",
      data: null
    });
  }
};

export const getProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        client: true,
        tasks: {
          include: {
            assignedUser: {
              select: {
                id: true,
                userName: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null
      });
    }

    res.json({
      success: true,
      message: "Project retrieved successfully",
      data: project
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get project",
      data: null
    });
  }
};

export const getAllProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10, clientId, status, name } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};

    // Filter by client if provided
    if (clientId) {
      where.clientId = clientId as string;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as string;
    }

    // Filter by name if provided
    if (name) {
      where.name = {
        contains: name as string,
        mode: "insensitive"
      };
    }

    // If not admin, only show projects for clients assigned to this user
    if (userRole !== 'admin') {
      where.client = {
        ClientAssignment: {
          some: {
            userId
          }
        }
      };
    }

    const projects = await prisma.project.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalProjects = await prisma.project.count({ where });

    res.json({
      success: true,
      message: "Projects retrieved successfully",
      data: {
        projects,
        totalPages: Math.ceil(totalProjects / limitNumber),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get projects",
      data: null
    });
  }
};

export const updateProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;
    const { name, description, clientId, startDate, endDate, budget, status } = req.body;

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null
      });
    }

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        name,
        description,
        clientId,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        budget: budget ? Number(budget) : undefined,
        status
      }
    });

    res.json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update project",
      data: null
    });
  }
};

export const deleteProject = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    // Check if the project exists
    const project = await prisma.project.findUnique({
      where: { id }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: "Project not found",
        data: null
      });
    }

    // Delete all tasks associated with this project
    await prisma.task.deleteMany({
      where: { projectId: id }
    });

    // Delete the project
    await prisma.project.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Project deleted successfully",
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete project",
      data: null
    });
  }
};

// Get projects assigned to the current user
export const getAssignedProjects = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const projects = await prisma.project.findMany({
      where: {
        client: {
          ClientAssignment: {
            some: {
              userId
            }
          }
        }
      },
      skip,
      take: limitNumber,
      include: {
        client: {
          select: {
            id: true,
            name: true
          }
        },
        tasks: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalProjects = await prisma.project.count({
      where: {
        client: {
          ClientAssignment: {
            some: {
              userId
            }
          }
        }
      }
    });

    res.json({
      success: true,
      message: "Assigned projects retrieved successfully",
      data: {
        projects,
        totalPages: Math.ceil(totalProjects / limitNumber),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get assigned projects",
      data: null
    });
  }
};
