import {
  useRef,
  useState,
} from "react";

import {
  Image,
  Send,
  Smile,
} from "lucide-react";

export default function MessageInput({
  onSend,
  onSendImage,
  disabled,
}) {
  const [text, setText] =
    useState("");

  const fileRef =
    useRef(null);

  const submit = async (e) => {
    e.preventDefault();

    if (
      disabled ||
      !text.trim()
    ) {
      return;
    }

    await onSend(
      text.trim()
    );

    setText("");
  };

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();
      submit(e);
    }
  };

  const handleImage = async (
    e
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select an image."
      );
      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image must be less than 5MB."
      );
      return;
    }

    await onSendImage(file);

    e.target.value = "";
  };

  return (
    <form
      className="message-input-wrap"
      onSubmit={submit}
    >

      <button
        type="button"
        className="input-icon"
        title="Emoji"
      >
        <Smile size={21} />
      </button>

      <input
        value={text}
        onChange={(e) =>
          setText(
            e.target.value
          )
        }
        onKeyDown={
          handleKeyDown
        }
        placeholder="Write a message..."
        disabled={disabled}
      />

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        hidden
        onChange={
          handleImage
        }
      />

      <button
        type="button"
        className="input-icon"
        title="Send picture"
        disabled={disabled}
        onClick={() =>
          fileRef.current?.click()
        }
      >
        <Image size={20} />
      </button>

      <button
        type="submit"
        className="send-button"
        disabled={
          disabled ||
          !text.trim()
        }
        title="Send message"
      >
        <Send size={18} />
      </button>

    </form>
  );
}