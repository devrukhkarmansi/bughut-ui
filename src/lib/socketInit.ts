import { socket } from "./socket";

// Initialize socket connection
export const initializeSocket = () => {
  console.log("=== Socket Initialization ===");
  console.log("Socket connection status:", socket.connected);
  console.log("Socket ID:", socket.id);
};
