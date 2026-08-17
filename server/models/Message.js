const express = require("express");
const multer = require("multer");

const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

const router = express.Router();

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 25 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedImages = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
    ];

    const allowedAudio = [
      "audio/webm",
      "audio/mpeg",
      "audio/mp3",
      "audio/wav",
      "audio/ogg",
      "audio/mp4",
      "audio/aac",
    ];

    if (
      allowedImages.includes(file.mimetype) ||
      allowedAudio.includes(file.mimetype)
    ) {
      return cb(null, true);
    }

    // Allow documents/files
    cb(null, true);
  },
});

// =====================================================
// CLOUDINARY UPLOAD HELPER
// =====================================================

function uploadToCloudinary(
  buffer,
  folder,
  resourceType = "auto"
) {
  return new Promise((resolve, reject) => {
    const stream =
      cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
        },
        (error, result) => {
          if (error) {
            return reject(error);
          }

          resolve(result);
        }
      );

    stream.end(buffer);
  });
}

// =====================================================
// TEST
// =====================================================

router.get("/test", (req, res) => {
  res.json({
    success: true,
    message: "Message routes are working",
  });
});

// =====================================================
// SEND TEXT MESSAGE
// =====================================================

router.post("/", async (req, res) => {
  try {
    const {
      chatId,
      senderId,
      receiverId,
      text,
    } = req.body;

    if (
      !chatId ||
      !senderId ||
      !receiverId ||
      !text ||
      !text.trim()
    ) {
      return res.status(400).json({
        success: false,
        message:
          "chatId, senderId, receiverId and text are required",
      });
    }

    const message = await Message.create({
      chatId,
      senderId,
      receiverId,

      text: text.trim(),

      type: "text",

      mediaUrl: "",
      fileName: "",
      fileType: "",
      fileSize: 0,
      duration: 0,

      seen: false,
    });

    return res.status(201).json({
      success: true,
      message,
    });
  } catch (error) {
    console.error("SEND MESSAGE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to send message",
      error: error.message,
    });
  }
});

// =====================================================
// SEND IMAGE
// =====================================================

router.post(
  "/image",
  upload.single("image"),
  async (req, res) => {
    try {
      const {
        chatId,
        senderId,
        receiverId,
      } = req.body;

      console.log("POST /api/messages/image");
      console.log("Body:", req.body);
      console.log("File:", req.file);

      if (
        !chatId ||
        !senderId ||
        !receiverId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "chatId, senderId and receiverId are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Image is required",
        });
      }

      if (
        !req.file.mimetype.startsWith("image/")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only image files are allowed",
        });
      }

      // Upload to Cloudinary
      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "real-chat/messages/images",
          "image"
        );

      console.log(
        "Cloudinary image:",
        result.secure_url
      );

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "image",

          mediaUrl: result.secure_url,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration: 0,

          seen: false,
        });

      return res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "SEND IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to send image",
        error: error.message,
      });
    }
  }
);

// =====================================================
// SEND FILE / DOCUMENT
// =====================================================

router.post(
  "/file",
  upload.single("file"),
  async (req, res) => {
    try {
      const {
        chatId,
        senderId,
        receiverId,
      } = req.body;

      console.log("POST /api/messages/file");
      console.log("Body:", req.body);
      console.log("File:", req.file);

      if (
        !chatId ||
        !senderId ||
        !receiverId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "chatId, senderId and receiverId are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "File is required",
        });
      }

      // Documents/files → Cloudinary raw
      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "real-chat/messages/files",
          "raw"
        );

      console.log(
        "Cloudinary file:",
        result.secure_url
      );

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "file",

          mediaUrl: result.secure_url,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration: 0,

          seen: false,
        });

      return res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "SEND FILE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to send file",
        error: error.message,
      });
    }
  }
);

// =====================================================
// SEND VOICE / AUDIO
// =====================================================

router.post(
  "/audio",
  upload.single("audio"),
  async (req, res) => {
    try {
      const {
        chatId,
        senderId,
        receiverId,
      } = req.body;

      console.log("POST /api/messages/audio");
      console.log("Body:", req.body);
      console.log("File:", req.file);

      if (
        !chatId ||
        !senderId ||
        !receiverId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "chatId, senderId and receiverId are required",
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Audio file is required",
        });
      }

      if (
        !req.file.mimetype.startsWith("audio/")
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only audio files are allowed",
        });
      }

      // Audio → Cloudinary video resource type
      const result =
        await uploadToCloudinary(
          req.file.buffer,
          "real-chat/messages/audio",
          "video"
        );

      console.log(
        "Cloudinary audio:",
        result.secure_url
      );

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "audio",

          mediaUrl: result.secure_url,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration:
            result.duration || 0,

          seen: false,
        });

      return res.status(201).json({
        success: true,
        message,
      });
    } catch (error) {
      console.error(
        "SEND AUDIO ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Failed to send audio",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET MESSAGES
// =====================================================

router.get(
  "/:conversationId",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const messages =
        await Message.find({
          chatId: conversationId,
        }).sort({
          createdAt: 1,
        });

      return res.json({
        success: true,
        messages,
      });
    } catch (error) {
      console.error(
        "GET MESSAGES ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to load messages",
        error: error.message,
      });
    }
  }
);

// =====================================================
// MARK MESSAGES SEEN
// =====================================================

router.put(
  "/:conversationId/seen",
  async (req, res) => {
    try {
      const {
        conversationId,
      } = req.params;

      const {
        currentUid,
      } = req.body;

      if (!currentUid) {
        return res.status(400).json({
          success: false,
          message:
            "currentUid is required",
        });
      }

      const result =
        await Message.updateMany(
          {
            chatId: conversationId,
            receiverId: currentUid,
            seen: false,
          },
          {
            $set: {
              seen: true,
            },
          }
        );

      return res.json({
        success: true,
        message:
          "Messages marked as seen",
        modifiedCount:
          result.modifiedCount,
      });
    } catch (error) {
      console.error(
        "MARK SEEN ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to mark messages as seen",
        error: error.message,
      });
    }
  }
);

module.exports = router;