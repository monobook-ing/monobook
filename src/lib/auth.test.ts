import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, fetchAuditEntries, fetchRoomById, fetchRooms } from "@/lib/auth";

const validRoomsPayload = {
  items: [
    {
      id: "room-1",
      property_id: "prop-1",
      name: "Ocean View Deluxe Suite",
      type: "Deluxe Suite",
      description: "Spacious suite",
      images: ["https://example.com/1.jpg"],
      price_per_night: 289,
      max_guests: 3,
      bed_config: "1 King Bed",
      amenities: ["WiFi", "AC"],
      source: "airbnb",
      source_url: "https://airbnb.com/rooms/1",
      sync_enabled: true,
      last_synced: "2026-02-22T14:30:00Z",
      status: "active",
      guest_tiers: [
        {
          id: "tier-1",
          min_guests: 1,
          max_guests: 2,
          price_per_night: 289,
        },
      ],
      date_overrides: [
        {
          id: "override-1",
          date: "2026-02-28",
          price: 350,
        },
      ],
    },
  ],
};

describe("fetchRooms", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API room payload to managed rooms", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(validRoomsPayload), { status: 200 })
    );

    const rooms = await fetchRooms("jwt", "prop-1");

    expect(rooms).toHaveLength(1);
    expect(rooms[0]).toMatchObject({
      id: "room-1",
      propertyId: "prop-1",
      pricePerNight: 289,
      maxGuests: 3,
      bedConfig: "1 King Bed",
      source: "airbnb",
      sourceUrl: "https://airbnb.com/rooms/1",
      syncEnabled: true,
      lastSynced: "2026-02-22T14:30:00Z",
      pricing: {
        guestTiers: [{ minGuests: 1, maxGuests: 2, pricePerNight: 289 }],
        dateOverrides: { "2026-02-28": 350 },
      },
    });
  });

  it("throws when room payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "room-1" }] }), { status: 200 })
    );

    await expect(fetchRooms("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid rooms response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchRooms("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it("retries once and succeeds after first 401 response", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(validRoomsPayload), { status: 200 }));

    const replaceSpy = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceSpy,
    } as Location);

    const rooms = await fetchRooms("jwt", "prop-1");

    expect(rooms).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(replaceSpy).not.toHaveBeenCalled();
  });

  it("logs out and redirects to /auth when retry also returns 401", async () => {
    localStorage.setItem("access_token", "jwt_key");
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "test@example.com",
        first_name: "Test",
        last_name: "User",
        default_account_id: "acct-1",
      })
    );

    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "unauthorized" }), { status: 401 }));
    const replaceSpy = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceSpy,
    } as Location);

    await expect(fetchRooms("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "unauthorized",
        status: 401,
      })
    );

    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(localStorage.getItem("access_token")).toBeNull();
    expect(localStorage.getItem("user")).toBeNull();
    expect(replaceSpy).toHaveBeenCalledWith("/auth");
  });
});

describe("fetchRoomById", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API room payload to managed room", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "room-1",
          property_id: "prop-1",
          name: "Ocean View Deluxe Suite",
          type: "Deluxe Suite",
          description: "Spacious suite",
          images: ["https://example.com/1.jpg"],
          price_per_night: 289,
          max_guests: 3,
          bed_config: "1 King Bed",
          amenities: ["WiFi", "AC"],
          source: "airbnb",
          source_url: "https://airbnb.com/rooms/1",
          sync_enabled: true,
          last_synced: "2026-02-22T14:30:00Z",
          status: "active",
          guest_tiers: [
            {
              id: "tier-1",
              min_guests: 1,
              max_guests: 2,
              price_per_night: 289,
            },
          ],
          date_overrides: [
            {
              id: "override-1",
              date: "2026-02-28",
              price: 350,
            },
          ],
        }),
        { status: 200 }
      )
    );

    const room = await fetchRoomById("jwt", "prop-1", "room-1");

    expect(room).toMatchObject({
      id: "room-1",
      propertyId: "prop-1",
      pricePerNight: 289,
      maxGuests: 3,
      bedConfig: "1 King Bed",
      source: "airbnb",
      sourceUrl: "https://airbnb.com/rooms/1",
      syncEnabled: true,
      lastSynced: "2026-02-22T14:30:00Z",
      pricing: {
        guestTiers: [{ minGuests: 1, maxGuests: 2, pricePerNight: 289 }],
        dateOverrides: { "2026-02-28": 350 },
      },
    });
  });

  it("throws when room payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "room-1" }), { status: 200 })
    );

    await expect(fetchRoomById("jwt", "prop-1", "room-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid room response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchRoomById("jwt", "prop-1", "room-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("fetchAuditEntries", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API audit payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "audit-1",
              property_id: "prop-1",
              conversation_id: "conv-1",
              source: "mcp",
              tool_name: "search_rooms",
              description: "Searched available rooms",
              status: "success",
              request_payload: null,
              response_payload: null,
              created_at: "2026-02-22T14:32:00Z",
            },
          ],
          next_cursor: "next-1",
        }),
        { status: 200 }
      )
    );

    const result = await fetchAuditEntries("jwt", "prop-1");

    expect(result).toEqual({
      items: [
        {
          id: "audit-1",
          propertyId: "prop-1",
          conversationId: "conv-1",
          source: "mcp",
          toolName: "search_rooms",
          description: "Searched available rooms",
          status: "success",
          createdAt: "2026-02-22T14:32:00Z",
        },
      ],
      nextCursor: "next-1",
    });
  });

  it("applies source, limit, and cursor query params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], next_cursor: null }), { status: 200 })
    );

    await fetchAuditEntries("jwt", "prop-1", {
      source: "mcp",
      limit: 10,
      cursor: "cursor-1",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/audit?source=mcp&limit=10&cursor=cursor-1"),
      expect.objectContaining({
        method: "GET",
      })
    );
  });

  it("throws when audit payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "audit-1" }], next_cursor: null }), {
        status: 200,
      })
    );

    await expect(fetchAuditEntries("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid audit log response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchAuditEntries("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});
