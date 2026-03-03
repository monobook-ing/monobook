import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import SettingsHome from "@/pages/Settings";

const useNotificationsMock = vi.hoisted(() =>
  vi.fn(() => ({
    unreadCount: 0,
    hasUnread: false,
    isLoading: false,
    error: null,
    refreshUnreadCount: vi.fn(),
  }))
);

vi.mock("@/contexts/NotificationsContext", () => ({
  useNotifications: useNotificationsMock,
}));

const renderSettingsHome = () =>
  render(
    <MemoryRouter>
      <SettingsHome />
    </MemoryRouter>
  );

describe("SettingsHome notifications section", () => {
  beforeEach(() => {
    useNotificationsMock.mockReturnValue({
      unreadCount: 0,
      hasUnread: false,
      isLoading: false,
      error: null,
      refreshUnreadCount: vi.fn(),
    });
  });

  it("renders notifications section link", () => {
    renderSettingsHome();

    expect(screen.getByRole("link", { name: /notifications/i })).toHaveAttribute(
      "href",
      "/settings/notifications"
    );
  });

  it("shows unread pointer on notifications card when unread notifications exist", () => {
    useNotificationsMock.mockReturnValue({
      unreadCount: 3,
      hasUnread: true,
      isLoading: false,
      error: null,
      refreshUnreadCount: vi.fn(),
    });

    renderSettingsHome();

    expect(screen.getByTestId("settings-notifications-unread-dot")).toBeInTheDocument();
  });
});
