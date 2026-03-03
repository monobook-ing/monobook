import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { NotificationsSettings } from "@/components/dashboard/NotificationsSettings";

const fetchNotificationsMock = vi.hoisted(() => vi.fn());
const markNotificationAsReadMock = vi.hoisted(() => vi.fn());
const markAllNotificationsAsReadMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const refreshUnreadCountMock = vi.hoisted(() => vi.fn());
const useNotificationsMock = vi.hoisted(() =>
  vi.fn(() => ({
    unreadCount: 0,
    hasUnread: false,
    isLoading: false,
    error: null,
    refreshUnreadCount: refreshUnreadCountMock,
  }))
);

vi.mock("@/lib/auth", () => ({
  fetchNotifications: fetchNotificationsMock,
  markNotificationAsRead: markNotificationAsReadMock,
  markAllNotificationsAsRead: markAllNotificationsAsReadMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/NotificationsContext", () => ({
  useNotifications: useNotificationsMock,
}));

describe("NotificationsSettings", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchNotificationsMock.mockReset();
    markNotificationAsReadMock.mockReset();
    markAllNotificationsAsReadMock.mockReset();
    readAccessTokenMock.mockReset();
    refreshUnreadCountMock.mockReset();
    useNotificationsMock.mockReturnValue({
      unreadCount: 0,
      hasUnread: false,
      isLoading: false,
      error: null,
      refreshUnreadCount: refreshUnreadCountMock,
    });
    readAccessTokenMock.mockReturnValue("jwt_key");
    refreshUnreadCountMock.mockResolvedValue(undefined);
  });

  it("loads and renders notifications list", async () => {
    fetchNotificationsMock.mockResolvedValue({
      items: [
        {
          id: "notif-1",
          userId: "user-1",
          subject: "Welcome",
          body: "Thanks for joining",
          type: "welcome",
          details: null,
          cta: null,
          isRead: false,
          readAt: null,
          createdAt: "2026-03-03T10:00:00Z",
        },
      ],
      nextCursor: null,
    });

    render(<NotificationsSettings showHeader={false} />);

    expect(await screen.findByText("Welcome")).toBeInTheDocument();
    expect(fetchNotificationsMock).toHaveBeenCalledWith("jwt_key", { limit: 20 });
  });

  it("renders booking success notification type label", async () => {
    fetchNotificationsMock.mockResolvedValue({
      items: [
        {
          id: "notif-1",
          userId: "user-1",
          subject: "New confirmed booking",
          body: "Guest: John Doe. Room: Ocean Suite.",
          type: "booking_success",
          details: null,
          cta: null,
          isRead: false,
          readAt: null,
          createdAt: "2026-03-03T10:00:00Z",
        },
      ],
      nextCursor: null,
    });

    render(<NotificationsSettings showHeader={false} />);

    expect(await screen.findByText("New confirmed booking")).toBeInTheDocument();
    expect(await screen.findByText(/Booking success/)).toBeInTheDocument();
  });

  it("marks a single notification as read and refreshes unread count", async () => {
    fetchNotificationsMock.mockResolvedValue({
      items: [
        {
          id: "notif-1",
          userId: "user-1",
          subject: "Update",
          body: "System update",
          type: "updates",
          details: null,
          cta: null,
          isRead: false,
          readAt: null,
          createdAt: "2026-03-03T10:00:00Z",
        },
      ],
      nextCursor: null,
    });
    markNotificationAsReadMock.mockResolvedValue({
      id: "notif-1",
      userId: "user-1",
      subject: "Update",
      body: "System update",
      type: "updates",
      details: null,
      cta: null,
      isRead: true,
      readAt: "2026-03-03T10:02:00Z",
      createdAt: "2026-03-03T10:00:00Z",
    });

    render(<NotificationsSettings showHeader={false} />);

    fireEvent.click(await screen.findByRole("button", { name: /mark as read/i }));

    await waitFor(() => {
      expect(markNotificationAsReadMock).toHaveBeenCalledWith("jwt_key", "notif-1");
      expect(refreshUnreadCountMock).toHaveBeenCalledTimes(1);
    });

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /mark as read/i })).not.toBeInTheDocument();
    });
  });

  it("marks all notifications as read and refreshes unread count", async () => {
    fetchNotificationsMock.mockResolvedValue({
      items: [
        {
          id: "notif-1",
          userId: "user-1",
          subject: "Update 1",
          body: "Body",
          type: "updates",
          details: null,
          cta: null,
          isRead: false,
          readAt: null,
          createdAt: "2026-03-03T10:00:00Z",
        },
      ],
      nextCursor: null,
    });
    markAllNotificationsAsReadMock.mockResolvedValue([
      {
        id: "notif-1",
        userId: "user-1",
        subject: "Update 1",
        body: "Body",
        type: "updates",
        details: null,
        cta: null,
        isRead: true,
        readAt: "2026-03-03T10:02:00Z",
        createdAt: "2026-03-03T10:00:00Z",
      },
    ]);

    render(<NotificationsSettings showHeader={false} />);

    fireEvent.click(await screen.findByRole("button", { name: /mark all as read/i }));

    await waitFor(() => {
      expect(markAllNotificationsAsReadMock).toHaveBeenCalledWith("jwt_key");
      expect(refreshUnreadCountMock).toHaveBeenCalledTimes(1);
    });
  });

  it("renders empty state when there are no notifications", async () => {
    fetchNotificationsMock.mockResolvedValue({ items: [], nextCursor: null });

    render(<NotificationsSettings showHeader={false} />);

    expect(await screen.findByText("No notifications yet")).toBeInTheDocument();
  });

  it("renders error state on load failure", async () => {
    fetchNotificationsMock.mockRejectedValue(new Error("Failed to fetch notifications"));

    render(<NotificationsSettings showHeader={false} />);

    expect(await screen.findByText("Failed to fetch notifications")).toBeInTheDocument();
  });

  it("does not render notification details field", async () => {
    fetchNotificationsMock.mockResolvedValue({
      items: [
        {
          id: "notif-1",
          userId: "user-1",
          subject: "Welcome",
          body: "Body text",
          type: "welcome",
          details: "Should not be shown",
          cta: null,
          isRead: false,
          readAt: null,
          createdAt: "2026-03-03T10:00:00Z",
        },
      ],
      nextCursor: null,
    });

    render(<NotificationsSettings showHeader={false} />);

    expect(await screen.findByText("Body text")).toBeInTheDocument();
    expect(screen.queryByText("Should not be shown")).not.toBeInTheDocument();
  });

  it("loads next page when load more is clicked", async () => {
    fetchNotificationsMock
      .mockResolvedValueOnce({
        items: [
          {
            id: "notif-1",
            userId: "user-1",
            subject: "First page",
            body: "Body",
            type: "news",
            details: null,
            cta: null,
            isRead: true,
            readAt: "2026-03-03T10:02:00Z",
            createdAt: "2026-03-03T10:00:00Z",
          },
        ],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "notif-2",
            userId: "user-1",
            subject: "Second page",
            body: "Body",
            type: "news",
            details: null,
            cta: null,
            isRead: true,
            readAt: "2026-03-03T10:04:00Z",
            createdAt: "2026-03-03T10:03:00Z",
          },
        ],
        nextCursor: null,
      });

    render(<NotificationsSettings showHeader={false} />);

    fireEvent.click(await screen.findByRole("button", { name: /load more/i }));

    await waitFor(() => {
      expect(fetchNotificationsMock).toHaveBeenNthCalledWith(2, "jwt_key", {
        limit: 20,
        cursor: "cursor-1",
      });
      expect(screen.getByText("Second page")).toBeInTheDocument();
    });
  });
});
