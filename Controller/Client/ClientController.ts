import { Request, Response } from 'express';
import { prisma } from '../../Components/ConnectDatabase.js';

export const createClient = async (req: Request, res: Response) => {
  try {
    const { name, email, phone, address } = req.body;

    const newClient = await prisma.client.create({
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.status(201).json(newClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to create client' });
  }
};

export const getClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const client = await prisma.client.findUnique({
      where: {
        id: Number(id),
      },
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get client' });
  }
};

export const getAllClients = async (req: Request, res: Response) => {
  try {
    const clients = await prisma.client.findMany();

    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to get clients' });
  }
};

export const updateClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;

    const updatedClient = await prisma.client.update({
      where: {
        id: Number(id),
      },
      data: {
        name,
        email,
        phone,
        address,
      },
    });

    res.json(updatedClient);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update client' });
  }
};

export const deleteClient = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.client.delete({
      where: {
        id: Number(id),
      },
    });

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to delete client' });
  }
};
