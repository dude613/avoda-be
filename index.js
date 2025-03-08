import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { apiRouter } from "./Routes/Api.js";
import { ConnectDatabase } from "./Components/ConnectDatabase.js";

dotenv.config();
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

const PORT = process.env.PORT || 8001;
app.use(cors());
app.use(bodyParser.json());

app.get("/", (req, res) => {
    res.send("Server working");
});

app.use("/api", apiRouter);
ConnectDatabase();

io.on("connection", (socket) => {
    socket.on("message", (data) => {
        io.emit("message", data);
    });
    socket.on("disconnect", () => { });
});

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
