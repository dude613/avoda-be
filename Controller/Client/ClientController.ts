import { Request, Response } from "express";
import { prisma } from "../../Components/ConnectDatabase.js";

export const createClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const {
      name,
      email,
      phone,
      address,
      industry,
      billingRate,
      notes,
    } = req.body;
    
    // Validate required fields
    if (!name || !email || billingRate === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        data: null,
      });
    }
    
    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
        industry,
        billingRate: parseFloat(billingRate),
        notes,
        // createdBy: userId,
      },
    });

    // Automatically assign the creator to the client
    // await prisma.clientAssignment.create({
    //   data: {
    //     clientId: newClient.id,
    //     userId,
    //     assignedBy: userId,
    //     assignedAt: new Date()
    //   }
    // });

    res.status(201).json({
      success: true,
      message: "Client created successfully",
      data: newClient,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to create client", data: null });
  }
};

export const getClientEmployees = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { clientId } = req.params;

    const client = await prisma.client.findUnique({
      where: {
        id: clientId,
      },
      include: {
        ClientAssignment: {
          include: {
            user: {
              select: {
                id: true,
                userName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found", data: null });
    }

    const employees = client.ClientAssignment.map((assignment) => assignment.user);

    res.json({
      success: true,
      message: "Employees retrieved successfully",
      data: employees,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get employees",
      data: null,
    });
  }
};

export const getClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: {
        id: String(id),
      },
      include: {
        ClientAssignment: true,
        projects: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
            tasks: {
              select: {
                id: true,
                name: true,
                status: true,
                assignedTo: true,
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
        }
      }
    });

    if (!client) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found", data: null });
    }

    res.json({
      success: true,
      message: "Client retrieved successfully",
      data: client,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get client", data: null });
  }
};

export const getAllClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10, name, email, industry } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      status: "active",
    };

    // If not admin, only show clients assigned to this user
    if (userRole !== 'admin') {
      where.ClientAssignment = {
        some: {
          userId
        }
      };
    }

    if (name) {
      where.name = {
        contains: name as string,
        mode: "insensitive",
      };
    }

    if (email) {
      where.email = {
        contains: email as string,
        mode: "insensitive",
      };
    }

    if (industry) {
      where.industry = {
        contains: industry as string,
        mode: "insensitive",
      };
    }

    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limitNumber,
      include: {
        projects: {
          select: {
            id: true,
            name: true,
          }
        }
      }
    });

    const totalClients = await prisma.client.count({ where });

    res.json({
      success: true,
      message: "Clients retrieved successfully",
      data: {
        clients,
        totalPages: Math.ceil(totalClients / limitNumber),
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to get clients", data: null });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;
    
    const {
      name,
      email,
      phone,
      address,
      industry,
      billingRate,
      notes,
      projects,
    } = req.body;

    const updatedClient = await prisma.client.update({
      where: {
        id: id,
      },
      data: {
        name,
        email,
        phone,
        address,
        industry,
        billingRate: parseFloat(billingRate),
        notes,
      },
    });

    res.json({
      success: true,
      message: "Client updated successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to update client", data: null });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;
    
    // Delete all related assignments, projects, and tasks
    await prisma.$transaction([
      prisma.clientAssignment.deleteMany({
        where: { clientId: id }
      }),
      prisma.task.deleteMany({
        where: {
          project: {
            clientId: id
          }
        }
      }),
      prisma.project.deleteMany({
        where: { clientId: id }
      }),
      prisma.client.delete({
        where: { id }
      })
    ]);

    res.json({
      success: true,
      message: "Client deleted successfully",
      data: null,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ success: false, message: "Failed to delete client", data: null });
  }
};

export const archiveClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    const updatedClient = await prisma.client.update({
      where: {
        id: id,
      },
      data: {
        status: "archived",
      },
    });

    res.json({
      success: true,
      message: "Client archived successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to archive client",
        data: null,
      });
  }
};

export const unarchiveClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { id } = req.params;

    const updatedClient = await prisma.client.update({
      where: {
        id: id,
      },
      data: {
        status: "active",
      },
    });

    res.json({
      success: true,
      message: "Client unarchived successfully",
      data: updatedClient,
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to unarchive client",
        data: null,
      });
  }
};

export const getArchivedClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const userRole = req.user?.role;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10, name, email, industry } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      status: "archived",
    };

    // If not admin, only show clients assigned to this user
    if (userRole !== 'admin') {
      where.ClientAssignment = {
        some: {
          userId
        }
      };
    }

    if (name) {
      where.name = {
        contains: name as string,
        mode: "insensitive",
      };
    }

    if (email) {
      where.email = {
        contains: email as string,
        mode: "insensitive",
      };
    }

    if (industry) {
      where.industry = {
        contains: industry as string,
        mode: "insensitive",
      };
    }

    const clients = await prisma.client.findMany({
      where,
      skip,
      take: limitNumber,
    });

    const totalClients = await prisma.client.count({ where });

    res.json({
      success: true,
      message: "Archived clients retrieved successfully",
      data: {
        clients,
        totalPages: Math.ceil(totalClients / limitNumber),
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({
        success: false,
        message: "Failed to get archived clients",
        data: null,
      });
  }
};

// New function to assign employees to clients
export const assignEmployeesToClient = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { clientId } = req.params;
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid array of employee IDs",
        data: null
      });
    }

    // Check if the client exists
    const client = await prisma.client.findUnique({
      where: { id: clientId }
    });

    if (!client) {
      return res.status(404).json({
        success: false,
        message: "Client not found",
        data: null
      });
    }

    // Delete existing assignments for this client
    await prisma.clientAssignment.deleteMany({
      where: { clientId }
    });

    // Create new assignments
    if (!clientId) {
      return res.status(400).json({
        success: false,
        message: "Client ID is required",
        data: null
      });
    }

    const assignments = await Promise.all(
      employeeIds.map(async (employeeId) => {
        return prisma.clientAssignment.create({
          data: {
            clientId: clientId,
            userId: employeeId,
            assignedBy: userId,
            assignedAt: new Date()
          }
        });
      })
    );

    res.json({
      success: true,
      message: "Employees assigned to client successfully",
      data: assignments
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to assign employees to client",
      data: null
    });
  }
};

// Get clients assigned to the current user
export const getAssignedClients = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized", data: null });
    }

    const { page = 1, limit = 10 } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const clients = await prisma.client.findMany({
      where: {
        status: "active",
        ClientAssignment: {
          some: {
            userId
          }
        }
      },
      skip,
      take: limitNumber,
      include: {
        projects: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    const totalClients = await prisma.client.count({
      where: {
        status: "active",
        ClientAssignment: {
          some: {
            userId
          }
        }
      }
    });

    res.json({
      success: true,
      message: "Assigned clients retrieved successfully",
      data: {
        clients,
        totalPages: Math.ceil(totalClients / limitNumber),
        currentPage: pageNumber,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Failed to get assigned clients",
      data: null
    });
  }
};
