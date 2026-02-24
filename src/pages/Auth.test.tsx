import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import Auth from "@/pages/Auth";

const navigateMock = vi.hoisted(() => vi.fn());
const hydrateSessionFromStorageMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

vi.mock("@/lib/auth", () => ({
  hydrateSessionFromStorage: hydrateSessionFromStorageMock,
}));

describe("Auth", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    hydrateSessionFromStorageMock.mockReset();
  });

  it("navigates to dashboard when user session is valid", async () => {
    hydrateSessionFromStorageMock.mockResolvedValue({
      status: "ready",
      me: {
        email: "a@b.com",
        first_name: "A",
        last_name: "B",
        default_account_id: "acct-1",
      },
    });

    render(<Auth />);

    await waitFor(() => {
      expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("stays on auth page when no valid session exists", async () => {
    hydrateSessionFromStorageMock.mockResolvedValue({
      status: "missing_token",
    });

    render(<Auth />);

    expect(await screen.findByText("Sign in to manage your properties")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
