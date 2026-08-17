import { useEffect, useState } from "react";

import {
  ArrowLeft,
  Bell,
  Lock,
  Moon,
  Palette,
  Shield,
  Sun,
  User,
  Eye,
  KeyRound,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";

import {
  getAuth,
  deleteUser,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

export default function Settings() {
  const navigate = useNavigate();

  // =====================================================
  // API URL
  // =====================================================

  const API_URL =
    process.env.REACT_APP_API_URL ||
    "http://localhost:5000";

  // =====================================================
  // LOAD SAVED SETTINGS
  // =====================================================

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("appearance") === "dark"
  );

  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") !== "off"
  );

  const [showOnlineStatus, setShowOnlineStatus] =
    useState(
      localStorage.getItem("showOnlineStatus") !==
        "off"
    );

  // =====================================================
  // DELETE ACCOUNT STATE
  // =====================================================

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [password, setPassword] = useState("");

  // =====================================================
  // APPLY DARK MODE
  // =====================================================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add(
        "dark-mode"
      );

      document.body.classList.add("dark-mode");

      localStorage.setItem(
        "appearance",
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark-mode"
      );

      document.body.classList.remove("dark-mode");

      localStorage.setItem(
        "appearance",
        "light"
      );
    }
  }, [darkMode]);

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const handleNotifications = () => {
    const newValue = !notifications;

    setNotifications(newValue);

    localStorage.setItem(
      "notifications",
      newValue ? "on" : "off"
    );
  };

  // =====================================================
  // ONLINE STATUS
  // =====================================================

  const handleOnlineStatus = () => {
    const newValue = !showOnlineStatus;

    setShowOnlineStatus(newValue);

    localStorage.setItem(
      "showOnlineStatus",
      newValue ? "on" : "off"
    );
  };

  // =====================================================
  // LIGHT MODE
  // =====================================================

  const enableLightMode = () => {
    setDarkMode(false);
  };

  // =====================================================
  // DARK MODE
  // =====================================================

  const enableDarkMode = () => {
    setDarkMode(true);
  };

  // =====================================================
  // OPEN DELETE MODAL
  // =====================================================

  const openDeleteModal = () => {
    setPassword("");
    setShowDeleteConfirm(true);
  };

  // =====================================================
  // CLOSE DELETE MODAL
  // =====================================================

  const closeDeleteModal = () => {
    if (deletingAccount) {
      return;
    }

    setPassword("");
    setShowDeleteConfirm(false);
  };

  // =====================================================
  // DELETE ACCOUNT
  // =====================================================

  const handleDeleteAccount = async () => {
    if (deletingAccount) {
      return;
    }

    try {
      setDeletingAccount(true);

      const auth = getAuth();

      const currentUser = auth.currentUser;

      // =================================================
      // CHECK USER
      // =================================================

      if (!currentUser) {
        alert(
          "No logged-in account was found."
        );

        setDeletingAccount(false);

        return;
      }

      const firebaseUid = currentUser.uid;

      console.log(
        "Starting account deletion:",
        firebaseUid
      );

      // =================================================
      // CHECK AUTH PROVIDER
      // =================================================

      const providerData =
        currentUser.providerData || [];

      const passwordProvider =
        providerData.find(
          (provider) =>
            provider.providerId ===
            "password"
        );

      // =================================================
      // EMAIL/PASSWORD RE-AUTHENTICATION
      // =================================================

      if (passwordProvider) {
        if (!password.trim()) {
          alert(
            "Please enter your current password."
          );

          setDeletingAccount(false);

          return;
        }

        console.log(
          "Re-authenticating Firebase user..."
        );

        const credential =
          EmailAuthProvider.credential(
            currentUser.email,
            password
          );

        await reauthenticateWithCredential(
          currentUser,
          credential
        );

        console.log(
          "Firebase re-authentication successful"
        );
      } else {
        // =================================================
        // OTHER PROVIDERS
        // =================================================

        alert(
          "For security, please log out and log in again, then try deleting your account."
        );

        setDeletingAccount(false);

        return;
      }

      // =================================================
      // FIREBASE TOKEN REFRESH
      // =================================================

      await currentUser.getIdToken(true);

      console.log(
        "Firebase authentication refreshed"
      );

      // =================================================
      // DELETE FIREBASE ACCOUNT FIRST
      // =================================================
      //
      // IMPORTANT:
      // We do this AFTER re-authentication.
      //
      // This prevents:
      //
      // MongoDB deleted
      // ↓
      // Firebase deletion fails
      // ↓
      // MongoDB user no longer exists
      //
      // =================================================

      console.log(
        "Deleting Firebase account..."
      );

      await deleteUser(currentUser);

      console.log(
        "Firebase account deleted successfully"
      );

      // =================================================
      // DELETE MONGODB ACCOUNT
      // =================================================

      console.log(
        "Deleting MongoDB account..."
      );

      const response = await fetch(
        `${API_URL}/api/users/${firebaseUid}`,
        {
          method: "DELETE",

          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

      const data =
        await response.json();

      console.log(
        "MongoDB delete response:",
        response.status,
        data
      );

      // =================================================
      // HANDLE MONGODB RESULT
      // =================================================

      if (!response.ok && response.status !== 404) {
        console.error(
          "MongoDB account deletion failed:",
          data
        );

        // Firebase is already deleted.
        // We do not want to tell the user that
        // the entire deletion failed.

        alert(
          "Firebase account was deleted, but some profile data could not be removed from MongoDB. Please contact the administrator."
        );

        setDeletingAccount(false);

        return;
      }

      // =================================================
      // CLEAR LOCAL SETTINGS
      // =================================================

      localStorage.removeItem(
        "appearance"
      );

      localStorage.removeItem(
        "notifications"
      );

      localStorage.removeItem(
        "showOnlineStatus"
      );

      // =================================================
      // SUCCESS
      // =================================================

      alert(
        "Your account has been permanently deleted."
      );

      // =================================================
      // REDIRECT
      // =================================================

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "DELETE ACCOUNT ERROR:",
        error
      );

      // =================================================
      // WRONG PASSWORD
      // =================================================

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        alert(
          "Incorrect password. Please enter your current password."
        );
      }

      // =================================================
      // WRONG PASSWORD - OLD FIREBASE VERSION
      // =================================================

      else if (
        error.code ===
        "auth/wrong-password"
      ) {
        alert(
          "Incorrect password. Please enter your current password."
        );
      }

      // =================================================
      // RECENT LOGIN REQUIRED
      // =================================================

      else if (
        error.code ===
        "auth/requires-recent-login"
      ) {
        alert(
          "Your login session is too old. Please log out and log in again, then try deleting your account."
        );
      }

      // =================================================
      // USER ALREADY DELETED
      // =================================================

      else if (
        error.code ===
        "auth/user-token-expired"
      ) {
        alert(
          "Your session has expired. Please log in again."
        );

        navigate("/login", {
          replace: true,
        });
      }

      // =================================================
      // FIREBASE USER NOT FOUND
      // =================================================

      else if (
        error.code ===
        "auth/user-not-found"
      ) {
        alert(
          "This Firebase account no longer exists."
        );

        navigate("/login", {
          replace: true,
        });
      }

      // =================================================
      // OTHER ERROR
      // =================================================

      else {
        alert(
          error.message ||
            "Failed to delete account."
        );
      }

      setDeletingAccount(false);
    }
  };

  // =====================================================
  // RENDER
  // =====================================================

  return (
    <div className="settings-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settings-header">

        <button
          className="settings-back"
          onClick={() =>
            navigate("/chat")
          }
          title="Back to Chat"
        >
          <ArrowLeft size={20} />
        </button>

        <div>
          <h1>Settings</h1>

          <p>
            Manage your ChatApp preferences
          </p>
        </div>

      </div>

      <div className="settings-container">

        {/* =================================================
            APPEARANCE
        ================================================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <Palette size={21} />
            </div>

            <div>
              <strong>
                Appearance
              </strong>

              <span>
                Choose how ChatApp looks
              </span>
            </div>

          </div>

          {/* LIGHT MODE */}

          <div className="setting-option">

            <div className="option-left">

              <div className="option-icon">
                <Sun size={19} />
              </div>

              <div>
                <strong>
                  Light mode
                </strong>

                <span>
                  Use the light appearance
                </span>
              </div>

            </div>

            <button
              type="button"
              className={`radio-button ${
                !darkMode
                  ? "selected"
                  : ""
              }`}
              onClick={
                enableLightMode
              }
            >
              {!darkMode && (
                <span />
              )}
            </button>

          </div>

          {/* DARK MODE */}

          <div className="setting-option">

            <div className="option-left">

              <div className="option-icon">
                <Moon size={19} />
              </div>

              <div>
                <strong>
                  Dark mode
                </strong>

                <span>
                  Use the dark appearance
                </span>
              </div>

            </div>

            <button
              type="button"
              className={`radio-button ${
                darkMode
                  ? "selected"
                  : ""
              }`}
              onClick={
                enableDarkMode
              }
            >
              {darkMode && (
                <span />
              )}
            </button>

          </div>

        </section>

        {/* =================================================
            NOTIFICATIONS
        ================================================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <Bell size={21} />
            </div>

            <div>
              <strong>
                Notifications
              </strong>

              <span>
                Manage message notifications
              </span>
            </div>

          </div>

          <div className="setting-option">

            <div className="option-left">

              <div className="option-icon">
                <Bell size={19} />
              </div>

              <div>
                <strong>
                  Message notifications
                </strong>

                <span>
                  Receive notifications for
                  new messages
                </span>
              </div>

            </div>

            <button
              type="button"
              className={`toggle ${
                notifications
                  ? "active"
                  : ""
              }`}
              onClick={
                handleNotifications
              }
            >
              <span />
            </button>

          </div>

        </section>

        {/* =================================================
            PRIVACY
        ================================================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <Eye size={21} />
            </div>

            <div>
              <strong>
                Privacy
              </strong>

              <span>
                Control your online visibility
              </span>
            </div>

          </div>

          <div className="setting-option">

            <div className="option-left">

              <div className="option-icon">
                <User size={19} />
              </div>

              <div>
                <strong>
                  Show online status
                </strong>

                <span>
                  Allow friends to see when
                  you are online
                </span>
              </div>

            </div>

            <button
              type="button"
              className={`toggle ${
                showOnlineStatus
                  ? "active"
                  : ""
              }`}
              onClick={
                handleOnlineStatus
              }
            >
              <span />
            </button>

          </div>

        </section>

        {/* =================================================
            SECURITY
        ================================================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <Shield size={21} />
            </div>

            <div>
              <strong>
                Security
              </strong>

              <span>
                Protect your account
              </span>
            </div>

          </div>

          {/* ACCOUNT SECURITY */}

          <button
            type="button"
            className="security-button"
            onClick={() => {
              alert(
                "Your account is protected by Firebase Authentication."
              );
            }}
          >

            <div className="option-icon">
              <Lock size={19} />
            </div>

            <div>
              <strong>
                Account security
              </strong>

              <span>
                Manage your account security
              </span>
            </div>

          </button>

          {/* PASSWORD */}

          <button
            type="button"
            className="security-button"
            onClick={() => {
              alert(
                "Password management is handled by Firebase Authentication."
              );
            }}
          >

            <div className="option-icon">
              <KeyRound size={19} />
            </div>

            <div>
              <strong>
                Password & authentication
              </strong>

              <span>
                Manage your login credentials
              </span>
            </div>

          </button>

        </section>

        {/* =================================================
            ACCOUNT
        ================================================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <User size={21} />
            </div>

            <div>
              <strong>
                Account
              </strong>

              <span>
                Manage your profile
              </span>
            </div>

          </div>

          {/* EDIT PROFILE */}

          <button
            type="button"
            className="settings-action-button"
            onClick={() =>
              navigate("/profile")
            }
          >
            <User size={18} />

            Edit profile
          </button>

          {/* DELETE ACCOUNT */}

          <button
            type="button"
            className="delete-account-button"
            onClick={
              openDeleteModal
            }
          >
            <Trash2 size={18} />

            <div>
              <strong>
                Delete account
              </strong>

              <span>
                Permanently delete your
                account and messages
              </span>
            </div>
          </button>

        </section>

      </div>

      {/* =================================================
          DELETE ACCOUNT MODAL
      ================================================= */}

      {showDeleteConfirm && (
        <div className="delete-modal-overlay">

          <div className="delete-modal">

            <div className="delete-warning-icon">
              <AlertTriangle
                size={30}
              />
            </div>

            <h2>
              Delete account?
            </h2>

            <p>
              This action cannot be undone.
              Your profile, messages and
              account data will be permanently
              deleted.
            </p>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <div className="delete-password-wrapper">

              <label htmlFor="delete-password">
                Enter your current password
              </label>

              <input
                id="delete-password"
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(
                    e.target.value
                  )
                }
                placeholder="Current password"
                disabled={
                  deletingAccount
                }
                autoComplete="current-password"
              />

            </div>

            <div className="delete-modal-actions">

              <button
                type="button"
                className="cancel-delete-button"
                onClick={
                  closeDeleteModal
                }
                disabled={
                  deletingAccount
                }
              >
                Cancel
              </button>

              <button
                type="button"
                className="confirm-delete-button"
                onClick={
                  handleDeleteAccount
                }
                disabled={
                  deletingAccount ||
                  !password.trim()
                }
              >
                {deletingAccount
                  ? "Deleting..."
                  : "Yes, delete account"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}