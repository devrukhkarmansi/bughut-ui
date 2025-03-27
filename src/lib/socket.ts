import { GameSocket } from "@/types/socket";
import { io } from "socket.io-client";

const SOCKET_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ?? "http://localhost:3000";

export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
}) as GameSocket;

socket.on("connect", () => {
  console.log("=== Socket Connected ===");
  console.log("Socket ID:", socket.id);
  console.log("Connection state:", {
    connected: socket.connected,
    disconnected: socket.disconnected,
  });
});

socket.on("connect_error", (error) => {
  console.error("=== Socket Connection Error ===");
  console.error("Error:", error);
  console.error("Current socket state:", {
    id: socket.id,
    connected: socket.connected,
    disconnected: socket.disconnected,
  });
});

socket.on("disconnect", (reason) => {
  console.log("=== Socket Disconnected ===");
  console.log("Reason:", reason);
  console.log("Attempting to reconnect...");

  if (reason === "io server disconnect") {
    // Server initiated disconnect, need to manually reconnect
    socket.connect();
  }
  // Otherwise, socket.io will automatically try to reconnect
});

socket.on("reconnect", (attemptNumber) => {
  console.log("=== Socket Reconnected ===");
  console.log("Attempt number:", attemptNumber);
  console.log("Socket ID:", socket.id);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log("=== Reconnection Attempt ===");
  console.log("Attempt number:", attemptNumber);
});

socket.on("reconnect_error", (error) => {
  console.error("=== Reconnection Error ===");
  console.error("Error:", error);
});

socket.on("reconnect_failed", () => {
  console.error("=== Reconnection Failed ===");
  console.error("Max reconnection attempts reached");
});

export const connectSocket = () => {
  if (!socket.connected) {
    console.log("=== Manually Connecting Socket ===");
    socket.connect();
  }
};

export const disconnectSocket = () => {
  if (socket.connected) {
    console.log("=== Manually Disconnecting Socket ===");
    socket.disconnect();
  }
};
