import {
  Check,
  CheckCheck,
  Download,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

const API_URL = "https://real-chat-5fxb.vercel.app";

export default function Message({
  message,
}) {
  const { user } = useAuth();

  const mine =
    message.senderId === user?.uid;

  // ==========================================
  // MESSAGE TIME
  // ==========================================

  const getMessageTime = () => {
    if (!message.createdAt) {
      return "";
    }

    const date =
      message.createdAt?.toDate
        ? message.createdAt.toDate()
        : new Date(message.createdAt);

    if (isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // ==========================================
  // MEDIA URL
  // ==========================================

  const getMediaUrl = () => {
    if (!message.mediaUrl) {
      return "";
    }

    if (
      message.mediaUrl.startsWith("http://") ||
      message.mediaUrl.startsWith("https://")
    ) {
      return message.mediaUrl;
    }

    return `${API_URL}${message.mediaUrl}`;
  };

  const mediaUrl = getMediaUrl();

  // ==========================================
  // DOWNLOAD FILE
  // ==========================================

  const downloadFile = () => {
    if (!mediaUrl) {
      return;
    }

    const link =
      document.createElement("a");

    link.href = mediaUrl;
    link.download =
      message.fileName || "download";

    link.target = "_blank";

    document.body.appendChild(link);

    link.click();

    document.body.removeChild(link);
  };

  return (
    <div
      className={`message-row ${
        mine ? "mine" : "theirs"
      }`}
    >
      <div className="message-bubble">

        {/* ======================================
            TEXT MESSAGE
        ====================================== */}

        {message.type === "text" &&
          message.text && (
            <div className="message-text">
              {message.text}
            </div>
          )}

        {/* ======================================
            IMAGE MESSAGE
        ====================================== */}

        {message.type === "image" &&
          mediaUrl && (
            <div className="chat-image-wrapper">

              <img
                src={mediaUrl}
                alt={
                  message.fileName ||
                  "Sent image"
                }
                className="chat-image"
                onClick={() =>
                  window.open(
                    mediaUrl,
                    "_blank"
                  )
                }
                onError={(e) => {
                  console.error(
                    "Image failed to load:",
                    mediaUrl
                  );
                }}
              />

              <button
                type="button"
                className="media-download-button"
                onClick={downloadFile}
                title="Download image"
              >
                <Download size={16} />
              </button>

            </div>
          )}

        {/* ======================================
            FILE MESSAGE
        ====================================== */}

        {message.type === "file" &&
          mediaUrl && (
            <div className="file-message">

              <div>
                <strong>
                  {message.fileName ||
                    "File"}
                </strong>

                {message.fileSize > 0 && (
                  <small>
                    {" "}
                    {(
                      message.fileSize /
                      1024 /
                      1024
                    ).toFixed(2)}{" "}
                    MB
                  </small>
                )}
              </div>

              <button
                type="button"
                onClick={downloadFile}
                title="Download file"
              >
                <Download size={18} />
              </button>

            </div>
          )}

        {/* ======================================
            AUDIO MESSAGE
        ====================================== */}

        {message.type === "audio" &&
          mediaUrl && (
            <div className="audio-message">

              <audio
                controls
                src={mediaUrl}
              />

              <button
                type="button"
                onClick={downloadFile}
                title="Download audio"
              >
                <Download size={18} />
              </button>

            </div>
          )}

        {/* ======================================
            MESSAGE META
        ====================================== */}

        <div className="message-meta">

          <span>
            {getMessageTime()}
          </span>

          {mine &&
            (message.seen ? (
              <CheckCheck size={15} />
            ) : (
              <Check size={15} />
            ))}

        </div>

      </div>
    </div>
  );
}