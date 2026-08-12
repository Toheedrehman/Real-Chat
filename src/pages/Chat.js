import { useEffect, useState } from "react";

import {
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";

import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";

import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";

export default function Chat() {
  const { user } = useAuth();

  const [selectedUser, setSelectedUser] =
    useState(null);

  // ONLINE STATUS
  useEffect(() => {
    if (!user?.uid) return;

    const userRef = doc(
      db,
      "users",
      user.uid
    );

    updateDoc(userRef, {
      isOnline: true,
      lastSeen: serverTimestamp(),
    }).catch(console.error);

    const handleBeforeUnload = () => {
      updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {});
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

      updateDoc(userRef, {
        isOnline: false,
        lastSeen: serverTimestamp(),
      }).catch(() => {});
    };
  }, [user?.uid]);

  return (
    <div className="chat-app">

      <Sidebar
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
      />

      <ChatWindow
        currentUid={user?.uid}
        selectedUser={selectedUser}
      />

    </div>
  );
}