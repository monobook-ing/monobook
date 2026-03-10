import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyProvider } from "@/contexts/PropertyContext";
import { PropertySwitcher } from "@/pages/DashboardLayout";

const fetchPropertiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const readUserMeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  fetchProperties: fetchPropertiesMock,
  readAccessToken: readAccessTokenMock,
  readUserMe: readUserMeMock,
  hydrateSessionFromStorage: vi.fn(),
}));

const renderSwitcher = () =>
  render(
    <PropertyProvider>
      <PropertySwitcher />
    </PropertyProvider>
  );

describe("PropertySwitcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchPropertiesMock.mockReset();
    readAccessTokenMock.mockReset();
    readUserMeMock.mockReset();
    localStorage.clear();
    readAccessTokenMock.mockReturnValue("jwt_key");
    readUserMeMock.mockReturnValue({
      email: "owner@example.com",
      first_name: "Owner",
      last_name: "One",
      default_account_id: "acct-1",
    });
  });

  it("shows skeleton in trigger and menu while properties are loading", () => {
    fetchPropertiesMock.mockImplementation(() => new Promise(() => {}));

    renderSwitcher();

    expect(screen.getByTestId("property-switcher-trigger-skeleton")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("property-switcher-trigger"));
    expect(screen.getByTestId("property-switcher-menu-skeleton")).toBeInTheDocument();
  });

  it("renders API properties after successful fetch", async () => {
    fetchPropertiesMock.mockResolvedValue([
      {
        id: "prop-1",
        name: "Mountain Lodge Retreat",
        address: {
          street: "789 Alpine Road",
          city: "Aspen",
          state: "CO",
          postalCode: "81611",
          country: "United States",
        },
      },
    ]);

    renderSwitcher();

    await waitFor(() => {
      expect(screen.queryByTestId("property-switcher-trigger-skeleton")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("property-switcher-trigger"));
    expect(await screen.findByText("Mountain Lodge Retreat")).toBeInTheDocument();
  });

  it("keeps only All Properties on fetch failure and disables manage action", async () => {
    fetchPropertiesMock.mockRejectedValue(new Error("failed"));

    renderSwitcher();

    await waitFor(() => {
      expect(screen.queryByTestId("property-switcher-trigger-skeleton")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("property-switcher-trigger"));

    expect(screen.getAllByText("All Properties").length).toBeGreaterThan(0);
    expect(screen.queryByText("Mountain Lodge Retreat")).not.toBeInTheDocument();

    const manageButton = screen.getByTestId("property-switcher-manage");
    expect(manageButton).toBeDisabled();
    expect(manageButton).toHaveTextContent("Read-only");
  });

  it("allows selecting a property from the menu", async () => {
    fetchPropertiesMock.mockResolvedValue([
      {
        id: "prop-1",
        name: "Mountain Lodge Retreat",
        address: {
          street: "789 Alpine Road",
          city: "Aspen",
          state: "CO",
          postalCode: "81611",
          country: "United States",
        },
      },
      {
        id: "prop-2",
        name: "City Loft",
        address: {
          street: "123 Main St",
          city: "Austin",
          state: "TX",
          postalCode: "73301",
          country: "United States",
        },
      },
    ]);

    renderSwitcher();

    await waitFor(() => {
      expect(screen.queryByTestId("property-switcher-trigger-skeleton")).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId("property-switcher-trigger"));
    const cityLoftOption = screen.getByRole("button", { name: /city loft/i });
    const triggerButton = screen.getByTestId("property-switcher-trigger");
    const allPropertiesOption = screen
      .getAllByRole("button", { name: /all properties/i })
      .find((button) => button !== triggerButton);
    expect(allPropertiesOption).toBeDefined();
    if (!allPropertiesOption) {
      throw new Error("Missing All Properties menu option");
    }

    fireEvent.click(cityLoftOption);
    expect(localStorage.getItem("selected_property_id:acct-1")).toBe("prop-2");
    expect(triggerButton).toHaveTextContent("City Loft");
  });
});
