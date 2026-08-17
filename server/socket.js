const { Server } = require("socket.io");
const User = require("./models/user");

let io = null;

// =====================================================
// INITIALIZE SOCKET.IO
// =====================================================

function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:5173",
        "https://real-chat-roan.vercel.app",
      ],

      methods: [
        "GET",
        "POST",
        "PUT",
        "PATCH",
        "DELETE",
      ],

      credentials: true,
    },

    transports: [
      "websocket",
      "polling",
    ],
  });

  // ===================================================
  // CONNECTION
  // ===================================================

  io.on("connection", (socket) => {
    console.log(
      "🟢 Socket connected:",
      socket.id
    );

    // =================================================
    // USER ONLINE
    // =================================================

    socket.on(
      "userOnline",
      async (firebaseUid) => {
        if (!firebaseUid) {
          return;
        }

        try {
          socket.firebaseUid =
            firebaseUid;

          // Personal room
          socket.join(firebaseUid);

          console.log(
            `🟢 User online: ${firebaseUid}`
          );

          const lastSeen =
            new Date();

          await User.findOneAndUpdate(
            { firebaseUid },
            {
              isOnline: true,
              lastSeen,
            },
            {
              new: true,
            }
          );

          // Notify everyone
          io.emit(
            "userStatus",
            {
              firebaseUid,
              isOnline: true,
              lastSeen,
            }
          );

        } catch (error) {
          console.error(
            "Socket online error:",
            error
          );
        }
      }
    );

    // =================================================
    // USER OFFLINE
    // =================================================

    socket.on(
      "userOffline",
      async () => {
        const firebaseUid =
          socket.firebaseUid;

        if (!firebaseUid) {
          return;
        }

        try {
          await handleUserOffline(
            socket,
            firebaseUid
          );

        } catch (error) {
          console.error(
            "Socket offline error:",
            error
          );
        }
      }
    );

    // =================================================
    // JOIN CHAT
    // =================================================

    socket.on(
      "joinChat",
      (chatId) => {
        if (!chatId) {
          return;
        }

        socket.join(chatId);

        console.log(
          `💬 ${socket.id} joined chat ${chatId}`
        );
      }
    );

    // =================================================
    // LEAVE CHAT
    // =================================================

    socket.on(
      "leaveChat",
      (chatId) => {
        if (!chatId) {
          return;
        }

        socket.leave(chatId);

        console.log(
          `🚪 ${socket.id} left chat ${chatId}`
        );
      }
    );

    // =================================================
    // TYPING START
    // =================================================

    socket.on(
      "typing",
      ({
        chatId,
        senderId,
        receiverId,
      }) => {
        if (
          !chatId ||
          !senderId ||
          !receiverId
        ) {
          return;
        }

        socket
          .to(receiverId)
          .emit(
            "userTyping",
            {
              chatId,
              senderId,
            }
          );
      }
    );

    // =================================================
    // TYPING STOP
    // =================================================

    socket.on(
      "stopTyping",
      ({
        chatId,
        senderId,
        receiverId,
      }) => {
        if (
          !chatId ||
          !senderId ||
          !receiverId
        ) {
          return;
        }

        socket
          .to(receiverId)
          .emit(
            "userStoppedTyping",
            {
              chatId,
              senderId,
            }
          );
      }
    );

    // =================================================
    // MESSAGE SEEN
    // =================================================

    socket.on(
      "messageSeen",
      ({
        chatId,
        messageId,
        senderId,
        receiverId,
      }) => {
        if (
          !chatId ||
          !messageId ||
          !senderId ||
          !receiverId
        ) {
          return;
        }

        socket
          .to(senderId)
          .emit(
            "messageSeen",
            {
              chatId,
              messageId,
              receiverId,
            }
          );

        console.log(
          `👁️ Message seen: ${messageId}`
        );
      }
    );

    // =================================================
    // MESSAGE DELIVERED
    // =================================================

    socket.on(
      "messageDelivered",
      ({
        chatId,
        messageId,
        senderId,
        receiverId,
      }) => {
        if (
          !chatId ||
          !messageId ||
          !senderId ||
          !receiverId
        ) {
          return;
        }

        socket
          .to(senderId)
          .emit(
            "messageDelivered",
            {
              chatId,
              messageId,
              receiverId,
            }
          );

        console.log(
          `✓ Message delivered: ${messageId}`
        );
      }
    );

    // =================================================
    // DISCONNECT
    // =================================================

    socket.on(
      "disconnect",
      async () => {
        console.log(
          "🔴 Socket disconnected:",
          socket.id
        );

        const firebaseUid =
          socket.firebaseUid;

        if (!firebaseUid) {
          return;
        }

        try {
          await handleUserOffline(
            socket,
            firebaseUid
          );

        } catch (error) {
          console.error(
            "Disconnect status error:",
            error
          );
        }
      }
    );
  });

  return io;
}

// =====================================================
// HANDLE USER OFFLINE
// =====================================================

async function handleUserOffline(
  socket,
  firebaseUid
) {
  const lastSeen =
    new Date();

  try {
    /*
     * Fetch sockets belonging to
     * this user's personal room.
     */

    const sockets =
      await io
        .in(firebaseUid)
        .fetchSockets();

    /*
     * If another browser/tab/device
     * is still connected, keep online.
     */

    if (sockets.length > 1) {
      console.log(
        `🟢 ${firebaseUid} still has an active socket`
      );

      return;
    }

    await User.findOneAndUpdate(
      { firebaseUid },
      {
        isOnline: false,
        lastSeen,
      },
      {
        new: true,
      }
    );

    io.emit(
      "userStatus",
      {
        firebaseUid,
        isOnline: false,
        lastSeen,
      }
    );

    console.log(
      `🔴 User offline: ${firebaseUid}`
    );

  } catch (error) {
    console.error(
      "handleUserOffline error:",
      error
    );
  }
}

// =====================================================
// GET IO
// =====================================================

function getIO() {
  if (!io) {
    throw new Error(
      "Socket.IO has not been initialized."
    );
  }

  return io;
}

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  initializeSocket,
  getIO,
};