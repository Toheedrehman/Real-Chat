const express = require("express");
const multer = require("multer");

const cloudinary = require("../config/cloudinary");
const Message = require("../models/Message");

const router = express.Router();

// =====================================================
// MULTER MEMORY STORAGE
// =====================================================

const storage = multer.memoryStorage();

// =====================================================
// FILE FILTER
// =====================================================

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    return cb(null, true);
  }

  if (file.mimetype.startsWith("audio/")) {
    return cb(null, true);
  }

  return cb(null, true);
};

// =====================================================
// MULTER
// =====================================================

const upload = multer({
  storage,
  fileFilter,

  limits: {
    fileSize: 25 * 1024 * 1024,
  },
});

// =====================================================
// CLOUDINARY BUFFER UPLOAD
// =====================================================

function uploadToCloudinary(
  buffer,
  options = {}
) {
  return new Promise(
    (resolve, reject) => {
      try {
        const uploadStream =
          cloudinary.uploader.upload_stream(
            {
              folder:
                options.folder ||
                "real-chat/messages",

              resource_type:
                options.resource_type ||
                "auto",

              ...options,
            },

            (error, result) => {
              if (error) {
                console.error(
                  "Cloudinary upload error:",
                  error
                );

                return reject(error);
              }

              resolve(result);
            }
          );

        uploadStream.end(buffer);

      } catch (error) {
        reject(error);
      }
    }
  );
}

// =====================================================
// SOCKET HELPER
// =====================================================

function emitNewMessage(req, message) {
  try {
    const io = req.app.get("io");

    if (!io) {
      console.warn(
        "Socket.IO instance not available"
      );

      return;
    }

    io.to(message.chatId).emit(
      "newMessage",
      message
    );

    console.log(
      "Socket.IO newMessage emitted:",
      message._id
    );

  } catch (error) {
    console.error(
      "Socket.IO emit error:",
      error
    );
  }
}

// =====================================================
// TEST ROUTE
// GET /api/messages/test
// =====================================================

router.get(
  "/test",
  (req, res) => {
    res.json({
      success: true,
      message:
        "Message routes are working",
    });
  }
);

// =====================================================
// SEND TEXT MESSAGE
// POST /api/messages
// =====================================================

router.post(
  "/",
  async (req, res) => {
    try {
      const {
        chatId,
        senderId,
        receiverId,
        text,
      } = req.body;

      console.log(
        "POST /api/messages"
      );

      // ------------------------------------------------
      // VALIDATION
      // ------------------------------------------------

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

      // ------------------------------------------------
      // CREATE MESSAGE
      // ------------------------------------------------

      const message =
        await Message.create({
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

      // ------------------------------------------------
      // SOCKET.IO
      // ------------------------------------------------

      emitNewMessage(
        req,
        message
      );

      // ------------------------------------------------
      // RESPONSE
      // ------------------------------------------------

      return res.status(201).json({
        success: true,
        message,
      });

    } catch (error) {
      console.error(
        "SEND MESSAGE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to send message",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SEND IMAGE
// POST /api/messages/image
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

      console.log(
        "===================================="
      );

      console.log(
        "POST /api/messages/image"
      );

      console.log(
        "Body:",
        req.body
      );

      console.log(
        "File:",
        req.file
          ? {
              originalname:
                req.file.originalname,

              mimetype:
                req.file.mimetype,

              size:
                req.file.size,
            }
          : null
      );

      // ------------------------------------------------
      // VALIDATE MESSAGE DATA
      // ------------------------------------------------

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

      // ------------------------------------------------
      // VALIDATE FILE
      // ------------------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message:
            "Image is required",
        });
      }

      // ------------------------------------------------
      // VALIDATE IMAGE
      // ------------------------------------------------

      if (
        !req.file.mimetype.startsWith(
          "image/"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only image files are allowed",
        });
      }

      // ------------------------------------------------
      // CLOUDINARY
      // ------------------------------------------------

      console.log(
        "Uploading image to Cloudinary..."
      );

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          {
            folder:
              "real-chat/messages/images",

            resource_type:
              "image",
          }
        );

      const mediaUrl =
        result.secure_url;

      console.log(
        "Cloudinary image:",
        mediaUrl
      );

      // ------------------------------------------------
      // SAVE MESSAGE
      // ------------------------------------------------

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "image",

          mediaUrl,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration: 0,

          seen: false,
        });

      console.log(
        "Image message saved successfully"
      );

      // ------------------------------------------------
      // SOCKET.IO
      // ------------------------------------------------

      emitNewMessage(
        req,
        message
      );

      console.log(
        "===================================="
      );

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
        message:
          "Failed to send image",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SEND FILE / DOCUMENT
// POST /api/messages/file
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

      console.log(
        "===================================="
      );

      console.log(
        "POST /api/messages/file"
      );

      console.log(
        "Body:",
        req.body
      );

      console.log(
        "File:",
        req.file
          ? {
              originalname:
                req.file.originalname,

              mimetype:
                req.file.mimetype,

              size:
                req.file.size,
            }
          : null
      );

      // ------------------------------------------------
      // VALIDATE
      // ------------------------------------------------

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
            "File is required",
        });
      }

      // ------------------------------------------------
      // CLOUDINARY
      // ------------------------------------------------

      console.log(
        "Uploading file to Cloudinary..."
      );

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          {
            folder:
              "real-chat/messages/files",

            resource_type:
              "raw",
          }
        );

      const mediaUrl =
        result.secure_url;

      console.log(
        "Cloudinary file:",
        mediaUrl
      );

      // ------------------------------------------------
      // SAVE MESSAGE
      // ------------------------------------------------

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "file",

          mediaUrl,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration: 0,

          seen: false,
        });

      console.log(
        "File message saved successfully"
      );

      // ------------------------------------------------
      // SOCKET.IO
      // ------------------------------------------------

      emitNewMessage(
        req,
        message
      );

      console.log(
        "===================================="
      );

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
        message:
          "Failed to send file",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// SEND VOICE / AUDIO
// POST /api/messages/audio
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
        duration,
      } = req.body;

      console.log(
        "===================================="
      );

      console.log(
        "POST /api/messages/audio"
      );

      console.log(
        "Body:",
        req.body
      );

      console.log(
        "File:",
        req.file
          ? {
              originalname:
                req.file.originalname,

              mimetype:
                req.file.mimetype,

              size:
                req.file.size,
            }
          : null
      );

      // ------------------------------------------------
      // VALIDATE
      // ------------------------------------------------

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
        !req.file.mimetype.startsWith(
          "audio/"
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Only audio files are allowed",
        });
      }

      // ------------------------------------------------
      // CLOUDINARY
      // ------------------------------------------------

      console.log(
        "Uploading audio to Cloudinary..."
      );

      const result =
        await uploadToCloudinary(
          req.file.buffer,
          {
            folder:
              "real-chat/messages/audio",

            resource_type:
              "video",
          }
        );

      const mediaUrl =
        result.secure_url;

      console.log(
        "Cloudinary audio:",
        mediaUrl
      );

      // ------------------------------------------------
      // SAVE MESSAGE
      // ------------------------------------------------

      const message =
        await Message.create({
          chatId,
          senderId,
          receiverId,

          text: "",

          type: "audio",

          mediaUrl,

          fileName:
            req.file.originalname,

          fileType:
            req.file.mimetype,

          fileSize:
            req.file.size,

          duration:
            Number(duration) || 0,

          seen: false,
        });

      console.log(
        "Audio message saved successfully"
      );

      // ------------------------------------------------
      // SOCKET.IO
      // ------------------------------------------------

      emitNewMessage(
        req,
        message
      );

      console.log(
        "===================================="
      );

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
        message:
          "Failed to send audio",
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// GET MESSAGES
// GET /api/messages/:conversationId
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
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// MARK MESSAGES SEEN
// PUT /api/messages/:conversationId/seen
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
            chatId:
              conversationId,

            receiverId:
              currentUid,

            seen: false,
          },

          {
            $set: {
              seen: true,
            },
          }
        );

      // ------------------------------------------------
      // SOCKET.IO SEEN EVENT
      // ------------------------------------------------

      const io =
        req.app.get("io");

      if (io) {
        io.to(conversationId).emit(
          "messagesSeen",
          {
            chatId:
              conversationId,

            currentUid,

            modifiedCount:
              result.modifiedCount,
          }
        );
      }

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
        error:
          error.message,
      });
    }
  }
);

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
    if (
      error instanceof
      multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File must be less than 25 MB",
        });
      }

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    if (error) {
      console.error(
        "MESSAGE ROUTE ERROR:",
        error
      );

      return res.status(400).json({
        success: false,
        message:
          error.message,
      });
    }

    next();
  }
);

// =====================================================
// EXPORT
// =====================================================

module.exports = router;