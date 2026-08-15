import {
  useEffect,
  useRef,
} from "react";

import {
  ArrowLeft,
  MessageCircle,
} from "lucide-react";

import ChatHeader from "./ChatHeader";
import Message from "./Message";
import MessageInput from "./MessageInput";

import {
  useChat,
} from "../hooks/useChat";

export default function ChatWindow({
  currentUid,
  selectedUser,
  onBack,
}) {
  const messagesAreaRef =
    useRef(null);

  // Track whether user is near bottom
  const isNearBottomRef =
    useRef(true);

  // Track previous message count
  const previousMessageCountRef =
    useRef(0);

  const {
    messages,
    loading,
    sending,

    sendMessage,
    sendImage,
    sendFile,
    sendAudio,
    markMessagesSeen,
  } = useChat(
    currentUid,
    selectedUser
  );

  // ==========================================
  // CHECK SCROLL POSITION
  // ==========================================

  const handleScroll = () => {
    const area =
      messagesAreaRef.current;

    if (!area) {
      return;
    }

    const distanceFromBottom =
      area.scrollHeight -
      area.scrollTop -
      area.clientHeight;

    isNearBottomRef.current =
      distanceFromBottom < 100;
  };

  // ==========================================
  // SCROLL TO BOTTOM
  // ==========================================

  const scrollToBottom = (
    smooth = false
  ) => {
    const area =
      messagesAreaRef.current;

    if (!area) {
      return;
    }

    area.scrollTo({
      top: area.scrollHeight,
      behavior: smooth
        ? "smooth"
        : "auto",
    });
  };

  // ==========================================
  // CHAT CHANGED
  // ==========================================

  useEffect(() => {
    if (!selectedUser) {
      previousMessageCountRef.current =
        0;

      return;
    }

    previousMessageCountRef.current =
      0;

    isNearBottomRef.current =
      true;

    const timer = setTimeout(() => {
      scrollToBottom(false);

      previousMessageCountRef.current =
        messages.length;
    }, 100);

    return () => {
      clearTimeout(timer);
    };

    // Only when selected user changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUser]);

  // ==========================================
  // NEW MESSAGE
  // ==========================================

  useEffect(() => {
    if (loading) {
      return;
    }

    const oldCount =
      previousMessageCountRef.current;

    const newCount =
      messages.length;

    // Initial messages
    if (oldCount === 0) {
      previousMessageCountRef.current =
        newCount;

      return;
    }

    // New message
    if (newCount > oldCount) {
      if (isNearBottomRef.current) {
        setTimeout(() => {
          scrollToBottom(true);
        }, 30);
      }
    }

    previousMessageCountRef.current =
      newCount;
  }, [
    messages.length,
    loading,
  ]);

  // ==========================================
  // MARK MESSAGES SEEN
  // ==========================================

  useEffect(() => {
    if (!selectedUser) {
      return;
    }

    if (markMessagesSeen) {
      markMessagesSeen().catch(
        () => {}
      );
    }
  }, [
    selectedUser,
    markMessagesSeen,
  ]);

  // ==========================================
  // NO CHAT SELECTED
  // ==========================================

  if (!selectedUser) {
    return (
      <main className="empty-chat">

        <div className="empty-chat-icon">
          <MessageCircle
            size={45}
          />
        </div>

        <h2>
          Welcome to ChatApp
        </h2>

        <p>
          Select a friend to start
          chatting.
        </p>

      </main>
    );
  }

  // ==========================================
  // CHAT WINDOW
  // ==========================================

  return (
    <main className="chat-window">

      {/* =====================================
          MOBILE CHAT HEADER
      ===================================== */}

      <div className="mobile-chat-top">

        <button
          type="button"
          className="mobile-back-button"
          onClick={onBack}
          aria-label="Back to chats"
        >
          <ArrowLeft size={24} />
        </button>

        <div className="mobile-chat-header-content">
          <ChatHeader
            user={selectedUser}
          />
        </div>

      </div>

      {/* =====================================
          MESSAGES AREA
      ===================================== */}

      <div
        ref={messagesAreaRef}
        className="messages-area"
        onScroll={handleScroll}
      >

        {loading ? (

          <div className="messages-loading">
            Loading messages...
          </div>

        ) : messages.length === 0 ? (

          <div className="messages-empty">

            <MessageCircle
              size={35}
            />

            <p>
              No messages yet
            </p>

            <span>
              Send a message to
              start chatting.
            </span>

          </div>

        ) : (

          messages.map(
            (message) => (
              <Message
                key={
                  message._id ||
                  message.id
                }
                message={message}
              />
            )
          )

        )}

      </div>

      {/* =====================================
          MESSAGE INPUT
      ===================================== */}

      <MessageInput
        onSend={sendMessage}
        onSendImage={sendImage}
        onSendFile={sendFile}
        onSendAudio={sendAudio}
        disabled={sending}
      />

    </main>
  );
}