import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  withCredentials: true,
  transports: ["websocket", "polling"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});

socket.on("connect", () => {
  console.log(
    "🟢 Socket.IO connected:",
    socket.id
  );
});

socket.on("disconnect", (reason) => {
  console.log(
    "🔴 Socket.IO disconnected:",
    reason
  );
});

socket.on("connect_error", (error) => {
  console.error(
    "❌ Socket connection error:",
    error.message
  );
});

export default socket;