import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";

import { MessageCircle } from "lucide-react";

import { auth } from "../firebase/firebase";

import "./Register.css";

const API_URL = "https://real-chat-5fxb.vercel.app";

export default function Register() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  // ==========================================
  // INPUT CHANGE
  // ==========================================

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  // ==========================================
  // REGISTER
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (!form.name.trim()) {
      setError("Please enter your name.");
      return;
    }

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (form.password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }

    try {
      setLoading(true);

      // ========================================
      // CREATE FIREBASE USER
      // ========================================

      const credential =
        await createUserWithEmailAndPassword(
          auth,
          form.email.trim(),
          form.password
        );

      const firebaseUser =
        credential.user;

      // ========================================
      // UPDATE FIREBASE DISPLAY NAME
      // ========================================

      await updateProfile(
        firebaseUser,
        {
          displayName:
            form.name.trim(),
        }
      );

      // ========================================
      // CREATE MONGODB PROFILE
      // ========================================

      try {
        const response = await fetch(
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
                form.name.trim(),

              email:
                form.email.trim(),
            }),
          }
        );

        const data =
          await response.json();

        console.log(
          "MongoDB registration:",
          data
        );

        if (!response.ok) {
          console.error(
            "MongoDB registration failed:",
            data
          );
        }
      } catch (mongoError) {
        console.error(
          "MongoDB registration error:",
          mongoError
        );
      }

      // ========================================
      // GO TO CHAT
      // ========================================

      navigate("/chat");

    } catch (error) {
      console.error(
        "Registration error:",
        error
      );

      if (
        error.code ===
        "auth/email-already-in-use"
      ) {
        setError(
          "This email is already registered."
        );
      } else if (
        error.code ===
        "auth/invalid-email"
      ) {
        setError(
          "Please enter a valid email address."
        );
      } else if (
        error.code ===
        "auth/weak-password"
      ) {
        setError(
          "Password is too weak."
        );
      } else {
        setError(
          error.message ||
            "Registration failed."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // UI
  // ==========================================

  return (
    <div className="register-page">

      {/* ======================================
          LEFT / BRAND SECTION
      ====================================== */}

      <div className="register-brand">

        <div className="brand-content">

          <div className="brand-logo">
            <MessageCircle
              size={30}
              strokeWidth={2.5}
            />
          </div>

          <h1>
            ChatApp
          </h1>

          <p>
            Connect, chat and stay
            connected with your friends.
          </p>

          <div className="brand-decoration">
            <span />
            <span />
            <span />
          </div>

        </div>

      </div>

      {/* ======================================
          REGISTER FORM
      ====================================== */}

      <div className="register-container">

        <div className="register-card">

          <div className="register-header">

            <div className="mobile-logo">
              <MessageCircle
                size={25}
              />
            </div>

            <h2>
              Create Account
            </h2>

            <p>
              Register to start chatting
            </p>

          </div>

          {/* ERROR */}

          {error && (
            <div className="register-error">
              {error}
            </div>
          )}

          {/* FORM */}

          <form
            onSubmit={handleSubmit}
            className="register-form"
          >

            {/* NAME */}

            <div className="form-group">

              <label htmlFor="name">
                Name
              </label>

              <input
                id="name"
                name="name"
                type="text"
                value={form.name}
                onChange={handleChange}
                placeholder="Enter your name"
                autoComplete="name"
                disabled={loading}
              />

            </div>

            {/* EMAIL */}

            <div className="form-group">

              <label htmlFor="email">
                Email
              </label>

              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="Enter your email"
                autoComplete="email"
                disabled={loading}
              />

            </div>

            {/* PASSWORD */}

            <div className="form-group">

              <label htmlFor="password">
                Password
              </label>

              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Enter your password"
                autoComplete="new-password"
                disabled={loading}
              />

            </div>

            {/* BUTTON */}

            <button
              type="submit"
              className="register-button"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="button-spinner" />
                  Creating Account...
                </>
              ) : (
                "Create Account"
              )}
            </button>

          </form>

          {/* LOGIN */}

          <div className="login-link">

            <span>
              Already have an account?
            </span>

            <Link to="/login">
              Login
            </Link>

          </div>

        </div>

      </div>

    </div>
  );
}