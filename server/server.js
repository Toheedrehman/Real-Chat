const dns = require("dns");

// =====================================================
// PUBLIC DNS FOR MONGODB SRV LOOKUP
// =====================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

// =====================================================
// IMPORTS
// =====================================================

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");

const {
  initializeSocket,
} = require("./socket");

// =====================================================
// ENVIRONMENT
// =====================================================

dotenv.config();

// =====================================================
// EXPRESS APP
// =====================================================

const app = express();

// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);

// =====================================================
// ALLOWED FRONTEND ORIGINS
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",

  // Production frontend
  "https://real-chat-roan.vercel.app",
];

// =====================================================
// EXPRESS CORS
// =====================================================

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without Origin
      // such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (
        allowedOrigins.includes(origin)
      ) {
        return callback(null, true);
      }

      console.log(
        "❌ CORS blocked:",
        origin
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],

    optionsSuccessStatus: 204,
  })
);

// =====================================================
// SOCKET.IO
// =====================================================

const io = initializeSocket(server);

// Make Socket.IO available inside routes
app.set("io", io);

// =====================================================
// BODY PARSER
// =====================================================

app.use(
  express.json({
    limit: "10mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "10mb",
  })
);

// =====================================================
// ROUTES
// =====================================================

const userRoutes =
  require("./routes/userRoutes");

const messageRoutes =
  require("./routes/messageRoutes");

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,

    message:
      "Real Chat Node.js Server is running",

    socket: true,

    mongodb:
      mongoose.connection.readyState === 1
        ? "connected"
        : "disconnected",
  });
});

// =====================================================
// API TEST
// =====================================================

app.get(
  "/api/test",
  (req, res) => {
    res.status(200).json({
      success: true,
      message: "API is working",
      socket: true,
    });
  }
);

// =====================================================
// SOCKET TEST
// =====================================================

app.get(
  "/api/socket-test",
  (req, res) => {
    const socketIO =
      req.app.get("io");

    res.status(200).json({
      success: true,

      socket:
        !!socketIO,

      message:
        socketIO
          ? "Socket.IO is initialized"
          : "Socket.IO is not initialized",
    });
  }
);

// =====================================================
// USER ROUTES
// =====================================================

app.use(
  "/api/users",
  userRoutes
);

// =====================================================
// MESSAGE ROUTES
// =====================================================

app.use(
  "/api/messages",
  messageRoutes
);

// =====================================================
// 404 HANDLER
// =====================================================

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "Route not found",

      path:
        req.originalUrl,
    });
  }
);

// =====================================================
// ERROR HANDLER
// =====================================================

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "❌ EXPRESS ERROR:",
      err
    );

    // CORS error
    if (
      err.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        success: false,
        message:
          "CORS origin not allowed",
      });
    }

    return res.status(500).json({
      success: false,

      message:
        "Server error",

      error:
        err.message,
    });
  }
);

// =====================================================
// DATABASE + SERVER START
// =====================================================

const PORT =
  process.env.PORT || 5000;

async function startServer() {
  try {
    // -----------------------------------------------
    // CHECK MONGO URI
    // -----------------------------------------------

    if (!process.env.MONGO_URI) {
      throw new Error(
        "MONGO_URI is missing from .env"
      );
    }

    // -----------------------------------------------
    // CONNECT MONGODB
    // -----------------------------------------------

    await mongoose.connect(
      process.env.MONGO_URI
    );

    console.log(
      "✅ MongoDB connected successfully"
    );

    // -----------------------------------------------
    // START HTTP + SOCKET SERVER
    // -----------------------------------------------

    server.listen(
      PORT,
      "0.0.0.0",
      () => {
        console.log(
          `🚀 Server running on http://localhost:${PORT}`
        );

        console.log(
          "🔌 Socket.IO server ready"
        );

        console.log(
          `📡 Socket endpoint: http://localhost:${PORT}`
        );
      }
    );

  } catch (error) {
    console.error(
      "❌ Server startup error:",
      error
    );

    process.exit(1);
  }
}

// =====================================================
// START ONLY WHEN RUN DIRECTLY
// =====================================================

if (
  require.main === module
) {
  startServer();
}

// =====================================================
// EXPORT
// =====================================================

module.exports = app;