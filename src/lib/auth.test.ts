import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AuthApiError,
  createBooking,
  createKnowledgeFile,
  deleteKnowledgeFile,
  fetchAuditEntries,
  fetchBookingById,
  fetchBookings,
  fetchGuestById,
  fetchGuests,
  fetchHostProfile,
  fetchKnowledgeFiles,
  fetchMe,
  fetchPaymentConnections,
  fetchPmsConnections,
  fetchRoomById,
  fetchRooms,
  readUserMe,
  updateBooking,
  updateGuest,
  updatePaymentConnection,
  updatePmsConnection,
  updateHostProfile,
} from "@/lib/auth";

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

describe("fetchMe", () => {
  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("normalizes camelCase fields and nullable names from API payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          email: "owner@example.com",
          firstName: null,
          lastName: null,
          defaultAccountId: "acct-1",
        }),
        { status: 200 }
      )
    );

    const me = await fetchMe("jwt");

    expect(me).toEqual({
      email: "owner@example.com",
      first_name: "",
      last_name: "",
      default_account_id: "acct-1",
    });
  });

  it("accepts wrapped payloads and extracts user profile", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          user: {
            email: "owner@example.com",
            first_name: "Owner",
            last_name: "One",
            default_account_id: "acct-1",
          },
        }),
        { status: 200 }
      )
    );

    await expect(fetchMe("jwt")).resolves.toEqual({
      email: "owner@example.com",
      first_name: "Owner",
      last_name: "One",
      default_account_id: "acct-1",
    });
  });

  it("rejects payloads that do not include a valid email", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          first_name: "Owner",
          last_name: "One",
        }),
        { status: 200 }
      )
    );

    await expect(fetchMe("jwt")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid user profile response",
      status: 200,
    });
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

  it("applies source, from, to, limit, and cursor query params", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [], next_cursor: null }), { status: 200 })
    );

    await fetchAuditEntries("jwt", "prop-1", {
      source: "mcp",
      from: "2026-02-22T00:00:00.000Z",
      to: "2026-02-22T23:59:59.999Z",
      limit: 10,
      cursor: "cursor-1",
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1.0/properties/prop-1/audit?");
    expect(url).toContain("source=mcp");
    expect(url).toContain("from=2026-02-22T00%3A00%3A00.000Z");
    expect(url).toContain("to=2026-02-22T23%3A59%3A59.999Z");
    expect(url).toContain("limit=10");
    expect(url).toContain("cursor=cursor-1");
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

describe("fetchHostProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API host profile payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "hp-uuid",
          property_id: "prop-1",
          name: "StayAI Host",
          location: "Miami, Florida",
          bio: "Bio",
          avatar_url: "https://example.com/avatar.jpg",
          avatar_initials: "SH",
          reviews: 142,
          rating: 4.92,
          years_hosting: 5,
          superhost: true,
          created_at: "2026-02-22T10:00:00Z",
          updated_at: "2026-02-22T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    await expect(fetchHostProfile("jwt", "prop-1")).resolves.toEqual({
      id: "hp-uuid",
      propertyId: "prop-1",
      name: "StayAI Host",
      location: "Miami, Florida",
      bio: "Bio",
      avatarUrl: "https://example.com/avatar.jpg",
      avatarInitials: "SH",
      reviews: 142,
      rating: 4.92,
      yearsHosting: 5,
      superhost: true,
      createdAt: "2026-02-22T10:00:00Z",
      updatedAt: "2026-02-22T10:00:00Z",
    });
  });

  it("throws when host profile payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "hp-uuid" }), { status: 200 })
    );

    await expect(fetchHostProfile("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid host profile response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchHostProfile("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("updateHostProfile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends editable fields and maps response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "hp-uuid",
          property_id: "prop-1",
          name: "StayAI Host Updated",
          location: "Miami Beach, Florida",
          bio: "Updated bio text",
          avatar_url: null,
          avatar_initials: "SH",
          reviews: 150,
          rating: 4.95,
          years_hosting: 6,
          superhost: true,
          created_at: "2026-02-22T10:00:00Z",
          updated_at: "2026-02-23T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    const result = await updateHostProfile("jwt", "prop-1", {
      name: "StayAI Host Updated",
      location: "Miami Beach, Florida",
      bio: "Updated bio text",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/host-profile"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "StayAI Host Updated",
          location: "Miami Beach, Florida",
          bio: "Updated bio text",
        }),
      })
    );

    expect(result).toEqual({
      id: "hp-uuid",
      propertyId: "prop-1",
      name: "StayAI Host Updated",
      location: "Miami Beach, Florida",
      bio: "Updated bio text",
      avatarUrl: null,
      avatarInitials: "SH",
      reviews: 150,
      rating: 4.95,
      yearsHosting: 6,
      superhost: true,
      createdAt: "2026-02-22T10:00:00Z",
      updatedAt: "2026-02-23T10:00:00Z",
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(
      updateHostProfile("jwt", "prop-1", {
        name: "Host",
        location: "Miami, Florida",
        bio: "Bio",
      })
    ).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("fetchKnowledgeFiles", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API knowledge files payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "file-1",
              property_id: "prop-1",
              name: "Hotel_Policy_2026.pdf",
              size: "2.4 MB",
              storage_path: null,
              mime_type: "application/pdf",
              created_at: "2026-02-10T00:00:00Z",
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(fetchKnowledgeFiles("jwt", "prop-1")).resolves.toEqual([
      {
        id: "file-1",
        propertyId: "prop-1",
        name: "Hotel_Policy_2026.pdf",
        size: "2.4 MB",
        storagePath: null,
        mimeType: "application/pdf",
        createdAt: "2026-02-10T00:00:00Z",
      },
    ]);
  });

  it("throws when knowledge files payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "file-1" }] }), { status: 200 })
    );

    await expect(fetchKnowledgeFiles("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid knowledge files response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchKnowledgeFiles("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("createKnowledgeFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends metadata payload and maps response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "file-2",
          property_id: "prop-1",
          name: "Check_in_Guide.pdf",
          size: "1.2 MB",
          storage_path: null,
          mime_type: "application/pdf",
          created_at: "2026-02-23T10:00:00Z",
        }),
        { status: 201 }
      )
    );

    const result = await createKnowledgeFile("jwt", "prop-1", {
      name: "Check_in_Guide.pdf",
      size: "1.2 MB",
      mimeType: "application/pdf",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/knowledge-files"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          name: "Check_in_Guide.pdf",
          size: "1.2 MB",
          mime_type: "application/pdf",
        }),
      })
    );

    expect(result).toEqual({
      id: "file-2",
      propertyId: "prop-1",
      name: "Check_in_Guide.pdf",
      size: "1.2 MB",
      storagePath: null,
      mimeType: "application/pdf",
      createdAt: "2026-02-23T10:00:00Z",
    });
  });

  it("throws when create response shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "file-2" }), { status: 201 })
    );

    await expect(
      createKnowledgeFile("jwt", "prop-1", {
        name: "Check_in_Guide.pdf",
        size: "1.2 MB",
        mimeType: "application/pdf",
      })
    ).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid knowledge file response",
      status: 201,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(
      createKnowledgeFile("jwt", "prop-1", {
        name: "Check_in_Guide.pdf",
        size: "1.2 MB",
        mimeType: "application/pdf",
      })
    ).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("deleteKnowledgeFile", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid delete response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "File deleted", id: "file-1" }), {
        status: 200,
      })
    );

    await expect(deleteKnowledgeFile("jwt", "prop-1", "file-1")).resolves.toEqual({
      message: "File deleted",
      id: "file-1",
    });
  });

  it("throws when delete response shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "File deleted" }), { status: 200 })
    );

    await expect(deleteKnowledgeFile("jwt", "prop-1", "file-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid knowledge file delete response",
      status: 200,
    });
  });

  it("throws parsed API error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(deleteKnowledgeFile("jwt", "prop-1", "file-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("fetchPmsConnections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API PMS connections payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "pms-1",
              property_id: "prop-1",
              provider: "mews",
              enabled: false,
              config: {},
              created_at: "2026-02-23T00:00:00Z",
              updated_at: "2026-02-23T00:00:00Z",
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(fetchPmsConnections("jwt", "prop-1")).resolves.toEqual([
      {
        id: "pms-1",
        propertyId: "prop-1",
        provider: "mews",
        enabled: false,
        config: {},
        createdAt: "2026-02-23T00:00:00Z",
        updatedAt: "2026-02-23T00:00:00Z",
      },
    ]);
  });

  it("throws when PMS connections payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "pms-1" }] }), { status: 200 })
    );

    await expect(fetchPmsConnections("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid PMS connections response",
      status: 200,
    });
  });
});

describe("updatePmsConnection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends enabled payload and maps response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "pms-1",
          property_id: "prop-1",
          provider: "mews",
          enabled: true,
          config: {},
          created_at: "2026-02-23T00:00:00Z",
          updated_at: "2026-02-23T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    const result = await updatePmsConnection("jwt", "prop-1", "mews", { enabled: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/pms-connections/mews"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          enabled: true,
        }),
      })
    );

    expect(result).toEqual({
      id: "pms-1",
      propertyId: "prop-1",
      provider: "mews",
      enabled: true,
      config: {},
      createdAt: "2026-02-23T00:00:00Z",
      updatedAt: "2026-02-23T10:00:00Z",
    });
  });

  it("throws when update response shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "pms-1" }), { status: 200 })
    );

    await expect(updatePmsConnection("jwt", "prop-1", "mews", { enabled: true })).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid PMS connection response",
      status: 200,
    });
  });
});

describe("fetchPaymentConnections", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API payment connections payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "pay-1",
              property_id: "prop-1",
              provider: "stripe",
              enabled: true,
              config: {},
              created_at: "2026-02-23T00:00:00Z",
              updated_at: "2026-02-23T00:00:00Z",
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(fetchPaymentConnections("jwt", "prop-1")).resolves.toEqual([
      {
        id: "pay-1",
        propertyId: "prop-1",
        provider: "stripe",
        enabled: true,
        config: {},
        createdAt: "2026-02-23T00:00:00Z",
        updatedAt: "2026-02-23T00:00:00Z",
      },
    ]);
  });

  it("throws when payment connections payload shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [{ id: "pay-1" }] }), { status: 200 })
    );

    await expect(fetchPaymentConnections("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid payment connections response",
      status: 200,
    });
  });
});

describe("updatePaymentConnection", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("sends enabled payload and maps response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "pay-1",
          property_id: "prop-1",
          provider: "stripe",
          enabled: false,
          config: {},
          created_at: "2026-02-23T00:00:00Z",
          updated_at: "2026-02-23T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    const result = await updatePaymentConnection("jwt", "prop-1", "stripe", { enabled: false });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/payment-connections/stripe"),
      expect.objectContaining({
        method: "PUT",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
        body: JSON.stringify({
          enabled: false,
        }),
      })
    );

    expect(result).toEqual({
      id: "pay-1",
      propertyId: "prop-1",
      provider: "stripe",
      enabled: false,
      config: {},
      createdAt: "2026-02-23T00:00:00Z",
      updatedAt: "2026-02-23T10:00:00Z",
    });
  });

  it("throws when update response shape is invalid", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "pay-1" }), { status: 200 })
    );

    await expect(updatePaymentConnection("jwt", "prop-1", "stripe", { enabled: true })).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid payment connection response",
      status: 200,
    });
  });

  it("normalizes legacy jp-morgan alias in update endpoint", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          id: "pay-2",
          property_id: "prop-1",
          provider: "jpmorgan",
          enabled: true,
          config: {},
          created_at: "2026-02-23T00:00:00Z",
          updated_at: "2026-02-23T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    await updatePaymentConnection("jwt", "prop-1", "jp-morgan", { enabled: true });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/payment-connections/jpmorgan"),
      expect.anything()
    );
  });
});

describe("bookings api", () => {
  const validBookingPayload = {
    id: "booking-1",
    property_id: "prop-1",
    room_id: "room-1",
    guest_id: "guest-1",
    guest_name: "Sarah Chen",
    check_in: "2026-03-15",
    check_out: "2026-03-20",
    total_price: 2100,
    status: "confirmed",
    ai_handled: true,
    source: "mcp",
    conversation_id: "conv_1",
    created_at: "2026-02-22T10:00:00Z",
    updated_at: "2026-02-22T10:00:00Z",
    cancelled_at: null,
  };

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it("maps valid bookings response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [validBookingPayload] }), { status: 200 })
    );

    await expect(fetchBookings("jwt", "prop-1")).resolves.toEqual([
      {
        id: "booking-1",
        propertyId: "prop-1",
        roomId: "room-1",
        guestId: "guest-1",
        guestName: "Sarah Chen",
        checkIn: "2026-03-15",
        checkOut: "2026-03-20",
        totalPrice: 2100,
        status: "confirmed",
        aiHandled: true,
        source: "mcp",
        conversationId: "conv_1",
        createdAt: "2026-02-22T10:00:00Z",
        updatedAt: "2026-02-22T10:00:00Z",
        cancelledAt: null,
      },
    ]);
  });

  it("accepts ai_pending status with null source in bookings list response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ ...validBookingPayload, status: "ai_pending", source: null }],
        }),
        { status: 200 }
      )
    );

    await expect(fetchBookings("jwt", "prop-1")).resolves.toEqual([
      expect.objectContaining({
        id: "booking-1",
        status: "ai_pending",
        source: null,
      }),
    ]);
  });

  it("includes status query when filter is provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [validBookingPayload] }), { status: 200 })
    );

    await fetchBookings("jwt", "prop-1", { status: "confirmed" });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1.0/properties/prop-1/bookings?status=confirmed");
  });

  it("rejects invalid bookings response payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ ...validBookingPayload, status: "invalid_status" }],
        }),
        { status: 200 }
      )
    );

    await expect(fetchBookings("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid bookings response",
      status: 200,
    });
  });

  it("maps valid single booking response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({ ...validBookingPayload, status: "ai_pending", source: null }),
        { status: 200 }
      )
    );

    await expect(fetchBookingById("jwt", "prop-1", "booking-1")).resolves.toMatchObject({
      id: "booking-1",
      propertyId: "prop-1",
      roomId: "room-1",
      status: "ai_pending",
      source: null,
    });
  });

  it("sends create payload and maps booking response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(validBookingPayload), { status: 201 })
    );

    const result = await createBooking("jwt", "prop-1", {
      roomId: "room-1",
      guestName: "Sarah Chen",
      guestEmail: "sarah@example.com",
      checkIn: "2026-03-15",
      checkOut: "2026-03-20",
      totalPrice: 2100,
      status: "confirmed",
      aiHandled: true,
      source: "mcp",
      conversationId: "conv_1",
    });

    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("/v1.0/properties/prop-1/bookings"),
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer jwt",
          "Content-Type": "application/json",
        }),
      })
    );

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      room_id: "room-1",
      guest_name: "Sarah Chen",
      guest_email: "sarah@example.com",
      check_in: "2026-03-15",
      check_out: "2026-03-20",
      total_price: 2100,
      status: "confirmed",
      ai_handled: true,
      source: "mcp",
      conversation_id: "conv_1",
    });

    expect(result).toMatchObject({
      id: "booking-1",
      propertyId: "prop-1",
      roomId: "room-1",
    });
  });

  it("sends partial update payload and maps response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validBookingPayload,
          status: "cancelled",
          check_out: "2026-04-05",
          cancelled_at: "2026-03-01T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    const result = await updateBooking("jwt", "prop-1", "booking-1", {
      status: "cancelled",
      checkOut: "2026-04-05",
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      status: "cancelled",
      check_out: "2026-04-05",
    });
    expect(result).toMatchObject({
      id: "booking-1",
      status: "cancelled",
      checkOut: "2026-04-05",
    });
  });

  it("throws parsed api error on non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchBookings("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });

  it("retries once and succeeds when first response is 401", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "unauthorized" }), { status: 401 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ items: [validBookingPayload] }), { status: 200 }));

    const replaceSpy = vi.fn();
    vi.spyOn(window, "location", "get").mockReturnValue({
      ...window.location,
      replace: replaceSpy,
    } as Location);

    const result = await fetchBookings("jwt", "prop-1");

    expect(result).toHaveLength(1);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
    expect(replaceSpy).not.toHaveBeenCalled();
  });
});

describe("guests api", () => {
  const validGuestDetailPayload = {
    id: "guest-1",
    property_id: "prop-1",
    name: "Sarah Chen",
    email: "sarah@example.com",
    phone: "+1 415-555-0142",
    notes: "VIP guest",
    total_stays: 4,
    last_stay_date: "2026-02-20",
    total_spent: 2578,
    latest_booking: {
      id: "booking-1",
      room_id: "room-1",
      room_image: "https://example.com/ocean-suite.jpg",
      room_name: "Ocean View Deluxe Suite",
      check_in: "2026-02-18",
      check_out: "2026-02-20",
      status: "confirmed",
      total_price: 578,
      ai_handled: true,
      source: "chatgpt",
    },
    created_at: "2026-02-01T10:00:00Z",
    updated_at: "2026-02-21T10:00:00Z",
    bookings: [
      {
        id: "booking-1",
        guest_id: "guest-1",
        room_id: "room-1",
        room_name: "Ocean View Deluxe Suite",
        property_id: "prop-1",
        check_in: "2026-02-18",
        check_out: "2026-02-20",
        status: "checked_out",
        total_price: 578,
        ai_handled: true,
        source: "chatgpt",
        conversation_id: "session-1",
      },
    ],
    conversations: [
      {
        id: "session-1",
        guest_id: "guest-1",
        channel: "widget",
        started_at: "2026-02-17T09:30:00Z",
        messages: [
          {
            role: "guest",
            text: "Hi there",
            timestamp: "2026-02-17T09:30:00Z",
          },
        ],
      },
    ],
  };

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid guests list response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [
            {
              id: "guest-1",
              property_id: "prop-1",
              name: "Sarah Chen",
              email: "sarah@example.com",
              phone: "+1 415-555-0142",
              notes: "",
              total_stays: 2,
              last_stay_date: "2026-02-20",
              total_spent: 578,
              latest_booking: null,
              created_at: "2026-02-01T10:00:00Z",
              updated_at: "2026-02-01T10:00:00Z",
            },
          ],
        }),
        { status: 200 }
      )
    );

    await expect(fetchGuests("jwt", "prop-1")).resolves.toEqual([
      {
        id: "guest-1",
        propertyId: "prop-1",
        name: "Sarah Chen",
        email: "sarah@example.com",
        phone: "+1 415-555-0142",
        notes: "",
        totalStays: 2,
        lastStayDate: "2026-02-20",
        totalSpent: 578,
        latestBooking: null,
        createdAt: "2026-02-01T10:00:00Z",
        updatedAt: "2026-02-01T10:00:00Z",
      },
    ]);
  });

  it("includes search query param when provided", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ items: [] }), { status: 200 })
    );

    await fetchGuests("jwt", "prop-1", { search: "Sarah" });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/v1.0/properties/prop-1/guests?search=Sarah");
  });

  it("rejects invalid guests list response payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          items: [{ id: "guest-1" }],
        }),
        { status: 200 }
      )
    );

    await expect(fetchGuests("jwt", "prop-1")).rejects.toMatchObject({
      name: "AuthApiError",
      message: "Invalid guests response",
      status: 200,
    });
  });

  it("maps valid guest detail response", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify(validGuestDetailPayload), { status: 200 })
    );

    await expect(fetchGuestById("jwt", "prop-1", "guest-1")).resolves.toMatchObject({
      id: "guest-1",
      propertyId: "prop-1",
      totalStays: 4,
      latestBooking: expect.objectContaining({
        roomName: "Ocean View Deluxe Suite",
        roomImage: "https://example.com/ocean-suite.jpg",
        source: "chatgpt",
      }),
      bookings: [
        expect.objectContaining({
          status: "checked_out",
          source: "chatgpt",
        }),
      ],
      conversations: [
        expect.objectContaining({
          channel: "widget",
        }),
      ],
    });
  });

  it("sends partial update payload and maps guest detail response", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          ...validGuestDetailPayload,
          notes: "Updated notes",
          updated_at: "2026-02-23T10:00:00Z",
        }),
        { status: 200 }
      )
    );

    const result = await updateGuest("jwt", "prop-1", "guest-1", {
      notes: "Updated notes",
      phone: null,
    });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(JSON.parse(String(init.body))).toEqual({
      notes: "Updated notes",
      phone: null,
    });
    expect(result).toMatchObject({
      id: "guest-1",
      notes: "Updated notes",
    });
  });

  it("throws parsed api error on guests non-2xx", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchGuests("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});

describe("readUserMe", () => {
  afterEach(() => {
    localStorage.clear();
  });

  it("normalizes legacy cached camelCase user payload", () => {
    localStorage.setItem(
      "user",
      JSON.stringify({
        email: "owner@example.com",
        firstName: "Owner",
        lastName: "One",
        defaultAccountId: "acct-1",
      })
    );

    expect(readUserMe()).toEqual({
      email: "owner@example.com",
      first_name: "Owner",
      last_name: "One",
      default_account_id: "acct-1",
    });
  });
});
