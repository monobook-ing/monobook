import { afterEach, describe, expect, it, vi } from "vitest";
import { AuthApiError, fetchRooms } from "@/lib/auth";

describe("fetchRooms", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps valid API room payload to managed rooms", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
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
        }),
        { status: 200 }
      )
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
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ detail: "forbidden" }), { status: 403 })
    );

    await expect(fetchRooms("jwt", "prop-1")).rejects.toEqual(
      expect.objectContaining<AuthApiError>({
        name: "AuthApiError",
        message: "forbidden",
        status: 403,
      })
    );
  });
});
