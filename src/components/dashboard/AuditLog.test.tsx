import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AuditLog } from "@/components/dashboard/AuditLog";

const fetchAuditEntriesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
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

vi.mock("@/components/ui/calendar", () => ({
  Calendar: ({ onSelect }: { onSelect?: (value: { from?: Date; to?: Date } | undefined) => void }) => (
    <div>
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

describe("AuditLog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchAuditEntriesMock.mockReset();
    readAccessTokenMock.mockReset();
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
      expect(fetchAuditEntriesMock).toHaveBeenCalledWith("jwt", "prop-1", {
        source: undefined,
        limit: 20,
      });
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
      expect(fetchAuditEntriesMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        source: "mcp",
        limit: 20,
      });
      expect(screen.queryByText("Guest initiated booking via widget")).not.toBeInTheDocument();
      expect(
        screen.getByText("Searched available rooms for March 15-20")
      ).toBeInTheDocument();
    });
  });

  it("filters by date range client-side", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchAuditEntriesMock.mockResolvedValue({
      items: firstPageItems,
      nextCursor: null,
    });

    render(<AuditLog />);

    await screen.findByText("Searched available rooms for March 15-20");
    expect(screen.getByText("Guest initiated booking via widget")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /date range/i }));
    fireEvent.click(screen.getByRole("button", { name: "Pick Feb 22" }));

    await waitFor(() => {
      expect(
        screen.getByText("Searched available rooms for March 15-20")
      ).toBeInTheDocument();
      expect(screen.queryByText("Guest initiated booking via widget")).not.toBeInTheDocument();
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

    fireEvent.click(screen.getByTestId("audit-load-more-button"));

    await waitFor(() => {
      expect(fetchAuditEntriesMock).toHaveBeenNthCalledWith(2, "jwt", "prop-1", {
        source: undefined,
        limit: 20,
        cursor: "cursor-1",
      });
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
});
