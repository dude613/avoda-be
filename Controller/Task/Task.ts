import { Request, Response } from "express";
import { prisma } from "../../Components/ConnectDatabase.js";

export const createTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { name, description, projectId, assignedTo, dueDate, priority, status } = req.body;

    // Validate required fields
    if (!name || !projectId) {
      return res.status(400).json({
        success: false,
        message: "Name and project ID are required",
        data: null
      });
    }

    // If assignedTo is provided, check if the user exists
    if (assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
          data: null
        });
      }

      // Check if the assigned user is assigned to this client
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        select: { clientId: true }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
          data: null
        });
      }

      const isUserAssigned = await prisma.clientAssignment.findFirst({
        where: {
          userId: assignedTo,
          clientId: project.clientId
        }
      });

      if (!isUserAssigned) {
        return res.status(403).json({
          success: false,
          message: "The assigned user is not assigned to this client",
          data: null
        });
      }
    }

    const newTask = await prisma.task.create({
      data: {
        name,
        description,
        projectId,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority: priority || "medium",
        status: status || "pending",
        createdBy: userId
      }
    });

    res.status(201).json({
      success: true,
      message: "Task created successfully",
      data: newTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to create task",
      data: null
    });
  }
};

export const getTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        project: {
          include: {
            client: true
          }
        },
            assignedUser: {
              select: {
                id: true,
                userName: true,
                email: true
              }
            }
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
        data: null
      });
    }

    res.json({
      success: true,
      message: "Task retrieved successfully",
      data: task
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get task",
      data: null
    });
  }
};

export const getAllTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10, projectId, status, priority, assignedTo } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {};

    // Filter by project if provided
    if (projectId) {
      where.projectId = projectId as string;
    }

    // Filter by status if provided
    if (status) {
      where.status = status as string;
    }

    // Filter by priority if provided
    if (priority) {
      where.priority = priority as string;
    }

    // Filter by assigned user if provided
    if (assignedTo) {
      where.assignedTo = assignedTo as string;
    }

    // If not admin, only show tasks for clients assigned to this user
    if (userRole !== 'admin') {
      where.project = {
        client: {
          ClientAssignment: {
            some: {
              userId
            }
          }
        }
      };
    }

    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
            assignedUser: {
              select: {
                id: true,
                userName: true,
                email: true
              }
            }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalTasks = await prisma.task.count({ where });

    res.json({
      success: true,
      message: "Tasks retrieved successfully",
      data: {
        tasks,
        totalPages: Math.ceil(totalTasks / limitNumber),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get tasks",
      data: null
    });
  }
};

export const updateTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;
    const { name, description, projectId, assignedTo, dueDate, priority, status } = req.body;

    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
        data: null
      });
    }

    // If assignedTo is changing, check if the new user exists and is assigned to the client
    if (assignedTo && assignedTo !== task.assignedTo) {
      const assignedUser = await prisma.user.findUnique({
        where: { id: assignedTo }
      });

      if (!assignedUser) {
        return res.status(404).json({
          success: false,
          message: "Assigned user not found",
          data: null
        });
      }

      // Get the client ID for the project
      const project = await prisma.project.findUnique({
        where: { id: projectId || task.projectId },
        select: { clientId: true }
      });

      if (!project) {
        return res.status(404).json({
          success: false,
          message: "Project not found",
          data: null
        });
      }

      // Check if the assigned user is assigned to this client
      const isUserAssigned = await prisma.clientAssignment.findFirst({
        where: {
          userId: assignedTo,
          clientId: project.clientId
        }
      });

      if (!isUserAssigned) {
        return res.status(403).json({
          success: false,
          message: "The assigned user is not assigned to this client",
          data: null
        });
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        name,
        description,
        projectId,
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : undefined,
        priority,
        status
      }
    });

    res.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to update task",
      data: null
    });
  }
};

export const deleteTask = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    // Check if the task exists
    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: "Task not found",
        data: null
      });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Task deleted successfully",
      data: null
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to delete task",
      data: null
    });
  }
};

// Get tasks assigned to the current user
export const getAssignedTasks = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10, status } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      assignedTo: userId
    };

    // Filter by status if provided
    if (status) {
      where.status = status as string;
    }

    const tasks = await prisma.task.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            client: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const totalTasks = await prisma.task.count({ where });

    res.json({
      success: true,
      message: "Assigned tasks retrieved successfully",
      data: {
        tasks,
        totalPages: Math.ceil(totalTasks / limitNumber),
        currentPage: pageNumber
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get assigned tasks",
      data: null
    });
  }
};
