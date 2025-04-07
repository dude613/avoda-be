import jwt from "jsonwebtoken";
// Map to store active connections by userId
const userConnections = new Map();
/**
  // Setup timer-specific WebSocket functionality using the existing Socket.io instance
  @param {Server} io - The Socket.io server instance
 */
export const setupTimerWebSockets = (io) => {
    // Create a namespace for timer-related events
    const timerIo = io.of("/timers");
    timerIo.use((socket, next) => {
        // Get token from handshake auth or query
        const token = socket.handshake.auth.token || socket.handshake.query.token;
        if (!token) {
            return next(new Error("Authentication required"));
        }
        try {
            if (!process.env.JWT_SECRET_KEY) {
                console.error("JWT secret key is not defined");
                return next(new Error("Server configuration error"));
            }
            // Verify JWT token
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            socket.userId = decoded.userId;
            return next();
        }
        catch (error) {
            console.error("JWT verification error:", error);
            return next(new Error("Authentication failed"));
        }
    });
    timerIo.on("connection", (socket) => {
        console.log(`Timer WebSocket connected for user: ${socket.userId}`);
        // Store connection with userId
        if (socket.userId) {
            if (!userConnections.has(socket.userId)) {
                userConnections.set(socket.userId, []);
            }
            userConnections.get(socket.userId)?.push(socket);
        }
        // Handle disconnection
        socket.on("disconnect", () => {
            console.log(`Timer WebSocket disconnected for user: ${socket.userId}`);
            if (socket.userId && userConnections.has(socket.userId)) {
                const connections = userConnections.get(socket.userId);
                const index = connections?.indexOf(socket);
                if (connections && index !== undefined && index > -1) {
                    connections.splice(index, 1);
                }
                // If no more connections for this user, remove the user entry
                if (connections?.length === 0) {
                    userConnections.delete(socket.userId);
                }
            }
        });
    });
    return timerIo;
};
/**
 * Broadcast a message to all connections of a specific user
 * @param {string} userId - The user ID to broadcast to
 * @param {string} event - The event name
 * @param {object} data - The data to send
 */
export const broadcastToUser = (userId, event, data) => {
    if (userConnections.has(userId)) {
        const connections = userConnections.get(userId);
        connections?.forEach((socket) => {
            socket.emit(event, data);
        });
    }
};
