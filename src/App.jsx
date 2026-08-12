import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";

import Login from "./pages/Login";
import Register from "./pages/Register";
import Chat from "./pages/Chat";
import Profile from "./pages/Profile";
import Settings from "./pages/Settings";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  useEffect(() => {
    const appearance = localStorage.getItem("appearance");

    if (appearance === "dark") {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
    } else {
      document.documentElement.classList.remove("dark-mode");
      document.body.classList.remove("dark-mode");
    }
  }, []);

  return (
    <Routes>

      {/* Home */}
      <Route
        path="/"
        element={<Navigate to="/chat" replace />}
      />

      {/* Authentication */}
      <Route
        path="/login"
        element={<Login />}
      />

      <Route
        path="/register"
        element={<Register />}
      />

      {/* Protected Pages */}
      <Route element={<ProtectedRoute />}>

        <Route
          path="/chat"
          element={<Chat />}
        />

        <Route
          path="/profile"
          element={<Profile />}
        />

        <Route
          path="/settings"
          element={<Settings />}
        />

      </Route>

      {/* Invalid URL */}
      <Route
        path="*"
        element={<Navigate to="/chat" replace />}
      />

    </Routes>
  );
}