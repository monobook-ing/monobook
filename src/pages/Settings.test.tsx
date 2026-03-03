import { render, screen, within } from "@testing-library/react";
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

describe("SettingsHome", () => {
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

  it("places AI Providers at the bottom as a disabled Soon card", () => {
    renderSettingsHome();

    const sections = screen.getAllByTestId(/settings-section-/);
    const lastSection = sections[sections.length - 1];
    expect(lastSection).toHaveAttribute("data-testid", "settings-section-ai-providers");
    expect(lastSection).toHaveAttribute("aria-disabled", "true");
    expect(within(lastSection).getByText("Soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ai providers/i })).not.toBeInTheDocument();
  });
});
