import { useEffect, useState } from "react";

import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
  getDocs,
} from "firebase/firestore";

import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import {
  db,
  storage,
} from "../firebase/firebase";

function getChatId(uid1, uid2) {
  return [uid1, uid2].sort().join("_");
}

export function useChat(
  currentUid,
  selectedUser
) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const otherUid = selectedUser?.id;

  const chatId =
    currentUid && otherUid
      ? getChatId(currentUid, otherUid)
      : null;

  // REAL-TIME MESSAGES
  useEffect(() => {
    if (!chatId) {
      setMessages([]);
      return;
    }

    setLoading(true);

    const messagesRef = collection(
      db,
      "chats",
      chatId,
      "messages"
    );

    const q = query(
      messagesRef,
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(
          (item) => ({
            id: item.id,
            ...item.data(),
          })
        );

        setMessages(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Message listener error:",
          error
        );

        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [chatId]);

  // SEND TEXT
  const sendMessage = async (text) => {
    if (!currentUid || !otherUid) {
      return;
    }

    if (!text.trim()) {
      return;
    }

    try {
      setSending(true);

      await addDoc(
        collection(
          db,
          "chats",
          chatId,
          "messages"
        ),
        {
          senderId: currentUid,
          receiverId: otherUid,
          text: text.trim(),
          type: "text",
          seen: false,
          createdAt: serverTimestamp(),
        }
      );
    } catch (error) {
      console.error(
        "Send message error:",
        error
      );

      alert("Message could not be sent.");
    } finally {
      setSending(false);
    }
  };

  // SEND IMAGE
  const sendImage = async (file) => {
    if (!currentUid || !otherUid) {
      return;
    }

    if (!file) {
      return;
    }

    try {
      setSending(true);

      const fileName =
        `${Date.now()}-${file.name}`;

      const imageRef = ref(
        storage,
        `chat-images/${chatId}/${fileName}`
      );

      await uploadBytes(
        imageRef,
        file
      );

      const imageUrl =
        await getDownloadURL(imageRef);

      await addDoc(
        collection(
          db,
          "chats",
          chatId,
          "messages"
        ),
        {
          senderId: currentUid,
          receiverId: otherUid,
          text: "",
          type: "image",
          imageUrl,
          seen: false,
          createdAt: serverTimestamp(),
        }
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
  };

  // MARK MESSAGES SEEN
  const markMessagesSeen = async () => {
    if (!chatId || !currentUid) {
      return;
    }

    const messagesRef = collection(
      db,
      "chats",
      chatId,
      "messages"
    );

    const q = query(
      messagesRef,
      where(
        "receiverId",
        "==",
        currentUid
      ),
      where(
        "seen",
        "==",
        false
      )
    );

    const snapshot =
      await getDocs(q);

    const updates =
      snapshot.docs.map((item) =>
        updateDoc(
          doc(
            db,
            "chats",
            chatId,
            "messages",
            item.id
          ),
          {
            seen: true,
          }
        )
      );

    await Promise.all(updates);
  };

  return {
    messages,
    loading,
    sending,
    sendMessage,
    sendImage,
    markMessagesSeen,
  };
}