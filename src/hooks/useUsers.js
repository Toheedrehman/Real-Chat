import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export function useUsers(currentUid) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const usersRef = collection(db, "users");

    const q = query(
      usersRef,
      orderBy("name")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs
          .map((item) => ({
            id: item.id,
            ...item.data(),
          }))
          .filter(
            (item) => item.id !== currentUid
          );

        setUsers(data);
        setLoading(false);
      },
      (error) => {
        console.error(
          "Users error:",
          error
        );
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUid]);

  return {
    users,
    loading,
  };
}

export function useUserSearch(users, search) {
  return useMemo(() => {
    const value = search
      .trim()
      .toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      const name =
        user.name?.toLowerCase() || "";

      const email =
        user.email?.toLowerCase() || "";

      return (
        name.includes(value) ||
        email.includes(value)
      );
    });
  }, [users, search]);
}