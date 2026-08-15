const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    // ==========================================
    // CHAT
    // ==========================================

    chatId: {
      type: String,
      required: true,
      index: true,
    },

    senderId: {
      type: String,
      required: true,
      index: true,
    },

    receiverId: {
      type: String,
      required: true,
      index: true,
    },

    // ==========================================
    // MESSAGE TEXT
    // ==========================================

    text: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // MESSAGE TYPE
    // ==========================================

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

    // ==========================================
    // MEDIA
    // ==========================================

    mediaUrl: {
      type: String,
      default: "",
    },

    // ==========================================
    // FILE INFORMATION
    // ==========================================

    fileName: {
      type: String,
      default: "",
    },

    fileType: {
      type: String,
      default: "",
    },

    fileSize: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // AUDIO
    // ==========================================

    duration: {
      type: Number,
      default: 0,
    },

    // ==========================================
    // SEEN
    // ==========================================

    seen: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "Message",
  messageSchema
);