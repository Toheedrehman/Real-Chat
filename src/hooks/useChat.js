import {
  useCallback,
  useEffect,
  useState,
} from "react";

import socket from "../socket";

// =====================================================
// BACKEND API
// =====================================================

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://real-chat-5fxb.vercel.app";

// =====================================================
// CHAT ID
// =====================================================

function getChatId(uid1, uid2) {
  return [uid1, uid2]
    .sort()
    .join("_");
}

// =====================================================
// USE CHAT
// =====================================================

export function useChat(
  currentUid,
  selectedUser
) {
  const [messages, setMessages] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [sending, setSending] =
    useState(false);

  // ===================================================
  // OTHER USER
  // ===================================================

  const otherUid =
    selectedUser?.firebaseUid ||
    selectedUser?.id ||
    null;

  // ===================================================
  // CHAT ID
  // ===================================================

  const chatId =
    currentUid && otherUid
      ? getChatId(
          currentUid,
          otherUid
        )
      : null;

  // ===================================================
  // ADD MESSAGE
  // ===================================================

  const addMessage = useCallback(
    (newMessage) => {
      if (!newMessage) {
        return;
      }

      setMessages((previous) => {
        const newId =
          newMessage._id ||
          newMessage.id;

        // Prevent duplicate message
        if (newId) {
          const exists =
            previous.some(
              (message) => {
                const messageId =
                  message._id ||
                  message.id;

                return (
                  messageId &&
                  messageId === newId
                );
              }
            );

          if (exists) {
            return previous;
          }
        }

        return [
          ...previous,
          newMessage,
        ];
      });
    },
    []
  );

  // ===================================================
  // FETCH OLD MESSAGES
  // ===================================================

  const fetchMessages =
    useCallback(async () => {
      if (!chatId) {
        setMessages([]);
        return;
      }

      try {
        setLoading(true);

        const response =
          await fetch(
            `${API_URL}/api/messages/${chatId}`
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Server error: ${response.status}`
          );
        }

        setMessages(
          data.messages || []
        );

      } catch (error) {
        console.error(
          "❌ Message loading error:",
          error
        );

        setMessages([]);

      } finally {
        setLoading(false);
      }
    }, [chatId]);

  // ===================================================
  // LOAD MESSAGES WHEN CHAT CHANGES
  // ===================================================

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  // ===================================================
  // SOCKET CONNECTION + CHAT ROOM
  // ===================================================

  useEffect(() => {
    if (!chatId) {
      return;
    }

    let joined = false;

    const joinRoom = () => {
      if (!socket.connected) {
        return;
      }

      socket.emit(
        "joinChat",
        chatId
      );

      joined = true;

      console.log(
        "💬 Joined chat room:",
        chatId
      );
    };

    // If already connected
    if (socket.connected) {
      joinRoom();
    } else {
      // Connect socket
      socket.connect();
    }

    // IMPORTANT:
    // Join room AFTER connection
    socket.on(
      "connect",
      joinRoom
    );

    return () => {
      socket.off(
        "connect",
        joinRoom
      );

      if (
        joined &&
        socket.connected
      ) {
        socket.emit(
          "leaveChat",
          chatId
        );

        console.log(
          "🚪 Left chat room:",
          chatId
        );
      }
    };
  }, [chatId]);

  // ===================================================
  // RECEIVE NEW MESSAGE
  // ===================================================

  useEffect(() => {
    if (!chatId) {
      return;
    }

    const handleNewMessage =
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        console.log(
          "📨 Socket new message:",
          newMessage
        );

        // Make sure message belongs
        // to currently opened chat
        if (
          String(
            newMessage.chatId
          ) !== String(chatId)
        ) {
          return;
        }

        addMessage(
          newMessage
        );
      };

    socket.on(
      "newMessage",
      handleNewMessage
    );

    return () => {
      socket.off(
        "newMessage",
        handleNewMessage
      );
    };
  }, [
    chatId,
    addMessage,
  ]);

  // ===================================================
  // SEND TEXT MESSAGE
  // ===================================================

  const sendMessage =
    useCallback(
      async (text) => {
        if (
          !currentUid ||
          !otherUid ||
          !chatId ||
          !text ||
          !text.trim()
        ) {
          return;
        }

        try {
          setSending(true);

          const response =
            await fetch(
              `${API_URL}/api/messages`,
              {
                method: "POST",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  chatId,
                  senderId:
                    currentUid,
                  receiverId:
                    otherUid,
                  text:
                    text.trim(),
                  type: "text",
                }),
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
          }

          // Add locally
          // Socket duplicate is prevented
          addMessage(
            data.message
          );

        } catch (error) {
          console.error(
            "❌ Send message error:",
            error
          );

          alert(
            `Message could not be sent: ${error.message}`
          );

        } finally {
          setSending(false);
        }
      },
      [
        currentUid,
        otherUid,
        chatId,
        addMessage,
      ]
    );

  // ===================================================
  // SEND IMAGE
  // ===================================================

  const sendImage =
    useCallback(
      async (file) => {
        if (
          !currentUid ||
          !otherUid ||
          !chatId ||
          !file
        ) {
          return;
        }

        if (
          !file.type.startsWith(
            "image/"
          )
        ) {
          alert(
            "Please select a valid image."
          );
          return;
        }

        if (
          file.size >
          5 * 1024 * 1024
        ) {
          alert(
            "Image must be less than 5 MB."
          );
          return;
        }

        try {
          setSending(true);

          const formData =
            new FormData();

          formData.append(
            "image",
            file
          );

          formData.append(
            "chatId",
            chatId
          );

          formData.append(
            "senderId",
            currentUid
          );

          formData.append(
            "receiverId",
            otherUid
          );

          const response =
            await fetch(
              `${API_URL}/api/messages/image`,
              {
                method: "POST",
                body: formData,
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
          }

          addMessage(
            data.message
          );

        } catch (error) {
          console.error(
            "❌ Image upload error:",
            error
          );

          alert(
            `Could not send picture:\n${error.message}`
          );

        } finally {
          setSending(false);
        }
      },
      [
        currentUid,
        otherUid,
        chatId,
        addMessage,
      ]
    );

  // ===================================================
  // SEND FILE
  // ===================================================

  const sendFile =
    useCallback(
      async (file) => {
        if (
          !currentUid ||
          !otherUid ||
          !chatId ||
          !file
        ) {
          return;
        }

        if (
          file.size >
          25 * 1024 * 1024
        ) {
          alert(
            "File must be less than 25 MB."
          );
          return;
        }

        try {
          setSending(true);

          const formData =
            new FormData();

          formData.append(
            "file",
            file
          );

          formData.append(
            "chatId",
            chatId
          );

          formData.append(
            "senderId",
            currentUid
          );

          formData.append(
            "receiverId",
            otherUid
          );

          const response =
            await fetch(
              `${API_URL}/api/messages/file`,
              {
                method: "POST",
                body: formData,
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
          }

          addMessage(
            data.message
          );

        } catch (error) {
          console.error(
            "❌ File upload error:",
            error
          );

          alert(
            `Could not send document:\n${error.message}`
          );

        } finally {
          setSending(false);
        }
      },
      [
        currentUid,
        otherUid,
        chatId,
        addMessage,
      ]
    );

  // ===================================================
  // SEND AUDIO
  // ===================================================

  const sendAudio =
    useCallback(
      async (audioBlob) => {
        if (
          !currentUid ||
          !otherUid ||
          !chatId ||
          !audioBlob
        ) {
          return;
        }

        try {
          setSending(true);

          const mimeType =
            audioBlob.type ||
            "audio/webm";

          let extension =
            "webm";

          if (
            mimeType.includes("mp4")
          ) {
            extension = "m4a";
          } else if (
            mimeType.includes("ogg")
          ) {
            extension = "ogg";
          } else if (
            mimeType.includes("mpeg")
          ) {
            extension = "mp3";
          }

          const audioFile =
            new File(
              [audioBlob],
              `voice-${Date.now()}.${extension}`,
              {
                type: mimeType,
              }
            );

          if (
            audioFile.size >
            25 * 1024 * 1024
          ) {
            alert(
              "Voice message must be less than 25 MB."
            );
            return;
          }

          const formData =
            new FormData();

          formData.append(
            "audio",
            audioFile
          );

          formData.append(
            "chatId",
            chatId
          );

          formData.append(
            "senderId",
            currentUid
          );

          formData.append(
            "receiverId",
            otherUid
          );

          const response =
            await fetch(
              `${API_URL}/api/messages/audio`,
              {
                method: "POST",
                body: formData,
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
          }

          addMessage(
            data.message
          );

        } catch (error) {
          console.error(
            "❌ Audio upload error:",
            error
          );

          alert(
            `Could not send voice message:\n${error.message}`
          );

        } finally {
          setSending(false);
        }
      },
      [
        currentUid,
        otherUid,
        chatId,
        addMessage,
      ]
    );

  // ===================================================
  // MARK MESSAGES SEEN
  // ===================================================

  const markMessagesSeen =
    useCallback(
      async () => {
        if (
          !chatId ||
          !currentUid
        ) {
          return;
        }

        try {
          const response =
            await fetch(
              `${API_URL}/api/messages/${chatId}/seen`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",
                },

                body: JSON.stringify({
                  currentUid,
                }),
              }
            );

          const data =
            await response.json();

          if (!response.ok) {
            throw new Error(
              data.error ||
                data.message ||
                `Server error: ${response.status}`
            );
          }

          // Update local messages
          setMessages(
            (previous) =>
              previous.map(
                (message) => {
                  if (
                    message.receiverId ===
                    currentUid
                  ) {
                    return {
                      ...message,
                      seen: true,
                    };
                  }

                  return message;
                }
              )
          );

          // Notify sender
          if (
            socket.connected
          ) {
            socket.emit(
              "messageSeen",
              {
                chatId,
                senderId:
                  otherUid,
                receiverId:
                  currentUid,
              }
            );
          }

          return data;

        } catch (error) {
          console.error(
            "❌ Mark seen error:",
            error
          );
        }
      },
      [
        chatId,
        currentUid,
        otherUid,
      ]
    );

  // ===================================================
  // RETURN
  // ===================================================

  return {
    messages,
    loading,
    sending,

    sendMessage,
    sendImage,
    sendFile,
    sendAudio,

    markMessagesSeen,
    fetchMessages,
  };
}