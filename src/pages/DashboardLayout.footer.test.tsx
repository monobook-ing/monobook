import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import DashboardLayout from "@/pages/DashboardLayout";

const hydrateSessionFromStorageMock = vi.hoisted(() => vi.fn());
const fetchPropertiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());

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

const renderLayout = () =>
  render(
    <MemoryRouter initialEntries={["/dashboard"]}>
      <Routes>
        <Route path="/" element={<div>root</div>} />
        <Route path="/auth" element={<div>auth</div>} />
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<div>dashboard-home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
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
    readAccessTokenMock.mockReturnValue("jwt_key");
    fetchPropertiesMock.mockResolvedValue([]);
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
});
