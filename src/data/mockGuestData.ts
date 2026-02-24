export interface Guest {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalStays: number;
  lastStayDate: string;
  notes?: string;
}

export interface GuestBooking {
  id: string;
  guestId: string;
  roomName: string;
  propertyId: string;
  checkIn: string;
  checkOut: string;
  status: "confirmed" | "checked_in" | "checked_out" | "cancelled" | "ai_pending";
  totalPrice: number;
  aiHandled: boolean;
}

export interface GuestConversationMessage {
  role: "guest" | "ai" | "staff";
  text: string;
  timestamp: string;
}

export interface GuestConversation {
  id: string;
  guestId: string;
  channel: "widget" | "chatGPT" | "claude";
  startedAt: string;
  messages: GuestConversationMessage[];
}

export const mockGuests: Guest[] = [
  {
    id: "guest-1",
    name: "Sarah Chen",
    email: "sarah.chen@example.com",
    phone: "+1 415-555-0142",
    totalStays: 4,
    lastStayDate: "2026-02-20",
    notes: "Prefers high floor, allergic to feathers",
  },
  {
    id: "guest-2",
    name: "Marcus Johnson",
    email: "marcus.j@example.com",
    phone: "+1 212-555-0198",
    totalStays: 2,
    lastStayDate: "2026-02-18",
  },
  {
    id: "guest-3",
    name: "Elena Petrova",
    email: "elena.p@example.com",
    phone: "+44 20 7946 0958",
    totalStays: 7,
    lastStayDate: "2026-02-22",
    notes: "VIP guest, always books suites",
  },
  {
    id: "guest-4",
    name: "Kenji Tanaka",
    email: "kenji.t@example.com",
    phone: "+81 3-5555-0147",
    totalStays: 1,
    lastStayDate: "2026-01-15",
  },
  {
    id: "guest-5",
    name: "Amira Hassan",
    email: "amira.h@example.com",
    phone: "+971 4-555-0163",
    totalStays: 3,
    lastStayDate: "2026-02-10",
    notes: "Late check-out preferred",
  },
  {
    id: "guest-6",
    name: "Lucas Moreau",
    email: "lucas.m@example.com",
    phone: "+33 1 55 55 01 74",
    totalStays: 5,
    lastStayDate: "2026-02-24",
  },
];

export const mockGuestBookings: GuestBooking[] = [
  // Sarah Chen
  { id: "gb-1", guestId: "guest-1", roomName: "Ocean View Deluxe Suite", propertyId: "prop-1", checkIn: "2026-02-18", checkOut: "2026-02-20", status: "checked_out", totalPrice: 578, aiHandled: true },
  { id: "gb-2", guestId: "guest-1", roomName: "Garden Family Room", propertyId: "prop-1", checkIn: "2026-01-05", checkOut: "2026-01-08", status: "checked_out", totalPrice: 720, aiHandled: false },
  { id: "gb-3", guestId: "guest-1", roomName: "Ocean View Deluxe Suite", propertyId: "prop-1", checkIn: "2025-11-12", checkOut: "2025-11-14", status: "checked_out", totalPrice: 578, aiHandled: true },
  { id: "gb-4", guestId: "guest-1", roomName: "Penthouse Suite", propertyId: "prop-2", checkIn: "2025-08-20", checkOut: "2025-08-25", status: "checked_out", totalPrice: 2450, aiHandled: false },

  // Marcus Johnson
  { id: "gb-5", guestId: "guest-2", roomName: "Standard Room", propertyId: "prop-1", checkIn: "2026-02-16", checkOut: "2026-02-18", status: "checked_out", totalPrice: 340, aiHandled: true },
  { id: "gb-6", guestId: "guest-2", roomName: "Standard Room", propertyId: "prop-1", checkIn: "2025-12-22", checkOut: "2025-12-26", status: "checked_out", totalPrice: 680, aiHandled: false },

  // Elena Petrova
  { id: "gb-7", guestId: "guest-3", roomName: "Penthouse Suite", propertyId: "prop-2", checkIn: "2026-02-20", checkOut: "2026-02-22", status: "checked_out", totalPrice: 980, aiHandled: true },
  { id: "gb-8", guestId: "guest-3", roomName: "Penthouse Suite", propertyId: "prop-2", checkIn: "2026-01-10", checkOut: "2026-01-15", status: "checked_out", totalPrice: 2450, aiHandled: true },
  { id: "gb-9", guestId: "guest-3", roomName: "Ocean View Deluxe Suite", propertyId: "prop-1", checkIn: "2025-10-01", checkOut: "2025-10-05", status: "checked_out", totalPrice: 1156, aiHandled: false },

  // Kenji Tanaka
  { id: "gb-10", guestId: "guest-4", roomName: "Garden Family Room", propertyId: "prop-1", checkIn: "2026-01-13", checkOut: "2026-01-15", status: "checked_out", totalPrice: 480, aiHandled: true },

  // Amira Hassan
  { id: "gb-11", guestId: "guest-5", roomName: "Ocean View Deluxe Suite", propertyId: "prop-1", checkIn: "2026-02-08", checkOut: "2026-02-10", status: "checked_out", totalPrice: 578, aiHandled: false },
  { id: "gb-12", guestId: "guest-5", roomName: "Standard Room", propertyId: "prop-1", checkIn: "2025-12-01", checkOut: "2025-12-03", status: "cancelled", totalPrice: 340, aiHandled: true },
  { id: "gb-13", guestId: "guest-5", roomName: "Penthouse Suite", propertyId: "prop-2", checkIn: "2025-09-15", checkOut: "2025-09-18", status: "checked_out", totalPrice: 1470, aiHandled: false },

  // Lucas Moreau
  { id: "gb-14", guestId: "guest-6", roomName: "Ocean View Deluxe Suite", propertyId: "prop-1", checkIn: "2026-02-22", checkOut: "2026-02-24", status: "confirmed", totalPrice: 578, aiHandled: true },
  { id: "gb-15", guestId: "guest-6", roomName: "Garden Family Room", propertyId: "prop-1", checkIn: "2026-01-20", checkOut: "2026-01-23", status: "checked_out", totalPrice: 720, aiHandled: true },
  { id: "gb-16", guestId: "guest-6", roomName: "Standard Room", propertyId: "prop-1", checkIn: "2025-11-05", checkOut: "2025-11-07", status: "checked_out", totalPrice: 340, aiHandled: false },
];

export const mockGuestConversations: GuestConversation[] = [
  {
    id: "conv-1",
    guestId: "guest-1",
    channel: "widget",
    startedAt: "2026-02-17T09:30:00Z",
    messages: [
      { role: "guest", text: "Hi, I'd like to book the Ocean View Suite for Feb 18-20", timestamp: "2026-02-17T09:30:00Z" },
      { role: "ai", text: "I'd be happy to help! The Ocean View Deluxe Suite is available for those dates at $289/night. Shall I proceed with the booking?", timestamp: "2026-02-17T09:30:15Z" },
      { role: "guest", text: "Yes please, and could I get a high floor?", timestamp: "2026-02-17T09:31:00Z" },
      { role: "ai", text: "Absolutely! I've noted your preference for a high floor. Your booking is confirmed — Ocean View Deluxe Suite, Feb 18–20, total $578. Confirmation ID: AH-7K2M9X.", timestamp: "2026-02-17T09:31:20Z" },
    ],
  },
  {
    id: "conv-2",
    guestId: "guest-1",
    channel: "chatGPT",
    startedAt: "2025-11-10T14:00:00Z",
    messages: [
      { role: "guest", text: "What suites do you have available Nov 12-14?", timestamp: "2025-11-10T14:00:00Z" },
      { role: "ai", text: "We have the Ocean View Deluxe Suite available at $289/night and the Penthouse Suite at $490/night for Nov 12-14.", timestamp: "2025-11-10T14:00:20Z" },
      { role: "guest", text: "I'll take the Ocean View please", timestamp: "2025-11-10T14:01:00Z" },
      { role: "ai", text: "Done! Booked the Ocean View Deluxe Suite for Nov 12–14. Total: $578.", timestamp: "2025-11-10T14:01:15Z" },
    ],
  },
  {
    id: "conv-3",
    guestId: "guest-2",
    channel: "widget",
    startedAt: "2026-02-15T11:00:00Z",
    messages: [
      { role: "guest", text: "Do you have anything available for tomorrow night?", timestamp: "2026-02-15T11:00:00Z" },
      { role: "ai", text: "Yes! We have a Standard Room at $170/night available Feb 16-18. Would you like to book it?", timestamp: "2026-02-15T11:00:12Z" },
      { role: "guest", text: "Perfect, book it for 2 nights", timestamp: "2026-02-15T11:00:45Z" },
      { role: "ai", text: "All set! Standard Room booked for Feb 16–18, total $340.", timestamp: "2026-02-15T11:01:00Z" },
    ],
  },
  {
    id: "conv-4",
    guestId: "guest-3",
    channel: "claude",
    startedAt: "2026-02-19T16:00:00Z",
    messages: [
      { role: "guest", text: "I need the Penthouse for Feb 20-22", timestamp: "2026-02-19T16:00:00Z" },
      { role: "ai", text: "The Penthouse Suite is available for Feb 20–22 at $490/night. As a returning VIP guest, would you like me to arrange any special amenities?", timestamp: "2026-02-19T16:00:18Z" },
      { role: "guest", text: "Yes, champagne on arrival and late checkout please", timestamp: "2026-02-19T16:01:00Z" },
      { role: "ai", text: "Wonderful! Booking confirmed: Penthouse Suite, Feb 20–22, $980. I've noted champagne on arrival and late checkout. Welcome back, Elena!", timestamp: "2026-02-19T16:01:25Z" },
    ],
  },
  {
    id: "conv-5",
    guestId: "guest-6",
    channel: "widget",
    startedAt: "2026-02-21T08:00:00Z",
    messages: [
      { role: "guest", text: "Bonjour! I'd like to extend my upcoming stay", timestamp: "2026-02-21T08:00:00Z" },
      { role: "ai", text: "Hello Lucas! I see your reservation for the Ocean View Deluxe Suite, Feb 22–24. How many additional nights would you like?", timestamp: "2026-02-21T08:00:15Z" },
      { role: "guest", text: "Actually the dates are fine, just confirming everything is set", timestamp: "2026-02-21T08:01:00Z" },
      { role: "ai", text: "Everything looks great! Your booking is confirmed: Ocean View Deluxe Suite, Feb 22–24, $578. See you soon!", timestamp: "2026-02-21T08:01:10Z" },
    ],
  },
];
