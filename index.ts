import dotenv from "dotenv";
dotenv.config(); // Load .env variables FIRST

// Keep instrument import - relies on allowJs and tsc copying it
import "./instrument.js";

import express, { Express, Request, Response, NextFunction, ErrorRequestHandler } from "express";
import * as Sentry from "@sentry/node";
import http from "http";
import { Server as SocketIOServer, Socket } from "socket.io"; // Rename to avoid conflict with http.Server
import cors from "cors";
import bodyParser from "body-parser";
import { apiRouter } from "./Routes/Api.js"; // Keep .js extension
import { ConnectDatabase } from "./Components/ConnectDatabase.js"; // Keep .js extension
import path, { join, dirname } from "path"; // Import path module
import { fileURLToPath } from "url";
import { appContent } from "./Constants/AppConstants.js"; // Keep .js extension as required by NodeNext
import { setupTimerWebSockets } from "./services/webSocketService.js"; // Keep .js extension as required by NodeNext

// Type assertion for appContent if needed, or define its type properly
const typedAppContent = appContent as any; // Using 'any' for simplicity, refine if possible

const {
  SERVER_WORKING_MESSAGE,
  SOCKET_CONNECTION_EVENT,
  SOCKET_MESSAGE_EVENT,
  SOCKET_DISCONNECT_EVENT,
  API_BASE_ROUTE
} = typedAppContent;

const app: Express = express(); // Use Express type

const server: http.Server = http.createServer(app); // Use http.Server type

// Serve static files (assuming 'files' directory exists)
app.use("/files", express.static("files"));

// Handle __dirname and __filename for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
app.use("/uploads", express.static(join(__dirname, "uploads")));

// Initialize Socket.io
const io = new SocketIOServer(server, { // Use renamed Server type
    cors: {
        origin: "*", // Consider restricting this in production
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"]
    }
});

// Setup middleware
const PORT: number = parseInt(process.env.PORT || "8001", 10); // Parse PORT to number
const BASE_URL: string = process.env.BASE_URL || "http://localhost";
const FRONTEND_URL: string = process.env.FRONTEND_URL || "http://localhost:3000"; // Default to localhost
const allowedOrigins = [
    FRONTEND_URL,
    /\.vercel\.app$/ // Wildcard for any Vercel subdomain (regex)
  ];
  
  app.use(cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.some(o =>
        typeof o === 'string' ? o === origin : o.test(origin)
      )) {
        callback(null, true);
      } else {
        console.error("Blocked by CORS:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  }));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req: Request, res: Response) => { // Add types
    res.send(SERVER_WORKING_MESSAGE);
});

// Sentry debug route
app.get("/debug-sentry", function mainHandler(req: Request, res: Response) { // Add types
    throw new Error("My first Sentry error!");
});

// Connect to database
ConnectDatabase(); // Assuming this handles its own errors

// Mount API routes
app.use(API_BASE_ROUTE, apiRouter);

// Generic error handling middleware (before Sentry)
const genericErrorHandler: ErrorRequestHandler = (err, req: Request, res: Response, next: NextFunction) => {
    // Log the error internally, including the stack trace and original error
    console.error("Unhandled Error:", err);
    console.error("Error Stack Trace:", err.stack);

    // Check if Sentry added an error ID to the response
    const sentryId = res.sentry;

    res.statusCode = 500;
    // Send a generic message to the client
    res.json({ // Send JSON response for consistency
        success: false,
        error: "An internal server error occurred.",
        // Include Sentry ID if available
        sentryId: sentryId
    });
    // Do not call next() after sending response unless necessary for further processing
};
app.use(genericErrorHandler);

// Sentry: Add this after all routes and custom error handlers
// The Sentry error handler has to be the last error handler.
Sentry.setupExpressErrorHandler(app);


// Socket.IO connection handling
io.on(SOCKET_CONNECTION_EVENT, (socket: Socket) => { // Add Socket type
    console.log(`Socket connected: ${socket.id}`); // Log connection

    socket.on(SOCKET_MESSAGE_EVENT, (data: any) => { // Add type for data if known
        console.log(`Message from ${socket.id}:`, data);
        // Broadcast message to all clients (including sender)
        io.emit(SOCKET_MESSAGE_EVENT, data);
    });

    socket.on(SOCKET_DISCONNECT_EVENT, (reason: string) => { // Add type for reason
        console.log(`Socket disconnected: ${socket.id}, Reason: ${reason}`);
    });

    // Handle potential socket errors
    socket.on('error', (error: Error) => {
        console.error(`Socket Error (${socket.id}):`, error);
    });
});

// Setup timer-specific WebSocket functionality
setupTimerWebSockets(io); // Assuming this function is correctly typed or handles 'any'

// Start server
server.listen(PORT, () => {
    console.log(`Server running at ${BASE_URL}:${PORT}`);
    // Send a verification message to Sentry on startup
    Sentry.captureMessage("Sentry initialized successfully!");
});

// Graceful shutdown handling (optional but recommended)
process.on('SIGTERM', () => {
    console.log('SIGTERM signal received: closing HTTP server');
    server.close(() => {
        console.log('HTTP server closed');
        // Close database connection, etc.
        process.exit(0);
    });
});
