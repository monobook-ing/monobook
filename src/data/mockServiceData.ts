// ── Types ────────────────────────────────────────────────────────────────

export type ServiceType = "internal" | "partner" | "product";
export type ServiceStatus = "active" | "hidden" | "draft";
export type PricingType = "fixed" | "per_person" | "per_night" | "per_hour" | "dynamic";
export type AvailabilityType = "always" | "date_range" | "time_slot" | "linked_booking";
export type Visibility = "public" | "after_booking" | "during_stay";

export interface ServiceCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  order: number;
}

export interface ServiceSlot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
}

export interface Service {
  id: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  type: ServiceType;
  categoryId: string;
  status: ServiceStatus;
  visibility: Visibility;
  pricingType: PricingType;
  price: number;
  currency: string;
  vatPercent: number;
  allowDiscount: boolean;
  bundleEligible: boolean;
  availabilityType: AvailabilityType;
  slots?: ServiceSlot[];
  imageUrl: string;
  attachRate: number;
  totalBookings: number;
  revenue30d: number;
  conversionRate: number;
  partnerId?: string;
  createdAt: string;
}

export interface Partner {
  id: string;
  name: string;
  activeServices: number;
  revenueSharePercent: number;
  revenueGenerated: number;
  status: "active" | "inactive";
}

export interface ServiceBooking {
  id: string;
  serviceId: string;
  guestName: string;
  date: string;
  quantity: number;
  total: number;
  status: "confirmed" | "pending" | "cancelled";
}

// ── Mock Categories ──────────────────────────────────────────────────────

export const mockServiceCategories: ServiceCategory[] = [
  { id: "cat-1", name: "Spa & Wellness", description: "Relaxation and body treatments", icon: "🧖", order: 1 },
  { id: "cat-2", name: "Dining & Drinks", description: "Restaurant and bar offerings", icon: "🍽️", order: 2 },
  { id: "cat-3", name: "Activities", description: "Tours, excursions, and entertainment", icon: "🎯", order: 3 },
  { id: "cat-4", name: "Transport", description: "Airport transfers and car rental", icon: "🚗", order: 4 },
  { id: "cat-5", name: "Essentials", description: "Toiletries, chargers, and extras", icon: "🧴", order: 5 },
];

// ── Mock Partners ────────────────────────────────────────────────────────

export const mockPartners: Partner[] = [
  { id: "ptr-1", name: "City Tours Ltd.", activeServices: 3, revenueSharePercent: 15, revenueGenerated: 4820, status: "active" },
  { id: "ptr-2", name: "Relax Spa Group", activeServices: 2, revenueSharePercent: 20, revenueGenerated: 7350, status: "active" },
  { id: "ptr-3", name: "Green Transfers", activeServices: 1, revenueSharePercent: 10, revenueGenerated: 1200, status: "inactive" },
];

// ── Mock Services ────────────────────────────────────────────────────────

export const mockServices: Service[] = [
  {
    id: "svc-1",
    name: "Deep Tissue Massage",
    shortDescription: "60-minute deep tissue massage in-room or spa",
    fullDescription: "A therapeutic full-body massage targeting muscle tension and stress relief. Available in-room or at the hotel spa.",
    type: "internal",
    categoryId: "cat-1",
    status: "active",
    visibility: "public",
    pricingType: "fixed",
    price: 89,
    currency: "USD",
    vatPercent: 20,
    allowDiscount: true,
    bundleEligible: true,
    availabilityType: "time_slot",
    slots: [
      { id: "slot-1", time: "09:00", capacity: 2, booked: 2 },
      { id: "slot-2", time: "11:00", capacity: 2, booked: 1 },
      { id: "slot-3", time: "14:00", capacity: 2, booked: 0 },
      { id: "slot-4", time: "16:00", capacity: 2, booked: 0 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop",
    attachRate: 24,
    totalBookings: 187,
    revenue30d: 5340,
    conversionRate: 18,
    createdAt: "2025-09-12",
  },
  {
    id: "svc-2",
    name: "Airport Transfer",
    shortDescription: "Private car transfer to/from airport",
    fullDescription: "Comfortable private sedan or minivan transfer between the hotel and the nearest airport. Book up to 24h before arrival.",
    type: "partner",
    categoryId: "cat-4",
    status: "active",
    visibility: "after_booking",
    pricingType: "fixed",
    price: 45,
    currency: "USD",
    vatPercent: 10,
    allowDiscount: false,
    bundleEligible: true,
    availabilityType: "linked_booking",
    imageUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0afa?w=400&h=300&fit=crop",
    attachRate: 38,
    totalBookings: 312,
    revenue30d: 8100,
    conversionRate: 32,
    partnerId: "ptr-3",
    createdAt: "2025-08-05",
  },
  {
    id: "svc-3",
    name: "Romantic Dinner Package",
    shortDescription: "4-course dinner with wine pairing for two",
    fullDescription: "An exclusive candlelit 4-course dinner at the rooftop restaurant with curated wine pairing. Perfect for special occasions.",
    type: "internal",
    categoryId: "cat-2",
    status: "active",
    visibility: "public",
    pricingType: "per_person",
    price: 120,
    currency: "USD",
    vatPercent: 20,
    allowDiscount: true,
    bundleEligible: false,
    availabilityType: "date_range",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop",
    attachRate: 12,
    totalBookings: 64,
    revenue30d: 3840,
    conversionRate: 9,
    createdAt: "2025-10-01",
  },
  {
    id: "svc-4",
    name: "City Walking Tour",
    shortDescription: "Guided 3-hour tour of Old Town highlights",
    fullDescription: "Explore the city's top landmarks with a certified local guide. Includes skip-the-line museum entry and a coffee stop.",
    type: "partner",
    categoryId: "cat-3",
    status: "draft",
    visibility: "public",
    pricingType: "per_person",
    price: 35,
    currency: "USD",
    vatPercent: 10,
    allowDiscount: true,
    bundleEligible: true,
    availabilityType: "time_slot",
    slots: [
      { id: "slot-5", time: "10:00", capacity: 12, booked: 8 },
      { id: "slot-6", time: "15:00", capacity: 12, booked: 3 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1569949381669-ecf31ae8f613?w=400&h=300&fit=crop",
    attachRate: 8,
    totalBookings: 42,
    revenue30d: 980,
    conversionRate: 6,
    partnerId: "ptr-1",
    createdAt: "2026-01-15",
  },
  {
    id: "svc-5",
    name: "Premium Toiletry Kit",
    shortDescription: "Luxury travel-size toiletry set",
    fullDescription: "Eco-friendly premium toiletry kit including shampoo, conditioner, body wash, and moisturizer in reusable containers.",
    type: "product",
    categoryId: "cat-5",
    status: "active",
    visibility: "during_stay",
    pricingType: "fixed",
    price: 25,
    currency: "USD",
    vatPercent: 20,
    allowDiscount: false,
    bundleEligible: true,
    availabilityType: "always",
    imageUrl: "https://images.unsplash.com/photo-1556228578-8c89e6adf883?w=400&h=300&fit=crop",
    attachRate: 15,
    totalBookings: 203,
    revenue30d: 1525,
    conversionRate: 12,
    createdAt: "2025-11-20",
  },
  {
    id: "svc-6",
    name: "Yoga Session",
    shortDescription: "Morning rooftop yoga class",
    fullDescription: "Start your day with a 45-minute guided yoga session on the rooftop terrace. Mats and water provided.",
    type: "internal",
    categoryId: "cat-1",
    status: "hidden",
    visibility: "public",
    pricingType: "per_person",
    price: 20,
    currency: "USD",
    vatPercent: 20,
    allowDiscount: true,
    bundleEligible: false,
    availabilityType: "time_slot",
    slots: [
      { id: "slot-7", time: "07:00", capacity: 10, booked: 10 },
      { id: "slot-8", time: "08:00", capacity: 10, booked: 5 },
    ],
    imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=400&h=300&fit=crop",
    attachRate: 20,
    totalBookings: 156,
    revenue30d: 2200,
    conversionRate: 15,
    createdAt: "2025-07-18",
  },
];

// ── Mock Bookings ────────────────────────────────────────────────────────

export const mockServiceBookings: ServiceBooking[] = [
  { id: "sb-1", serviceId: "svc-1", guestName: "Anna Müller", date: "2026-02-28", quantity: 1, total: 89, status: "confirmed" },
  { id: "sb-2", serviceId: "svc-1", guestName: "James Lee", date: "2026-02-27", quantity: 2, total: 178, status: "confirmed" },
  { id: "sb-3", serviceId: "svc-2", guestName: "Sophie Martin", date: "2026-02-26", quantity: 1, total: 45, status: "pending" },
  { id: "sb-4", serviceId: "svc-3", guestName: "Carlos Rivera", date: "2026-02-25", quantity: 2, total: 240, status: "confirmed" },
  { id: "sb-5", serviceId: "svc-5", guestName: "Emily Wang", date: "2026-02-24", quantity: 3, total: 75, status: "confirmed" },
  { id: "sb-6", serviceId: "svc-4", guestName: "Oliver Brown", date: "2026-02-23", quantity: 1, total: 35, status: "cancelled" },
  { id: "sb-7", serviceId: "svc-6", guestName: "Yuki Tanaka", date: "2026-02-22", quantity: 1, total: 20, status: "confirmed" },
];

// ── Analytics mock ───────────────────────────────────────────────────────

export const mockServiceRevenueByMonth = [
  { month: "Sep", revenue: 4200 },
  { month: "Oct", revenue: 5800 },
  { month: "Nov", revenue: 6100 },
  { month: "Dec", revenue: 8400 },
  { month: "Jan", revenue: 7200 },
  { month: "Feb", revenue: 9100 },
];

export const mockAttachRateByService = [
  { name: "Massage", rate: 24 },
  { name: "Transfer", rate: 38 },
  { name: "Dinner", rate: 12 },
  { name: "Tour", rate: 8 },
  { name: "Toiletry", rate: 15 },
  { name: "Yoga", rate: 20 },
];

// ── Helpers ──────────────────────────────────────────────────────────────

export const getCategoryName = (id: string) =>
  mockServiceCategories.find((c) => c.id === id)?.name ?? "—";

export const getPartnerName = (id?: string) =>
  id ? mockPartners.find((p) => p.id === id)?.name ?? "—" : "—";

export const serviceTypeLabel: Record<ServiceType, string> = {
  internal: "Internal",
  partner: "Partner",
  product: "Product",
};

export const statusColor: Record<ServiceStatus, string> = {
  active: "bg-success/10 text-success",
  hidden: "bg-muted text-muted-foreground",
  draft: "bg-primary/10 text-primary",
};
