import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { GuestManagement } from "@/components/dashboard/GuestManagement";

const fetchGuestsMock = vi.hoisted(() => vi.fn());
const fetchGuestByIdMock = vi.hoisted(() => vi.fn());
const fetchRoomsMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const clipboardWriteTextMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "prop-1",
  },
}));
const isMobileRef = vi.hoisted(() => ({ current: false }));

vi.mock("@/lib/auth", () => ({
  fetchGuests: fetchGuestsMock,
  fetchGuestById: fetchGuestByIdMock,
  fetchRooms: fetchRoomsMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => isMobileRef.current,
}));

const guestSummaries = [
  {
    id: "guest-1",
    propertyId: "prop-1",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 415-555-0142",
    notes: "Prefers high floor, allergic to feathers",
    totalStays: 4,
    lastStayDate: "2026-02-20",
    totalSpent: 578,
    latestBooking: {
      id: "booking-1",
      roomId: "room-1",
      roomImage: "https://example.com/ocean-suite.jpg",
      roomName: "Ocean View Deluxe Suite",
      checkIn: "2026-02-18",
      checkOut: "2026-02-20",
      status: "confirmed",
      totalPrice: 578,
      aiHandled: true,
      source: "chatgpt",
    },
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-20T00:00:00Z",
  },
  {
    id: "guest-2",
    propertyId: "prop-1",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    phone: "+1 212-555-0198",
    notes: "",
    totalStays: 2,
    lastStayDate: "2026-02-18",
    totalSpent: 680,
    latestBooking: null,
    createdAt: "2026-02-01T00:00:00Z",
    updatedAt: "2026-02-18T00:00:00Z",
  },
];

const guestDetailsById = {
  "guest-1": {
    ...guestSummaries[0],
    bookings: [
      {
        id: "booking-1",
        guestId: "guest-1",
        roomId: "room-1",
        roomName: "Ocean View Deluxe Suite",
        propertyId: "prop-1",
        checkIn: "2026-02-18",
        checkOut: "2026-02-20",
        status: "confirmed",
        totalPrice: 578,
        aiHandled: true,
        source: "chatgpt",
        conversationId: "conv-1",
      },
    ],
    conversations: [
      {
        id: "conv-1",
        guestId: "guest-1",
        channel: "widget",
        startedAt: "2026-02-17T09:30:00Z",
        messages: [
          {
            role: "guest",
            text: "Hi there",
            timestamp: "2026-02-17T09:30:00Z",
          },
        ],
      },
    ],
  },
  "guest-2": {
    ...guestSummaries[1],
    bookings: [],
    conversations: [],
  },
};

function LocationSearchProbe() {
  const location = useLocation();
  return <p data-testid="location-search">{location.search}</p>;
}

const renderGuestManagement = (entry: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route
          path="/guests"
          element={
            <>
              <GuestManagement />
              <LocationSearchProbe />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  );

describe("GuestManagement URL sync", () => {
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
    if (!HTMLElement.prototype.scrollIntoView) {
      HTMLElement.prototype.scrollIntoView = () => {};
    }
    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: clipboardWriteTextMock,
      },
      configurable: true,
    });

    fetchGuestsMock.mockReset();
    fetchGuestByIdMock.mockReset();
    fetchRoomsMock.mockReset();
    readAccessTokenMock.mockReset();
    clipboardWriteTextMock.mockReset();
    propertyStateRef.current = { selectedPropertyId: "prop-1" };
    isMobileRef.current = false;

    readAccessTokenMock.mockReturnValue("jwt");
    fetchGuestsMock.mockResolvedValue(guestSummaries);
    fetchRoomsMock.mockResolvedValue([
      {
        id: "room-1",
        propertyId: "prop-1",
        name: "Ocean View Deluxe Suite",
        type: "suite",
        description: "Ocean view",
        images: [],
        pricePerNight: 289,
        maxGuests: 3,
        bedConfig: "King",
        amenities: [],
        source: "manual",
        syncEnabled: false,
        status: "active",
        pricing: {
          guestTiers: [],
          dateOverrides: {},
        },
      },
    ]);
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestDetailsById[guestId])
    );
  });

  it("loads guests without filters by default", async () => {
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");

    expect(fetchGuestsMock).toHaveBeenCalledWith("jwt", "prop-1", {
      search: "",
      roomId: undefined,
      status: undefined,
    });
  });

  it("does not submit search on each keypress and submits on Enter", async () => {
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");
    const initialCalls = fetchGuestsMock.mock.calls.length;

    const searchInput = screen.getByPlaceholderText("Search guests...");
    fireEvent.change(searchInput, { target: { value: "sarah" } });
    expect(fetchGuestsMock).toHaveBeenCalledTimes(initialCalls);

    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    await waitFor(() =>
      expect(fetchGuestsMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        search: "sarah",
        roomId: undefined,
        status: undefined,
      })
    );
  });

  it("submits search on blur", async () => {
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");

    const searchInput = screen.getByPlaceholderText("Search guests...");
    fireEvent.change(searchInput, { target: { value: "marcus" } });
    fireEvent.blur(searchInput);

    await waitFor(() =>
      expect(fetchGuestsMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        search: "marcus",
        roomId: undefined,
        status: undefined,
      })
    );
  });

  it("applies room and status filters immediately and combines with search", async () => {
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");

    fireEvent.click(screen.getByTestId("guests-room-filter"));
    fireEvent.click(await screen.findByRole("option", { name: "Ocean View Deluxe Suite" }));
    await waitFor(() =>
      expect(fetchGuestsMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        search: "",
        roomId: "room-1",
        status: undefined,
      })
    );

    fireEvent.click(screen.getByTestId("guests-status-filter"));
    fireEvent.click(await screen.findByRole("option", { name: "AI Pending" }));
    await waitFor(() =>
      expect(fetchGuestsMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        search: "",
        roomId: "room-1",
        status: "ai_pending",
      })
    );

    const searchInput = screen.getByPlaceholderText("Search guests...");
    fireEvent.change(searchInput, { target: { value: "vip" } });
    fireEvent.keyDown(searchInput, { key: "Enter", code: "Enter" });
    await waitFor(() =>
      expect(fetchGuestsMock).toHaveBeenLastCalledWith("jwt", "prop-1", {
        search: "vip",
        roomId: "room-1",
        status: "ai_pending",
      })
    );
  });

  it("opens guest detail from guestId query", async () => {
    renderGuestManagement("/guests?guestId=guest-1");

    await waitFor(() => {
      expect(fetchGuestByIdMock).toHaveBeenCalledWith("jwt", "prop-1", "guest-1");
      expect(screen.getByText("Prefers high floor, allergic to feathers")).toBeInTheDocument();
    });

    expect(screen.getByTestId("location-search")).toHaveTextContent("?guestId=guest-1");
  });

  it("syncs URL when opening and closing detail", async () => {
    isMobileRef.current = true;
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    await waitFor(() => {
      expect(fetchGuestByIdMock).toHaveBeenCalledWith("jwt", "prop-1", "guest-1");
      expect(screen.getByTestId("location-search")).toHaveTextContent("?guestId=guest-1");
    });

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

    await waitFor(() => {
      expect(screen.getByTestId("location-search")).toHaveTextContent("");
      expect(screen.queryByText("Prefers high floor, allergic to feathers")).not.toBeInTheDocument();
    });
  });

  it("uses glass bottom-sheet styles for mobile guest detail drawer", async () => {
    isMobileRef.current = true;
    renderGuestManagement("/guests");

    await screen.findByText("Sarah Chen");
    fireEvent.click(screen.getByText("Sarah Chen"));

    const drawer = await screen.findByTestId("guest-detail-drawer");
    expect(drawer).toHaveClass("rounded-t-[32px]");
    expect(drawer).toHaveClass("bg-background/80");
    expect(drawer).toHaveClass("backdrop-blur-2xl");
    expect(drawer).toHaveClass("max-h-[calc(100dvh-1rem)]");
    expect(drawer).not.toHaveClass("pb-[max(1rem,env(safe-area-inset-bottom))]");
    expect(drawer.querySelector("svg.lucide-x")).toBeNull();
  });

  it("falls back to guestName query and canonicalizes to guestId", async () => {
    renderGuestManagement("/guests?guestId=unknown&guestName=Sarah%20Chen");

    await waitFor(() => {
      expect(fetchGuestByIdMock).toHaveBeenCalledWith("jwt", "prop-1", "guest-1");
      expect(screen.getByTestId("location-search")).toHaveTextContent("?guestId=guest-1");
    });
  });

  it("clears invalid guest query params without opening detail", async () => {
    renderGuestManagement("/guests?guestId=unknown&guestName=Unknown%20Guest");

    await screen.findByText("Sarah Chen");

    await waitFor(() => {
      expect(screen.getByTestId("location-search")).toHaveTextContent("");
      expect(fetchGuestByIdMock).not.toHaveBeenCalled();
      expect(screen.queryByText("Prefers high floor, allergic to feathers")).not.toBeInTheDocument();
    });
  });

  it("shows copy icons only for available email and phone fields", async () => {
    const firstRender = renderGuestManagement("/guests?guestId=guest-1");

    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy phone" })).toBeInTheDocument();

    firstRender.unmount();
    const guestTwoWithoutPhone = {
      ...guestDetailsById["guest-2"],
      phone: null,
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-2" ? guestTwoWithoutPhone : guestDetailsById[guestId])
    );
    renderGuestManagement("/guests?guestId=guest-2");

    await waitFor(() => {
      expect(fetchGuestByIdMock).toHaveBeenCalledWith("jwt", "prop-1", "guest-2");
    });
    expect(screen.queryByRole("button", { name: "Copy phone" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Copy email" })).toBeInTheDocument();
  });

  it("copies email and phone and resets copied state icon", async () => {
    clipboardWriteTextMock.mockResolvedValue(undefined);
    renderGuestManagement("/guests?guestId=guest-1");

    await screen.findByText("Prefers high floor, allergic to feathers");

    const emailCopyButton = screen.getByRole("button", { name: "Copy email" });
    fireEvent.click(emailCopyButton);

    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledWith("sarah.chen@example.com");
    });
    expect(emailCopyButton.querySelector("svg.lucide-check")).not.toBeNull();

    await new Promise((resolve) => setTimeout(resolve, 1600));
    await waitFor(() => {
      expect(emailCopyButton.querySelector("svg.lucide-copy")).not.toBeNull();
    });

    const phoneCopyButton = screen.getByRole("button", { name: "Copy phone" });
    fireEvent.click(phoneCopyButton);
    await waitFor(() => {
      expect(clipboardWriteTextMock).toHaveBeenCalledWith("+1 415-555-0142");
    });
  });

  it("renders latest booking top image preloader when room image exists", async () => {
    renderGuestManagement("/guests?guestId=guest-1");

    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByTestId("latest-booking-room-image-container")).toBeInTheDocument();
    expect(screen.getByTestId("latest-booking-room-image-skeleton")).toBeInTheDocument();
    const roomImage = screen.getByTestId("latest-booking-room-image");
    expect(roomImage).toHaveAttribute("src", "https://example.com/ocean-suite.jpg");

    fireEvent.load(roomImage);
    await waitFor(() => {
      expect(screen.queryByTestId("latest-booking-room-image-skeleton")).not.toBeInTheDocument();
    });
  });

  it("renders provider label for gemini source", async () => {
    const guestWithGeminiSource = {
      ...guestDetailsById["guest-1"],
      latestBooking: {
        ...guestDetailsById["guest-1"].latestBooking,
        source: "Gemini",
      },
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-1" ? guestWithGeminiSource : guestDetailsById[guestId])
    );

    renderGuestManagement("/guests?guestId=guest-1");
    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByText("Gemini")).toBeInTheDocument();
  });

  it("renders provider label for claude source", async () => {
    const guestWithClaudeSource = {
      ...guestDetailsById["guest-1"],
      latestBooking: {
        ...guestDetailsById["guest-1"].latestBooking,
        source: "claude",
      },
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-1" ? guestWithClaudeSource : guestDetailsById[guestId])
    );

    renderGuestManagement("/guests?guestId=guest-1");
    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByText("Claude")).toBeInTheDocument();
  });

  it("renders provider label for chatgpt source", async () => {
    renderGuestManagement("/guests?guestId=guest-1");

    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByText("ChatGPT")).toBeInTheDocument();
  });

  it("falls back to generic ai label for unknown source", async () => {
    const guestWithUnknownSource = {
      ...guestDetailsById["guest-1"],
      latestBooking: {
        ...guestDetailsById["guest-1"].latestBooking,
        source: "widget",
      },
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-1" ? guestWithUnknownSource : guestDetailsById[guestId])
    );

    renderGuestManagement("/guests?guestId=guest-1");
    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByText("Booked via AI")).toBeInTheDocument();
  });

  it("falls back to generic ai label for null source", async () => {
    const guestWithNullSource = {
      ...guestDetailsById["guest-1"],
      latestBooking: {
        ...guestDetailsById["guest-1"].latestBooking,
        source: null,
      },
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-1" ? guestWithNullSource : guestDetailsById[guestId])
    );

    renderGuestManagement("/guests?guestId=guest-1");
    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.getByText("Booked via AI")).toBeInTheDocument();
  });

  it("does not render latest booking room image section when room image is missing", async () => {
    const guestWithoutImage = {
      ...guestDetailsById["guest-1"],
      latestBooking: {
        ...guestDetailsById["guest-1"].latestBooking,
        roomImage: null,
      },
    };
    fetchGuestByIdMock.mockImplementation(
      (_token: string, _propertyId: string, guestId: keyof typeof guestDetailsById) =>
        Promise.resolve(guestId === "guest-1" ? guestWithoutImage : guestDetailsById[guestId])
    );
    renderGuestManagement("/guests?guestId=guest-1");

    await screen.findByText("Prefers high floor, allergic to feathers");
    expect(screen.queryByTestId("latest-booking-room-image-container")).not.toBeInTheDocument();
    expect(screen.queryByTestId("latest-booking-room-image")).not.toBeInTheDocument();
  });
});
