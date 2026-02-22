import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  clearAuthStorage,
  fetchMe,
  fetchMeWithRetry,
  hydrateSessionFromStorage,
  readAccessToken,
  saveAccessToken,
  saveUserMe,
} from "@/lib/auth";

const sampleMe = {
  email: "microsaas.farm@gmail.com",
  first_name: "microsaas.farm",
  last_name: "MicroSaas Farm",
  default_account_id: "bc3acf90-710f-4066-baec-1998a4ce61a0",
};

describe("auth helpers", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("fetchMe sends bearer token and returns parsed payload", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(JSON.stringify(sampleMe), { status: 200 }));

    const result = await fetchMe("jwt_key");

    expect(result).toEqual(sampleMe);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-fexi.onrender.com/v1.0/users/me",
      {
        method: "GET",
        headers: { Authorization: "Bearer jwt_key" },
      }
    );
  });

  it("fetchMe throws normalized AuthApiError on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 })
    );

    await expect(fetchMe("bad")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Unauthorized",
      status: 401,
    });
  });

  it("fetchMeWithRetry retries retryable errors and succeeds", async () => {
    vi.useFakeTimers();

    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ detail: "Server error" }), { status: 500 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify(sampleMe), { status: 200 }));

    const promise = fetchMeWithRetry("jwt_key", 3, 10);
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toEqual(sampleMe);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("fetchMeWithRetry does not retry non-retryable auth errors", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Forbidden" }), { status: 403 })
    );

    await expect(fetchMeWithRetry("jwt_key", 3, 10)).rejects.toBeInstanceOf(
      AuthApiError
    );
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("storage helpers save and read expected keys", () => {
    saveAccessToken("token-1");
    saveUserMe(sampleMe);

    expect(readAccessToken()).toBe("token-1");
    expect(JSON.parse(localStorage.getItem("user") || "{}")).toEqual(sampleMe);

    clearAuthStorage();
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });

  it("hydrateSessionFromStorage reports missing token", async () => {
    const result = await hydrateSessionFromStorage();

    expect(result).toEqual({ status: "missing_token" });
  });

  it("hydrateSessionFromStorage refreshes user when token is valid", async () => {
    saveAccessToken("token-2");
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(sampleMe), { status: 200 })
    );

    const result = await hydrateSessionFromStorage();

    expect(result).toEqual({ status: "ready", me: sampleMe });
    expect(JSON.parse(localStorage.getItem("user") || "{}")).toEqual(sampleMe);
  });

  it("hydrateSessionFromStorage clears auth data when fetch fails", async () => {
    saveAccessToken("token-3");
    localStorage.setItem("user", JSON.stringify({ stale: true }));
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 })
    );

    const result = await hydrateSessionFromStorage();

    expect(result.status).toBe("invalid_session");
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
  });
});
