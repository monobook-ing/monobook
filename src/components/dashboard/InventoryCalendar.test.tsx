import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { InventoryCalendar } from "@/components/dashboard/InventoryCalendar";

const fetchRoomsMock = vi.hoisted(() => vi.fn());
const fetchBookingsMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const navigateMock = vi.hoisted(() => vi.fn());
const isMobileRef = vi.hoisted(() => ({ current: false }));
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "all",
  },
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/auth", () => ({
  fetchRooms: fetchRoomsMock,
  fetchBookings: fetchBookingsMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileRef.current,
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
    SelectTrigger: ({
      children,
      ...props
    }: any) => <div {...props}>{children}</div>,
    SelectValue: () => null,
    SelectContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    SelectItem: ({ value, children }: { value: string; children: React.ReactNode }) => {
      const ctx = React.useContext(SelectContext);
      return (
        <button type="button" onClick={() => ctx?.onValueChange(value)}>
          {children}
        </button>
      );
    },
  };
});

const formatYmd = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const addDays = (days: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return formatYmd(date);
};

const baseRoom = {
  id: "room-1",
  propertyId: "prop-1",
  name: "Ocean View Deluxe Suite",
  type: "Deluxe Suite",
  description: "Spacious suite",
  images: ["https://example.com/1.jpg"],
  pricePerNight: 289,
  maxGuests: 3,
  bedConfig: "1 King Bed",
  amenities: ["WiFi", "AC"],
  source: "airbnb" as const,
  sourceUrl: "https://airbnb.com/rooms/1",
  syncEnabled: true,
  lastSynced: "2026-02-22T14:30:00Z",
  status: "active" as const,
  pricing: {
    dateOverrides: {},
    guestTiers: [],
  },
};

const baseBooking = {
  id: "booking-1",
  propertyId: "prop-1",
  roomId: "room-1",
  guestId: "guest-1",
  guestName: "Sarah Chen",
  checkIn: addDays(1),
  checkOut: addDays(3),
  totalPrice: 2100,
  status: "confirmed" as const,
  aiHandled: true,
  source: "mcp",
  conversationId: "conv_1",
  createdAt: "2026-02-22T10:00:00Z",
  updatedAt: "2026-02-22T10:00:00Z",
  cancelledAt: null,
};

describe("InventoryCalendar", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    if (!HTMLElement.prototype.hasPointerCapture) {
      HTMLElement.prototype.hasPointerCapture = () => false;
    }
    if (!HTMLElement.prototype.setPointerCapture) {
      HTMLElement.prototype.setPointerCapture = () => {};
    }
    if (!HTMLElement.prototype.releasePointerCapture) {
      HTMLElement.prototype.releasePointerCapture = () => {};
    }
    fetchRoomsMock.mockReset();
    fetchBookingsMock.mockReset();
    readAccessTokenMock.mockReset();
    navigateMock.mockReset();
    isMobileRef.current = false;
    propertyStateRef.current = { selectedPropertyId: "all" };
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    render(<InventoryCalendar />);

    expect(screen.getByTestId("inventory-select-property-state")).toBeInTheDocument();
    expect(fetchRoomsMock).not.toHaveBeenCalled();
    expect(fetchBookingsMock).not.toHaveBeenCalled();
  });

  it("shows missing-token error when token is absent", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue(null);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("inventory-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load bookings.")
      ).toBeInTheDocument();
    });
    expect(fetchRoomsMock).not.toHaveBeenCalled();
    expect(fetchBookingsMock).not.toHaveBeenCalled();
  });

  it("fetches rooms and bookings for selected property", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(fetchRoomsMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(fetchBookingsMock).toHaveBeenCalledWith("jwt", "prop-1", undefined);
      expect(screen.getByText("Ocean View Deluxe Suite")).toBeInTheDocument();
      expect(screen.getByText("Sarah Chen")).toBeInTheDocument();
    });
  });

  it("refetches bookings when status filter changes", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(fetchBookingsMock).toHaveBeenCalledWith("jwt", "prop-1", undefined);
    });

    fireEvent.click(screen.getByRole("button", { name: "Confirmed" }));

    await waitFor(() => {
      expect(fetchBookingsMock).toHaveBeenLastCalledWith("jwt", "prop-1", { status: "confirmed" });
    });
  });

  it("renders AI Pending status in filter, legend, and dialog badge", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([{ ...baseBooking, status: "ai_pending", guestName: "Chris Cole" }]);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "AI Pending" })).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cancelled" })).not.toBeInTheDocument();
      expect(screen.getAllByText("AI Pending").length).toBeGreaterThan(0);
      expect(screen.getByText("Chris Cole")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Chris Cole"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("AI Pending")).toBeInTheDocument();
  });

  it("still renders cancelled booking badge in dialog for compatibility", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([{ ...baseBooking, status: "cancelled", guestName: "Pat Gray" }]);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(screen.getByText("Pat Gray")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: "Cancelled" })).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Pat Gray"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Cancelled")).toBeInTheDocument();
  });

  it("shows empty state when no bookings are returned", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([]);

    render(<InventoryCalendar />);

    await waitFor(() => {
      expect(screen.getByTestId("inventory-empty-state")).toBeInTheDocument();
    });
  });

  it("renders booking details dialog when booking block is clicked", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("Booking Details")).toBeInTheDocument();
    expect(within(dialog).getByText("ID: booking-1")).toBeInTheDocument();
    expect(within(dialog).getByText("$2100.00")).toBeInTheDocument();
    const previewImage = within(dialog).getByRole("img", { name: /ocean view deluxe suite preview/i });
    expect(previewImage).toHaveAttribute("src", "https://example.com/1.jpg");
  });

  it("renders booking details in a mobile bottom sheet and closes it", async () => {
    isMobileRef.current = true;
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const drawer = await screen.findByTestId("inventory-booking-drawer");
    expect(within(drawer).getByText("Booking Details")).toBeInTheDocument();
    expect(within(drawer).getByText("ID: booking-1")).toBeInTheDocument();
    expect(within(drawer).getByText("$2100.00")).toBeInTheDocument();
    const previewImage = within(drawer).getByRole("img", { name: /ocean view deluxe suite preview/i });
    expect(previewImage).toHaveAttribute("src", "https://example.com/1.jpg");

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      const closedDrawer = screen.getByTestId("inventory-booking-drawer");
      expect(closedDrawer).toHaveAttribute("data-state", "closed");
      expect(screen.queryByText("ID: booking-1")).not.toBeInTheDocument();
    });
  });

  it("navigates to guest details when guest row is clicked in desktop booking dialog", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const dialog = await screen.findByRole("dialog");
    fireEvent.click(within(dialog).getByRole("button", { name: /open guest profile for sarah chen/i }));

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/guests?guestId=guest-1&guestName=Sarah+Chen");
    });
  });

  it("closes mobile booking drawer before navigating to guest details", async () => {
    isMobileRef.current = true;
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const drawer = await screen.findByTestId("inventory-booking-drawer");
    fireEvent.click(within(drawer).getByRole("button", { name: /open guest profile for sarah chen/i }));

    await waitFor(() => {
      const closedDrawer = screen.getByTestId("inventory-booking-drawer");
      expect(closedDrawer).toHaveAttribute("data-state", "closed");
    });

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/guests?guestId=guest-1&guestName=Sarah+Chen");
    });
  });

  it("shows room preview fallback in booking details when room has no images", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([{ ...baseRoom, images: [] }]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByLabelText(/ocean view deluxe suite preview image unavailable/i)).toBeInTheDocument();
  });

  it("shows room image preview on room hover", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([baseRoom]);
    fetchBookingsMock.mockResolvedValue([baseBooking]);

    render(<InventoryCalendar />);

    const trigger = await screen.findByTestId("inventory-room-hover-trigger-room-1");
    fireEvent.pointerEnter(trigger);
    fireEvent.mouseEnter(trigger);

    const content = await screen.findByTestId("inventory-room-hover-content-room-1");
    const previewImage = within(content).getByRole("img", { name: /ocean view deluxe suite preview/i });
    expect(previewImage).toHaveAttribute("src", "https://example.com/1.jpg");
  });

  it("ignores stale responses when selected property changes", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");

    let resolveFirstRooms: ((value: typeof baseRoom[]) => void) | null = null;
    let resolveFirstBookings: ((value: typeof baseBooking[]) => void) | null = null;
    const firstRooms = new Promise<typeof baseRoom[]>((resolve) => {
      resolveFirstRooms = resolve;
    });
    const firstBookings = new Promise<typeof baseBooking[]>((resolve) => {
      resolveFirstBookings = resolve;
    });

    fetchRoomsMock
      .mockImplementationOnce(() => firstRooms)
      .mockResolvedValueOnce([{ ...baseRoom, id: "room-2", name: "Garden Family Room", propertyId: "prop-2" }]);
    fetchBookingsMock
      .mockImplementationOnce(() => firstBookings)
      .mockResolvedValueOnce([
        { ...baseBooking, id: "booking-2", roomId: "room-2", propertyId: "prop-2", guestName: "Latest Guest" },
      ]);

    const { rerender } = render(<InventoryCalendar />);

    propertyStateRef.current.selectedPropertyId = "prop-2";
    rerender(<InventoryCalendar />);

    await waitFor(() => {
      expect(screen.getByText("Garden Family Room")).toBeInTheDocument();
      expect(screen.getByText("Latest Guest")).toBeInTheDocument();
    });

    resolveFirstRooms?.([baseRoom]);
    resolveFirstBookings?.([baseBooking]);

    await waitFor(() => {
      expect(screen.getByText("Latest Guest")).toBeInTheDocument();
      expect(screen.queryByText("Sarah Chen")).not.toBeInTheDocument();
    });
  });
});
