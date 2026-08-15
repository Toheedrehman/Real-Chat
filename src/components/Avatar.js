const API_URL = "https://real-chat-5fxb.vercel.app";

export default function Avatar({
  user,
  size = "normal",
}) {
  // ==========================================
  // PROFILE IMAGE
  // ==========================================

  let imageUrl = "";

  if (user?.profileImage) {
    imageUrl = user.profileImage.startsWith("http")
      ? user.profileImage
      : `${API_URL}${user.profileImage}`;
  } else if (user?.photoURL) {
    imageUrl = user.photoURL;
  }

  // ==========================================
  // INITIALS
  // ==========================================

  const initials = (
    user?.name ||
    user?.email ||
    "?"
  )
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  // ==========================================
  // IMAGE
  // ==========================================

  if (imageUrl) {
    return (
      <img
        className={`avatar avatar-${size}`}
        src={imageUrl}
        alt={user?.name || "User"}
        onError={(e) => {
          console.error(
            "Avatar image failed to load:",
            imageUrl
          );

          e.currentTarget.style.display =
            "none";

          e.currentTarget.nextSibling.style.display =
            "flex";
        }}
      />
    );
  }

  // ==========================================
  // FALLBACK
  // ==========================================

  return (
    <div
      className={`avatar avatar-${size} avatar-placeholder`}
    >
      {initials}
    </div>
  );
}