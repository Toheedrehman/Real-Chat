const express = require("express");
const multer = require("multer");
const fs = require("fs");
const { Readable } = require("stream");

const cloudinary = require("../config/cloudinary");
const User = require("../models/user");

const router = express.Router();

// ==========================================
// OLD UPLOAD DIRECTORY
// ==========================================
//
// Kept only for compatibility with old images
// already stored as /uploads/... in MongoDB.
//
// New images are NOT saved here.
// New images go to Cloudinary.
//

const uploadDir = require("path").join(
  __dirname,
  "../uploads"
);

// ==========================================
// MULTER CONFIGURATION
// ==========================================
//
// IMPORTANT:
// memoryStorage is required for Vercel.
// We do NOT write uploaded files to disk.
//

const storage = multer.memoryStorage();

const upload = multer({
  storage,

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: function (req, file, cb) {
    if (
      file.mimetype &&
      file.mimetype.startsWith("image/")
    ) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Only image files are allowed"
        )
      );
    }
  },
});

// ==========================================
// TEST
// GET /api/users/test
// ==========================================

router.get("/test", (req, res) => {
  console.log("USER ROUTE TEST");

  res.json({
    success: true,
    message: "Users route is working",
  });
});

// ==========================================
// REGISTER USER
// POST /api/users/register
// ==========================================

router.post("/register", async (req, res) => {
  console.log("================================");
  console.log("POST /api/users/register");
  console.log("Body:", req.body);

  try {
    const {
      firebaseUid,
      name,
      email,
    } = req.body;

    // --------------------------------------
    // VALIDATE
    // --------------------------------------

    if (!firebaseUid || !name || !email) {
      return res.status(400).json({
        success: false,
        message:
          "firebaseUid, name and email are required",
      });
    }

    const cleanUid = firebaseUid.trim();
    const cleanName = name.trim();
    const cleanEmail =
      email.trim().toLowerCase();

    // --------------------------------------
    // CHECK UID
    // --------------------------------------

    const existingUid =
      await User.findOne({
        firebaseUid: cleanUid,
      });

    if (existingUid) {
      console.log(
        "User already exists by UID"
      );

      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: existingUid,
      });
    }

    // --------------------------------------
    // CHECK EMAIL
    // --------------------------------------

    const existingEmail =
      await User.findOne({
        email: cleanEmail,
      });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Email already exists in MongoDB",
      });
    }

    // --------------------------------------
    // CREATE USER
    // --------------------------------------

    const user = await User.create({
      firebaseUid: cleanUid,
      name: cleanName,
      email: cleanEmail,
      profileImage: "",
      isOnline: true,
      lastSeen: new Date(),
    });

    console.log(
      "MongoDB user created:",
      user._id
    );

    return res.status(201).json({
      success: true,
      message:
        "User registered successfully",
      user,
    });
  } catch (error) {
    console.error(
      "REGISTER MONGODB ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ==========================================
// GET ALL USERS
// GET /api/users
// ==========================================

router.get("/", async (req, res) => {
  try {
    const { currentUid } = req.query;

    const filter = currentUid
      ? {
          firebaseUid: {
            $ne: currentUid,
          },
        }
      : {};

    const users = await User.find(filter)
      .select("-__v")
      .sort({ name: 1 });

    return res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    console.error(
      "GET USERS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
});

// ==========================================
// GET USER BY FIREBASE UID
// GET /api/users/:firebaseUid
// ==========================================

router.get(
  "/:firebaseUid",
  async (req, res) => {
    try {
      const firebaseUid =
        req.params.firebaseUid.trim();

      const user =
        await User.findOne({
          firebaseUid,
        }).select("-__v");

      if (!user) {
        console.log(
          "User not found:",
          firebaseUid
        );

        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        user,
      });
    } catch (error) {
      console.error(
        "GET USER ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// ==========================================
// UPDATE ONLINE STATUS
// PUT /api/users/:firebaseUid/status
// ==========================================

router.put(
  "/:firebaseUid/status",
  async (req, res) => {
    try {
      const firebaseUid =
        req.params.firebaseUid.trim();

      const { isOnline } = req.body;

      const user =
        await User.findOneAndUpdate(
          {
            firebaseUid,
          },
          {
            isOnline: Boolean(isOnline),
            lastSeen: new Date(),
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      return res.status(200).json({
        success: true,
        message: "Status updated",
        user,
      });
    } catch (error) {
      console.error(
        "STATUS ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// ==========================================
// UPDATE PROFILE NAME
// PUT /api/users/:firebaseUid/profile
// ==========================================

router.put(
  "/:firebaseUid/profile",
  async (req, res) => {
    try {
      const firebaseUid =
        req.params.firebaseUid.trim();

      const { name } = req.body;

      if (!name || !name.trim()) {
        return res.status(400).json({
          success: false,
          message: "Name is required",
        });
      }

      const user =
        await User.findOneAndUpdate(
          {
            firebaseUid,
          },
          {
            name: name.trim(),
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(
        "Profile name updated:",
        user.name
      );

      return res.status(200).json({
        success: true,
        message:
          "Profile updated successfully",
        user,
      });
    } catch (error) {
      console.error(
        "PROFILE UPDATE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// ==========================================
// UPLOAD PROFILE PHOTO
// PUT /api/users/:firebaseUid/photo
// ==========================================
//
// New photos:
// React
//   ↓
// Multer memory
//   ↓
// Cloudinary
//   ↓
// MongoDB
//
// No files are written to Vercel.
//

router.put(
  "/:firebaseUid/photo",
  upload.single("image"),
  async (req, res) => {
    try {
      const firebaseUid =
        req.params.firebaseUid.trim();

      // --------------------------------------
      // CHECK FILE
      // --------------------------------------

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

      console.log(
        "================================"
      );

      console.log(
        "PROFILE PHOTO CLOUDINARY UPLOAD"
      );

      console.log(
        "Firebase UID:",
        firebaseUid
      );

      console.log(
        "Original file:",
        req.file.originalname
      );

      // --------------------------------------
      // FIND USER
      // --------------------------------------

      const existingUser =
        await User.findOne({
          firebaseUid,
        });

      if (!existingUser) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // --------------------------------------
      // OLD IMAGE
      // --------------------------------------

      const oldImage =
        existingUser.profileImage || "";

      // --------------------------------------
      // UPLOAD BUFFER TO CLOUDINARY
      // --------------------------------------

      const imageURL =
        await new Promise(
          (resolve, reject) => {
            const uploadStream =
              cloudinary.uploader.upload_stream(
                {
                  folder:
                    "real-chat/profiles",

                  public_id:
                    firebaseUid,

                  overwrite: true,

                  resource_type: "image",
                },

                (error, result) => {
                  if (error) {
                    return reject(error);
                  }

                  resolve(
                    result.secure_url
                  );
                }
              );

            Readable.from(
              req.file.buffer
            ).pipe(uploadStream);
          }
        );

      console.log(
        "Cloudinary image URL:",
        imageURL
      );

      // --------------------------------------
      // UPDATE MONGODB
      // --------------------------------------

      const user =
        await User.findOneAndUpdate(
          {
            firebaseUid,
          },
          {
            profileImage: imageURL,
          },
          {
            new: true,
            runValidators: true,
          }
        ).select("-__v");

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // --------------------------------------
      // IMPORTANT:
      // DO NOT DELETE OLD /uploads IMAGES
      // --------------------------------------
      //
      // This keeps existing profile pictures
      // safe.
      //
      // If oldImage is:
      //
      // /uploads/old-photo.png
      //
      // we leave it alone.
      //
      // New image is now Cloudinary.
      //
      // --------------------------------------

      console.log(
        "Previous image:",
        oldImage || "None"
      );

      console.log(
        "New profile image:",
        imageURL
      );

      return res.status(200).json({
        success: true,

        message:
          "Profile image updated successfully",

        user,

        profileImage: imageURL,
      });
    } catch (error) {
      console.error(
        "PROFILE IMAGE ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

// ==========================================
// MULTER ERROR HANDLER
// ==========================================

router.use(
  (
    error,
    req,
    res,
    next
  ) => {
    if (
      error instanceof multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Image must be less than 5 MB",
        });
      }

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    if (error) {
      console.error(
        "USER ROUTE ERROR:",
        error
      );

      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    next();
  }
);

// ==========================================
// EXPORT
// ==========================================

module.exports = router;