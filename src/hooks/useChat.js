import {
  useCallback,
  useEffect,
  useState,
} from "react";

const API_URL = "https://real-chat-5fxb.vercel.app";

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
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

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
      ? getChatId(currentUid, otherUid)
      : null;

  // =====================================================
  // GET MESSAGES
  // =====================================================

  const fetchMessages = useCallback(async () => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(
        `${API_URL}/api/messages/${chatId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ||
            data.message ||
            `Server error: ${response.status}`
        );
      }

      setMessages(data.messages || []);
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
  }, [chatId, fetchMessages]);

  // =====================================================
  // ADD MESSAGE
  // =====================================================

  const addMessage = useCallback(
    (newMessage) => {
      if (!newMessage) {
        return;
      }

      setMessages((previous) => {
        const newId =
          newMessage._id ||
          newMessage.id;

        const exists = previous.some(
          (message) => {
            const messageId =
              message._id ||
              message.id;

            return (
              messageId &&
              newId &&
              messageId === newId
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
      });
    },
    []
  );

  // =====================================================
  // SEND TEXT
  // =====================================================

  const sendMessage = useCallback(
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

        const response = await fetch(
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

              text: text.trim(),

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

        addMessage(data.message);
      } catch (error) {
        console.error(
          "Send message error:",
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

  // =====================================================
  // SEND IMAGE
  // =====================================================

  const sendImage = useCallback(
    async (file) => {
      if (
        !currentUid ||
        !otherUid ||
        !chatId ||
        !file
      ) {
        return;
      }

      // Check image type
      if (
        !file.type.startsWith("image/")
      ) {
        alert(
          "Please select a valid image."
        );
        return;
      }

      // 5 MB frontend limit
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

        console.log(
          "Uploading image:",
          {
            name: file.name,
            type: file.type,
            size: file.size,
            chatId,
            senderId: currentUid,
            receiverId: otherUid,
          }
        );

        const response =
          await fetch(
            `${API_URL}/api/messages/image`,
            {
              method: "POST",
              body: formData,
            }
          );

        // Safely read response
        const data =
          await response.json();

        console.log(
          "Image upload response:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Server error: ${response.status}`
          );
        }

        if (!data.message) {
          throw new Error(
            "Server did not return the uploaded message."
          );
        }

        addMessage(data.message);

      } catch (error) {
        console.error(
          "IMAGE UPLOAD ERROR:",
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

  // =====================================================
  // SEND FILE / DOCUMENT
  // =====================================================

  const sendFile = useCallback(
    async (file) => {
      if (
        !currentUid ||
        !otherUid ||
        !chatId ||
        !file
      ) {
        return;
      }

      // 25 MB frontend limit
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

        console.log(
          "Uploading file:",
          {
            name: file.name,
            type: file.type,
            size: file.size,
            chatId,
            senderId: currentUid,
            receiverId: otherUid,
          }
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

        console.log(
          "File upload response:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Server error: ${response.status}`
          );
        }

        if (!data.message) {
          throw new Error(
            "Server did not return the uploaded file message."
          );
        }

        addMessage(data.message);

      } catch (error) {
        console.error(
          "FILE UPLOAD ERROR:",
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

  // =====================================================
  // SEND AUDIO
  // =====================================================

  const sendAudio = useCallback(
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

        let extension = "webm";

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

        // 25 MB limit
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

        formData.append(
          "type",
          "audio"
        );

        console.log(
          "Uploading audio:",
          {
            name: audioFile.name,
            type: audioFile.type,
            size: audioFile.size,
          }
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

        console.log(
          "Audio upload response:",
          response.status,
          data
        );

        if (!response.ok) {
          throw new Error(
            data.error ||
              data.message ||
              `Server error: ${response.status}`
          );
        }

        if (!data.message) {
          throw new Error(
            "Server did not return the audio message."
          );
        }

        addMessage(data.message);

      } catch (error) {
        console.error(
          "AUDIO UPLOAD ERROR:",
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
              data.error ||
                data.message ||
                `Server error: ${response.status}`
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