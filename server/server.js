const dns = require("dns");

// Use public DNS for MongoDB SRV lookup
dns.setServers([
  "8.8.8.8",
  "1.1.1.1",
]);

const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");
const mongoose = require("mongoose");

dotenv.config();

const app = express();

// ==========================================
// ROUTES
// ==========================================

const userRoutes = require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");

// ==========================================
// CORS
// ==========================================

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://localhost:5173",
  "https://real-chat-roan.vercel.app",
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("CORS blocked:", origin);

      return callback(
        new Error("Not allowed by CORS")
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

// ==========================================
// BODY PARSER
// ==========================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// ==========================================
// OLD UPLOADS
// ==========================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// ==========================================
// HEALTH CHECK
// ==========================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message:
      "Real Chat Node.js Server is running",
  });
});

// ==========================================
// API TEST
// ==========================================

app.get("/api/test", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API is working",
  });
});

// ==========================================
// USER ROUTES
// ==========================================

app.use(
  "/api/users",
  userRoutes
);

// ==========================================
// MESSAGE ROUTES
// ==========================================

app.use(
  "/api/messages",
  messageRoutes
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
    path: req.originalUrl,
  });
});

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (err, req, res, next) => {
    console.error(
      "EXPRESS ERROR:",
      err
    );

    res.status(500).json({
      success: false,
      message: "Server error",
      error: err.message,
    });
  }
);

// ==========================================
// START SERVER LOCALLY
// ==========================================

const PORT =
  process.env.PORT || 5000;

if (require.main === module) {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log(
        "MongoDB connected successfully"
      );

      app.listen(PORT, () => {
        console.log(
          `Server running on http://localhost:${PORT}`
        );
      });
    })
    .catch((error) => {
      console.error(
        "MongoDB connection error:",
        error.message
      );

      process.exit(1);
    });
}

// ==========================================
// VERCEL EXPORT
// ==========================================

module.exports = app;