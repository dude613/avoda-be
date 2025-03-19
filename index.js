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
import { 
  SERVER_WORKING_MESSAGE, 
  BASE_URL, 
  SOCKET_CONNECTION_EVENT, 
  SOCKET_MESSAGE_EVENT, 
  SOCKET_DISCONNECT_EVENT,
  API_BASE_ROUTE
} from "./Constants/AppConstants.js";

dotenv.config();
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

Sentry.setupExpressErrorHandler(app);

app.get("/", (req, res) => {
    res.send(SERVER_WORKING_MESSAGE);
});

app.use(API_BASE_ROUTE, apiRouter);
ConnectDatabase();


// Optional fallthrough error handler
app.use(function onError(err, req, res, next) {
  // The error id is attached to `res.sentry` to be returned
  // and optionally displayed to the user for support.
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

io.on(SOCKET_CONNECTION_EVENT, (socket) => {
    socket.on(SOCKET_MESSAGE_EVENT, (data) => {
        io.emit(SOCKET_MESSAGE_EVENT, data);
    });
    socket.on(SOCKET_DISCONNECT_EVENT, () => { });
});

server.listen(PORT, () => {
    console.log(`${BASE_URL}:${PORT}`);
});
