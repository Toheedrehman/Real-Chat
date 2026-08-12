import {
  LogOut,
  MessageCircle,
  Search,
  UserCircle,
  Settings,
} from "lucide-react";

import {
  signOut,
} from "firebase/auth";

import {
  useNavigate,
} from "react-router-dom";

import Avatar from "./Avatar";

import {
  auth,
} from "../firebase/firebase";

import {
  useAuth,
} from "../context/AuthContext";

import {
  useUserSearch,
  useUsers,
} from "../hooks/useUsers";

import {
  useState,
} from "react";

export default function Sidebar({
  selectedUser,
  onSelectUser,
}) {
  const {
    user,
    profile,
  } = useAuth();

  const {
    users,
    loading,
  } = useUsers(user?.uid);

  const [search, setSearch] = useState("");

  const navigate = useNavigate();

  const filteredUsers =
    useUserSearch(
      users,
      search
    );

  const current =
    profile || {
      name:
        user?.displayName ||
        user?.email,
      email: user?.email,
      photoURL:
        user?.photoURL || "",
    };

  const logout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <aside className="sidebar">

      {/* HEADER */}
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
            className="icon-button"
            title="Profile"
            onClick={() =>
              navigate("/profile")
            }
          >
            <UserCircle size={21} />
          </button>

          <button
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


      {/* CURRENT USER */}
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


      {/* SEARCH */}
      <div className="search-box">

        <Search size={18} />

        <input
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
          placeholder="Search friends..."
        />

      </div>


      <div className="section-title">
        FRIENDS
      </div>


      {/* FRIEND LIST */}
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

          filteredUsers.map((item) => (

            <button
              key={item.id}
              className={`user-item ${
                selectedUser?.id === item.id
                  ? "selected"
                  : ""
              }`}
              onClick={() =>
                onSelectUser(item)
              }
            >

              <div className="avatar-wrap">

                <Avatar user={item} />

                {item.isOnline && (
                  <span className="status-dot" />
                )}

              </div>


              <div className="user-item-content">

                <div className="user-item-row">

                  <strong>
                    {item.name || "User"}
                  </strong>

                  <small>
                    {item.isOnline
                      ? "Online"
                      : "Offline"}
                  </small>

                </div>


                <span>

                  {item.isOnline
                    ? "Active now"
                    : item.lastSeen
                    ? `Last seen ${new Date(
                        item.lastSeen.seconds * 1000
                      ).toLocaleString()}`
                    : item.email}

                </span>

              </div>

            </button>

          ))

        )}

      </div>


      {/* LOGOUT */}
      <button
        className="logout-button"
        onClick={logout}
      >
        <LogOut size={18} />
        Logout
      </button>

    </aside>
  );
}