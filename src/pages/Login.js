import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";

import {
  MessageCircle,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
} from "lucide-react";

import { auth } from "../firebase/firebase";

import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] =
    useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [resetMode, setResetMode] =
    useState(false);

  // =====================================================
  // LOGIN
  // =====================================================

  const submit = async (event) => {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.email || !form.password) {
      setError(
        "Please enter your email and password."
      );
      return;
    }

    try {
      setLoading(true);

      await signInWithEmailAndPassword(
        auth,
        form.email.trim(),
        form.password
      );

      navigate("/chat");
    } catch (err) {
      console.error("LOGIN ERROR:", err);

      switch (err.code) {
        case "auth/invalid-credential":
        case "auth/wrong-password":
        case "auth/user-not-found":
          setError(
            "Invalid email or password."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many attempts. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            "Unable to sign in. Please try again."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORGOT PASSWORD
  // =====================================================

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!form.email.trim()) {
      setError(
        "Please enter your email address first."
      );
      return;
    }

    try {
      setLoading(true);

      await sendPasswordResetEmail(
        auth,
        form.email.trim()
      );

      setSuccess(
        "Password reset email sent. Please check your inbox."
      );
    } catch (err) {
      console.error(
        "PASSWORD RESET ERROR:",
        err
      );

      switch (err.code) {
        case "auth/user-not-found":
          setError(
            "No account exists with this email address."
          );
          break;

        case "auth/invalid-email":
          setError(
            "Please enter a valid email address."
          );
          break;

        case "auth/too-many-requests":
          setError(
            "Too many requests. Please try again later."
          );
          break;

        case "auth/network-request-failed":
          setError(
            "Network error. Please check your internet connection."
          );
          break;

        default:
          setError(
            "Unable to send password reset email."
          );
      }
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FORGOT PASSWORD SCREEN
  // =====================================================

  if (resetMode) {
    return (
      <div className="login-page">

        {/* LEFT BRAND */}

        <div className="login-brand">

          <div className="brand-content">

            <div className="brand-icon">
              <MessageCircle
                size={42}
                strokeWidth={2.5}
              />
            </div>

            <h1>ChatApp</h1>

            <p>
              Connect, chat and stay connected
              with your
              <br />
              friends.
            </p>

            <div className="brand-dots">
              <span></span>
              <span className="active"></span>
              <span></span>
            </div>

          </div>

        </div>

        {/* RIGHT RESET SECTION */}

        <div className="login-section">

          <div className="login-card">

            <button
              type="button"
              className="back-login-button"
              onClick={() => {
                setResetMode(false);
                setError("");
                setSuccess("");
              }}
            >
              <ArrowLeft size={18} />
              Back to Login
            </button>

            <div className="forgot-icon">
              <Mail size={32} />
            </div>

            <h2>Forgot Password?</h2>

            <p className="login-subtitle">
              Enter your email and we'll send you
              a password reset link.
            </p>

            {error && (
              <div className="login-error">
                {error}
              </div>
            )}

            {success && (
              <div className="login-success">
                {success}
              </div>
            )}

            <div className="login-form">

              <label>Email</label>

              <input
                type="email"
                placeholder="Enter your email"
                value={form.email}
                onChange={(e) =>
                  setForm({
                    ...form,
                    email: e.target.value,
                  })
                }
              />

              <button
                type="button"
                className="login-button"
                onClick={handleForgotPassword}
                disabled={loading}
              >
                {loading
                  ? "Sending..."
                  : "Send Reset Email"}
              </button>

            </div>

            <p className="login-footer">
              Remember your password?{" "}
              <button
                type="button"
                className="login-link-button"
                onClick={() => {
                  setResetMode(false);
                  setError("");
                  setSuccess("");
                }}
              >
                Sign In
              </button>
            </p>

          </div>

        </div>

      </div>
    );
  }

  // =====================================================
  // NORMAL LOGIN SCREEN
  // =====================================================

  return (
    <div className="login-page">

      {/* ==========================================
          LEFT BRAND SECTION
      ========================================== */}

      <div className="login-brand">

        <div className="brand-content">

          <div className="brand-icon">
            <MessageCircle
              size={42}
              strokeWidth={2.5}
            />
          </div>

          <h1>ChatApp</h1>

          <p>
            Connect, chat and stay connected with
            your
            <br />
            friends.
          </p>

          <div className="brand-dots">
            <span></span>
            <span className="active"></span>
            <span></span>
          </div>

        </div>

      </div>

      {/* ==========================================
          RIGHT LOGIN SECTION
      ========================================== */}

      <div className="login-section">

        <div className="login-card">

          <h2>Welcome Back</h2>

          <p className="login-subtitle">
            Sign in to continue chatting
          </p>

          {error && (
            <div className="login-error">
              {error}
            </div>
          )}

          {success && (
            <div className="login-success">
              {success}
            </div>
          )}

          <form
            onSubmit={submit}
            className="login-form"
          >

            {/* EMAIL */}

            <label>Email</label>

            <input
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={(e) =>
                setForm({
                  ...form,
                  email: e.target.value,
                })
              }
            />

            {/* PASSWORD */}

            <label>Password</label>

            <div className="login-password">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                placeholder="Enter your password"
                value={form.password}
                onChange={(e) =>
                  setForm({
                    ...form,
                    password: e.target.value,
                  })
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (value) => !value
                  )
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >
                {showPassword ? (
                  <EyeOff size={20} />
                ) : (
                  <Eye size={20} />
                )}
              </button>

            </div>

            {/* FORGOT PASSWORD */}

            <div className="forgot-password-row">

              <button
                type="button"
                className="forgot-password"
                onClick={() => {
                  setResetMode(true);
                  setError("");
                  setSuccess("");
                }}
              >
                Forgot password?
              </button>

            </div>

            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              {loading
                ? "Signing In..."
                : "Sign In"}
            </button>

          </form>

          {/* FOOTER */}

          <p className="login-footer">
            Don't have an account?{" "}
            <Link to="/register">
              Create one
            </Link>
          </p>

        </div>

      </div>

    </div>
  );
}