import {
  useEffect,
  useMemo,
  useState,
} from "react";

const API_URL = "http://localhost:5000";

export function useUsers(currentUid) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUid) {
      setUsers([]);
      setLoading(false);
      return;
    }

    const fetchUsers = async () => {
      try {
        setLoading(true);

        console.log(
          "Fetching users:",
          currentUid
        );

        const response = await fetch(
          `${API_URL}/api/users?currentUid=${encodeURIComponent(
            currentUid
          )}`
        );

        const data = await response.json();

        console.log(
          "Users response:",
          data
        );

        if (!response.ok) {
          throw new Error(
            data.message ||
              "Failed to fetch users"
          );
        }

        setUsers(
          data.users || []
        );
      } catch (error) {
        console.error(
          "Users error:",
          error
        );

        setUsers([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentUid]);

  return {
    users,
    loading,
  };
}

export function useUserSearch(
  users,
  search
) {
  return useMemo(() => {
    const value =
      search.trim().toLowerCase();

    if (!value) {
      return users;
    }

    return users.filter((user) => {
      const name =
        user.name?.toLowerCase() || "";

      const email =
        user.email?.toLowerCase() || "";

      return (
        name.includes(value) ||
        email.includes(value)
      );
    });
  }, [users, search]);
}