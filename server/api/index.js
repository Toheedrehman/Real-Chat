const mongoose = require("mongoose");
const app = require("../server");

let cachedConnection = null;

async function connectDB() {
  if (mongoose.connection.readyState === 1) {
    return;
  }

  if (cachedConnection) {
    await cachedConnection;
    return;
  }

  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is missing");
  }

  cachedConnection = mongoose.connect(
    process.env.MONGO_URI,
    {
      serverSelectionTimeoutMS: 10000,
    }
  );

  await cachedConnection;

  console.log("MongoDB connected successfully");
}

module.exports = async (req, res) => {
  try {
    await connectDB();

    return app(req, res);
  } catch (error) {
    console.error("MongoDB connection failed:", error);

    return res.status(500).json({
      success: false,
      message: "Database connection failed",
      error: error.message,
    });
  }
};