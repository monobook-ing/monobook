import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  clearAuthStorage,
  fetchProperties,
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

  it("fetchProperties sends bearer token and maps api fields", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "prop-1",
              name: "Mountain Lodge Retreat",
              street: "789 Alpine Road",
              city: "Aspen",
              state: "CO",
              postal_code: "81611",
              country: "United States",
              lat: 39.1911,
              lng: -106.8175,
              floor: "Ground",
              section: "Main Lodge",
              property_number: "ML-01",
            },
          ],
        }),
        { status: 200 }
      )
    );

    const result = await fetchProperties("jwt_key");

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api-fexi.onrender.com/v1.0/properties",
      {
        method: "GET",
        headers: { Authorization: "Bearer jwt_key" },
      }
    );
    expect(result).toEqual([
      {
        id: "prop-1",
        name: "Mountain Lodge Retreat",
        address: {
          street: "789 Alpine Road",
          city: "Aspen",
          state: "CO",
          postalCode: "81611",
          country: "United States",
          lat: 39.1911,
          lng: -106.8175,
          floor: "Ground",
          section: "Main Lodge",
          propertyNumber: "ML-01",
        },
      },
    ]);
  });

  it("fetchProperties throws normalized AuthApiError on non-200", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "Unauthorized" }), { status: 401 })
    );

    await expect(fetchProperties("bad")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Unauthorized",
      status: 401,
    });
  });

  it("fetchProperties throws when payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ nope: [] }), { status: 200 })
    );

    await expect(fetchProperties("jwt_key")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid properties response",
      status: 200,
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
