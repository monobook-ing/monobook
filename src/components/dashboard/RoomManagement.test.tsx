import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomManagement } from "@/components/dashboard/RoomManagement";

const fetchRoomsMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "all",
    properties: [{ id: "prop-1", name: "Mountain Lodge Retreat" }],
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchRooms: fetchRoomsMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

const apiRoom = {
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
    dateOverrides: { "2026-02-28": 350 },
    guestTiers: [{ minGuests: 1, maxGuests: 2, pricePerNight: 289 }],
  },
};

describe("RoomManagement", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchRoomsMock.mockReset();
    readAccessTokenMock.mockReset();
    propertyStateRef.current = {
      selectedPropertyId: "all",
      properties: [{ id: "prop-1", name: "Mountain Lodge Retreat" }],
    };
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    render(<RoomManagement />);

    expect(screen.getByTestId("rooms-select-property-state")).toBeInTheDocument();
    expect(fetchRoomsMock).not.toHaveBeenCalled();
  });

  it("fetches and renders rooms for a selected property", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([apiRoom]);

    render(<RoomManagement />);

    await waitFor(() => {
      expect(fetchRoomsMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(screen.getByText("Ocean View Deluxe Suite")).toBeInTheDocument();
    });
  });

  it("shows missing-token error when token is absent", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue(null);

    render(<RoomManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("rooms-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load rooms.")
      ).toBeInTheDocument();
    });
    expect(fetchRoomsMock).not.toHaveBeenCalled();
  });

  it("shows API error state when room fetch fails", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockRejectedValue(new Error("boom"));

    render(<RoomManagement />);

    await waitFor(() => {
      expect(screen.getByTestId("rooms-error-state")).toBeInTheDocument();
      expect(screen.getByText("boom")).toBeInTheDocument();
    });
  });

  it("keeps room controls read-only", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([apiRoom]);

    render(<RoomManagement />);

    await waitFor(() => {
      expect(screen.getByText("Ocean View Deluxe Suite")).toBeInTheDocument();
    });

    expect(screen.getByTestId("add-room-button")).toBeDisabled();

    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));

    expect(await screen.findByRole("button", { name: /sync now/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete/i })).toBeDisabled();
  });
});
