import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST

import "./instrument.js";

import express from "express";
import * as Sentry from "@sentry/node";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import { apiRouter } from "./Routes/Api.js";
import { ConnectDatabase } from "./Components/ConnectDatabase.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { appContent } from "./Constants/AppConstants.js";
import { setupTimerWebSockets } from "./services/webSocketService.js";

const {
  SERVER_WORKING_MESSAGE,
  SOCKET_CONNECTION_EVENT,
  SOCKET_MESSAGE_EVENT,
  SOCKET_DISCONNECT_EVENT,
  API_BASE_ROUTE
} = appContent;

const app = express();

const server = http.createServer(app);
app.use("/files", express.static("files"));

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Setup middleware
const PORT = process.env.PORT || 8001;
const BASE_URL = process.env.BASE_URL || "http://localhost";
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.send(SERVER_WORKING_MESSAGE);
});

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
});

//TODO Add DB Error Handling
// Connect to database
ConnectDatabase();

app.use(API_BASE_ROUTE, apiRouter);

// Error handling middleware
app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});
// Sentry: Add this after all routes, but before any other error-handling middlewares are defined
Sentry.setupExpressErrorHandler(app);
//TODO Sentry has a postgres integration

io.on(SOCKET_CONNECTION_EVENT, (socket) => {
    socket.on(SOCKET_MESSAGE_EVENT, (data) => {
        io.emit(SOCKET_MESSAGE_EVENT, data);
    });
    socket.on(SOCKET_DISCONNECT_EVENT, () => { });
});

// Setup timer-specific WebSocket functionality
setupTimerWebSockets(io);

// Start server
server.listen(PORT, () => {
    console.log(`${BASE_URL}:${PORT}`);
    // Send a verification message to Sentry on startup
    Sentry.captureMessage("Sentry initialized successfully!");
});
