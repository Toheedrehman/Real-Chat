const mongoose = require("mongoose");

// =====================================================
// MESSAGE SCHEMA
// =====================================================

const messageSchema = new mongoose.Schema(
  {
    // ===================================================
    // CHAT ID
    // ===================================================

    chatId: {
      type: String,
      required: true,
      index: true,
    },

    // ===================================================
    // SENDER
    // ===================================================

    senderId: {
      type: String,
      required: true,
      index: true,
    },

    // ===================================================
    // RECEIVER
    // ===================================================

    receiverId: {
      type: String,
      required: true,
      index: true,
    },

    // ===================================================
    // TEXT
    // ===================================================

    text: {
      type: String,
      default: "",
      trim: true,
    },

    // ===================================================
    // MESSAGE TYPE
    // text / image / file / audio
    // ===================================================

    type: {
      type: String,
      enum: [
        "text",
        "image",
        "file",
        "audio",
      ],
      default: "text",
    },

    // ===================================================
    // CLOUDINARY MEDIA URL
    // ===================================================

    mediaUrl: {
      type: String,
      default: "",
    },

    // ===================================================
    // ORIGINAL FILE NAME
    // ===================================================

    fileName: {
      type: String,
      default: "",
    },

    // ===================================================
    // MIME TYPE
    // ===================================================

    fileType: {
      type: String,
      default: "",
    },

    // ===================================================
    // FILE SIZE IN BYTES
    // ===================================================

    fileSize: {
      type: Number,
      default: 0,
    },

    // ===================================================
    // AUDIO DURATION
    // ===================================================

    duration: {
      type: Number,
      default: 0,
    },

    // ===================================================
    // SEEN STATUS
    // ===================================================

    seen: {
      type: Boolean,
      default: false,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// INDEX FOR FAST CHAT MESSAGE LOADING
// =====================================================

messageSchema.index({
  chatId: 1,
  createdAt: 1,
});

// =====================================================
// MONGOOSE MODEL
// =====================================================
//
// Important for Vercel/serverless:
// Reuse the existing model if Mongoose
// has already registered it.
//
// =====================================================

const Message =
  mongoose.models.Message ||
  mongoose.model(
    "Message",
    messageSchema
  );

// =====================================================
// EXPORT
// =====================================================

module.exports = Message;