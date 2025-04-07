
interface AppContent {
    SERVER_WORKING_MESSAGE: string;
    SOCKET_CONNECTION_EVENT: string;
    SOCKET_MESSAGE_EVENT: string;
    SOCKET_DISCONNECT_EVENT: string;
    API_BASE_ROUTE: string;
}

export const appContent: AppContent = {
    SERVER_WORKING_MESSAGE: "Server working",
    SOCKET_CONNECTION_EVENT: "connection",
    SOCKET_MESSAGE_EVENT: "message",
    SOCKET_DISCONNECT_EVENT: "disconnect",
    API_BASE_ROUTE: "/api",
}
