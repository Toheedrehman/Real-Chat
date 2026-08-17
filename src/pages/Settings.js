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
  CheckCircle,
  X,
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
  // SETTINGS
  // =====================================================

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("appearance") === "dark"
  );

  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") !== "off"
  );

  const [showOnlineStatus, setShowOnlineStatus] =
    useState(
      localStorage.getItem("showOnlineStatus") !== "off"
    );

  // =====================================================
  // DELETE ACCOUNT STATES
  // =====================================================

  const [showDeleteConfirm, setShowDeleteConfirm] =
    useState(false);

  const [showPasswordModal, setShowPasswordModal] =
    useState(false);

  const [showDeleteSuccess, setShowDeleteSuccess] =
    useState(false);

  const [password, setPassword] = useState("");

  const [deletingAccount, setDeletingAccount] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  // =====================================================
  // APPLY DARK MODE
  // =====================================================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add(
        "dark-mode"
      );

      document.body.classList.add(
        "dark-mode"
      );

      localStorage.setItem(
        "appearance",
        "dark"
      );
    } else {
      document.documentElement.classList.remove(
        "dark-mode"
      );

      document.body.classList.remove(
        "dark-mode"
      );

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
  // OPEN DELETE CONFIRMATION
  // =====================================================

  const openDeleteConfirmation = () => {
    setErrorMessage("");
    setShowDeleteConfirm(true);
  };

  // =====================================================
  // CLOSE DELETE CONFIRMATION
  // =====================================================

  const closeDeleteConfirmation = () => {
    if (deletingAccount) {
      return;
    }

    setShowDeleteConfirm(false);
  };

  // =====================================================
  // START DELETE PROCESS
  // =====================================================

  const startDeleteProcess = async () => {
    if (deletingAccount) {
      return;
    }

    try {
      const auth = getAuth();

      const currentUser = auth.currentUser;

      // -----------------------------------------------
      // CHECK USER
      // -----------------------------------------------

      if (!currentUser) {
        setErrorMessage(
          "No logged-in account was found."
        );

        return;
      }

      console.log(
        "Starting account deletion:",
        currentUser.uid
      );

      // -----------------------------------------------
      // CHECK LOGIN PROVIDER
      // -----------------------------------------------

      const passwordProvider =
        currentUser.providerData.find(
          (provider) =>
            provider.providerId ===
            "password"
        );

      // -----------------------------------------------
      // EMAIL/PASSWORD USER
      // -----------------------------------------------

      if (passwordProvider) {
        setShowDeleteConfirm(false);
        setPassword("");
        setErrorMessage("");
        setShowPasswordModal(true);

        return;
      }

      // -----------------------------------------------
      // OTHER AUTH PROVIDERS
      // -----------------------------------------------

      await deleteAccount(currentUser);

    } catch (error) {
      console.error(
        "START DELETE ERROR:",
        error
      );

      setErrorMessage(
        error.message ||
          "Unable to start account deletion."
      );
    }
  };

  // =====================================================
  // REAUTHENTICATE
  // =====================================================

  const handleReauthentication = async () => {
    if (deletingAccount) {
      return;
    }

    if (!password.trim()) {
      setErrorMessage(
        "Please enter your password."
      );

      return;
    }

    try {
      setDeletingAccount(true);
      setErrorMessage("");

      const auth = getAuth();

      const currentUser = auth.currentUser;

      // -----------------------------------------------
      // CHECK USER
      // -----------------------------------------------

      if (!currentUser) {
        throw new Error(
          "No logged-in account was found."
        );
      }

      console.log(
        "Re-authenticating Firebase user..."
      );

      // -----------------------------------------------
      // CREATE CREDENTIAL
      // -----------------------------------------------

      const credential =
        EmailAuthProvider.credential(
          currentUser.email,
          password
        );

      // -----------------------------------------------
      // REAUTHENTICATE
      // -----------------------------------------------

      await reauthenticateWithCredential(
        currentUser,
        credential
      );

      console.log(
        "Firebase re-authentication successful"
      );

      // -----------------------------------------------
      // REFRESH TOKEN
      // -----------------------------------------------

      await currentUser.getIdToken(
        true
      );

      console.log(
        "Firebase authentication refreshed"
      );

      // -----------------------------------------------
      // DELETE ACCOUNT
      // -----------------------------------------------

      await deleteAccount(
        currentUser
      );

    } catch (error) {
      console.error(
        "REAUTHENTICATION ERROR:",
        error
      );

      setDeletingAccount(false);

      if (
        error.code ===
        "auth/wrong-password"
      ) {
        setErrorMessage(
          "Incorrect password. Please try again."
        );

        return;
      }

      if (
        error.code ===
        "auth/invalid-credential"
      ) {
        setErrorMessage(
          "Incorrect password. Please try again."
        );

        return;
      }

      if (
        error.code ===
        "auth/too-many-requests"
      ) {
        setErrorMessage(
          "Too many attempts. Please try again later."
        );

        return;
      }

      setErrorMessage(
        error.message ||
          "Authentication failed."
      );
    }
  };

  // =====================================================
  // DELETE ACCOUNT
  // =====================================================

  const deleteAccount = async (
    currentUser
  ) => {
    try {
      setDeletingAccount(true);
      setErrorMessage("");

      const firebaseUid =
        currentUser.uid;

      console.log(
        "Deleting Firebase account..."
      );

      // =================================================
      // DELETE FIREBASE ACCOUNT FIRST
      // =================================================

      await deleteUser(
        currentUser
      );

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

      let data = {};

      try {
        data = await response.json();
      } catch {
        data = {};
      }

      console.log(
        "MongoDB delete response:",
        response.status,
        data
      );

      // -----------------------------------------------
      // 404 IS ACCEPTED
      // -----------------------------------------------
      //
      // Firebase is already deleted.
      // If MongoDB user doesn't exist anymore,
      // account deletion is still complete.
      //

      if (
        !response.ok &&
        response.status !== 404
      ) {
        throw new Error(
          data.message ||
            "Failed to delete MongoDB account"
        );
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
      // SHOW SUCCESS MODAL
      // =================================================

      setPassword("");
      setShowPasswordModal(false);
      setShowDeleteConfirm(false);

      setDeletingAccount(false);

      setShowDeleteSuccess(true);

    } catch (error) {
      console.error(
        "DELETE ACCOUNT ERROR:",
        error
      );

      setDeletingAccount(false);

      // -----------------------------------------------
      // RECENT LOGIN REQUIRED
      // -----------------------------------------------

      if (
        error.code ===
        "auth/requires-recent-login"
      ) {
        setShowPasswordModal(false);

        setErrorMessage(
          "For security, please log out and log in again, then try deleting your account."
        );

        return;
      }

      // -----------------------------------------------
      // FIREBASE USER NOT FOUND
      // -----------------------------------------------

      if (
        error.code ===
        "auth/user-not-found"
      ) {
        setShowPasswordModal(false);
        setShowDeleteConfirm(false);
        setShowDeleteSuccess(true);

        return;
      }

      setErrorMessage(
        error.message ||
          "Failed to delete account."
      );
    }
  };

  // =====================================================
  // SUCCESS MODAL OK
  // =====================================================

  const handleSuccessOK = () => {
    setShowDeleteSuccess(false);

    navigate("/login", {
      replace: true,
    });
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

          <button
            type="button"
            className="security-button"
            onClick={() => {
              setErrorMessage(
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

          <button
            type="button"
            className="security-button"
            onClick={() => {
              setErrorMessage(
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
              openDeleteConfirmation
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
          ERROR MESSAGE
      ================================================= */}

      {errorMessage && (
        <div className="settings-message-overlay">

          <div className="settings-error-modal">

            <button
              className="settings-error-close"
              onClick={() =>
                setErrorMessage("")
              }
            >
              <X size={18} />
            </button>

            <div className="settings-error-icon">
              <AlertTriangle size={26} />
            </div>

            <h2>
              Something went wrong
            </h2>

            <p>
              {errorMessage}
            </p>

            <button
              className="settings-error-button"
              onClick={() =>
                setErrorMessage("")
              }
            >
              OK
            </button>

          </div>

        </div>
      )}

      {/* =================================================
          DELETE CONFIRMATION MODAL
      ================================================= */}

      {showDeleteConfirm && (
        <div className="delete-modal-overlay">

          <div className="delete-modal">

            <div className="delete-warning-icon">
              <AlertTriangle size={30} />
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

            <div className="delete-modal-actions">

              <button
                type="button"
                className="cancel-delete-button"
                onClick={
                  closeDeleteConfirmation
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
                  startDeleteProcess
                }
                disabled={
                  deletingAccount
                }
              >
                Yes, delete account
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          PASSWORD RE-AUTHENTICATION MODAL
      ================================================= */}

      {showPasswordModal && (
        <div className="delete-modal-overlay">

          <div className="password-modal">

            <button
              type="button"
              className="password-modal-close"
              onClick={() => {
                if (!deletingAccount) {
                  setShowPasswordModal(
                    false
                  );

                  setPassword("");
                  setErrorMessage("");
                }
              }}
              disabled={
                deletingAccount
              }
            >
              <X size={20} />
            </button>

            <div className="password-warning-icon">
              <Lock size={27} />
            </div>

            <h2>
              Confirm your identity
            </h2>

            <p>
              For security, enter your
              current password before
              deleting your account.
            </p>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(
                  event.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              disabled={
                deletingAccount
              }
              onKeyDown={(event) => {
                if (
                  event.key === "Enter"
                ) {
                  handleReauthentication();
                }
              }}
            />

            <div className="password-modal-actions">

              <button
                type="button"
                className="cancel-delete-button"
                onClick={() => {
                  setShowPasswordModal(
                    false
                  );

                  setPassword("");
                  setErrorMessage("");
                }}
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
                  handleReauthentication
                }
                disabled={
                  deletingAccount
                }
              >
                {deletingAccount
                  ? "Deleting..."
                  : "Confirm deletion"}
              </button>

            </div>

          </div>

        </div>
      )}

      {/* =================================================
          SUCCESS MODAL
      ================================================= */}

      {showDeleteSuccess && (
        <div className="success-modal-overlay">

          <div className="success-modal">

            <div className="success-icon">
              <CheckCircle size={42} />
            </div>

            <h2>
              Account Deleted
            </h2>

            <p>
              Your account has been
              permanently deleted.
            </p>

            <button
              type="button"
              className="success-ok-button"
              onClick={
                handleSuccessOK
              }
            >
              OK
            </button>

          </div>

        </div>
      )}

    </div>
  );
}