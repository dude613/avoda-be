import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();


export async function ConnectDatabase() {
    const uri = process.env.MONGODB_URI;
    try {
        await mongoose.connect(uri);
        console.log("Connected to MongoDB Database");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        throw error;
    }
}