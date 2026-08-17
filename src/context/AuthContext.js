import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  onAuthStateChanged,
  signOut,
} from "firebase/auth";

import { auth } from "../firebase/firebase";
import socket from "../socket";

const API_URL =
  "https://real-chat-5fxb.vercel.app";

const AuthContext =
  createContext(null);

export function AuthProvider({
  children,
}) {
  const [user, setUser] =
    useState(null);

  const [mongoUser, setMongoUser] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  // =====================================================
  // LOAD / CREATE MONGODB PROFILE
  // =====================================================

  const loadMongoProfile = async (
    firebaseUser
  ) => {
    if (!firebaseUser?.uid) {
      setMongoUser(null);
      return;
    }

    try {
      console.log(
        "Loading MongoDB profile:",
        firebaseUser.uid
      );

      // ================================================
      // GET PROFILE
      // ================================================

      const response = await fetch(
        `${API_URL}/api/users/${firebaseUser.uid}`
      );

      const data =
        await response.json();

      console.log(
        "MongoDB profile response:",
        data
      );

      // ================================================
      // PROFILE FOUND
      // ================================================

      if (
        response.ok &&
        data.success &&
        data.user
      ) {
        console.log(
          "MongoDB profile found:",
          data.user
        );

        setMongoUser(data.user);

        return data.user;
      }

      // ================================================
      // PROFILE DOES NOT EXIST
      // ================================================

      if (response.status === 404) {
        console.log(
          "MongoDB profile does not exist. Creating..."
        );

        const registerResponse =
          await fetch(
            `${API_URL}/api/users/register`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
              },

              body: JSON.stringify({
                firebaseUid:
                  firebaseUser.uid,

                name:
                  firebaseUser.displayName ||
                  firebaseUser.email?.split(
                    "@"
                  )[0] ||
                  "User",

                email:
                  firebaseUser.email || "",
              }),
            }
          );

        const registerData =
          await registerResponse.json();

        console.log(
          "MongoDB registration response:",
          registerData
        );

        if (
          registerResponse.ok &&
          registerData.success &&
          registerData.user
        ) {
          console.log(
            "MongoDB profile created/linked:",
            registerData.user
          );

          setMongoUser(
            registerData.user
          );

          return registerData.user;
        }

        throw new Error(
          registerData.message ||
            "Could not create MongoDB profile"
        );
      }

      throw new Error(
        data.message ||
          "Could not load MongoDB profile"
      );

    } catch (error) {
      console.error(
        "MongoDB profile error:",
        error
      );

      setMongoUser(null);

      return null;
    }
  };

  // =====================================================
  // UPDATE MONGODB USER
  // =====================================================

  const updateMongoUser = (
    updatedUser
  ) => {
    console.log(
      "Updating MongoDB user in AuthContext:",
      updatedUser
    );

    setMongoUser(updatedUser);
  };

  // =====================================================
  // FIREBASE AUTH + SOCKET.IO
  // =====================================================

  useEffect(() => {
    let mounted = true;

    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          console.log(
            "Firebase auth changed:",
            firebaseUser?.uid || null
          );

          // ============================================
          // LOGGED OUT
          // ============================================

          if (!firebaseUser) {
            if (socket.connected) {
              socket.emit(
                "userOffline"
              );

              socket.disconnect();
            }

            if (mounted) {
              setUser(null);
              setMongoUser(null);
              setLoading(false);
            }

            return;
          }

          // ============================================
          // LOGGED IN
          // ============================================

          if (mounted) {
            setUser(firebaseUser);
            setLoading(true);
          }

          // ============================================
          // MONGODB PROFILE
          // ============================================

          await loadMongoProfile(
            firebaseUser
          );

          // ============================================
          // SOCKET.IO
          // ============================================

          if (!socket.connected) {
            socket.connect();
          }

          socket.emit(
            "userOnline",
            firebaseUser.uid
          );

          console.log(
            "Socket.IO connected for user:",
            firebaseUser.uid
          );

          // ============================================
          // FINISH LOADING
          // ============================================

          if (mounted) {
            setLoading(false);
          }
        }
      );

    return () => {
      mounted = false;
      unsubscribe();
    };
  }, []);

  // =====================================================
  // LOGOUT
  // =====================================================

  const logout = async () => {
    try {
      console.log(
        "Logging out..."
      );

      // ==========================================
      // SOCKET OFFLINE
      // ==========================================

      if (socket.connected) {
        socket.emit(
          "userOffline"
        );

        socket.disconnect();
      }

      // ==========================================
      // FIREBASE LOGOUT
      // ==========================================

      await signOut(auth);

      console.log(
        "Logout successful"
      );

    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // =====================================================
  // PROVIDER
  // =====================================================

  return (
    <AuthContext.Provider
      value={{
        user,
        mongoUser,
        loading,
        logout,
        updateMongoUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// =====================================================
// useAuth
// =====================================================

export function useAuth() {
  return useContext(
    AuthContext
  );
}