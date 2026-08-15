import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Camera } from "lucide-react";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";

const API_URL = "https://real-chat-5fxb.vercel.app";

export default function Profile() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [email, setEmail] = useState("");

  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // GET PROFILE
  // ==========================================

  useEffect(() => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        setLoading(true);

        const response = await fetch(
          `${API_URL}/api/users/${user.uid}`
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.message || "Failed to load profile"
          );
        }

        const profile = data.user || data;

        console.log("Profile loaded:", profile);

        setName(profile.name || "");
        setEmail(profile.email || user.email || "");

        // IMPORTANT:
        // MongoDB field is profileImage
        let image = profile.profileImage || "";

        // Convert relative URL to full URL
        if (image && image.startsWith("/")) {
          image = `${API_URL}${image}`;
        }

        setPhotoURL(image);
      } catch (error) {
        console.error("Profile error:", error);
        setMessage(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  // ==========================================
  // UPLOAD PROFILE IMAGE
  // ==========================================

  const handleImageUpload = async (event) => {
    const file = event.target.files?.[0];

    if (!file || !user?.uid) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      setMessage("Please select a valid image.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setMessage("Image size must be less than 5 MB.");
      return;
    }

    try {
      setUploading(true);
      setMessage("");

      const formData = new FormData();

      formData.append("image", file);

      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/photo`,
        {
          method: "PUT",
          body: formData,
        }
      );

      const data = await response.json();

      console.log("Photo upload response:", data);

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to upload image"
        );
      }

      let newPhotoURL =
        data.user?.profileImage ||
        data.profileImage ||
        "";

      if (
        newPhotoURL &&
        newPhotoURL.startsWith("/")
      ) {
        newPhotoURL = `${API_URL}${newPhotoURL}`;
      }

      setPhotoURL(newPhotoURL);

      setMessage(
        "Profile image updated successfully."
      );
    } catch (error) {
      console.error(
        "Image upload error:",
        error
      );

      setMessage(error.message);
    } finally {
      setUploading(false);
    }
  };

  // ==========================================
  // SAVE PROFILE NAME
  // ==========================================

  const save = async (event) => {
    event.preventDefault();

    if (!name.trim()) {
      setMessage("Please enter your name.");
      return;
    }

    if (!user?.uid) {
      setMessage("User is not logged in.");
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      // IMPORTANT:
      // Backend route is /:firebaseUid/profile
      const response = await fetch(
        `${API_URL}/api/users/${user.uid}/profile`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
          }),
        }
      );

      const data = await response.json();

      console.log("Profile update response:", data);

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to update profile"
        );
      }

      setName(
        data.user?.name ||
          name.trim()
      );

      setMessage(
        "Profile updated successfully."
      );
    } catch (error) {
      console.error(
        "Profile update error:",
        error
      );

      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-card">
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="profile-page">
      <div className="profile-card">

        {/* Back */}
        <button
          className="back-button"
          onClick={() => navigate("/chat")}
        >
          <ArrowLeft size={19} />
          Back to chat
        </button>

        {/* Profile image */}
        <div className="profile-avatar-wrapper">
          <label
            className="profile-avatar clickable"
            htmlFor="profile-image-input"
          >
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="profile-photo"
                onError={(event) => {
                  console.error(
                    "Profile image failed:",
                    photoURL
                  );

                  event.currentTarget.style.display =
                    "none";
                }}
              />
            ) : (
              <Avatar
                user={{
                  uid: user?.uid,
                  name,
                  email,
                  photoURL: "",
                }}
                size="large"
              />
            )}

            <div className="camera-overlay">
              <Camera size={22} />
            </div>
          </label>

          <input
            id="profile-image-input"
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            hidden
            disabled={uploading}
          />
        </div>

        {uploading && (
          <p className="uploading-text">
            Uploading image...
          </p>
        )}

        {/* Name */}
        <h1>My Profile</h1>

        <p>{email || user?.email}</p>

        <form
          onSubmit={save}
          className="auth-form"
        >
          <label>Display name</label>

          <input
            value={name}
            onChange={(event) =>
              setName(event.target.value)
            }
            placeholder="Enter your name"
            disabled={saving}
          />

          <button
            type="submit"
            className="primary-button"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : "Save changes"}
          </button>
        </form>

        {message && (
          <div className="success-box">
            {message}
          </div>
        )}

      </div>
    </div>
  );
}