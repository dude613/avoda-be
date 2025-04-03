// IMPORTANT: Make sure to import `instrument.js` at the top of your file.
// If you're using ECMAScript Modules (ESM) syntax, use `import "./instrument.js";`
import "./instrument.js";

import express from "express";
import http from "http";
import * as Sentry from "@sentry/node";
import { Server } from "socket.io";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { apiRouter } from "./Routes/Api.js";
import { ConnectDatabase } from "./Components/ConnectDatabase.js";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import { appContent } from "./Constants/AppConstants.js";
import { setupTimerWebSockets } from "./services/webSocketService.js";

const {
  SERVER_WORKING_MESSAGE,
  BASE_URL,
  SOCKET_CONNECTION_EVENT,
  SOCKET_MESSAGE_EVENT,
  SOCKET_DISCONNECT_EVENT,
  API_BASE_ROUTE
} = appContent;

dotenv.config();
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
app.use(cors());
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sentry error tracking
Sentry.setupExpressErrorHandler(app);

// Routes
app.get("/", (req, res) => {
  res.send(SERVER_WORKING_MESSAGE);
});

// API routes
app.use(API_BASE_ROUTE, apiRouter);

// Connect to database
ConnectDatabase();

// Error handling middleware
app.use(function onError(err, req, res, next) {
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});

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
});
