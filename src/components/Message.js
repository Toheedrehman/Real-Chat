import {
  Check,
  CheckCheck,
} from "lucide-react";

import {
  useAuth,
} from "../context/AuthContext";

export default function Message({
  message,
}) {
  const { user } =
    useAuth();

  const mine =
    message.senderId ===
    user?.uid;

  const time =
    message.createdAt?.toDate
      ? message.createdAt
          .toDate()
          .toLocaleTimeString(
            [],
            {
              hour: "2-digit",
              minute: "2-digit",
            }
          )
      : "";

  return (
    <div
      className={`message-row ${
        mine
          ? "mine"
          : "theirs"
      }`}
    >

      <div className="message-bubble">

        {message.type ===
          "image" &&
          message.imageUrl && (
            <img
              src={
                message.imageUrl
              }
              alt="Sent"
              className="chat-image"
            />
          )}

        {message.text && (
          <div className="message-text">
            {message.text}
          </div>
        )}

        <div className="message-meta">

          <span>
            {time}
          </span>

          {mine &&
            (message.seen ? (
              <CheckCheck
                size={15}
              />
            ) : (
              <Check
                size={15}
              />
            ))}

        </div>

      </div>

    </div>
  );
}