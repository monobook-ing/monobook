import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SettingsSectionPage from "@/pages/SettingsSection";

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

vi.mock("@/components/dashboard/MCPIntegrationSettings", () => ({
  MCPIntegrationSettings: () => <div data-testid="mcp-settings-content">settings content</div>,
}));

vi.mock("@/components/dashboard/AuditLog", () => ({
  AuditLog: () => <div data-testid="audit-log-content">audit log</div>,
}));

vi.mock("@/components/dashboard/NotificationsSettings", () => ({
  NotificationsSettings: () => <div data-testid="notifications-settings-content">notifications content</div>,
}));

const renderSettingsSection = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/settings/:sectionId" element={<SettingsSectionPage />} />
      </Routes>
    </MemoryRouter>
  );

describe("SettingsSection mobile layout contracts", () => {
  beforeEach(() => {
    useNotificationsMock.mockReturnValue({
      unreadCount: 0,
      hasUnread: false,
      isLoading: false,
      error: null,
      refreshUnreadCount: vi.fn(),
    });
  });

  it("uses overflow-safe root container and horizontal tab scroller", () => {
    renderSettingsSection("/settings/query-log");

    const allSettingsLink = screen.getByRole("link", { name: /all settings/i });
    expect(allSettingsLink).toHaveClass("md:hidden");
    const rootContainer = allSettingsLink.parentElement;
    expect(rootContainer).toHaveClass("w-full", "max-w-full", "min-w-0", "overflow-x-hidden");

    const queryLogTab = screen.getByRole("link", { name: "Query Log" });
    const tabsRow = queryLogTab.parentElement as HTMLElement | null;
    const tabsScroller = tabsRow?.parentElement as HTMLElement | null;

    expect(tabsScroller).toHaveClass(
      "w-full",
      "max-w-full",
      "min-w-0",
      "overflow-x-auto",
      "overflow-y-hidden",
      "hide-scrollbar"
    );
    expect(tabsRow).toHaveClass("inline-flex", "w-max");
  });

  it("keeps tabs non-shrinking for horizontal swipe behavior", () => {
    renderSettingsSection("/settings/payment-providers");

    const paymentTab = screen.getByRole("link", { name: "Payment Providers" });
    const knowledgeTab = screen.getByRole("link", { name: "Knowledge Base (RAG)" });

    expect(paymentTab).toHaveClass("shrink-0", "whitespace-nowrap");
    expect(knowledgeTab).toHaveClass("shrink-0", "whitespace-nowrap");
  });

  it("renders notifications page and unread tab pointer when notifications are unread", () => {
    useNotificationsMock.mockReturnValue({
      unreadCount: 2,
      hasUnread: true,
      isLoading: false,
      error: null,
      refreshUnreadCount: vi.fn(),
    });

    renderSettingsSection("/settings/notifications");

    expect(screen.getByTestId("notifications-settings-content")).toBeInTheDocument();
    expect(screen.getByTestId("settings-section-notifications-unread-dot")).toBeInTheDocument();
  });

  it("renders AI Providers tab as disabled with Soon badge", () => {
    renderSettingsSection("/settings/query-log");

    const aiTab = screen.getByTestId("settings-tab-ai-providers");
    expect(aiTab).toHaveAttribute("aria-disabled", "true");
    expect(within(aiTab).getByText("Soon")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /ai providers/i })).not.toBeInTheDocument();
  });

  it("keeps direct AI Providers route accessible while tab stays disabled", () => {
    renderSettingsSection("/settings/ai-providers");

    expect(screen.getByRole("heading", { name: "AI Providers" })).toBeInTheDocument();
    expect(screen.getByTestId("mcp-settings-content")).toBeInTheDocument();

    const aiTab = screen.getByTestId("settings-tab-ai-providers");
    expect(aiTab).toHaveAttribute("aria-disabled", "true");
    expect(aiTab).toHaveClass("bg-background", "text-foreground", "shadow-sm");
  });
});
