import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { fetchUnreadNotificationsCount, readAccessToken } from "@/lib/auth";

type NotificationsContextValue = {
  unreadCount: number;
  hasUnread: boolean;
  isLoading: boolean;
  error: string | null;
  refreshUnreadCount: () => Promise<void>;
};

const defaultValue: NotificationsContextValue = {
  unreadCount: 0,
  hasUnread: false,
  isLoading: false,
  error: null,
  refreshUnreadCount: async () => {},
};

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  const refreshUnreadCount = useCallback(async () => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const accessToken = readAccessToken();
    if (!accessToken) {
      if (requestIdRef.current !== requestId) return;
      setUnreadCount(0);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const count = await fetchUnreadNotificationsCount(accessToken);
      if (requestIdRef.current !== requestId) return;
      setUnreadCount(count);
      setError(null);
    } catch (refreshError) {
      if (requestIdRef.current !== requestId) return;
      setUnreadCount(0);
      setError(
        refreshError instanceof Error
          ? refreshError.message
          : "Failed to fetch notifications count"
      );
    } finally {
      if (requestIdRef.current === requestId) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refreshUnreadCount();
  }, [refreshUnreadCount]);

  useEffect(() => {
    const handleFocus = () => {
      void refreshUnreadCount();
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshUnreadCount();
      }
    };

    window.addEventListener("focus", handleFocus);
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      window.removeEventListener("focus", handleFocus);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [refreshUnreadCount]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      unreadCount,
      hasUnread: unreadCount > 0,
      isLoading,
      error,
      refreshUnreadCount,
    }),
    [error, isLoading, refreshUnreadCount, unreadCount]
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export const useNotifications = () => {
  return useContext(NotificationsContext) ?? defaultValue;
};
