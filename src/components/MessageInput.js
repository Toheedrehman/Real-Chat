import {
  useRef,
  useState,
} from "react";

import {
  File as FileIcon,
  Image,
  Mic,
  Send,
  Smile,
  Square,
  X,
} from "lucide-react";

import EmojiPicker from "emoji-picker-react";

export default function MessageInput({
  onSend,
  onSendImage,
  onSendFile,
  onSendAudio,
  disabled,
  replyTo,
  onCancelReply,
}) {
  const [text, setText] = useState("");

  const [selectedImage, setSelectedImage] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState("");

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false);

  const [recording, setRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const fileRef = useRef(null);

  const documentRef = useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const recordingTimerRef =
    useRef(null);

  // ==========================================
  // SEND
  // ==========================================

  const submit = async (e) => {
    e.preventDefault();

    if (disabled) {
      return;
    }

    // ========================================
    // SEND IMAGE
    // ========================================

    if (selectedImage) {
      if (!onSendImage) {
        alert("Image sending is not available.");
        return;
      }

      await onSendImage(
        selectedImage,
        text.trim()
      );

      clearImage();

      setText("");

      setShowEmojiPicker(false);

      return;
    }

    // ========================================
    // SEND FILE
    // ========================================

    if (selectedFile) {
      if (!onSendFile) {
        alert("File sending is not available.");
        return;
      }

      await onSendFile(
        selectedFile,
        text.trim()
      );

      setSelectedFile(null);

      setText("");

      setShowEmojiPicker(false);

      return;
    }

    // ========================================
    // SEND TEXT
    // ========================================

    if (!text.trim()) {
      return;
    }

    await onSend(
      text.trim(),
      replyTo || null
    );

    setText("");

    setShowEmojiPicker(false);
  };

  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (e) => {
    if (
      e.key === "Enter" &&
      !e.shiftKey
    ) {
      e.preventDefault();

      submit(e);
    }
  };

  // ==========================================
  // EMOJI
  // ==========================================

  const handleEmojiClick = (
    emojiData
  ) => {
    setText(
      (previous) =>
        previous + emojiData.emoji
    );
  };

  // ==========================================
  // IMAGE SELECT
  // ==========================================

  const handleImage = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select an image."
      );

      e.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Image must be less than 5MB."
      );

      e.target.value = "";

      return;
    }

    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedFile(null);

    setSelectedImage(file);

    const preview =
      URL.createObjectURL(file);

    setImagePreview(preview);

    e.target.value = "";
  };

  // ==========================================
  // CLEAR IMAGE
  // ==========================================

  const clearImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(
        imagePreview
      );
    }

    setSelectedImage(null);

    setImagePreview("");

    if (fileRef.current) {
      fileRef.current.value = "";
    }
  };

  // ==========================================
  // FILE SELECT
  // ==========================================

  const handleFile = (e) => {
    const file =
      e.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      file.size >
      25 * 1024 * 1024
    ) {
      alert(
        "File must be less than 25MB."
      );

      e.target.value = "";

      return;
    }

    clearImage();

    setSelectedFile(file);

    e.target.value = "";
  };

  // ==========================================
  // REMOVE FILE
  // ==========================================

  const removeFile = () => {
    setSelectedFile(null);

    if (documentRef.current) {
      documentRef.current.value = "";
    }
  };

  // ==========================================
  // START AUDIO RECORDING
  // ==========================================

  const startRecording = async () => {
    if (
      disabled ||
      recording
    ) {
      return;
    }

    if (!onSendAudio) {
      alert(
        "Voice messages are not available."
      );

      return;
    }

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      // ======================================
      // CHOOSE SUPPORTED AUDIO FORMAT
      // ======================================

      let mimeType = "";

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        mimeType =
          "audio/webm;codecs=opus";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/webm"
        )
      ) {
        mimeType =
          "audio/webm";
      } else if (
        MediaRecorder.isTypeSupported(
          "audio/ogg;codecs=opus"
        )
      ) {
        mimeType =
          "audio/ogg;codecs=opus";
      }

      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              {
                mimeType,
              }
            )
          : new MediaRecorder(
              stream
            );

      mediaRecorderRef.current =
        recorder;

      audioChunksRef.current = [];

      // ======================================
      // AUDIO DATA
      // ======================================

      recorder.ondataavailable =
        (event) => {
          if (
            event.data &&
            event.data.size > 0
          ) {
            audioChunksRef.current.push(
              event.data
            );
          }
        };

      // ======================================
      // RECORDING STOPPED
      // ======================================

      recorder.onstop =
        async () => {
          try {
            const audioType =
              recorder.mimeType ||
              "audio/webm";

            const audioBlob =
              new Blob(
                audioChunksRef.current,
                {
                  type: audioType,
                }
              );

            stream
              .getTracks()
              .forEach(
                (track) =>
                  track.stop()
              );

            if (
              audioBlob.size === 0
            ) {
              return;
            }

            // =================================
            // FILE EXTENSION
            // =================================

            let extension =
              "webm";

            if (
              audioType.includes(
                "ogg"
              )
            ) {
              extension =
                "ogg";
            } else if (
              audioType.includes(
                "mpeg"
              )
            ) {
              extension =
                "mp3";
            } else if (
              audioType.includes(
                "wav"
              )
            ) {
              extension =
                "wav";
            }

            // =================================
            // IMPORTANT:
            // Use window.File, NOT Lucide File
            // =================================

            const audioFile =
              new window.File(
                [audioBlob],
                `voice-${Date.now()}.${extension}`,
                {
                  type:
                    audioType,
                }
              );

            await onSendAudio(
              audioFile
            );
          } catch (error) {
            console.error(
              "Audio processing error:",
              error
            );

            alert(
              "Could not send voice message."
            );
          } finally {
            audioChunksRef.current = [];
          }
        };

      // ======================================
      // START
      // ======================================

      recorder.start();

      setRecording(true);

      setRecordingTime(0);

      recordingTimerRef.current =
        setInterval(() => {
          setRecordingTime(
            (previous) =>
              previous + 1
          );
        }, 1000);
    } catch (error) {
      console.error(
        "Microphone error:",
        error
      );

      alert(
        "Microphone permission is required."
      );
    }
  };

  // ==========================================
  // STOP RECORDING
  // ==========================================

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      recording
    ) {
      mediaRecorderRef.current.stop();

      mediaRecorderRef.current =
        null;

      setRecording(false);

      if (
        recordingTimerRef.current
      ) {
        clearInterval(
          recordingTimerRef.current
        );

        recordingTimerRef.current =
          null;
      }
    }
  };

  // ==========================================
  // RECORDING TIME
  // ==========================================

  const formatRecordingTime =
    () => {
      const minutes =
        Math.floor(
          recordingTime / 60
        );

      const seconds =
        recordingTime % 60;

      return `${minutes}:${String(
        seconds
      ).padStart(2, "0")}`;
    };

  // ==========================================
  // UI
  // ==========================================

  return (
    <form
      className="message-input-wrap"
      onSubmit={submit}
    >

      {/* =====================================
          REPLY PREVIEW
      ===================================== */}

      {replyTo && (
        <div className="reply-preview">

          <div>
            <strong>
              Replying to
            </strong>

            <div>
              {replyTo.text ||
                replyTo.fileName ||
                "Attachment"}
            </div>
          </div>

          <button
            type="button"
            onClick={
              onCancelReply
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          EMOJI PICKER
      ===================================== */}

      {showEmojiPicker && (
        <div className="emoji-picker-container">

          <EmojiPicker
            onEmojiClick={
              handleEmojiClick
            }
            width={320}
            height={400}
            previewConfig={{
              showPreview: false,
            }}
          />

        </div>
      )}

      {/* =====================================
          IMAGE PREVIEW
      ===================================== */}

      {imagePreview && (
        <div className="selected-image-preview">

          <img
            src={imagePreview}
            alt="Selected"
          />

          <button
            type="button"
            className="remove-image-button"
            onClick={
              clearImage
            }
            disabled={disabled}
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          FILE PREVIEW
      ===================================== */}

      {selectedFile && (
        <div className="selected-file-preview">

          <FileIcon size={24} />

          <div>
            <strong>
              {selectedFile.name}
            </strong>

            <small>
              {(
                selectedFile.size /
                1024 /
                1024
              ).toFixed(2)}{" "}
              MB
            </small>
          </div>

          <button
            type="button"
            onClick={
              removeFile
            }
          >
            <X size={16} />
          </button>

        </div>
      )}

      {/* =====================================
          RECORDING INDICATOR
      ===================================== */}

      {recording && (
        <div className="recording-indicator">

          <span className="recording-dot" />

          Recording{" "}
          {formatRecordingTime()}

        </div>
      )}

      {/* =====================================
          EMOJI BUTTON
      ===================================== */}

      <button
        type="button"
        className="input-icon"
        title="Emoji"
        disabled={
          disabled ||
          recording
        }
        onClick={() =>
          setShowEmojiPicker(
            (previous) =>
              !previous
          )
        }
      >
        <Smile size={21} />
      </button>

      {/* =====================================
          TEXT INPUT
      ===================================== */}

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
        placeholder={
          selectedImage ||
          selectedFile
            ? "Add a caption..."
            : "Write a message..."
        }
        disabled={
          disabled ||
          recording
        }
      />

      {/* =====================================
          IMAGE INPUT
      ===================================== */}

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
        title="Image"
        disabled={
          disabled ||
          recording
        }
        onClick={() =>
          fileRef.current?.click()
        }
      >
        <Image size={20} />
      </button>

      {/* =====================================
          DOCUMENT INPUT
      ===================================== */}

      <input
        ref={documentRef}
        type="file"
        hidden
        onChange={
          handleFile
        }
      />

      <button
        type="button"
        className="input-icon"
        title="File"
        disabled={
          disabled ||
          recording
        }
        onClick={() =>
          documentRef.current?.click()
        }
      >
        <FileIcon size={20} />
      </button>

      {/* =====================================
          VOICE BUTTON
      ===================================== */}

      <button
        type="button"
        className="input-icon"
        title={
          recording
            ? "Stop recording"
            : "Voice message"
        }
        disabled={disabled}
        onClick={
          recording
            ? stopRecording
            : startRecording
        }
      >
        {recording ? (
          <Square size={18} />
        ) : (
          <Mic size={20} />
        )}
      </button>

      {/* =====================================
          SEND BUTTON
      ===================================== */}

      <button
        type="submit"
        className="send-button"
        disabled={
          disabled ||
          recording ||
          (
            !text.trim() &&
            !selectedImage &&
            !selectedFile
          )
        }
        title="Send"
      >
        <Send size={18} />
      </button>

    </form>
  );
}