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
} from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const navigate = useNavigate();

  // =========================
  // LOAD SAVED SETTINGS
  // =========================

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("appearance") === "dark"
  );

  const [notifications, setNotifications] = useState(
    localStorage.getItem("notifications") !== "off"
  );

  const [showOnlineStatus, setShowOnlineStatus] = useState(
    localStorage.getItem("showOnlineStatus") !== "off"
  );

  // =========================
  // APPLY DARK MODE
  // =========================

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");

      localStorage.setItem("appearance", "dark");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");

      localStorage.setItem("appearance", "light");
    }
  }, [darkMode]);

  // =========================
  // NOTIFICATIONS
  // =========================

  const handleNotifications = () => {
    const newValue = !notifications;

    setNotifications(newValue);

    localStorage.setItem(
      "notifications",
      newValue ? "on" : "off"
    );
  };

  // =========================
  // ONLINE STATUS
  // =========================

  const handleOnlineStatus = () => {
    const newValue = !showOnlineStatus;

    setShowOnlineStatus(newValue);

    localStorage.setItem(
      "showOnlineStatus",
      newValue ? "on" : "off"
    );
  };

  // =========================
  // LIGHT MODE
  // =========================

  const enableLightMode = () => {
    setDarkMode(false);
  };

  // =========================
  // DARK MODE
  // =========================

  const enableDarkMode = () => {
    setDarkMode(true);
  };

  return (
    <div className="settings-page">

      {/* =========================
          HEADER
      ========================= */}

      <div className="settings-header">

        <button
          className="settings-back"
          onClick={() => navigate("/chat")}
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

        {/* =========================
            APPEARANCE
        ========================= */}

        <section className="setting-section">

          <div className="setting-heading">

            <div className="setting-icon">
              <Palette size={21} />
            </div>

            <div>
              <strong>Appearance</strong>

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
                !darkMode ? "selected" : ""
              }`}
              onClick={enableLightMode}
            >
              {!darkMode && <span />}
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
                darkMode ? "selected" : ""
              }`}
              onClick={enableDarkMode}
            >
              {darkMode && <span />}
            </button>

          </div>

        </section>


        {/* =========================
            NOTIFICATIONS
        ========================= */}

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
                  Receive notifications for new
                  messages
                </span>
              </div>

            </div>


            <button
              type="button"
              className={`toggle ${
                notifications ? "active" : ""
              }`}
              onClick={handleNotifications}
            >
              <span />
            </button>

          </div>

        </section>


        {/* =========================
            PRIVACY
        ========================= */}

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
                  Allow friends to see when you
                  are online
                </span>
              </div>

            </div>


            <button
              type="button"
              className={`toggle ${
                showOnlineStatus ? "active" : ""
              }`}
              onClick={handleOnlineStatus}
            >
              <span />
            </button>

          </div>

        </section>


        {/* =========================
            SECURITY
        ========================= */}

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


        {/* =========================
            ACCOUNT
        ========================= */}

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


          <button
            type="button"
            className="settings-action-button"
            onClick={() => navigate("/profile")}
          >
            <User size={18} />
            Edit profile
          </button>

        </section>

      </div>

    </div>
  );
}