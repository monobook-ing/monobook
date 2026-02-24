import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/pages/DashboardLayout";
import { TooltipProvider } from "@/components/ui/tooltip";

const hydrateSessionFromStorageMock = vi.hoisted(() => vi.fn());
const fetchPropertiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboard_sidebar_collapsed";

vi.mock("@/lib/auth", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/auth")>();
  return {
    ...actual,
    hydrateSessionFromStorage: hydrateSessionFromStorageMock,
    fetchProperties: fetchPropertiesMock,
    readAccessToken: readAccessTokenMock,
  };
});

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const setViewport = (width: number) => {
  Object.defineProperty(window, "innerWidth", { configurable: true, writable: true, value: width });
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: query.includes("max-width: 767px") ? width <= 767 : false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
};

const renderLayout = (entry = "/dashboard") =>
  render(
    <TooltipProvider>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/" element={<div>root</div>} />
          <Route path="/auth" element={<div>auth</div>} />
          <Route path="/dashboard" element={<DashboardLayout />}>
            <Route index element={<div>dashboard-home</div>} />
          </Route>
          <Route path="/inventory" element={<DashboardLayout />}>
            <Route index element={<div>inventory-page</div>} />
          </Route>
          <Route path="/rooms" element={<DashboardLayout />}>
            <Route index element={<div>rooms-page</div>} />
          </Route>
          <Route path="/settings" element={<DashboardLayout />}>
            <Route index element={<div>settings-page</div>} />
          </Route>
          <Route path="/audit" element={<DashboardLayout />}>
            <Route index element={<div>audit-page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </TooltipProvider>
  );

describe("DashboardLayout footer host card", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    hydrateSessionFromStorageMock.mockReset();
    fetchPropertiesMock.mockReset();
    readAccessTokenMock.mockReset();
    localStorage.clear();

    hydrateSessionFromStorageMock.mockResolvedValue({
      status: "ready",
      me: {
        email: "microsaas.farm@gmail.com",
        first_name: "microsaas.farm",
        last_name: "MicroSaas Farm",
        default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
      },
    });
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "microsaas.farm@gmail.com",
        first_name: "microsaas.farm",
        last_name: "MicroSaas Farm",
        default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
      })
    );
    readAccessTokenMock.mockReturnValue("jwt_key");
    fetchPropertiesMock.mockResolvedValue([]);
    setViewport(1024);
  });

  it("renders user full name, Pro plan, initials, and email from /users/me cache", async () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "microsaas.farm@gmail.com",
        first_name: "microsaas.farm",
        last_name: "MicroSaas Farm",
        default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
      })
    );

    renderLayout();

    await waitFor(() => {
      expect(screen.getByText("microsaas.farm MicroSaas Farm")).toBeInTheDocument();
    });
    expect(screen.getByText("Pro plan")).toBeInTheDocument();
    expect(screen.getByText("MM")).toBeInTheDocument();

    fireEvent.click(screen.getByText("microsaas.farm MicroSaas Farm"));
    expect(await screen.findByText("microsaas.farm@gmail.com")).toBeInTheDocument();
  });

  it("falls back to hardcoded defaults when cached user payload is invalid", async () => {
    localStorage.setItem("user", "{invalid");

    renderLayout();

    await waitFor(() => {
      expect(screen.getByText("StayAI Hotel")).toBeInTheDocument();
    });
    expect(screen.getByText("SA")).toBeInTheDocument();
    expect(screen.getByText("Pro plan")).toBeInTheDocument();

    fireEvent.click(screen.getByText("StayAI Hotel"));
    expect(await screen.findByText("admin@stayai.com")).toBeInTheDocument();
  });

  it("logs out and redirects to auth when clicking logout", async () => {
    localStorage.setItem("access_token", "jwt_key");
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "microsaas.farm@gmail.com",
        first_name: "microsaas.farm",
        last_name: "MicroSaas Farm",
        default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
      })
    );

    renderLayout();

    await waitFor(() => {
      expect(screen.getByText("microsaas.farm MicroSaas Farm")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("microsaas.farm MicroSaas Farm"));
    fireEvent.click(await screen.findByText("Log out"));

    expect(await screen.findByText("auth")).toBeInTheDocument();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("starts expanded by default and collapses with persisted state", async () => {
    renderLayout("/rooms");

    await waitFor(() => {
      expect(screen.getByText("rooms-page")).toBeInTheDocument();
    });

    const sidebar = screen.getByTestId("desktop-sidebar");
    expect(sidebar).toHaveAttribute("data-collapsed", "false");
    expect(screen.getByText("monobook.ing")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sidebar-collapse-button"));

    await waitFor(() => {
      expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute("data-collapsed", "true");
    });
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe("true");
    expect(screen.queryByText("monobook.ing")).not.toBeInTheDocument();
    expect(within(screen.getByTestId("desktop-sidebar")).queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("restores collapsed sidebar from storage and expands when requested", async () => {
    localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, "true");

    renderLayout("/dashboard");

    await waitFor(() => {
      expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute("data-collapsed", "true");
    });
    expect(screen.getByTestId("sidebar-expand-button")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("sidebar-expand-button"));

    await waitFor(() => {
      expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute("data-collapsed", "false");
    });
    expect(localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY)).toBe("false");
    expect(screen.getByText("monobook.ing")).toBeInTheDocument();
  });

  it("shows tooltip with page name when hovering icon in collapsed sidebar", async () => {
    renderLayout("/dashboard");

    await waitFor(() => {
      expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute("data-collapsed", "false");
    });

    fireEvent.click(screen.getByTestId("sidebar-collapse-button"));
    await waitFor(() => {
      expect(screen.getByTestId("desktop-sidebar")).toHaveAttribute("data-collapsed", "true");
    });

    const inventoryButton = within(screen.getByTestId("desktop-sidebar")).getByRole("button", { name: "Inventory" });
    expect(screen.queryByRole("tooltip")).not.toBeInTheDocument();
    fireEvent.pointerEnter(inventoryButton);
    fireEvent.pointerMove(inventoryButton);
    fireEvent.mouseOver(inventoryButton);
    expect(await screen.findByRole("tooltip")).toHaveTextContent("Inventory");
  });

  it.each(["/dashboard", "/inventory", "/rooms", "/settings", "/audit"])(
    "shows mobile top property switcher on %s when no property is selected",
    async (entry) => {
      setViewport(390);
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

      renderLayout(entry);

      expect(await screen.findByTestId("mobile-empty-property-switcher")).toBeInTheDocument();
      expect(screen.getByTestId("mobile-property-switcher-trigger")).toBeInTheDocument();
    }
  );

  it("hides mobile top property switcher after selecting a property", async () => {
    setViewport(390);
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

    renderLayout("/rooms");

    const trigger = await screen.findByTestId("mobile-property-switcher-trigger");
    fireEvent.click(trigger);
    fireEvent.click(await screen.findByText("City Loft"));

    await waitFor(() => {
      expect(screen.queryByTestId("mobile-empty-property-switcher")).not.toBeInTheDocument();
    });
    expect(localStorage.getItem("selected_property_id:bc3acf90-710f-4066-baec-1998a4ce61a0")).toBe("prop-2");
  });

  it("does not render mobile top property switcher on desktop", async () => {
    setViewport(1280);
    renderLayout("/rooms");

    await waitFor(() => {
      expect(screen.getByText("rooms-page")).toBeInTheDocument();
    });
    expect(screen.queryByTestId("mobile-empty-property-switcher")).not.toBeInTheDocument();
  });
});
