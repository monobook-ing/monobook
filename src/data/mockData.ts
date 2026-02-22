export interface Property {
  id: string;
  name: string;
  location: string;
  pricePerNight: number;
  rating: number;
  aiMatchScore: number;
  image: string;
  amenities: string[];
  roomType: string;
}

export interface Booking {
  id: string;
  guestName: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "pending" | "ai-pending";
  totalPrice: number;
  roomNumber: string;
  aiHandled: boolean;
}

export interface DashboardMetrics {
  aiDirectBookings: number;
  aiDirectBookingsTrend: number[];
  commissionSaved: number;
  commissionSavedTrend: number[];
  occupancyRate: number;
  occupancyTrend: number[];
  revenue: number;
  revenueTrend: number[];
}

export interface Room {
  id: string;
  name: string;
  type: string;
  bookings: {
    id: string;
    guestName: string;
    checkIn: string;
    checkOut: string;
    status: "confirmed" | "pending" | "ai-pending";
  }[];
}

export const mockProperties: Property[] = [
  {
    id: "p1",
    name: "Villa Serenità",
    location: "Amalfi Coast, Italy",
    pricePerNight: 420,
    rating: 4.9,
    aiMatchScore: 98,
    image: "hotel-1",
    amenities: ["Pool", "Sea View", "Spa", "WiFi"],
    roomType: "Deluxe Suite",
  },
  {
    id: "p2",
    name: "The Skyline Loft",
    location: "Manhattan, New York",
    pricePerNight: 380,
    rating: 4.8,
    aiMatchScore: 94,
    image: "hotel-2",
    amenities: ["City View", "Gym", "Bar", "WiFi"],
    roomType: "Penthouse Suite",
  },
  {
    id: "p3",
    name: "Coral Bay Resort",
    location: "Maldives",
    pricePerNight: 650,
    rating: 4.95,
    aiMatchScore: 91,
    image: "hotel-3",
    amenities: ["Beach", "Snorkeling", "Spa", "Restaurant"],
    roomType: "Overwater Bungalow",
  },
  {
    id: "p4",
    name: "Alpine Lodge Zermatt",
    location: "Zermatt, Switzerland",
    pricePerNight: 340,
    rating: 4.7,
    aiMatchScore: 87,
    image: "hotel-4",
    amenities: ["Mountain View", "Hot Tub", "Ski-in", "Fireplace"],
    roomType: "Mountain Suite",
  },
];

export const mockBookings: Booking[] = [
  {
    id: "b1",
    guestName: "Sarah Chen",
    propertyId: "p1",
    checkIn: "2026-03-15",
    checkOut: "2026-03-20",
    status: "confirmed",
    totalPrice: 2100,
    roomNumber: "301",
    aiHandled: true,
  },
  {
    id: "b2",
    guestName: "James Wilson",
    propertyId: "p1",
    checkIn: "2026-03-22",
    checkOut: "2026-03-25",
    status: "confirmed",
    totalPrice: 1260,
    roomNumber: "205",
    aiHandled: true,
  },
  {
    id: "b3",
    guestName: "Maria Garcia",
    propertyId: "p1",
    checkIn: "2026-03-18",
    checkOut: "2026-03-21",
    status: "ai-pending",
    totalPrice: 1260,
    roomNumber: "102",
    aiHandled: true,
  },
  {
    id: "b4",
    guestName: "Alex Thompson",
    propertyId: "p1",
    checkIn: "2026-04-01",
    checkOut: "2026-04-05",
    status: "pending",
    totalPrice: 1680,
    roomNumber: "401",
    aiHandled: false,
  },
  {
    id: "b5",
    guestName: "Yuki Tanaka",
    propertyId: "p1",
    checkIn: "2026-03-28",
    checkOut: "2026-04-02",
    status: "confirmed",
    totalPrice: 2520,
    roomNumber: "502",
    aiHandled: true,
  },
];

export const mockDashboardMetrics: DashboardMetrics = {
  aiDirectBookings: 147,
  aiDirectBookingsTrend: [12, 18, 15, 22, 28, 25, 32, 35, 30, 38, 42, 47],
  commissionSaved: 28450,
  commissionSavedTrend: [1200, 1800, 2100, 2400, 2200, 2800, 3100, 2900, 3400, 3800, 4200, 4650],
  occupancyRate: 87,
  occupancyTrend: [72, 78, 80, 82, 79, 85, 88, 84, 86, 89, 87, 87],
  revenue: 184320,
  revenueTrend: [12000, 14500, 15200, 16800, 15500, 17200, 18400, 17800, 19200, 20500, 21100, 22120],
};

export const mockRooms: Room[] = [
  {
    id: "r1",
    name: "Room 101",
    type: "Standard",
    bookings: [
      { id: "rb1", guestName: "Sarah Chen", checkIn: "2026-03-15", checkOut: "2026-03-20", status: "confirmed" },
      { id: "rb2", guestName: "Alex Kim", checkIn: "2026-03-25", checkOut: "2026-03-28", status: "ai-pending" },
    ],
  },
  {
    id: "r2",
    name: "Room 205",
    type: "Deluxe",
    bookings: [
      { id: "rb3", guestName: "James Wilson", checkIn: "2026-03-22", checkOut: "2026-03-25", status: "confirmed" },
    ],
  },
  {
    id: "r3",
    name: "Room 301",
    type: "Suite",
    bookings: [
      { id: "rb4", guestName: "Maria Garcia", checkIn: "2026-03-18", checkOut: "2026-03-21", status: "confirmed" },
      { id: "rb5", guestName: "Yuki Tanaka", checkIn: "2026-03-28", checkOut: "2026-04-02", status: "ai-pending" },
    ],
  },
  {
    id: "r4",
    name: "Room 401",
    type: "Suite",
    bookings: [
      { id: "rb6", guestName: "Alex Thompson", checkIn: "2026-04-01", checkOut: "2026-04-05", status: "pending" },
    ],
  },
  {
    id: "r5",
    name: "Room 502",
    type: "Penthouse",
    bookings: [
      { id: "rb7", guestName: "Emma Laurent", checkIn: "2026-03-14", checkOut: "2026-03-18", status: "confirmed" },
      { id: "rb8", guestName: "David Park", checkIn: "2026-03-20", checkOut: "2026-03-24", status: "confirmed" },
    ],
  },
];

export const mockUploadedFiles = [
  { id: "f1", name: "Hotel_Policy_2026.pdf", size: "2.4 MB", uploadedAt: "2026-02-10" },
  { id: "f2", name: "WiFi_Instructions.docx", size: "145 KB", uploadedAt: "2026-02-12" },
  { id: "f3", name: "Restaurant_Menu.pdf", size: "5.1 MB", uploadedAt: "2026-02-15" },
];
