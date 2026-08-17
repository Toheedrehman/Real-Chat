const express = require("express");
const multer = require("multer");
const { Readable } = require("stream");
const admin = require("firebase-admin");

const cloudinary = require("../config/cloudinary");
const User = require("../models/user");

const router = express.Router();

// =====================================================
// MULTER CONFIGURATION
// =====================================================

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
        new Error("Only image files are allowed")
      );
    }
  },
});

// =====================================================
// FIREBASE TOKEN VERIFICATION
// =====================================================
//
// Used for protected account deletion.
//
// Frontend must send:
//
// Authorization: Bearer FIREBASE_ID_TOKEN
//
// =====================================================

async function verifyFirebaseToken(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";

    if (!authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is required",
      });
    }

    const idToken = authHeader.substring(7);

    if (!idToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication token is missing",
      });
    }

    const decodedToken =
      await admin.auth().verifyIdToken(idToken);

    req.firebaseUser = decodedToken;

    next();
  } catch (error) {
    console.error(
      "FIREBASE TOKEN VERIFICATION ERROR:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired authentication token",
    });
  }
}

// =====================================================
// TEST
// GET /api/users/test
// =====================================================

router.get("/test", (req, res) => {
  console.log("USER ROUTE TEST");

  res.json({
    success: true,
    message: "Users route is working",
  });
});

// =====================================================
// REGISTER USER
// POST /api/users/register
// =====================================================

router.post("/register", async (req, res) => {
  try {
    const {
      firebaseUid,
      name,
      email,
    } = req.body;

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

    // -----------------------------------------------
    // CHECK UID
    // -----------------------------------------------

    const existingUid =
      await User.findOne({
        firebaseUid: cleanUid,
      });

    if (existingUid) {
      return res.status(200).json({
        success: true,
        message: "User already exists",
        user: existingUid,
      });
    }

    // -----------------------------------------------
    // CHECK EMAIL
    // -----------------------------------------------

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

    // -----------------------------------------------
    // CREATE USER
    // -----------------------------------------------

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

// =====================================================
// DELETE ACCOUNT
// DELETE /api/users/:firebaseUid
// =====================================================
//
// SECURITY:
// Firebase ID token is required.
//
// The UID inside the URL MUST match the UID
// inside the verified Firebase token.
//
// =====================================================

router.delete(
  "/:firebaseUid",
  verifyFirebaseToken,
  async (req, res) => {
    try {
      const requestedUid =
        req.params.firebaseUid.trim();

      const authenticatedUid =
        req.firebaseUser.uid;

      console.log(
        "================================"
      );

      console.log(
        "DELETE ACCOUNT REQUEST"
      );

      console.log(
        "Requested UID:",
        requestedUid
      );

      console.log(
        "Authenticated UID:",
        authenticatedUid
      );

      // -----------------------------------------------
      // SECURITY CHECK
      // -----------------------------------------------

      if (
        requestedUid !== authenticatedUid
      ) {
        return res.status(403).json({
          success: false,
          message:
            "You are not authorized to delete this account",
        });
      }

      // -----------------------------------------------
      // FIND USER
      // -----------------------------------------------

      const user =
        await User.findOne({
          firebaseUid: authenticatedUid,
        });

      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      // -----------------------------------------------
      // DELETE CLOUDINARY PROFILE IMAGE
      // -----------------------------------------------

      const profileImage =
        user.profileImage || "";

      if (
        profileImage &&
        profileImage.includes("cloudinary.com")
      ) {
        try {
          const publicId =
            `real-chat/profiles/${authenticatedUid}`;

          await cloudinary.uploader.destroy(
            publicId,
            {
              resource_type: "image",
            }
          );

          console.log(
            "Cloudinary profile image deleted"
          );
        } catch (cloudinaryError) {
          // Do not stop account deletion
          // if Cloudinary deletion fails.

          console.error(
            "CLOUDINARY DELETE ERROR:",
            cloudinaryError.message
          );
        }
      }

      // -----------------------------------------------
      // DELETE MONGODB USER
      // -----------------------------------------------

      const deleteResult =
        await User.deleteOne({
          firebaseUid: authenticatedUid,
        });

      if (
        deleteResult.deletedCount === 0
      ) {
        return res.status(404).json({
          success: false,
          message: "User not found",
        });
      }

      console.log(
        "MongoDB user deleted:",
        authenticatedUid
      );

      // -----------------------------------------------
      // IMPORTANT
      // -----------------------------------------------
      //
      // Firebase account is deleted from the
      // frontend with:
      //
      // deleteUser(currentUser)
      //
      // AFTER this API succeeds.
      //
      // -----------------------------------------------

      return res.status(200).json({
        success: true,
        message:
          "MongoDB account data deleted successfully",
      });
    } catch (error) {
      console.error(
        "DELETE ACCOUNT ERROR:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Failed to delete account",
        error: error.message,
      });
    }
  }
);

// =====================================================
// GET ALL USERS
// GET /api/users
// =====================================================

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

// =====================================================
// GET USER BY FIREBASE UID
// GET /api/users/:firebaseUid
// =====================================================

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

// =====================================================
// UPDATE ONLINE STATUS
// PUT /api/users/:firebaseUid/status
// =====================================================

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

// =====================================================
// UPDATE PROFILE NAME
// PUT /api/users/:firebaseUid/profile
// =====================================================

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

// =====================================================
// UPLOAD PROFILE PHOTO
// PUT /api/users/:firebaseUid/photo
// =====================================================

router.put(
  "/:firebaseUid/photo",
  upload.single("image"),
  async (req, res) => {
    try {
      const firebaseUid =
        req.params.firebaseUid.trim();

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "No image uploaded",
        });
      }

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

      // -----------------------------------------------
      // UPLOAD TO CLOUDINARY
      // -----------------------------------------------

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

      // -----------------------------------------------
      // UPDATE MONGODB
      // -----------------------------------------------

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

// =====================================================
// MULTER ERROR HANDLER
// =====================================================

router.use(
  (error, req, res, next) => {
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

// =====================================================
// EXPORT
// =====================================================

module.exports = router;