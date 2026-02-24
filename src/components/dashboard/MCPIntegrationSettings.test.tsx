import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MCPIntegrationSettings } from "@/components/dashboard/MCPIntegrationSettings";

const fetchHostProfileMock = vi.hoisted(() => vi.fn());
const updateHostProfileMock = vi.hoisted(() => vi.fn());
const fetchKnowledgeFilesMock = vi.hoisted(() => vi.fn());
const createKnowledgeFileMock = vi.hoisted(() => vi.fn());
const deleteKnowledgeFileMock = vi.hoisted(() => vi.fn());
const fetchPmsConnectionsMock = vi.hoisted(() => vi.fn());
const updatePmsConnectionMock = vi.hoisted(() => vi.fn());
const fetchPaymentConnectionsMock = vi.hoisted(() => vi.fn());
const updatePaymentConnectionMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const toastErrorMock = vi.hoisted(() => vi.fn());
const triggerSelectionHapticMock = vi.hoisted(() => vi.fn());
const propertyStateRef = vi.hoisted(() => ({
  current: {
    selectedPropertyId: "prop-1",
  },
}));

vi.mock("sonner", () => ({
  toast: {
    error: toastErrorMock,
  },
}));

vi.mock("@/lib/auth", () => ({
  fetchHostProfile: fetchHostProfileMock,
  updateHostProfile: updateHostProfileMock,
  fetchKnowledgeFiles: fetchKnowledgeFilesMock,
  createKnowledgeFile: createKnowledgeFileMock,
  deleteKnowledgeFile: deleteKnowledgeFileMock,
  fetchPmsConnections: fetchPmsConnectionsMock,
  updatePmsConnection: updatePmsConnectionMock,
  fetchPaymentConnections: fetchPaymentConnectionsMock,
  updatePaymentConnection: updatePaymentConnectionMock,
  readAccessToken: readAccessTokenMock,
}));

vi.mock("@/contexts/PropertyContext", () => ({
  useProperty: () => propertyStateRef.current,
}));

vi.mock("@/lib/haptics", () => ({
  triggerSelectionHaptic: triggerSelectionHapticMock,
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

const knowledgeFiles = [
  {
    id: "file-uuid-1",
    propertyId: "prop-1",
    name: "Hotel_Policy_2026.pdf",
    size: "2.4 MB",
    storagePath: null,
    mimeType: "application/pdf",
    createdAt: "2026-02-10T00:00:00Z",
  },
];

const pmsConnections = [
  {
    id: "pms-1",
    propertyId: "prop-1",
    provider: "mews",
    enabled: false,
    config: {},
    createdAt: "2026-02-23T00:00:00Z",
    updatedAt: "2026-02-23T00:00:00Z",
  },
  {
    id: "pms-2",
    propertyId: "prop-1",
    provider: "cloudbeds",
    enabled: true,
    config: {},
    createdAt: "2026-02-23T00:00:00Z",
    updatedAt: "2026-02-23T00:00:00Z",
  },
];

const paymentConnections = [
  {
    id: "pay-1",
    propertyId: "prop-1",
    provider: "stripe",
    enabled: false,
    config: {},
    createdAt: "2026-02-23T00:00:00Z",
    updatedAt: "2026-02-23T00:00:00Z",
  },
  {
    id: "pay-2",
    propertyId: "prop-1",
    provider: "jpmorgan",
    enabled: true,
    config: {},
    createdAt: "2026-02-23T00:00:00Z",
    updatedAt: "2026-02-23T00:00:00Z",
  },
];

describe("MCPIntegrationSettings Host Details", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchHostProfileMock.mockReset();
    updateHostProfileMock.mockReset();
    fetchKnowledgeFilesMock.mockReset();
    createKnowledgeFileMock.mockReset();
    deleteKnowledgeFileMock.mockReset();
    fetchPmsConnectionsMock.mockReset();
    updatePmsConnectionMock.mockReset();
    fetchPaymentConnectionsMock.mockReset();
    updatePaymentConnectionMock.mockReset();
    readAccessTokenMock.mockReset();
    toastErrorMock.mockReset();
    triggerSelectionHapticMock.mockReset();
    propertyStateRef.current = { selectedPropertyId: "prop-1" };
    fetchKnowledgeFilesMock.mockResolvedValue(knowledgeFiles);
    createKnowledgeFileMock.mockResolvedValue(knowledgeFiles[0]);
    deleteKnowledgeFileMock.mockResolvedValue({ message: "File deleted", id: "file-uuid-1" });
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);
    updatePmsConnectionMock.mockImplementation(async (_token, _propertyId, provider, input) => ({
      ...(pmsConnections.find((item) => item.provider === provider) ?? pmsConnections[0]),
      provider,
      enabled: input.enabled,
    }));
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
    updatePaymentConnectionMock.mockImplementation(async (_token, _propertyId, provider, input) => ({
      ...(paymentConnections.find((item) => item.provider === provider) ?? paymentConnections[0]),
      provider,
      enabled: input.enabled,
    }));
  });

  it("shows select-property state and does not fetch when all properties is selected", () => {
    propertyStateRef.current.selectedPropertyId = "all";

    render(<MCPIntegrationSettings />);

    expect(screen.getByTestId("host-details-select-property-state")).toBeInTheDocument();
    expect(fetchHostProfileMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("pms-select-property-state")).toBeInTheDocument();
    expect(fetchPmsConnectionsMock).not.toHaveBeenCalled();
    expect(screen.getByTestId("payment-select-property-state")).toBeInTheDocument();
    expect(fetchPaymentConnectionsMock).not.toHaveBeenCalled();
  });

  it("shows PMS missing-token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByTestId("pms-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load PMS connections.")
      ).toBeInTheDocument();
    });
    expect(fetchPmsConnectionsMock).not.toHaveBeenCalled();
  });

  it("shows payment missing-token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByTestId("payment-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load payment connections.")
      ).toBeInTheDocument();
    });
    expect(fetchPaymentConnectionsMock).not.toHaveBeenCalled();
  });

  it("fetches and renders PMS connections for selected property", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(fetchPmsConnectionsMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(screen.getByTestId("pms-toggle-mews")).toBeInTheDocument();
      expect(screen.getByTestId("pms-toggle-cloudbeds")).toBeInTheDocument();
    });
  });

  it("fetches and renders payment provider toggles for all catalog providers", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(fetchPaymentConnectionsMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(screen.getByTestId("payment-toggle-stripe")).toBeInTheDocument();
      expect(screen.getByTestId("payment-toggle-jpmorgan")).toBeInTheDocument();
      expect(screen.getByTestId("payment-toggle-ipay")).toBeInTheDocument();
      expect(screen.getByTestId("payment-toggle-liqpay")).toBeInTheDocument();
      expect(screen.getByTestId("payment-toggle-monobank")).toBeInTheDocument();
    });
  });

  it("opens disable confirmation dialog before disabling an enabled payment provider", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("payment-toggle-jpmorgan");
    fireEvent.click(screen.getByTestId("payment-toggle-jpmorgan"));

    expect(screen.getByText("Disable JP Morgan?")).toBeInTheDocument();
    expect(updatePaymentConnectionMock).not.toHaveBeenCalled();
  });

  it("does not disable payment provider when confirmation is canceled", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("payment-toggle-jpmorgan");
    fireEvent.click(screen.getByTestId("payment-toggle-jpmorgan"));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByText("Disable JP Morgan?")).not.toBeInTheDocument();
      expect(updatePaymentConnectionMock).not.toHaveBeenCalled();
      expect(triggerSelectionHapticMock).not.toHaveBeenCalled();
    });
  });

  it("disables payment connection after confirmation", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
    updatePaymentConnectionMock.mockResolvedValue({
      ...paymentConnections[1],
      enabled: false,
    });

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("payment-toggle-jpmorgan");
    fireEvent.click(screen.getByTestId("payment-toggle-jpmorgan"));
    fireEvent.click(screen.getByRole("button", { name: "Disable" }));

    await waitFor(() => {
      expect(updatePaymentConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "jpmorgan", {
        enabled: false,
      });
      expect(triggerSelectionHapticMock).toHaveBeenCalledTimes(1);
    });
  });

  it("optimistically enables payment connection and keeps updated value on success", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
    updatePaymentConnectionMock.mockResolvedValue({
      ...paymentConnections[0],
      enabled: true,
    });

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("payment-toggle-stripe");
    fireEvent.click(screen.getByTestId("payment-toggle-stripe"));

    await waitFor(() => {
      expect(updatePaymentConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "stripe", {
        enabled: true,
      });
      expect(screen.getByTestId("payment-toggle-stripe")).toBeInTheDocument();
      expect(triggerSelectionHapticMock).toHaveBeenCalledTimes(1);
    });
  });

  it("rolls back payment toggle and shows toast when update fails", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
    updatePaymentConnectionMock.mockRejectedValue(new Error("payment update failed"));

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("payment-toggle-stripe");
    fireEvent.click(screen.getByTestId("payment-toggle-stripe"));

    await waitFor(() => {
      expect(updatePaymentConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "stripe", {
        enabled: true,
      });
      expect(toastErrorMock).toHaveBeenCalledWith("payment update failed");
      expect(triggerSelectionHapticMock).not.toHaveBeenCalled();
    });
  });

  it("disables only the pending payment provider while request is in flight", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
    let resolveUpdate: ((value: unknown) => void) | null = null;
    updatePaymentConnectionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    render(<MCPIntegrationSettings />);

    const stripeToggle = await screen.findByTestId("payment-toggle-stripe");
    const jpMorganToggle = screen.getByTestId("payment-toggle-jpmorgan");
    fireEvent.click(stripeToggle);

    await waitFor(() => {
      expect(stripeToggle).toBeDisabled();
      expect(jpMorganToggle).not.toBeDisabled();
    });

    resolveUpdate?.({
      ...paymentConnections[0],
      enabled: true,
    });

    await waitFor(() => {
      expect(stripeToggle).not.toBeDisabled();
    });
  });

  it("renders missing API payment providers as disabled and still toggle-capable", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPaymentConnectionsMock.mockResolvedValue([paymentConnections[0]]);
    updatePaymentConnectionMock.mockResolvedValue({
      id: "pay-9",
      propertyId: "prop-1",
      provider: "monobank",
      enabled: true,
      config: {},
      createdAt: "2026-02-23T00:00:00Z",
      updatedAt: "2026-02-23T10:00:00Z",
    });

    render(<MCPIntegrationSettings />);

    const monobankToggle = await screen.findByTestId("payment-toggle-monobank");
    fireEvent.click(monobankToggle);

    await waitFor(() => {
      expect(updatePaymentConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "monobank", {
        enabled: true,
      });
    });
  });

  it("optimistically toggles PMS connection and keeps updated value on success", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);
    updatePmsConnectionMock.mockResolvedValue({
      ...pmsConnections[0],
      enabled: true,
    });

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("pms-toggle-mews");
    fireEvent.click(screen.getByTestId("pms-toggle-mews"));

    await waitFor(() => {
      expect(updatePmsConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "mews", {
        enabled: true,
      });
      expect(screen.getByTestId("pms-toggle-mews")).toBeInTheDocument();
      expect(triggerSelectionHapticMock).toHaveBeenCalledTimes(1);
    });
  });

  it("rolls back PMS toggle and shows toast when update fails", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);
    updatePmsConnectionMock.mockRejectedValue(new Error("pms update failed"));

    render(<MCPIntegrationSettings />);

    await screen.findByTestId("pms-toggle-mews");
    fireEvent.click(screen.getByTestId("pms-toggle-mews"));

    await waitFor(() => {
      expect(updatePmsConnectionMock).toHaveBeenCalledWith("jwt", "prop-1", "mews", {
        enabled: true,
      });
      expect(toastErrorMock).toHaveBeenCalledWith("pms update failed");
      expect(triggerSelectionHapticMock).not.toHaveBeenCalled();
    });
  });

  it("disables only the pending PMS provider while request is in flight", async () => {
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);
    let resolveUpdate: ((value: unknown) => void) | null = null;
    updatePmsConnectionMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveUpdate = resolve;
        })
    );

    render(<MCPIntegrationSettings />);

    const mewsToggle = await screen.findByTestId("pms-toggle-mews");
    const cloudbedsToggle = screen.getByTestId("pms-toggle-cloudbeds");
    fireEvent.click(mewsToggle);

    await waitFor(() => {
      expect(mewsToggle).toBeDisabled();
      expect(cloudbedsToggle).not.toBeDisabled();
    });

    resolveUpdate?.({
      ...pmsConnections[0],
      enabled: true,
    });

    await waitFor(() => {
      expect(mewsToggle).not.toBeDisabled();
    });
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

describe("MCPIntegrationSettings Knowledge Base", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchHostProfileMock.mockReset();
    updateHostProfileMock.mockReset();
    fetchKnowledgeFilesMock.mockReset();
    createKnowledgeFileMock.mockReset();
    deleteKnowledgeFileMock.mockReset();
    fetchPmsConnectionsMock.mockReset();
    updatePmsConnectionMock.mockReset();
    fetchPaymentConnectionsMock.mockReset();
    updatePaymentConnectionMock.mockReset();
    readAccessTokenMock.mockReset();
    toastErrorMock.mockReset();
    propertyStateRef.current = { selectedPropertyId: "prop-1" };
    readAccessTokenMock.mockReturnValue("jwt");
    fetchHostProfileMock.mockResolvedValue(hostProfile);
    fetchPmsConnectionsMock.mockResolvedValue(pmsConnections);
    fetchPaymentConnectionsMock.mockResolvedValue(paymentConnections);
  });

  it("shows select-property state and does not fetch knowledge files when all properties is selected", () => {
    propertyStateRef.current.selectedPropertyId = "all";

    render(<MCPIntegrationSettings />);

    expect(screen.getByTestId("knowledge-select-property-state")).toBeInTheDocument();
    expect(fetchKnowledgeFilesMock).not.toHaveBeenCalled();
  });

  it("shows missing-token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByTestId("knowledge-error-state")).toBeInTheDocument();
      expect(
        screen.getByText("You are not authenticated. Please sign in again to load knowledge files.")
      ).toBeInTheDocument();
    });
    expect(fetchKnowledgeFilesMock).not.toHaveBeenCalled();
  });

  it("renders fetched knowledge files", async () => {
    fetchKnowledgeFilesMock.mockResolvedValue(knowledgeFiles);

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(fetchKnowledgeFilesMock).toHaveBeenCalledWith("jwt", "prop-1");
      expect(screen.getByText("Hotel_Policy_2026.pdf")).toBeInTheDocument();
      expect(screen.getByText(/2.4 MB/)).toBeInTheDocument();
    });
  });

  it("uploads selected file metadata via API and refetches list", async () => {
    fetchKnowledgeFilesMock
      .mockResolvedValueOnce(knowledgeFiles)
      .mockResolvedValueOnce([
        ...knowledgeFiles,
        {
          id: "file-uuid-2",
          propertyId: "prop-1",
          name: "Check_in_Guide.pdf",
          size: "1.2 MB",
          storagePath: null,
          mimeType: "application/pdf",
          createdAt: "2026-02-23T00:00:00Z",
        },
      ]);
    createKnowledgeFileMock.mockResolvedValue({
      id: "file-uuid-2",
      propertyId: "prop-1",
      name: "Check_in_Guide.pdf",
      size: "1.2 MB",
      storagePath: null,
      mimeType: "application/pdf",
      createdAt: "2026-02-23T00:00:00Z",
    });

    render(<MCPIntegrationSettings />);

    await screen.findByText("Hotel_Policy_2026.pdf");
    const input = screen.getByTestId("knowledge-file-input") as HTMLInputElement;
    const file = new File(["abc"], "Check_in_Guide.pdf", { type: "application/pdf" });

    fireEvent.change(input, { target: { files: [file] } });

    await waitFor(() => {
      expect(createKnowledgeFileMock).toHaveBeenCalledWith("jwt", "prop-1", {
        name: "Check_in_Guide.pdf",
        size: "3 B",
        mimeType: "application/pdf",
      });
      expect(fetchKnowledgeFilesMock).toHaveBeenCalledTimes(2);
    });
  });

  it("deletes a file and refetches list", async () => {
    fetchKnowledgeFilesMock
      .mockResolvedValueOnce(knowledgeFiles)
      .mockResolvedValueOnce([]);
    deleteKnowledgeFileMock.mockResolvedValue({ message: "File deleted", id: "file-uuid-1" });

    render(<MCPIntegrationSettings />);

    await screen.findByText("Hotel_Policy_2026.pdf");
    fireEvent.click(screen.getByTestId("knowledge-delete-file-uuid-1"));

    await waitFor(() => {
      expect(deleteKnowledgeFileMock).toHaveBeenCalledWith("jwt", "prop-1", "file-uuid-1");
      expect(fetchKnowledgeFilesMock).toHaveBeenCalledTimes(2);
    });
  });

  it("shows API error state when knowledge files fetch fails", async () => {
    fetchKnowledgeFilesMock.mockRejectedValue(new Error("knowledge fetch failed"));

    render(<MCPIntegrationSettings />);

    await waitFor(() => {
      expect(screen.getByTestId("knowledge-error-state")).toBeInTheDocument();
      expect(screen.getByText("knowledge fetch failed")).toBeInTheDocument();
    });
  });
});
