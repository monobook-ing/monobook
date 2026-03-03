import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import SettingsSectionPage from "@/pages/SettingsSection";

vi.mock("@/components/dashboard/MCPIntegrationSettings", () => ({
  MCPIntegrationSettings: () => <div data-testid="mcp-settings-content">settings content</div>,
}));

vi.mock("@/components/dashboard/AuditLog", () => ({
  AuditLog: () => <div data-testid="audit-log-content">audit log</div>,
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
  it("uses overflow-safe root container and horizontal tab scroller", () => {
    renderSettingsSection("/settings/query-log");

    const allSettingsLink = screen.getByRole("link", { name: /all settings/i });
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
});
