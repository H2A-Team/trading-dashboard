export const APP_CONSTANTS = {
    API_URL: import.meta.env.VITE_API_URL || "http://localhost:3001/api",
    // VOTE_APP_DOMAIN: process.env.VITE_VOTE_APP_DOMAIN || "https://presenti.com",
    SOCKET_DOMAIN: import.meta.env.VITE_SOCKET_URL || "http://localhost:5001",
};
