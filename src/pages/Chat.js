import {
  useEffect,
  useState,
} from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import { useAuth } from "../context/AuthContext";

export default function Chat() {
  const { user } = useAuth();

  const [
    selectedUser,
    setSelectedUser,
  ] = useState(null);

  const [
    pageLoading,
    setPageLoading,
  ] = useState(true);

  // ==========================================
  // INITIAL PAGE LOADING
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 700);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  // ==========================================
  // RENDER
  // ==========================================

  return (
    <div className="chat-page-wrapper">

      {/* ======================================
          CHAT APP
      ====================================== */}

      <div
        className={`chat-app ${
          pageLoading
            ? "chat-blurred"
            : ""
        } ${
          selectedUser
            ? "chat-selected"
            : "chat-not-selected"
        }`}
      >

        {/* ====================================
            SIDEBAR
        ==================================== */}

        <aside className="chat-sidebar">
          <Sidebar
            selectedUser={
              selectedUser
            }
            onSelectUser={
              setSelectedUser
            }
          />
        </aside>

        {/* ====================================
            CHAT WINDOW
        ==================================== */}

        <section className="chat-main">
          <ChatWindow
            currentUid={
              user?.uid
            }
            selectedUser={
              selectedUser
            }
            onBack={() =>
              setSelectedUser(null)
            }
          />
        </section>

      </div>

      {/* ======================================
          LOADING OVERLAY
      ====================================== */}

      {pageLoading && (
        <div className="chat-loading-overlay">

          <div className="chat-loader">

            <div className="loader-spinner"></div>

            <p>
              Loading chat...
            </p>

          </div>

        </div>
      )}

    </div>
  );
}