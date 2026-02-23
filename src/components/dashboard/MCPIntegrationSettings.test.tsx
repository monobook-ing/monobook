import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MCPIntegrationSettings } from "@/components/dashboard/MCPIntegrationSettings";

const fetchHostProfileMock = vi.hoisted(() => vi.fn());
const updateHostProfileMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "prop-1",
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchHostProfile: fetchHostProfileMock,
  updateHostProfile: updateHostProfileMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

const hostProfile = {
  id: "hp-uuid",
  propertyId: "prop-1",
  name: "StayAI Host",
  location: "Miami, Florida",
  bio: "We are passionate hosts who love creating memorable stays...",
  avatarUrl: "https://example.com/avatar.jpg",
  avatarInitials: "SH",
  reviews: 142,
  rating: 4.92,
  yearsHosting: 5,
  superhost: true,
  createdAt: "2026-02-22T10:00:00Z",
  updatedAt: "2026-02-22T10:00:00Z",
};

describe("MCPIntegrationSettings Host Details", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchHostProfileMock.mockReset();
    updateHostProfileMock.mockReset();
    readAccessTokenMock.mockReset();
    propertyStateRef.current = { selectedPropertyId: "prop-1" };
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    propertyStateRef.current.selectedPropertyId = "all";

    render(<MCPIntegrationSettings />);

    expect(screen.getByTestId("host-details-select-property-state")).toBeInTheDocument();
    expect(fetchHostProfileMock).not.toHaveBeenCalled();
  });

  it("shows missing-token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByTestId("host-details-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load host profile.")
      ).toBeInTheDocument();
    });
    expect(fetchHostProfileMock).not.toHaveBeenCalled();
  });

  it("fetches and renders host profile for selected property", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(fetchHostProfileMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(screen.getByText("StayAI Host")).toBeInTheDocument();
      expect(screen.getByText("Miami, Florida")).toBeInTheDocument();
      expect(screen.getByText("142")).toBeInTheDocument();
      expect(screen.getByText("4.92")).toBeInTheDocument();
    });
  });

  it("saves editable fields and reflects API response", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    updateHostProfileMock.mockResolvedValue({
      ...hostProfile,
      name: "StayAI Host Updated",
      location: "Miami Beach, Florida",
      bio: "Updated bio text",
    });

    render(<MCPIntegrationSettings />);

    await screen.findByText("StayAI Host");

    fireEvent.click(screen.getByRole("button", { name: /edit/i }));

    fireEvent.change(screen.getByLabelText("Name"), {
      target: { value: "StayAI Host Updated" },
    });
    fireEvent.change(screen.getByLabelText("Location"), {
      target: { value: "Miami Beach, Florida" },
    });
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Updated bio text" },
    });

    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(updateHostProfileMock).toHaveBeenCalledWith("jwt", "prop-1", {
        name: "StayAI Host Updated",
        location: "Miami Beach, Florida",
        bio: "Updated bio text",
      });
      expect(screen.getByText("StayAI Host Updated")).toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /^save$/i })).not.toBeInTheDocument();
    });
  });

  it("shows save error and stays in edit mode when PUT fails", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    updateHostProfileMock.mockRejectedValue(new Error("save failed"));

    render(<MCPIntegrationSettings />);

    await screen.findByText("StayAI Host");
    fireEvent.click(screen.getByRole("button", { name: /edit/i }));
    fireEvent.change(screen.getByLabelText("Bio"), {
      target: { value: "Will fail" },
    });
    fireEvent.click(screen.getByRole("button", { name: /^save$/i }));

    await waitFor(() => {
      expect(screen.getByTestId("host-details-save-error-state")).toBeInTheDocument();
      expect(screen.getByText("save failed")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /^save$/i })).toBeInTheDocument();
      expect(screen.getByLabelText("Bio")).toHaveValue("Will fail");
    });
  });

  it("keeps sync buttons disabled and non-mutating", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);

    render(<MCPIntegrationSettings />);

    await screen.findByText("StayAI Host");
    expect(screen.getByTestId("host-sync-airbnb-button")).toBeDisabled();
    expect(screen.getByTestId("host-sync-booking-button")).toBeDisabled();
    expect(screen.getByText("Coming soon")).toBeInTheDocument();
    expect(screen.getByText("142")).toBeInTheDocument();
  });

  it("renders avatar image when avatar_url exists and falls back to initials when missing", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValueOnce(hostProfile);

    const { rerender } = render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByAltText("StayAI Host")).toBeInTheDocument();
      expect(screen.queryByText("SH")).not.toBeInTheDocument();
    });

    fetchHostProfileMock.mockResolvedValueOnce({
      ...hostProfile,
      propertyId: "prop-2",
      avatarUrl: null,
      avatarInitials: "ZZ",
    });

    propertyStateRef.current.selectedPropertyId = "prop-2";
    rerender(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByText("ZZ")).toBeInTheDocument();
    });
  });
});
