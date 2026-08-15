const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const User = require("../models/User");

const router = express.Router();

// ==========================================
// UPLOAD DIRECTORY
// ==========================================

const uploadDir = path.join(
  __dirname,
  "../uploads"
);

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, {
    recursive: true,
  });
}

// ==========================================
// MULTER CONFIGURATION
// ==========================================

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },

  filename: function (req, file, cb) {
    const extension = path.extname(
      file.originalname
    );

    const filename =
      `${req.params.firebaseUid}-` +
      `${Date.now()}${extension}`;

    cb(null, filename);
  },
});

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

    // Validate
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

    // Check UID
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

    // Check email
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

    // Create user
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
            returnDocument: "after",
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
            returnDocument: "after",
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
        "PROFILE PHOTO UPLOAD"
      );

      console.log(
        "Firebase UID:",
        firebaseUid
      );

      console.log(
        "File:",
        req.file.filename
      );

      // --------------------------------------
      // FIND USER FIRST
      // --------------------------------------

      const existingUser =
        await User.findOne({
          firebaseUid,
        });

      if (!existingUser) {
        // Delete uploaded file because
        // user does not exist
        try {
          fs.unlinkSync(
            req.file.path
          );
        } catch (deleteError) {
          console.error(
            "Could not delete uploaded file:",
            deleteError
          );
        }

        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // --------------------------------------
      // OLD IMAGE
      // --------------------------------------

      const oldImage =
        existingUser.profileImage;

      // --------------------------------------
      // NEW IMAGE URL
      // --------------------------------------

      const imageURL =
        `/uploads/${req.file.filename}`;

      // --------------------------------------
      // UPDATE DATABASE
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
            returnDocument: "after",
            runValidators: true,
          }
        ).select("-__v");

      // --------------------------------------
      // DELETE OLD IMAGE
      // --------------------------------------

      if (
        oldImage &&
        oldImage.startsWith("/uploads/")
      ) {
        const oldImagePath =
          path.join(
            __dirname,
            "..",
            oldImage
          );

        if (
          fs.existsSync(oldImagePath)
        ) {
          try {
            fs.unlinkSync(
              oldImagePath
            );

            console.log(
              "Old profile image deleted"
            );
          } catch (deleteError) {
            console.error(
              "Old image delete error:",
              deleteError
            );
          }
        }
      }

      console.log(
        "Profile image saved:",
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