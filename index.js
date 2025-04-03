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

const {
    SERVER_WORKING_MESSAGE,
    BASE_URL,
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
    res.send(SERVER_WORKING_MESSAGE);
});

app.get("/debug-sentry", function mainHandler(req, res) {
    throw new Error("My first Sentry error!");
  });
  
app.get("/ping", (req, res) => {
    res.send("NOT_DOWN");
});

app.use(API_BASE_ROUTE, apiRouter);
ConnectDatabase();

// Your custom error handler must be defined before the Sentry error handler
app.use(function onError(err, req, res, next) {
    // The error id is attached to `res.sentry` to be returned
    // and optionally displayed to the user for support.
    res.statusCode = 500;
    res.end(res.sentry + "\n");
});

// Sentry: The error handler must be before any other error middleware and after all controllers
Sentry.setupExpressErrorHandler(app);

io.on(SOCKET_CONNECTION_EVENT, (socket) => {
    socket.on(SOCKET_MESSAGE_EVENT, (data) => {
        io.emit(SOCKET_MESSAGE_EVENT, data);
    });
    socket.on(SOCKET_DISCONNECT_EVENT, () => { });
});

server.listen(PORT, () => {
    console.log(`${BASE_URL}:${PORT}`);
    // Send a verification message to Sentry on startup
    Sentry.captureMessage("Sentry initialized successfully!");
});
