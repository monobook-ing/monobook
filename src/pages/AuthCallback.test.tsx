import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AuthCallback from "@/pages/AuthCallback";

const navigateMock = vi.hoisted(() => vi.fn());
const searchParamsRef = vi.hoisted(
  () => ({ current: new URLSearchParams("code=test-code") })
);

const saveAccessTokenMock = vi.hoisted(() => vi.fn());
const saveUserMeMock = vi.hoisted(() => vi.fn());
const fetchMeWithRetryMock = vi.hoisted(() => vi.fn());
const clearAuthStorageMock = vi.hoisted(() => vi.fn());
const isAuthInvalidErrorMock = vi.hoisted(() => vi.fn(() => false));
const toastSuccessMock = vi.hoisted(() => vi.fn());

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => navigateMock,
    useSearchParams: () => [searchParamsRef.current],
  };
});

vi.mock("@/lib/auth", () => ({
  API_BASE: "https://api-fexi.onrender.com",
  saveAccessToken: saveAccessTokenMock,
  saveUserMe: saveUserMeMock,
  fetchMeWithRetry: fetchMeWithRetryMock,
  clearAuthStorage: clearAuthStorageMock,
  isAuthInvalidError: isAuthInvalidErrorMock,
}));

vi.mock("sonner", () => ({
  toast: {
    success: toastSuccessMock,
    error: vi.fn(),
  },
}));

describe("AuthCallback", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    navigateMock.mockReset();
    saveAccessTokenMock.mockReset();
    saveUserMeMock.mockReset();
    fetchMeWithRetryMock.mockReset();
    clearAuthStorageMock.mockReset();
    isAuthInvalidErrorMock.mockReset();
    isAuthInvalidErrorMock.mockReturnValue(false);
    toastSuccessMock.mockReset();
    searchParamsRef.current = new URLSearchParams("code=test-code");
  });

  it("navigates to dashboard after sign-in and /users/me success", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "jwt_key" }), { status: 200 })
    );
    fetchMeWithRetryMock.mockResolvedValue({
      email: "microsaas.farm@gmail.com",
      first_name: "microsaas.farm",
      last_name: "MicroSaas Farm",
      default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
    });

    render(<AuthCallback />);

    await waitFor(() => {
      expect(saveAccessTokenMock).toHaveBeenCalledWith("jwt_key");
      expect(fetchMeWithRetryMock).toHaveBeenCalledWith("jwt_key", 3, 400);
      expect(saveUserMeMock).toHaveBeenCalledTimes(1);
      expect(toastSuccessMock).toHaveBeenCalledWith("Signed in successfully!");
      expect(navigateMock).toHaveBeenCalledWith("/dashboard", { replace: true });
    });
  });

  it("shows blocking error and does not navigate when /users/me fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ access_token: "jwt_key" }), { status: 200 })
    );
    fetchMeWithRetryMock.mockRejectedValue(new Error("Profile fetch failed"));

    render(<AuthCallback />);

    expect(await screen.findByText("Sign-in failed")).toBeInTheDocument();
    expect(await screen.findByText("Profile fetch failed")).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
