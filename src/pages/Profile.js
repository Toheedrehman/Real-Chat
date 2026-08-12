import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { doc, updateDoc } from "firebase/firestore";
import { ArrowLeft } from "lucide-react";
import Avatar from "../components/Avatar";
import { useAuth } from "../context/AuthContext";
import { db } from "../firebase/firebase";

export default function Profile() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState(profile?.name || "");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;

    try {
      setSaving(true);
      await updateDoc(doc(db, "users", user.uid), {
        name: name.trim(),
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-card">
        <button className="back-button" onClick={() => navigate("/chat")}>
          <ArrowLeft size={19} /> Back to chat
        </button>

        <div className="profile-avatar">
          <Avatar user={profile || user} size="large" />
        </div>

        <h1>My Profile</h1>
        <p>{user.email}</p>

        <form onSubmit={save} className="auth-form">
          <label>Display name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} />
          <button className="primary-button" disabled={saving}>
            {saving ? "Saving..." : "Save changes"}
          </button>
        </form>

        {message && <div className="success-box">{message}</div>}
      </div>
    </div>
  );
}
