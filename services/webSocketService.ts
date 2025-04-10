import jwt, { JwtPayload } from "jsonwebtoken";
import { Server as SocketIOServer, Socket, Namespace } from "socket.io"; 

interface SocketTokenPayload extends JwtPayload {
  userId: string; 
  
}


interface AuthenticatedSocket extends Socket {
    userId?: string;
}

const socketsByUser = new Map<string, Set<AuthenticatedSocket>>();

export const setupTimerWebSockets = (io: SocketIOServer): Namespace => {
  
  const timerIo: Namespace = io.of("/timers");

  
  timerIo.use((socket: Socket, next: (err?: Error) => void) => {
    
    const authSocket = socket as AuthenticatedSocket;

    
    const token = authSocket.handshake.auth.token || authSocket.handshake.query.token;

    if (!token || typeof token !== 'string') { 
      console.log("Timer WS Auth: No token provided.");
      return next(new Error("Authentication required: No token provided"));
    }

    const jwtSecret = process.env.JWT_SECRET_KEY;
    if (!jwtSecret) {
      console.error("Timer WS Auth: JWT secret key is not defined");
      return next(new Error("Server configuration error"));
    }

    try {
      
      const decoded = jwt.verify(token, jwtSecret) as SocketTokenPayload;

      
      if (!decoded.userId || typeof decoded.userId !== 'string') {
          console.log("Timer WS Auth: Invalid token payload (missing or invalid userId).");
          return next(new Error("Authentication failed: Invalid token payload"));
      }

      
      authSocket.userId = decoded.userId;
      console.log(`Timer WS Auth: User ${decoded.userId} authenticated.`);
      next(); 
    } catch (error: any) {
      console.error("Timer WS Auth: Token verification failed:", error.message);
      next(new Error("Authentication failed: Invalid or expired token"));
    }
  });

  
  timerIo.on("connection", (socket: Socket) => {
      
      const authSocket = socket as AuthenticatedSocket;
      const userId = authSocket.userId;

      
      if (!userId) {
          console.error("Timer WS Connection: userId missing on authenticated socket. Disconnecting.");
          authSocket.disconnect(true);
          return;
      }

      console.log(`Timer WebSocket connected for user: ${userId} (Socket ID: ${authSocket.id})`);

      
      if (!socketsByUser.has(userId)) {
          socketsByUser.set(userId, new Set());
      }
      socketsByUser.get(userId)?.add(authSocket);

      
      authSocket.on("disconnect", (reason: string) => {
          console.log(`Timer WebSocket disconnected for user: ${userId} (Socket ID: ${authSocket.id}), Reason: ${reason}`);
          if (socketsByUser.has(userId)) {
              const connections = socketsByUser.get(userId);
              if (connections) {
                  connections.delete(authSocket);

                  if (connections.size === 0) {
                      socketsByUser.delete(userId);
                      console.log(`Removed user ${userId} from active timer connections.`);
                  }
              }
          }
      });

      
      
  });

  return timerIo;
};

/**
 * Broadcasts a message to all active WebSocket connections for a specific user ID.
 * @param userId - The user ID (string) to broadcast to.
 * @param event - The event name (string) to emit.
 * @param data - The data payload (any type) to send with the event.
 */
export const broadcastToUser = (userId: string, event: string, data: any): void => {
  if (socketsByUser.has(userId)) {
    const connections = socketsByUser.get(userId);
    if (connections && connections.size > 0) {
      console.log(`Broadcasting event '${event}' to user ${userId} (${connections.size} connection(s))`);
      connections.forEach((socket: AuthenticatedSocket) => {
        socket.emit(event, data);
      });
    } else {
      console.log(`No active connections found for user ${userId} to broadcast event '${event}'.`);
    }
  } else {
    console.log(`User ${userId} not found in active timer connections for event '${event}'.`);
  }
};