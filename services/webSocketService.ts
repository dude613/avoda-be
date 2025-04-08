import jwt, { JwtPayload } from "jsonwebtoken";
import { Server as SocketIOServer, Socket, Namespace } from "socket.io"; // Import necessary types

// Define a type for the decoded JWT payload expected by this middleware
interface SocketTokenPayload extends JwtPayload {
  userId: number; // Assuming userId is stored in the token as a number
  // Add other properties if included in your token payload
}

// Extend the Socket type to include our custom userId property
interface AuthenticatedSocket extends Socket {
    userId?: number; // Add userId property
}

// Map to store active connections by userId (Socket ID might be better, but using userId as per original)
// Using AuthenticatedSocket type for the value
const userConnections = new Map<number, AuthenticatedSocket[]>();

/**
 * Sets up timer-specific WebSocket functionality using the existing Socket.io instance.
 * Creates a namespace, adds authentication middleware, and handles connections.
 * @param io - The main Socket.io server instance.
 * @returns The created Socket.io Namespace for timers.
 */
export const setupTimerWebSockets = (io: SocketIOServer): Namespace => {
  // Create a namespace for timer-related events
  const timerIo: Namespace = io.of("/timers");

  // Authentication middleware for the timer namespace
  timerIo.use((socket: Socket, next: (err?: Error) => void) => {
    // Cast socket to our extended type
    const authSocket = socket as AuthenticatedSocket;

    // Get token from handshake auth or query
    const token = authSocket.handshake.auth.token || authSocket.handshake.query.token;

    if (!token || typeof token !== 'string') { // Check if token is a non-empty string
      console.log("Timer WS Auth: No token provided.");
      return next(new Error("Authentication required: No token provided"));
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      console.error("Timer WS Auth: JWT secret key is not defined");
      return next(new Error("Server configuration error"));
    }

    try {
      // Verify JWT token
      const decoded = jwt.verify(token, jwtSecret) as SocketTokenPayload;

      // Validate decoded payload
      if (!decoded.userId || typeof decoded.userId !== 'number') {
          console.log("Timer WS Auth: Invalid token payload (missing or invalid userId).");
          return next(new Error("Authentication failed: Invalid token payload"));
      }

      // Attach userId to the socket object
      authSocket.userId = decoded.userId;
      console.log(`Timer WS Auth: User ${decoded.userId} authenticated.`);
      next(); // Proceed with connection
    } catch (error: any) {
      console.error("Timer WS Auth: Token verification failed:", error.message);
      next(new Error("Authentication failed: Invalid or expired token"));
    }
  });

  // Handle connections within the authenticated namespace
  timerIo.on("connection", (socket: Socket) => {
      // Cast socket to our extended type
      const authSocket = socket as AuthenticatedSocket;
      const userId = authSocket.userId;

      // userId should always be defined here due to the middleware, but check defensively
      if (!userId) {
          console.error("Timer WS Connection: userId missing on authenticated socket. Disconnecting.");
          authSocket.disconnect(true);
          return;
      }

      console.log(`Timer WebSocket connected for user: ${userId} (Socket ID: ${authSocket.id})`);

      // Store connection with userId
      if (!userConnections.has(userId)) {
          userConnections.set(userId, []);
      }
      userConnections.get(userId)?.push(authSocket); // Use optional chaining for safety

      // Handle disconnection
      authSocket.on("disconnect", (reason: string) => {
          console.log(`Timer WebSocket disconnected for user: ${userId} (Socket ID: ${authSocket.id}), Reason: ${reason}`);
          if (userConnections.has(userId)) {
              const connections = userConnections.get(userId);
              if (connections) {
                  const index = connections.indexOf(authSocket);
                  if (index !== -1) {
                      connections.splice(index, 1);
                  }
                  // If no more connections for this user, remove the user entry
                  if (connections.length === 0) {
                      userConnections.delete(userId);
                      console.log(`Removed user ${userId} from active timer connections.`);
                  }
              }
          }
      });

      // Optional: Handle specific events from the client for this namespace
      // authSocket.on('timer:client_event', (data) => { ... });
  });

  return timerIo;
};

/**
 * Broadcasts a message to all active WebSocket connections for a specific user ID.
 * @param userId - The user ID (number) to broadcast to.
 * @param event - The event name (string) to emit.
 * @param data - The data payload (any type) to send with the event.
 */
export const broadcastToUser = (userId: number, event: string, data: any): void => {
  if (userConnections.has(userId)) {
    const connections = userConnections.get(userId);
    if (connections && connections.length > 0) {
        console.log(`Broadcasting event '${event}' to user ${userId} (${connections.length} connection(s))`);
        connections.forEach((socket) => {
            socket.emit(event, data);
        });
    } else {
         console.log(`No active connections found for user ${userId} to broadcast event '${event}'.`);
    }
  } else {
      console.log(`User ${userId} not found in active timer connections for event '${event}'.`);
  }
};
