export default function Avatar({ user, size = "normal" }) {
  const initials = (user?.name || user?.email || "?")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return user?.photoURL ? (
    <img
      className={`avatar avatar-${size}`}
      src={user.photoURL}
      alt={user.name || "User"}
    />
  ) : (
    <div className={`avatar avatar-${size} avatar-placeholder`}>
      {initials}
    </div>
  );
}