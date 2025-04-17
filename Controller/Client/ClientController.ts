import { Request, Response } from "express";
import { prisma } from "../../Components/ConnectDatabase.js";

export const createClient = async (req: Request, res: Response) => {
  try {
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
    // Validate required fields
    if (
      !name ||
      !email ||
      billingRate === undefined ||
      projects === undefined
    ) {
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
        billingRate: Number(billingRate),
        notes,
        projects: Number(projects),
      },
    });

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

export const getClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: {
        id: String(id),
      },
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
    const { page = 1, limit = 10, name, email, industry } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      status: "active",
    };

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
        billingRate,
        notes,
        projects,
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
    const { id } = req.params;

    await prisma.client.delete({
      where: {
        id: id,
      },
    });

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
    const { page = 1, limit = 10, name, email, industry } = req.query;

    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    const skip = (pageNumber - 1) * limitNumber;

    const where: any = {
      status: "archived",
    };

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
