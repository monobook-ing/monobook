import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { RoomManagement } from "@/components/dashboard/RoomManagement";

const fetchRoomsMock = vi.hoisted(() => vi.fn());
const fetchRoomByIdMock = vi.hoisted(() => vi.fn());
const deleteRoomMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const toastSuccessMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "all",
    properties: [{ id: "prop-1", name: "Mountain Lodge Retreat" }],
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchRooms: fetchRoomsMock,
  fetchRoomById: fetchRoomByIdMock,
  deleteRoom: deleteRoomMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
    success: toastSuccessMock,
  },
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
    fetchRoomByIdMock.mockReset();
    deleteRoomMock.mockReset();
    readAccessTokenMock.mockReset();
    toastErrorMock.mockReset();
    toastSuccessMock.mockReset();
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
    fetchRoomByIdMock.mockResolvedValue(apiRoom);

    render(<RoomManagement />);

    await waitFor(() => {
      expect(screen.getByText("Ocean View Deluxe Suite")).toBeInTheDocument();
    });

    expect(screen.getByTestId("add-room-button")).toBeDisabled();

    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));

    expect(await screen.findByRole("button", { name: /sync now/i })).toBeDisabled();
    expect(screen.getByRole("button", { name: /delete/i })).toBeEnabled();
  });

  it("shows delete confirmation and deletes room on yes", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([apiRoom]);
    fetchRoomByIdMock.mockResolvedValue(apiRoom);
    deleteRoomMock.mockResolvedValue({ message: "Room deleted", id: "room-1" });

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");
    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));

    await screen.findByRole("button", { name: /sync now/i });

    fireEvent.click(screen.getByRole("button", { name: /^delete$/i }));

    expect(screen.getByText("Are you sure you want to delete room?")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^yes$/i }));

    await waitFor(() => {
      expect(deleteRoomMock).toHaveBeenCalledWith("jwt", "prop-1", "room-1");
      expect(toastSuccessMock).toHaveBeenCalledWith("Room deleted");
    });

    await waitFor(() => {
      expect(screen.queryByText("Ocean View Deluxe Suite")).not.toBeInTheDocument();
      expect(screen.getByTestId("rooms-empty-state")).toBeInTheDocument();
    });
  });

  it("opens room details with loading skeleton and then renders fetched room detail", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([apiRoom]);
    fetchRoomByIdMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(apiRoom), 0);
        })
    );

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");

    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));

    expect(screen.getByRole("dialog")).toBeVisible();
    expect(screen.getByTestId("room-detail-loading-state")).toBeInTheDocument();
    expect(screen.getByTestId("room-detail-loading-hero")).toBeInTheDocument();
    expect(screen.getByTestId("room-detail-loading-thumbnails")).toBeInTheDocument();
    expect(screen.getByTestId("room-detail-loading-property-card")).toBeInTheDocument();
    expect(screen.getByTestId("room-detail-loading-pricing-card")).toBeInTheDocument();
    expect(screen.getByTestId("room-detail-loading-amenities")).toBeInTheDocument();

    await waitFor(() => {
      expect(fetchRoomByIdMock).toHaveBeenCalledWith("jwt", "prop-1", "room-1");
      expect(screen.queryByTestId("room-detail-loading-state")).not.toBeInTheDocument();
    });
  });

  it("shows inline error and retries room detail fetch", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([apiRoom]);
    fetchRoomByIdMock
      .mockRejectedValueOnce(new Error("detail failed"))
      .mockResolvedValueOnce(apiRoom);

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");

    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));

    await waitFor(() => {
      expect(screen.getByTestId("room-detail-error-state")).toBeInTheDocument();
      expect(screen.getByText("detail failed")).toBeInTheDocument();
    });
    expect(toastErrorMock).toHaveBeenCalledWith("detail failed");

    fireEvent.click(screen.getByRole("button", { name: /retry/i }));

    await waitFor(() => {
      expect(fetchRoomByIdMock).toHaveBeenCalledTimes(2);
      expect(screen.queryByTestId("room-detail-error-state")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: /sync now/i })).toBeInTheDocument();
    });
  });

  it("keeps latest clicked room detail when earlier response resolves later", async () => {
    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");

    const secondRoom = {
      ...apiRoom,
      id: "room-2",
      name: "Garden Family Room",
      bedConfig: "2 Queen Beds",
    };

    let resolveFirst: ((value: typeof apiRoom) => void) | null = null;
    fetchRoomsMock.mockResolvedValue([apiRoom, secondRoom]);
    fetchRoomByIdMock
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveFirst = resolve;
          })
      )
      .mockResolvedValueOnce(secondRoom);

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");
    await screen.findByText("Garden Family Room");

    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));
    fireEvent.click(screen.getByText("Garden Family Room"));

    await waitFor(() => {
      expect(fetchRoomByIdMock).toHaveBeenNthCalledWith(2, "jwt", "prop-1", "room-2");
      expect(screen.getByText(/2 Queen Beds/i)).toBeInTheDocument();
    });

    resolveFirst?.(apiRoom);

    await waitFor(() => {
      expect(screen.getByText(/2 Queen Beds/i)).toBeInTheDocument();
      expect(screen.queryByText(/1 King Bed/i)).not.toBeInTheDocument();
      expect(screen.queryByText("detail failed")).not.toBeInTheDocument();
    });
  });

  it("renders all room images as thumbnails including first image", async () => {
    const multiImageRoom = {
      ...apiRoom,
      images: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
        "https://example.com/4.jpg",
        "https://example.com/5.jpg",
      ],
    };

    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([multiImageRoom]);
    fetchRoomByIdMock.mockResolvedValue(multiImageRoom);

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");
    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));
    await screen.findByRole("button", { name: /sync now/i });

    expect(screen.getByTestId("room-image-thumbnail-strip")).toBeInTheDocument();
    expect(screen.getAllByRole("button", { name: /ocean view deluxe suite preview/i })).toHaveLength(5);
  });

  it("clicking thumbnails updates the main preview image and active state", async () => {
    const multiImageRoom = {
      ...apiRoom,
      images: [
        "https://example.com/1.jpg",
        "https://example.com/2.jpg",
        "https://example.com/3.jpg",
      ],
    };

    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([multiImageRoom]);
    fetchRoomByIdMock.mockResolvedValue(multiImageRoom);

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");
    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));
    await screen.findByRole("button", { name: /sync now/i });

    const mainImage = screen.getByTestId("room-detail-main-image");
    expect(mainImage).toHaveAttribute("src", "https://example.com/1.jpg");

    const thirdThumbnail = screen.getByRole("button", { name: /ocean view deluxe suite preview 3/i });
    fireEvent.click(thirdThumbnail);

    expect(mainImage).toHaveAttribute("src", "https://example.com/3.jpg");
    expect(thirdThumbnail).toHaveAttribute("aria-pressed", "true");

    const firstThumbnail = screen.getByRole("button", { name: /ocean view deluxe suite preview 1/i });
    fireEvent.click(firstThumbnail);

    expect(mainImage).toHaveAttribute("src", "https://example.com/1.jpg");
    expect(firstThumbnail).toHaveAttribute("aria-pressed", "true");
  });

  it("shows fallback main image when room has no images and no thumbnail rail", async () => {
    const noImageRoom = {
      ...apiRoom,
      images: [],
    };

    propertyStateRef.current.selectedPropertyId = "prop-1";
    readAccessTokenMock.mockReturnValue("jwt");
    fetchRoomsMock.mockResolvedValue([noImageRoom]);
    fetchRoomByIdMock.mockResolvedValue(noImageRoom);

    render(<RoomManagement />);

    await screen.findByText("Ocean View Deluxe Suite");
    fireEvent.click(screen.getByText("Ocean View Deluxe Suite"));
    await screen.findByRole("button", { name: /sync now/i });

    expect(screen.getByTestId("room-detail-main-image-fallback")).toBeInTheDocument();
    expect(screen.queryByTestId("room-image-thumbnail-strip")).not.toBeInTheDocument();
  });
});
