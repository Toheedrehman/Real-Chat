import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { onAuthStateChanged } from "firebase/auth";

import { auth } from "../firebase/firebase";

const API_URL = "https://real-chat-5fxb.vercel.app";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [mongoUser, setMongoUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ==========================================
  // LOAD / CREATE MONGODB PROFILE
  // ==========================================

  const loadMongoProfile = async (firebaseUser) => {
    if (!firebaseUser?.uid) {
      setMongoUser(null);
      return;
    }

    try {
      console.log(
        "Loading MongoDB profile:",
        firebaseUser.uid
      );

      const response = await fetch(
        `${API_URL}/api/users/${firebaseUser.uid}`
      );

      const data = await response.json();

      console.log(
        "MongoDB profile response:",
        data
      );

      // ========================================
      // PROFILE FOUND
      // ========================================

      if (response.ok && data.user) {
        console.log(
          "MongoDB profile found:",
          data.user
        );

        setMongoUser(data.user);

        return;
      }

      // ========================================
      // PROFILE DOES NOT EXIST
      // CREATE PROFILE
      // ========================================

      if (response.status === 404) {
        console.log(
          "MongoDB profile does not exist. Creating..."
        );

        const registerResponse = await fetch(
          `${API_URL}/api/users/register`,
          {
            method: "POST",

            headers: {
              "Content-Type": "application/json",
            },

            body: JSON.stringify({
              firebaseUid: firebaseUser.uid,

              name:
                firebaseUser.displayName ||
                firebaseUser.email?.split("@")[0] ||
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

        if (!registerResponse.ok) {
          throw new Error(
            registerData.message ||
              "Could not create MongoDB profile"
          );
        }

        setMongoUser(
          registerData.user || null
        );

        return;
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
    }
  };

  // ==========================================
  // UPDATE MONGODB USER IN CONTEXT
  // ==========================================

  const updateMongoUser = (updatedUser) => {
    console.log(
      "Updating MongoDB user in AuthContext:",
      updatedUser
    );

    setMongoUser(updatedUser);
  };

  // ==========================================
  // FIREBASE AUTH LISTENER
  // ==========================================

  useEffect(() => {
    const unsubscribe =
      onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          console.log(
            "Firebase auth changed:",
            firebaseUser?.uid || null
          );

          setUser(firebaseUser);

          if (firebaseUser) {
            await loadMongoProfile(
              firebaseUser
            );
          } else {
            setMongoUser(null);
          }

          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // ==========================================
  // LOGOUT
  // ==========================================

  const logout = async () => {
    try {
      await auth.signOut();

      setUser(null);
      setMongoUser(null);
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  };

  // ==========================================
  // CONTEXT PROVIDER
  // ==========================================

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

// ==========================================
// useAuth
// ==========================================

export function useAuth() {
  return useContext(AuthContext);
}