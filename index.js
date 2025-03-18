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
    res.send("Server working");
});

app.use("/api", apiRouter);
ConnectDatabase();

   
app.use(function onError(err, req, res, next) {
  res.statusCode = 500;
  res.end(res.sentry + "\n");
});

io.on("connection", (socket) => {
    socket.on("message", (data) => {
        io.emit("message", data);
    });
    socket.on("disconnect", () => { });
});

server.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
});
