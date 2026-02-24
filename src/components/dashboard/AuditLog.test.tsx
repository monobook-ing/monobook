import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLog } from "@/components/dashboard/AuditLog";

const fetchAuditEntriesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const useIsMobileMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "prop-1",
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchAuditEntries: fetchAuditEntriesMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: useIsMobileMock,
}));

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({
    onSelect,
    className,
    classNames,
  }: {
    onSelect?: (value: { from?: Date; to?: Date } | undefined) => void;
    className?: string;
    classNames?: Record<string, string>;
  }) => (
    <div
      data-testid="mock-calendar"
      data-class-name={className ?? ""}
      data-head-row={classNames?.head_row ?? ""}
      data-row={classNames?.row ?? ""}
      data-head-cell={classNames?.head_cell ?? ""}
      data-day={classNames?.day ?? ""}
      data-month={classNames?.month ?? ""}
      data-nav-button={classNames?.nav_button ?? ""}
      data-nav-button-previous={classNames?.nav_button_previous ?? ""}
      data-nav-button-next={classNames?.nav_button_next ?? ""}
    >
      <button
        type="button"
        onClick={() =>
          onSelect?.({
            from: new Date(2026, 1, 22),
            to: new Date(2026, 1, 22),
          })
        }
      >
        Pick Feb 22
      </button>
      <button type="button" onClick={() => onSelect?.(undefined)}>
        Clear Mock Range
      </button>
    </div>
  ),
}));

const firstPageItems = [
  {
    id: "audit-1",
    propertyId: "prop-1",
    conversationId: "conv-1",
    source: "mcp",
    toolName: "search_rooms",
    description: "Searched available rooms for March 15-20",
    status: "success",
    createdAt: "2026-02-22T14:32:00",
  },
  {
    id: "audit-2",
    propertyId: "prop-1",
    conversationId: "conv-2",
    source: "widget",
    toolName: "create_booking",
    description: "Guest initiated booking via widget",
    status: "pending",
    createdAt: "2026-02-21T18:05:00",
  },
];

const getExpectedRange = () => {
  const fromDate = new Date(2026, 1, 22);
  fromDate.setHours(0, 0, 0, 0);
  const toDate = new Date(2026, 1, 22);
  toDate.setHours(23, 59, 59, 999);
  return {
    from: fromDate.toISOString(),
    to: toDate.toISOString(),
  };
};

describe("AuditLog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchAuditEntriesMock.mockReset();
    readAccessTokenMock.mockReset();
    useIsMobileMock.mockReset();
    useIsMobileMock.mockReturnValue(false);
    propertyStateRef.current = {
      selectedPropertyId: "prop-1",
    };
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    propertyStateRef.current.selectedPropertyId = "all";

    render(<AuditLog />);

    expect(screen.getByTestId("audit-select-property-state")).toBeInTheDocument();
    expect(fetchAuditEntriesMock).not.toHaveBeenCalled();
  });

  it("shows missing-token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<AuditLog />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load audit logs.")
      ).toBeInTheDocument();
    });
    expect(fetchAuditEntriesMock).not.toHaveBeenCalled();
  });

  it("fetches and renders audit entries for selected property", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock.mockResolvedValue({
      items: firstPageItems,
      nextCursor: null,
    });

    render(<AuditLog />);

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenCalledWith(
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: undefined,
          from: undefined,
          to: undefined,
          limit: 20,
        })
      );
      expect(
        screen.getByText("Searched available rooms for March 15-20")
      ).toBeInTheDocument();
      expect(screen.getByText("Guest initiated booking via widget")).toBeInTheDocument();
    });
  });

  it("applies source chip filter with API refetch", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock
      .mockResolvedValueOnce({
        items: firstPageItems,
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        items: [firstPageItems[0]],
        nextCursor: null,
      });

    render(<AuditLog />);

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: "MCP" }));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenCalledTimes(2);
      expect(fetchAuditEntriesMock).toHaveBeenLastCalledWith(
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: "mcp",
          from: undefined,
          to: undefined,
          limit: 20,
        })
      );
      expect(screen.queryByText("Guest initiated booking via widget")).not.toBeInTheDocument();
      expect(
        screen.getByText("Searched available rooms for March 15-20")
      ).toBeInTheDocument();
    });
  });

  it("refetches when date range changes and when it is cleared", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock
      .mockResolvedValueOnce({
        items: firstPageItems,
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        items: [firstPageItems[0]],
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        items: firstPageItems,
        nextCursor: null,
      });

    render(<AuditLog />);

    await screen.findByText("Searched available rooms for March 15-20");
    expect(screen.getByText("Guest initiated booking via widget")).toBeInTheDocument();
    const expectedRange = getExpectedRange();

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pick Feb 22" }));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(
        2,
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: undefined,
          from: expectedRange.from,
          to: expectedRange.to,
          limit: 20,
        })
      );
    });

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(
        3,
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: undefined,
          from: undefined,
          to: undefined,
          limit: 20,
        })
      );
    });
  });

  it("loads next page and appends entries", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock
      .mockResolvedValueOnce({
        items: [firstPageItems[0]],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        items: [firstPageItems[0]],
        nextCursor: "cursor-1",
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "audit-3",
            propertyId: "prop-1",
            conversationId: "conv-3",
            source: "mcp",
            toolName: "get_guest_info",
            description: "Loaded guest profile",
            status: "success",
            createdAt: "2026-02-22T17:00:00",
          },
        ],
        nextCursor: null,
      });

    render(<AuditLog />);

    await screen.findByText("Searched available rooms for March 15-20");
    const expectedRange = getExpectedRange();

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pick Feb 22" }));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(
        2,
        "jwt",
        "prop-1",
        expect.objectContaining({
          from: expectedRange.from,
          to: expectedRange.to,
        })
      );
    });

    fireEvent.click(screen.getByTestId("audit-load-more-button"));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(
        3,
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: undefined,
          from: expectedRange.from,
          to: expectedRange.to,
          limit: 20,
          cursor: "cursor-1",
        })
      );
      expect(screen.getByText("Loaded guest profile")).toBeInTheDocument();
      expect(screen.queryByTestId("audit-load-more-button")).not.toBeInTheDocument();
    });
  });

  it("shows API error state when fetch fails", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock.mockRejectedValue(new Error("boom"));

    render(<AuditLog />);

    await waitFor(() => {
      expect(screen.getByTestId("audit-error-state")).toBeInTheDocument();
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });

  it("uses drawer date picker on mobile and auto-closes after selecting a full range", async () => {
    useIsMobileMock.mockReturnValue(true);
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock
      .mockResolvedValueOnce({
        items: firstPageItems,
        nextCursor: null,
      })
      .mockResolvedValueOnce({
        items: [firstPageItems[0]],
        nextCursor: null,
      });

    render(<AuditLog />);

    await screen.findByText("Searched available rooms for March 15-20");
    expect(screen.queryByTestId("audit-date-drawer")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));

    expect(await screen.findByTestId("audit-date-drawer")).toBeInTheDocument();
    const mobileCalendar = screen.getByTestId("mock-calendar");
    expect(mobileCalendar).toHaveAttribute(
      "data-class-name",
      expect.stringContaining("w-full")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-head-row",
      expect.stringContaining("grid grid-cols-7")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-row",
      expect.stringContaining("grid grid-cols-7")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-head-cell",
      expect.stringContaining("w-full")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-day",
      expect.stringContaining("rounded-md")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-month",
      expect.stringContaining("px-4")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-nav-button",
      expect.stringContaining("h-14 w-14")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-nav-button-previous",
      expect.stringContaining("left-4")
    );
    expect(mobileCalendar).toHaveAttribute(
      "data-nav-button-next",
      expect.stringContaining("right-4")
    );
    fireEvent.click(screen.getByRole("button", { name: "Pick Feb 22" }));

    const expectedRange = getExpectedRange();
    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(
        2,
        "jwt",
        "prop-1",
        expect.objectContaining({
          source: undefined,
          from: expectedRange.from,
          to: expectedRange.to,
          limit: 20,
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("audit-date-drawer")).toHaveAttribute("data-state", "closed");
    });
  });

  it("keeps desktop date picker in popover mode", async () => {
    useIsMobileMock.mockReturnValue(false);
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock.mockResolvedValue({
      items: firstPageItems,
      nextCursor: null,
    });

    render(<AuditLog />);

    await screen.findByText("Searched available rooms for March 15-20");
    fireEvent.click(screen.getByRole("button", { name: /date range/i }));

    expect(screen.queryByTestId("audit-date-drawer")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pick Feb 22" })).toBeInTheDocument();
  });
});
