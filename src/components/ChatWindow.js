import {
  useEffect,
  useRef,
} from "react";

import {
  MessageCircle,
} from "lucide-react";

import Avatar from "./Avatar";
import ChatHeader from "./ChatHeader";
import Message from "./Message";
import MessageInput from "./MessageInput";

import {
  useChat,
} from "../hooks/useChat";

export default function ChatWindow({
  currentUid,
  selectedUser,
}) {
  const bottomRef = useRef(null);

  const {
    messages,
    loading,
    sending,
    sendMessage,
    sendImage,
    markMessagesSeen,
  } = useChat(
    currentUid,
    selectedUser
  );

  useEffect(() => {
    if (!selectedUser) return;

    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });

    markMessagesSeen?.().catch(
      () => {}
    );
  }, [
    messages,
    selectedUser,
    markMessagesSeen,
  ]);

  if (!selectedUser) {
    return (
      <main className="empty-chat">
        <div className="empty-chat-icon">
          <MessageCircle size={45} />
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

  return (
    <main className="chat-window">
      <ChatHeader
        user={selectedUser}
      />

      <div className="messages-area">
        {loading ? (
          <div className="messages-loading">
            Loading messages...
          </div>
        ) : messages.length === 0 ? (
          <div className="conversation-empty">
            <Avatar
              user={selectedUser}
              size="large"
            />

            <h3>
              Start a conversation
            </h3>

            <p>
              Send a message to{" "}
              {selectedUser.name ||
                "your friend"}.
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <Message
              key={message.id}
              message={message}
            />
          ))
        )}

        <div ref={bottomRef} />
      </div>

      <MessageInput
        onSend={sendMessage}
        onSendImage={sendImage}
        disabled={sending}
      />
    </main>
  );
}