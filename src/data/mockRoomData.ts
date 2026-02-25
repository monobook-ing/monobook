import hotel1 from "@/assets/hotel-1.jpg";
import hotel2 from "@/assets/hotel-2.jpg";
import hotel3 from "@/assets/hotel-3.jpg";
import hotel4 from "@/assets/hotel-4.jpg";

export interface GuestTier {
  minGuests: number;
  maxGuests: number;
  pricePerNight: number;
}

export interface RoomPricing {
  dateOverrides: Record<string, number>; // "YYYY-MM-DD" -> price
  guestTiers: GuestTier[];
}

export interface ManagedRoom {
  id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  pricePerNight: number;
  currencyCode?: string;
  currencyDisplay?: string;
  maxGuests: number;
  bedConfig: string;
  amenities: string[];
  source: "airbnb" | "booking" | "manual";
  sourceUrl?: string;
  syncEnabled: boolean;
  lastSynced?: string;
  status: "active" | "draft" | "archived";
  propertyId?: string;
  pricing?: RoomPricing;
}

export const mockRooms: ManagedRoom[] = [
  {
    id: "room-1",
    name: "Ocean View Deluxe Suite",
    type: "Deluxe Suite",
    description:
      "Spacious suite with panoramic ocean views, private balcony, and luxurious furnishings. Features a king-size bed, marble bathroom with rain shower, and a separate living area perfect for relaxation.",
    images: [hotel1, hotel2, hotel3, hotel4],
    pricePerNight: 289,
    currencyCode: "USD",
    currencyDisplay: "$",
    maxGuests: 3,
    bedConfig: "1 King Bed",
    amenities: ["WiFi", "Ocean View", "Balcony", "AC", "Mini Bar", "Room Service", "Safe", "Flat-screen TV"],
    source: "airbnb",
    sourceUrl: "https://airbnb.com/rooms/48291034",
    syncEnabled: true,
    lastSynced: "2026-02-22T14:30:00Z",
    status: "active",
    propertyId: "prop-1",
    pricing: {
      dateOverrides: {
        "2026-02-28": 350,
        "2026-03-01": 350,
        "2026-03-14": 399,
        "2026-03-15": 399,
      },
      guestTiers: [
        { minGuests: 1, maxGuests: 2, pricePerNight: 289 },
        { minGuests: 3, maxGuests: 3, pricePerNight: 339 },
      ],
    },
  },
  {
    id: "room-2",
    name: "Garden Family Room",
    type: "Family Room",
    description:
      "A warm, family-friendly room overlooking the tropical garden. Comes with two queen beds, a children's play corner, and direct pool access.",
    images: [hotel3, hotel1, hotel4],
    pricePerNight: 195,
    currencyCode: "USD",
    currencyDisplay: "$",
    maxGuests: 4,
    bedConfig: "2 Queen Beds",
    amenities: ["WiFi", "Garden View", "Pool Access", "AC", "Kitchen", "Parking", "Crib Available"],
    source: "booking",
    sourceUrl: "https://booking.com/hotel/us/example.html",
    syncEnabled: true,
    lastSynced: "2026-02-21T09:15:00Z",
    status: "active",
    propertyId: "prop-1",
  },
  {
    id: "room-3",
    name: "Standard Twin Room",
    type: "Standard Room",
    description:
      "Comfortable twin room ideal for friends or colleagues traveling together. Clean, modern design with all essential amenities.",
    images: [hotel2, hotel4],
    pricePerNight: 120,
    currencyCode: "USD",
    currencyDisplay: "$",
    maxGuests: 2,
    bedConfig: "2 Twin Beds",
    amenities: ["WiFi", "AC", "Flat-screen TV", "Desk", "Parking"],
    source: "manual",
    syncEnabled: false,
    status: "active",
    propertyId: "prop-2",
  },
  {
    id: "room-4",
    name: "Presidential Penthouse",
    type: "Penthouse",
    description:
      "The crown jewel of our property. A stunning two-floor penthouse with 360-degree city views, private jacuzzi, chef's kitchen, and dedicated butler service.",
    images: [hotel4, hotel1, hotel2, hotel3],
    pricePerNight: 750,
    currencyCode: "USD",
    currencyDisplay: "$",
    maxGuests: 6,
    bedConfig: "1 King Bed + 2 Single Beds",
    amenities: ["WiFi", "City View", "Jacuzzi", "Kitchen", "Butler Service", "AC", "Mini Bar", "Gym Access", "Spa Access"],
    source: "airbnb",
    sourceUrl: "https://airbnb.com/rooms/90128374",
    syncEnabled: false,
    lastSynced: "2026-02-18T20:00:00Z",
    status: "draft",
    propertyId: "prop-3",
    pricing: {
      dateOverrides: {
        "2026-03-06": 899,
        "2026-03-07": 899,
        "2026-03-08": 899,
      },
      guestTiers: [
        { minGuests: 1, maxGuests: 2, pricePerNight: 750 },
        { minGuests: 3, maxGuests: 4, pricePerNight: 850 },
        { minGuests: 5, maxGuests: 6, pricePerNight: 950 },
      ],
    },
  },
];

export const mockScrapedRoom: Omit<ManagedRoom, "id"> = {
  name: "Beachfront Villa with Infinity Pool",
  type: "Villa",
  description:
    "Stunning beachfront villa featuring a private infinity pool, open-air living space, and direct beach access. Wake up to the sound of waves in this 3-bedroom tropical paradise.",
  images: [hotel1, hotel3, hotel2, hotel4],
  pricePerNight: 420,
  currencyCode: "USD",
  currencyDisplay: "$",
  maxGuests: 6,
  bedConfig: "1 King Bed + 2 Queen Beds",
  amenities: ["WiFi", "Pool", "Beach Access", "Kitchen", "AC", "BBQ", "Parking", "Garden"],
  source: "airbnb",
  sourceUrl: "",
  syncEnabled: true,
  status: "active",
};
