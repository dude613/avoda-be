// Define a type for the constants object for better type safety
interface AppContent {
    readonly SERVER_WORKING_MESSAGE: string;
    readonly SOCKET_CONNECTION_EVENT: string;
    readonly SOCKET_MESSAGE_EVENT: string;
    readonly SOCKET_DISCONNECT_EVENT: string;
    readonly API_BASE_ROUTE: string;
}

// Use 'as const' to infer literal types and make properties readonly
export const appContent: AppContent = {
    SERVER_WORKING_MESSAGE: "Server working",
    SOCKET_CONNECTION_EVENT: "connection",
    SOCKET_MESSAGE_EVENT: "message",
    SOCKET_DISCONNECT_EVENT: "disconnect",
    API_BASE_ROUTE: "/api",
} as const; // Use 'as const' for immutability and literal types
