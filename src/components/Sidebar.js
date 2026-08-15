import {
  LogOut,
  MessageCircle,
  Search,
  UserCircle,
  Settings,
} from "lucide-react";

import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

import Avatar from "./Avatar";

import { auth } from "../firebase/firebase";
import { useAuth } from "../context/AuthContext";

import {
  useUserSearch,
  useUsers,
} from "../hooks/useUsers";

export default function Sidebar({
  selectedUser,
  onSelectUser,
}) {
  const {
    user,
    mongoUser,
  } = useAuth();

  const {
    users,
    loading,
  } = useUsers(user?.uid);

  const [search, setSearch] =
    useState("");

  const navigate = useNavigate();

  // ==========================================
  // SEARCH USERS
  // ==========================================

  const filteredUsers =
    useUserSearch(
      users,
      search
    );

  // ==========================================
  // CURRENT USER
  // ==========================================

  const current = mongoUser || {
    name:
      user?.displayName ||
      user?.email ||
      "User",

    email:
      user?.email || "",

    photoURL:
      user?.photoURL || "",

    profileImage:
      "",
  };

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      await signOut(auth);

      navigate("/login");
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <aside className="sidebar">

      {/* ======================================
          HEADER
      ====================================== */}

      <div className="sidebar-top">

        <div className="brand">

          <div className="brand-icon">
            <MessageCircle size={21} />
          </div>

          <div>
            <strong>
              ChatApp
            </strong>

            <span>
              Real-time messaging
            </span>
          </div>

        </div>

        {/* PROFILE + SETTINGS */}

        <div className="sidebar-actions">

          <button
            type="button"
            className="icon-button"
            title="Profile"
            onClick={() =>
              navigate("/profile")
            }
          >
            <UserCircle size={21} />
          </button>

          <button
            type="button"
            className="icon-button"
            title="Settings"
            onClick={() =>
              navigate("/settings")
            }
          >
            <Settings size={21} />
          </button>

        </div>

      </div>

      {/* ======================================
          CURRENT USER
      ====================================== */}

      <div className="current-user">

        <div className="avatar-wrap">

          <Avatar user={current} />

          <span className="status-dot" />

        </div>

        <div className="current-user-info">

          <strong>
            {current.name || "User"}
          </strong>

          <span className="online-text">
            <i />
            Online
          </span>

        </div>

      </div>

      {/* ======================================
          SEARCH
      ====================================== */}

      <div className="search-box">

        <Search size={18} />

        <input
          type="text"
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search friends..."
        />

      </div>

      {/* ======================================
          FRIENDS TITLE
      ====================================== */}

      <div className="section-title">
        FRIENDS
      </div>

      {/* ======================================
          FRIEND LIST
      ====================================== */}

      <div className="user-list">

        {loading ? (

          <div className="empty-list">
            Loading friends...
          </div>

        ) : filteredUsers.length === 0 ? (

          <div className="empty-list">
            No friends found.
          </div>

        ) : (

          filteredUsers.map((item) => {

            const userId =
              item.firebaseUid ||
              item._id;

            const isSelected =
              selectedUser?.firebaseUid ===
              item.firebaseUid;

            return (
              <button
                key={userId}
                type="button"
                className={`user-item ${
                  isSelected
                    ? "selected"
                    : ""
                }`}
                onClick={() =>
                  onSelectUser(item)
                }
              >

                {/* AVATAR */}

                <div className="avatar-wrap">

                  <Avatar user={item} />

                  {item.isOnline && (
                    <span className="status-dot" />
                  )}

                </div>

                {/* USER INFORMATION */}

                <div className="user-item-content">

                  <div className="user-item-row">

                    <strong>
                      {item.name ||
                        "User"}
                    </strong>

                    <small>
                      {item.isOnline
                        ? "Online"
                        : "Offline"}
                    </small>

                  </div>

                  <span>

                    {item.isOnline ? (
                      "Active now"
                    ) : item.lastSeen ? (
                      `Last seen ${formatLastSeen(
                        item.lastSeen
                      )}`
                    ) : (
                      item.email
                    )}

                  </span>

                </div>

              </button>
            );
          })

        )}

      </div>

      {/* ======================================
          LOGOUT
      ====================================== */}

      <button
        type="button"
        className="logout-button"
        onClick={logout}
      >
        <LogOut size={18} />
        Logout
      </button>

    </aside>
  );
}

// ==========================================
// LAST SEEN FORMATTER
// ==========================================

function formatLastSeen(lastSeen) {
  try {
    let date;

    // MongoDB Date / ISO string
    if (
      typeof lastSeen === "string" ||
      lastSeen instanceof Date
    ) {
      date = new Date(lastSeen);
    }

    // Firestore timestamp
    else if (
      lastSeen?.seconds
    ) {
      date = new Date(
        lastSeen.seconds * 1000
      );
    }

    // MongoDB serialized object
    else if (
      lastSeen?.$date
    ) {
      date = new Date(
        lastSeen.$date
      );
    }

    if (
      !date ||
      Number.isNaN(
        date.getTime()
      )
    ) {
      return "recently";
    }

    return date.toLocaleString();

  } catch (error) {
    return "recently";
  }
}