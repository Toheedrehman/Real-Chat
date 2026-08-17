const dns = require("dns");

// =====================================================
// PUBLIC DNS FOR MONGODB SRV LOOKUP
// =====================================================

dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const http = require("http");

const {
  initializeSocket,
} = require("./socket");

dotenv.config();

const app = express();

// =====================================================
// HTTP SERVER
// =====================================================

const server =
  http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io =
  initializeSocket(server);

// Make io available to routes
app.set("io", io);

// =====================================================
// ROUTES
// =====================================================

const userRoutes =
  require("./routes/userRoutes");

const messageRoutes =
  require("./routes/messageRoutes");

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://real-chat-roan.vercel.app",
];

app.use(
  cors({
    origin: function (
      origin,
      callback
    ) {
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      console.log(
        "CORS blocked:",
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
// BODY PARSER
// =====================================================

app.use(
  express.json()
);

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// HEALTH CHECK
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Real Chat Node.js Server is running",
    socket: true,
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
      message:
        "API is working",
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
// 404
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
      "EXPRESS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message:
        "Server error",
      error:
        err.message,
    });
  }
);

// =====================================================
// START SERVER
// =====================================================

const PORT =
  process.env.PORT || 5000;

if (
  require.main === module
) {
  mongoose
    .connect(
      process.env.MONGO_URI
    )
    .then(() => {
      console.log(
        "MongoDB connected successfully"
      );

      server.listen(
        PORT,
        () => {
          console.log(
            `Server running on http://localhost:${PORT}`
          );

          console.log(
            "Socket.IO server ready"
          );
        }
      );
    })
    .catch(
      (error) => {
        console.error(
          "MongoDB connection error:",
          error.message
        );

        process.exit(1);
      }
    );
}

// =====================================================
// EXPORT
// =====================================================

module.exports = app;