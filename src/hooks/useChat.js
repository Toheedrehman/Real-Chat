import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL = "http://localhost:5000";

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

  // =====================================================
  // OTHER USER
  // =====================================================

  const otherUid =
    selectedUser?.firebaseUid ||
    selectedUser?.id ||
    null;

  // =====================================================
  // CHAT ID
  // =====================================================

  const chatId =
    currentUid && otherUid
      ? getChatId(
          currentUid,
          otherUid
        )
      : null;

  // =====================================================
  // GET MESSAGES
  // =====================================================

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
            data.message ||
              "Failed to load messages"
          );
        }

        setMessages(
          data.messages || []
        );
      } catch (error) {
        console.error(
          "Message loading error:",
          error
        );

        setMessages([]);
      } finally {
        setLoading(false);
      }
    }, [chatId]);

  // =====================================================
  // LOAD ONLY WHEN CHAT CHANGES
  // =====================================================

  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    fetchMessages();
  }, [
    chatId,
    fetchMessages,
  ]);

  // =====================================================
  // ADD MESSAGE
  // =====================================================

  const addMessage =
    useCallback(
      (newMessage) => {
        if (!newMessage) {
          return;
        }

        setMessages(
          (previous) => {
            const newId =
              newMessage._id ||
              newMessage.id;

            const exists =
              previous.some(
                (message) => {
                  const messageId =
                    message._id ||
                    message.id;

                  return (
                    messageId &&
                    newId &&
                    messageId ===
                      newId
                  );
                }
              );

            if (exists) {
              return previous;
            }

            return [
              ...previous,
              newMessage,
            ];
          }
        );
      },
      []
    );

  // =====================================================
  // SEND TEXT
  // =====================================================

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
              data.message ||
                "Message could not be sent"
            );
          }

          addMessage(
            data.message
          );
        } catch (error) {
          console.error(
            "Send message error:",
            error
          );

          alert(
            "Message could not be sent."
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

  // =====================================================
  // SEND IMAGE
  // =====================================================

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
            "Please select an image."
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

          formData.append(
            "type",
            "image"
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
              data.message ||
                "Could not send image"
            );
          }

          addMessage(
            data.message
          );
        } catch (error) {
          console.error(
            "Image error:",
            error
          );

          alert(
            "Could not send the picture."
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

  // =====================================================
  // SEND FILE
  // =====================================================

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

          formData.append(
            "type",
            "file"
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
              data.message ||
                "Could not send file"
            );
          }

          addMessage(
            data.message
          );
        } catch (error) {
          console.error(
            "File error:",
            error
          );

          alert(
            "Could not send the document."
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

  // =====================================================
  // SEND AUDIO
  // =====================================================

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
            mimeType.includes(
              "mp4"
            )
          ) {
            extension = "m4a";
          } else if (
            mimeType.includes(
              "ogg"
            )
          ) {
            extension = "ogg";
          } else if (
            mimeType.includes(
              "mpeg"
            )
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

          formData.append(
            "type",
            "audio"
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
              data.message ||
                "Could not send audio"
            );
          }

          addMessage(
            data.message
          );
        } catch (error) {
          console.error(
            "Audio error:",
            error
          );

          alert(
            "Could not send voice message."
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

  // =====================================================
  // MARK MESSAGES SEEN
  // =====================================================

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
              data.message ||
                "Failed to mark messages as seen"
            );
          }

          // Update local state
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

          return data;
        } catch (error) {
          console.error(
            "Mark seen error:",
            error
          );
        }
      },
      [
        chatId,
        currentUid,
      ]
    );

  // =====================================================
  // RETURN
  // =====================================================

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