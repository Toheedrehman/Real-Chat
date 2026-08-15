import { useEffect, useState } from "react";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import { useAuth } from "../context/AuthContext";

const API_URL = "https://real-chat-5fxb.vercel.app";

export default function Chat() {
  const { user } = useAuth();

  const [selectedUser, setSelectedUser] =
    useState(null);

  const [pageLoading, setPageLoading] =
    useState(true);

  // ==========================================
  // INITIAL PAGE LOADING
  // ==========================================

  useEffect(() => {
    const timer = setTimeout(() => {
      setPageLoading(false);
    }, 700);

    return () => clearTimeout(timer);
  }, []);

  // ==========================================
  // ONLINE STATUS
  // ==========================================

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    const updateOnlineStatus = async (
      isOnline
    ) => {
      try {
        const response = await fetch(
          `${API_URL}/api/users/${user.uid}/status`,
          {
            method: "PUT",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              isOnline,
            }),
          }
        );

        const data =
          await response.json();

        console.log(
          `Online status (${isOnline}):`,
          response.status,
          data
        );
      } catch (error) {
        console.error(
          "Online status error:",
          error
        );
      }
    };

    // USER ONLINE
    updateOnlineStatus(true);

    // ========================================
    // USER LEAVES PAGE
    // ========================================

    const handleBeforeUnload = () => {
      fetch(
        `${API_URL}/api/users/${user.uid}/status`,
        {
          method: "PUT",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            isOnline: false,
          }),

          keepalive: true,
        }
      ).catch((error) => {
        console.error(
          "Offline status error:",
          error
        );
      });
    };

    window.addEventListener(
      "beforeunload",
      handleBeforeUnload
    );

    return () => {
      window.removeEventListener(
        "beforeunload",
        handleBeforeUnload
      );
    };
  }, [user?.uid]);

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
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
          />
        </aside>

        {/* ====================================
            CHAT WINDOW
        ==================================== */}

        <section className="chat-main">
          <ChatWindow
            currentUid={user?.uid}
            selectedUser={selectedUser}
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