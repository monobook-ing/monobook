import { useEffect, useRef, useState } from "react";
import { format } from "date-fns";
import { Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchNotifications, markAllNotificationsAsRead, markNotificationAsRead, readAccessToken, type Notification } from "@/lib/auth";
import { useNotifications } from "@/contexts/NotificationsContext";

const PAGE_SIZE = 20;

const formatNotificationType = (type: Notification["type"]) => {
  if (type === "invite_accepted") return "Invite accepted";
  return type.charAt(0).toUpperCase() + type.slice(1);
};

const formatNotificationError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load notifications.";
  }
  return error;
};

const formatNotificationDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return format(date, "MMM d, yyyy · HH:mm");
};

interface NotificationsSettingsProps {
  showHeader?: boolean;
}

export function NotificationsSettings({ showHeader = true }: NotificationsSettingsProps = {}) {
  const [items, setItems] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [markingIds, setMarkingIds] = useState<Set<string>>(new Set());
  const [isMarkingAll, setIsMarkingAll] = useState(false);
  const requestIdRef = useRef(0);
  const { refreshUnreadCount } = useNotifications();

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const load = async () => {
      const accessToken = readAccessToken();
      if (!accessToken) {
        setItems([]);
        setNextCursor(null);
        setError("missing_token");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchNotifications(accessToken, { limit: PAGE_SIZE });
        if (requestIdRef.current !== requestId) return;
        setItems(result.items);
        setNextCursor(result.nextCursor);
      } catch (loadError) {
        if (requestIdRef.current !== requestId) return;
        setItems([]);
        setNextCursor(null);
        setError(
          loadError instanceof Error ? loadError.message : "Failed to fetch notifications"
        );
      } finally {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      }
    };

    void load();
  }, []);

  const handleLoadMore = async () => {
    if (!nextCursor || isLoadingMore) return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("missing_token");
      return;
    }

    setIsLoadingMore(true);
    try {
      const result = await fetchNotifications(accessToken, {
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      setItems((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (loadError) {
      setError(
        loadError instanceof Error ? loadError.message : "Failed to fetch notifications"
      );
    } finally {
      setIsLoadingMore(false);
    }
  };

  const handleMarkAsRead = async (item: Notification) => {
    if (item.isRead) return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("missing_token");
      return;
    }

    setMarkingIds((prev) => new Set(prev).add(item.id));
    try {
      const updated = await markNotificationAsRead(accessToken, item.id);
      setItems((prev) => prev.map((current) => (current.id === updated.id ? updated : current)));
      await refreshUnreadCount();
    } catch (markError) {
      setError(
        markError instanceof Error ? markError.message : "Failed to mark notification as read"
      );
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("missing_token");
      return;
    }

    setIsMarkingAll(true);
    try {
      const updatedItems = await markAllNotificationsAsRead(accessToken);
      const updatesById = new Map(updatedItems.map((item) => [item.id, item]));
      setItems((prev) =>
        prev.map((item) => updatesById.get(item.id) ?? { ...item, isRead: true })
      );
      await refreshUnreadCount();
    } catch (markError) {
      setError(
        markError instanceof Error ? markError.message : "Failed to mark notifications as read"
      );
    } finally {
      setIsMarkingAll(false);
      setMarkingIds(new Set());
    }
  };

  const hasUnreadItems = items.some((item) => !item.isRead);

  return (
    <div className="space-y-4">
      {showHeader && (
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Notifications</h1>
          <p className="text-sm text-muted-foreground mt-1">Activity and product updates for your account</p>
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {items.length} notification{items.length === 1 ? "" : "s"}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          onClick={handleMarkAllAsRead}
          disabled={!hasUnreadItems || isMarkingAll}
        >
          {isMarkingAll && <Loader2 className="w-4 h-4 animate-spin" />}
          Mark all as read
        </Button>
      </div>

      {isLoading && (
        <Card className="rounded-2xl">
          <CardContent className="space-y-4 p-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-2">
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {!isLoading && error && (
        <Card className="rounded-2xl border-destructive/30">
          <CardContent className="p-4">
            <p className="text-sm text-destructive">{formatNotificationError(error)}</p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && items.length === 0 && (
        <Card className="rounded-2xl">
          <CardContent className="p-8 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
              <Bell className="h-5 w-5 text-primary" />
            </div>
            <p className="text-sm font-medium text-foreground">No notifications yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              You will see account updates and important alerts here.
            </p>
          </CardContent>
        </Card>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="space-y-3">
          {items.map((item) => {
            const isMarking = markingIds.has(item.id);
            return (
              <Card
                key={item.id}
                className={`rounded-2xl ${item.isRead ? "" : "border-primary/30 bg-primary/5"}`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      <span
                        aria-hidden="true"
                        className={`block h-2.5 w-2.5 rounded-full ${
                          item.isRead ? "bg-muted" : "bg-destructive"
                        }`}
                      />
                    </div>
                    <div className="min-w-0 flex-1 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-foreground">{item.subject}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatNotificationType(item.type)} · {formatNotificationDate(item.createdAt)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 rounded-lg px-2.5 text-xs"
                          onClick={() => void handleMarkAsRead(item)}
                          disabled={item.isRead || isMarking || isMarkingAll}
                        >
                          {isMarking && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                          Mark as read
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{item.body}</p>
                      {item.details && (
                        <p className="text-xs text-muted-foreground">{item.details}</p>
                      )}
                      {item.cta && (
                        <p className="text-xs font-medium text-foreground">CTA: {item.cta}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}

          {nextCursor && (
            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl"
              onClick={() => void handleLoadMore()}
              disabled={isLoadingMore}
            >
              {isLoadingMore && <Loader2 className="w-4 h-4 animate-spin" />}
              Load more
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
