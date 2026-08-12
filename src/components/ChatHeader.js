import {
  Phone,
  Video,
  MoreVertical,
} from "lucide-react";

import Avatar from "./Avatar";

export default function ChatHeader({ user }) {
  const startVoiceCall = () => {
    alert(`Calling ${user.name || user.email}...`);
  };

  const startVideoCall = () => {
    alert(`Video calling ${user.name || user.email}...`);
  };

  const openMenu = () => {
    alert("Chat options");
  };

  return (
    <header className="chat-header">
      <div className="chat-person">
        <div className="avatar-wrap">
          <Avatar user={user} />

          {user.isOnline && (
            <span className="status-dot" />
          )}
        </div>

        <div>
          <h2>{user.name || "User"}</h2>

          <p>
            {user.isOnline
              ? "Online"
              : "Offline"}
          </p>
        </div>
      </div>

      <div className="chat-actions">
        <button
          className="icon-button"
          title="Voice call"
          onClick={startVoiceCall}
        >
          <Phone size={20} />
        </button>

        <button
          className="icon-button"
          title="Video call"
          onClick={startVideoCall}
        >
          <Video size={20} />
        </button>

        <button
          className="icon-button"
          title="More options"
          onClick={openMenu}
        >
          <MoreVertical size={20} />
        </button>
      </div>
    </header>
  );
}