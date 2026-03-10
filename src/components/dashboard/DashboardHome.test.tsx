import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DashboardHome } from "@/components/dashboard/DashboardHome";

const fetchDashboardMetricsMock = vi.hoisted(() => vi.fn());
const fetchRecentActivityMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "all",
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchDashboardMetrics: fetchDashboardMetricsMock,
  fetchRecentActivity: fetchRecentActivityMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("@/components/ui/select", async () => {
  const React = await import("react");
  const SelectContext = React.createContext<{
    value: string;
    onValueChange: (value: string) => void;
  } | null>(null);

  return {
    Select: ({
      value,
      onValueChange,
      children,
    }: {
      value: string;
      onValueChange: (value: string) => void;
      children: unknown;
    }) => (
      <SelectContext.Provider value={{ value, onValueChange }}>
        {children as React.ReactNode}
      </SelectContext.Provider>
    ),
    SelectTrigger: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({
      value,
      children,
      disabled,
    }: {
      value: string;
      children: React.ReactNode;
      disabled?: boolean;
    }) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button type="button" disabled={disabled} onClick={() => !disabled && ctx?.onValueChange(value)}>
          {children}
        </button>
      );
    },
  };
});

const metricsPayload = {
  aiDirectBookings: 47,
  commissionSaved: 4650,
  occupancyRate: 87,
  revenue: 22120,
  aiDirectBookingsTrend: [12, 18, 47],
  commissionSavedTrend: [1200, 1800, 4650],
  occupancyTrend: [72, 84, 87],
  revenueTrend: [12000, 18000, 22120],
};

describe("DashboardHome", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = class ResizeObserver {
        observe() {}
        unobserve() {}
        disconnect() {}
      };
    }
    fetchDashboardMetricsMock.mockReset();
    fetchRecentActivityMock.mockReset();
    readAccessTokenMock.mockReset();
    propertyStateRef.current = { selectedPropertyId: "all" };
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    render(<DashboardHome />);

    expect(screen.getByTestId("dashboard-select-property-state")).toBeInTheDocument();
    expect(fetchDashboardMetricsMock).not.toHaveBeenCalled();
    expect(fetchRecentActivityMock).not.toHaveBeenCalled();
  });

  it("shows missing-token error when token is absent", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue(null);

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load dashboard.")
      ).toBeInTheDocument();
    });
    expect(fetchDashboardMetricsMock).not.toHaveBeenCalled();
    expect(fetchRecentActivityMock).not.toHaveBeenCalled();
  });

  it("fetches dashboard metrics and recent activity for selected property", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchDashboardMetricsMock.mockResolvedValue(metricsPayload);
    fetchRecentActivityMock.mockResolvedValue([
      {
        id: "booking-1",
        guestName: "Sarah Chen",
        checkIn: "2026-03-15",
        checkOut: "2026-03-20",
        aiHandled: true,
        status: "ai_pending",
        createdAt: "2026-02-22T11:33:12Z",
      },
    ]);

    render(<DashboardHome />);

    await waitFor(() => {
      expect(fetchDashboardMetricsMock).toHaveBeenCalledWith("jwt", "prop-1", { range: "month" });
      expect(fetchRecentActivityMock).toHaveBeenCalledWith("jwt", "prop-1", { limit: 5 });
      expect(screen.getByText("47")).toBeInTheDocument();
      expect(screen.getByText("$4,650")).toBeInTheDocument();
      expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
      expect(screen.getByText("AI Pending")).toBeInTheDocument();
      expect(screen.getByText("AI Handled")).toBeInTheDocument();
    });
  });

  it("shows empty state when recent activity list is empty", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchDashboardMetricsMock.mockResolvedValue(metricsPayload);
    fetchRecentActivityMock.mockResolvedValue([]);

    render(<DashboardHome />);

    await waitFor(() => {
      expect(screen.getByTestId("dashboard-activity-empty-state")).toBeInTheDocument();
    });
  });

  it("refetches metrics when period changes and keeps custom disabled", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchDashboardMetricsMock.mockResolvedValue(metricsPayload);
    fetchRecentActivityMock.mockResolvedValue([]);

    render(<DashboardHome />);

    await waitFor(() => {
      expect(fetchDashboardMetricsMock).toHaveBeenCalledWith("jwt", "prop-1", { range: "month" });
    });

    fireEvent.click(screen.getByRole("button", { name: "Week" }));
    await waitFor(() => {
      expect(fetchDashboardMetricsMock).toHaveBeenLastCalledWith("jwt", "prop-1", { range: "week" });
    });

    const customButton = screen.getByRole("button", { name: "Custom (Coming soon)" });
    expect(customButton).toBeDisabled();
    fireEvent.click(customButton);

    await waitFor(() => {
      expect(fetchDashboardMetricsMock).toHaveBeenCalledTimes(2);
    });
  });
});
