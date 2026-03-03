import { API_BASE } from "@/lib/auth";

export type ServiceType = "internal" | "partner" | "product";
export type ServiceStatus = "active" | "hidden" | "draft";
export type PricingType = "fixed" | "per_person" | "per_night" | "per_hour" | "dynamic";
export type AvailabilityType = "always" | "date_range" | "time_slot" | "linked_booking";
export type Visibility = "public" | "after_booking" | "during_stay";
export type CapacityMode = "unlimited" | "limited_quantity" | "per_day_limit" | "per_hour_limit";
export type ServiceBookingStatus = "confirmed" | "pending" | "cancelled";
export type PartnerStatus = "active" | "inactive";
export type PartnerPayoutType = "manual" | "automated" | "affiliate";

export interface ServiceCategory {
  id: string;
  accountId: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServicePartner {
  id: string;
  accountId: string;
  slug: string;
  name: string;
  revenueSharePercent: number;
  payoutType: PartnerPayoutType;
  externalUrl: string | null;
  attributionTracking: boolean;
  status: PartnerStatus;
  activeServices: number;
  revenueGenerated: number;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceSlot {
  id: string;
  serviceId: string;
  time: string;
  capacity: number;
  booked: number;
  sortOrder: number;
  createdAt: string;
}

export interface Service {
  id: string;
  propertyId: string;
  accountId: string;
  categoryId: string | null;
  partnerId: string | null;
  slug: string;
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrls: string[];
  type: ServiceType;
  status: ServiceStatus;
  visibility: Visibility;
  pricingType: PricingType;
  price: number;
  currencyCode: string;
  vatPercent: number;
  allowDiscount: boolean;
  bundleEligible: boolean;
  availabilityType: AvailabilityType;
  capacityMode: CapacityMode;
  capacityLimit: number | null;
  recurringScheduleEnabled: boolean;
  availableBeforeBooking: boolean;
  availableDuringBooking: boolean;
  postBookingUpsell: boolean;
  inStayQrOrdering: boolean;
  upsellTriggerRoomType: string;
  earlyBookingDiscountPercent: number | null;
  knowledgeLanguage: string;
  knowledgeAiSearchEnabled: boolean;
  attachRate: number;
  totalBookings: number;
  revenue30d: number;
  conversionRate: number;
  categoryName: string | null;
  partnerName: string | null;
  slots: ServiceSlot[];
  createdAt: string;
  updatedAt: string;
}

export interface ServiceBooking {
  id: string;
  propertyId: string;
  serviceId: string;
  bookingId: string | null;
  externalRef: string;
  guestName: string;
  serviceDate: string;
  quantity: number;
  total: number;
  currencyCode: string;
  status: ServiceBookingStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ServiceRevenuePoint {
  month: string;
  revenue: number;
}

export interface ServiceAttachRatePoint {
  name: string;
  rate: number;
}

export interface ServiceTopPerformer {
  id: string;
  name: string;
  imageUrl: string | null;
  attachRate: number;
  revenue30d: number;
}

export interface ServiceAnalytics {
  revenueByMonth: ServiceRevenuePoint[];
  attachRateByService: ServiceAttachRatePoint[];
  topServices: ServiceTopPerformer[];
}

export interface ServiceSlotInput {
  time: string;
  capacity: number;
  booked: number;
  sortOrder: number;
}

export interface ServiceUpsertInput {
  name: string;
  shortDescription: string;
  fullDescription: string;
  imageUrls: string[];
  type: ServiceType;
  categoryId: string | null;
  partnerId: string | null;
  status: ServiceStatus;
  visibility: Visibility;
  pricingType: PricingType;
  price: number;
  currencyCode: string;
  vatPercent: number;
  allowDiscount: boolean;
  bundleEligible: boolean;
  availabilityType: AvailabilityType;
  capacityMode: CapacityMode;
  capacityLimit: number | null;
  recurringScheduleEnabled: boolean;
  availableBeforeBooking: boolean;
  availableDuringBooking: boolean;
  postBookingUpsell: boolean;
  inStayQrOrdering: boolean;
  upsellTriggerRoomType: string;
  earlyBookingDiscountPercent: number | null;
  knowledgeLanguage: string;
  knowledgeAiSearchEnabled: boolean;
  attachRate: number;
  totalBookings: number;
  revenue30d: number;
  conversionRate: number;
  slots: ServiceSlotInput[];
}

export interface CreateServiceCategoryInput {
  name: string;
  description: string;
  icon: string;
  sortOrder: number;
}

export interface UpdateServiceCategoryInput {
  name?: string;
  description?: string;
  icon?: string;
  sortOrder?: number;
}

export interface CreateServicePartnerInput {
  name: string;
  revenueSharePercent: number;
  payoutType: PartnerPayoutType;
  externalUrl?: string | null;
  attributionTracking?: boolean;
  status: PartnerStatus;
}

export interface UpdateServicePartnerInput {
  name?: string;
  revenueSharePercent?: number;
  payoutType?: PartnerPayoutType;
  externalUrl?: string | null;
  attributionTracking?: boolean;
  status?: PartnerStatus;
}

export interface FetchServicesOptions {
  search?: string;
  type?: ServiceType;
  categoryId?: string;
  status?: ServiceStatus;
}

export class ServicesApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ServicesApiError";
  }
}

const parseError = async (res: Response) => {
  const body = await res.json().catch(() => null);
  const message =
    (body && typeof body.detail === "string" && body.detail) ||
    (body && typeof body.message === "string" && body.message) ||
    `Request failed with status ${res.status}`;
  return new ServicesApiError(message, res.status);
};

const authHeaders = (accessToken: string, contentType = true): HeadersInit => {
  return {
    Authorization: `Bearer ${accessToken}`,
    ...(contentType ? { "Content-Type": "application/json" } : {}),
  };
};

const asNumber = (value: unknown, fallback = 0) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const mapServiceCategory = (item: any): ServiceCategory => ({
  id: item.id,
  accountId: item.account_id,
  slug: item.slug,
  name: item.name,
  description: item.description ?? "",
  icon: item.icon ?? "📦",
  sortOrder: asNumber(item.sort_order),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapServicePartner = (item: any): ServicePartner => ({
  id: item.id,
  accountId: item.account_id,
  slug: item.slug,
  name: item.name,
  revenueSharePercent: asNumber(item.revenue_share_percent),
  payoutType: item.payout_type ?? "manual",
  externalUrl: item.external_url ?? null,
  attributionTracking: Boolean(item.attribution_tracking),
  status: item.status ?? "active",
  activeServices: asNumber(item.active_services),
  revenueGenerated: asNumber(item.revenue_generated),
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapServiceSlot = (item: any): ServiceSlot => ({
  id: item.id,
  serviceId: item.service_id,
  time: item.time ?? "",
  capacity: asNumber(item.capacity),
  booked: asNumber(item.booked),
  sortOrder: asNumber(item.sort_order),
  createdAt: item.created_at,
});

const mapService = (item: any): Service => ({
  id: item.id,
  propertyId: item.property_id,
  accountId: item.account_id,
  categoryId: item.category_id ?? null,
  partnerId: item.partner_id ?? null,
  slug: item.slug,
  name: item.name,
  shortDescription: item.short_description ?? "",
  fullDescription: item.full_description ?? "",
  imageUrls: Array.isArray(item.image_urls) ? item.image_urls : [],
  type: item.type ?? "internal",
  status: item.status ?? "draft",
  visibility: item.visibility ?? "public",
  pricingType: item.pricing_type ?? "fixed",
  price: asNumber(item.price),
  currencyCode: item.currency_code ?? "USD",
  vatPercent: asNumber(item.vat_percent),
  allowDiscount: Boolean(item.allow_discount),
  bundleEligible: Boolean(item.bundle_eligible),
  availabilityType: item.availability_type ?? "always",
  capacityMode: item.capacity_mode ?? "unlimited",
  capacityLimit: item.capacity_limit == null ? null : asNumber(item.capacity_limit),
  recurringScheduleEnabled: Boolean(item.recurring_schedule_enabled),
  availableBeforeBooking: Boolean(item.available_before_booking),
  availableDuringBooking: Boolean(item.available_during_booking),
  postBookingUpsell: Boolean(item.post_booking_upsell),
  inStayQrOrdering: Boolean(item.in_stay_qr_ordering),
  upsellTriggerRoomType: item.upsell_trigger_room_type ?? "any",
  earlyBookingDiscountPercent:
    item.early_booking_discount_percent == null
      ? null
      : asNumber(item.early_booking_discount_percent),
  knowledgeLanguage: item.knowledge_language ?? "en",
  knowledgeAiSearchEnabled: Boolean(item.knowledge_ai_search_enabled),
  attachRate: asNumber(item.attach_rate),
  totalBookings: asNumber(item.total_bookings),
  revenue30d: asNumber(item.revenue_30d),
  conversionRate: asNumber(item.conversion_rate),
  categoryName: item.category_name ?? null,
  partnerName: item.partner_name ?? null,
  slots: Array.isArray(item.slots) ? item.slots.map(mapServiceSlot) : [],
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapServiceBooking = (item: any): ServiceBooking => ({
  id: item.id,
  propertyId: item.property_id,
  serviceId: item.service_id,
  bookingId: item.booking_id ?? null,
  externalRef: item.external_ref,
  guestName: item.guest_name,
  serviceDate: item.service_date,
  quantity: asNumber(item.quantity, 1),
  total: asNumber(item.total),
  currencyCode: item.currency_code ?? "USD",
  status: item.status ?? "confirmed",
  createdAt: item.created_at,
  updatedAt: item.updated_at,
});

const mapUpsertPayload = (input: ServiceUpsertInput) => ({
  name: input.name,
  short_description: input.shortDescription,
  full_description: input.fullDescription,
  image_urls: input.imageUrls,
  type: input.type,
  category_id: input.categoryId,
  partner_id: input.partnerId,
  status: input.status,
  visibility: input.visibility,
  pricing_type: input.pricingType,
  price: input.price,
  currency_code: input.currencyCode,
  vat_percent: input.vatPercent,
  allow_discount: input.allowDiscount,
  bundle_eligible: input.bundleEligible,
  availability_type: input.availabilityType,
  capacity_mode: input.capacityMode,
  capacity_limit: input.capacityLimit,
  recurring_schedule_enabled: input.recurringScheduleEnabled,
  available_before_booking: input.availableBeforeBooking,
  available_during_booking: input.availableDuringBooking,
  post_booking_upsell: input.postBookingUpsell,
  in_stay_qr_ordering: input.inStayQrOrdering,
  upsell_trigger_room_type: input.upsellTriggerRoomType,
  early_booking_discount_percent: input.earlyBookingDiscountPercent,
  knowledge_language: input.knowledgeLanguage,
  knowledge_ai_search_enabled: input.knowledgeAiSearchEnabled,
  attach_rate: input.attachRate,
  total_bookings: input.totalBookings,
  revenue_30d: input.revenue30d,
  conversion_rate: input.conversionRate,
  slots: input.slots.map((slot) => ({
    time: slot.time,
    capacity: slot.capacity,
    booked: slot.booked,
    sort_order: slot.sortOrder,
  })),
});

export const fetchServiceCategories = async (
  accessToken: string,
  propertyId: string
): Promise<ServiceCategory[]> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/categories`, {
    method: "GET",
    headers: authHeaders(accessToken, false),
  });
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return (data.items ?? []).map(mapServiceCategory);
};

export const createServiceCategory = async (
  accessToken: string,
  propertyId: string,
  input: CreateServiceCategoryInput
): Promise<ServiceCategory> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/categories`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      name: input.name,
      description: input.description,
      icon: input.icon,
      sort_order: input.sortOrder,
    }),
  });
  if (!res.ok) throw await parseError(res);
  return mapServiceCategory(await res.json());
};

export const updateServiceCategory = async (
  accessToken: string,
  propertyId: string,
  categoryId: string,
  input: UpdateServiceCategoryInput
): Promise<ServiceCategory> => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.description !== undefined) payload.description = input.description;
  if (input.icon !== undefined) payload.icon = input.icon;
  if (input.sortOrder !== undefined) payload.sort_order = input.sortOrder;

  const res = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/services/categories/${categoryId}`,
    {
      method: "PATCH",
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    }
  );
  if (!res.ok) throw await parseError(res);
  return mapServiceCategory(await res.json());
};

export const reorderServiceCategories = async (
  accessToken: string,
  propertyId: string,
  items: Array<{ id: string; sortOrder: number }>
): Promise<ServiceCategory[]> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/categories/reorder`, {
    method: "PUT",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      items: items.map((item) => ({ id: item.id, sort_order: item.sortOrder })),
    }),
  });
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return (data.items ?? []).map(mapServiceCategory);
};

export const deleteServiceCategory = async (
  accessToken: string,
  propertyId: string,
  categoryId: string
): Promise<void> => {
  const res = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/services/categories/${categoryId}`,
    {
      method: "DELETE",
      headers: authHeaders(accessToken, false),
    }
  );
  if (!res.ok) throw await parseError(res);
};

export const fetchServicePartners = async (
  accessToken: string,
  propertyId: string
): Promise<ServicePartner[]> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/partners`, {
    method: "GET",
    headers: authHeaders(accessToken, false),
  });
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return (data.items ?? []).map(mapServicePartner);
};

export const createServicePartner = async (
  accessToken: string,
  propertyId: string,
  input: CreateServicePartnerInput
): Promise<ServicePartner> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/partners`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify({
      name: input.name,
      revenue_share_percent: input.revenueSharePercent,
      payout_type: input.payoutType,
      external_url: input.externalUrl ?? null,
      attribution_tracking: input.attributionTracking ?? false,
      status: input.status,
    }),
  });
  if (!res.ok) throw await parseError(res);
  return mapServicePartner(await res.json());
};

export const updateServicePartner = async (
  accessToken: string,
  propertyId: string,
  partnerId: string,
  input: UpdateServicePartnerInput
): Promise<ServicePartner> => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = input.name;
  if (input.revenueSharePercent !== undefined) {
    payload.revenue_share_percent = input.revenueSharePercent;
  }
  if (input.payoutType !== undefined) payload.payout_type = input.payoutType;
  if (input.externalUrl !== undefined) payload.external_url = input.externalUrl;
  if (input.attributionTracking !== undefined) {
    payload.attribution_tracking = input.attributionTracking;
  }
  if (input.status !== undefined) payload.status = input.status;

  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/partners/${partnerId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return mapServicePartner(await res.json());
};

export const fetchServices = async (
  accessToken: string,
  propertyId: string,
  options?: FetchServicesOptions
): Promise<Service[]> => {
  const params = new URLSearchParams();
  if (options?.search?.trim()) params.set("search", options.search.trim());
  if (options?.type) params.set("type", options.type);
  if (options?.categoryId) params.set("category_id", options.categoryId);
  if (options?.status) params.set("status", options.status);

  const query = params.toString();
  const res = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/services${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: authHeaders(accessToken, false),
    }
  );
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return (data.items ?? []).map(mapService);
};

export const fetchServiceById = async (
  accessToken: string,
  propertyId: string,
  serviceId: string
): Promise<Service> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/${serviceId}`, {
    method: "GET",
    headers: authHeaders(accessToken, false),
  });
  if (!res.ok) throw await parseError(res);
  return mapService(await res.json());
};

export const createService = async (
  accessToken: string,
  propertyId: string,
  input: ServiceUpsertInput
): Promise<Service> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services`, {
    method: "POST",
    headers: authHeaders(accessToken),
    body: JSON.stringify(mapUpsertPayload(input)),
  });
  if (!res.ok) throw await parseError(res);
  return mapService(await res.json());
};

export const updateService = async (
  accessToken: string,
  propertyId: string,
  serviceId: string,
  input: Partial<ServiceUpsertInput>
): Promise<Service> => {
  const payload: Record<string, unknown> = {};

  if (input.name !== undefined) payload.name = input.name;
  if (input.shortDescription !== undefined) payload.short_description = input.shortDescription;
  if (input.fullDescription !== undefined) payload.full_description = input.fullDescription;
  if (input.imageUrls !== undefined) payload.image_urls = input.imageUrls;
  if (input.type !== undefined) payload.type = input.type;
  if (input.categoryId !== undefined) payload.category_id = input.categoryId;
  if (input.partnerId !== undefined) payload.partner_id = input.partnerId;
  if (input.status !== undefined) payload.status = input.status;
  if (input.visibility !== undefined) payload.visibility = input.visibility;
  if (input.pricingType !== undefined) payload.pricing_type = input.pricingType;
  if (input.price !== undefined) payload.price = input.price;
  if (input.currencyCode !== undefined) payload.currency_code = input.currencyCode;
  if (input.vatPercent !== undefined) payload.vat_percent = input.vatPercent;
  if (input.allowDiscount !== undefined) payload.allow_discount = input.allowDiscount;
  if (input.bundleEligible !== undefined) payload.bundle_eligible = input.bundleEligible;
  if (input.availabilityType !== undefined) payload.availability_type = input.availabilityType;
  if (input.capacityMode !== undefined) payload.capacity_mode = input.capacityMode;
  if (input.capacityLimit !== undefined) payload.capacity_limit = input.capacityLimit;
  if (input.recurringScheduleEnabled !== undefined) {
    payload.recurring_schedule_enabled = input.recurringScheduleEnabled;
  }
  if (input.availableBeforeBooking !== undefined) {
    payload.available_before_booking = input.availableBeforeBooking;
  }
  if (input.availableDuringBooking !== undefined) {
    payload.available_during_booking = input.availableDuringBooking;
  }
  if (input.postBookingUpsell !== undefined) payload.post_booking_upsell = input.postBookingUpsell;
  if (input.inStayQrOrdering !== undefined) payload.in_stay_qr_ordering = input.inStayQrOrdering;
  if (input.upsellTriggerRoomType !== undefined) {
    payload.upsell_trigger_room_type = input.upsellTriggerRoomType;
  }
  if (input.earlyBookingDiscountPercent !== undefined) {
    payload.early_booking_discount_percent = input.earlyBookingDiscountPercent;
  }
  if (input.knowledgeLanguage !== undefined) payload.knowledge_language = input.knowledgeLanguage;
  if (input.knowledgeAiSearchEnabled !== undefined) {
    payload.knowledge_ai_search_enabled = input.knowledgeAiSearchEnabled;
  }
  if (input.attachRate !== undefined) payload.attach_rate = input.attachRate;
  if (input.totalBookings !== undefined) payload.total_bookings = input.totalBookings;
  if (input.revenue30d !== undefined) payload.revenue_30d = input.revenue30d;
  if (input.conversionRate !== undefined) payload.conversion_rate = input.conversionRate;
  if (input.slots !== undefined) {
    payload.slots = input.slots.map((slot) => ({
      time: slot.time,
      capacity: slot.capacity,
      booked: slot.booked,
      sort_order: slot.sortOrder,
    }));
  }

  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/${serviceId}`, {
    method: "PATCH",
    headers: authHeaders(accessToken),
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw await parseError(res);
  return mapService(await res.json());
};

export const deleteService = async (
  accessToken: string,
  propertyId: string,
  serviceId: string
): Promise<void> => {
  const res = await fetch(`${API_BASE}/v1.0/properties/${propertyId}/services/${serviceId}`, {
    method: "DELETE",
    headers: authHeaders(accessToken, false),
  });
  if (!res.ok) throw await parseError(res);
};

export const fetchServiceBookings = async (
  accessToken: string,
  propertyId: string,
  serviceId: string
): Promise<ServiceBooking[]> => {
  const res = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/services/${serviceId}/bookings`,
    {
      method: "GET",
      headers: authHeaders(accessToken, false),
    }
  );
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return (data.items ?? []).map(mapServiceBooking);
};

export const fetchServiceAnalytics = async (
  accessToken: string,
  propertyId: string,
  range?: string
): Promise<ServiceAnalytics> => {
  const params = new URLSearchParams();
  if (range) params.set("range", range);
  const query = params.toString();
  const res = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/services/analytics${query ? `?${query}` : ""}`,
    {
      method: "GET",
      headers: authHeaders(accessToken, false),
    }
  );
  if (!res.ok) throw await parseError(res);
  const data = await res.json();
  return {
    revenueByMonth: (data.revenue_by_month ?? []).map((item: any) => ({
      month: item.month ?? "",
      revenue: asNumber(item.revenue),
    })),
    attachRateByService: (data.attach_rate_by_service ?? []).map((item: any) => ({
      name: item.name ?? "",
      rate: asNumber(item.rate),
    })),
    topServices: (data.top_services ?? []).map((item: any) => ({
      id: item.id,
      name: item.name ?? "",
      imageUrl: item.image_url ?? null,
      attachRate: asNumber(item.attach_rate),
      revenue30d: asNumber(item.revenue_30d),
    })),
  };
};

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
