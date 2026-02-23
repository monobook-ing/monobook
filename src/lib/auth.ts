import { type Property } from "@/data/mockPropertyData";
import { type ManagedRoom } from "@/data/mockRoomData";
export const API_BASE = "https://api-fexi.onrender.com";

export type UserMe = {
  email: string;
  first_name: string;
  last_name: string;
  default_account_id: string;
};

export type ApiProperty = {
  id: string;
  name: string;
  street?: string | null;
  city?: string | null;
  state?: string | null;
  postal_code?: string | null;
  country?: string | null;
  lat?: number | null;
  lng?: number | null;
  floor?: string | null;
  section?: string | null;
  property_number?: string | null;
};

type PropertiesResponse = {
  items: ApiProperty[];
};

export type ApiGuestTier = {
  id: string;
  min_guests: number;
  max_guests: number;
  price_per_night: number;
};

export type ApiDateOverride = {
  id: string;
  date: string;
  price: number;
};

export type ApiRoom = {
  id: string;
  property_id: string;
  name: string;
  type: string;
  description: string;
  images: string[];
  price_per_night: number;
  max_guests: number;
  bed_config: string;
  amenities: string[];
  source: string;
  source_url?: string | null;
  sync_enabled: boolean;
  last_synced?: string | null;
  status: "active" | "draft" | "archived";
  guest_tiers?: ApiGuestTier[] | null;
  date_overrides?: ApiDateOverride[] | null;
};

type RoomsResponse = {
  items: ApiRoom[];
};

export type ApiAuditEntry = {
  id: string;
  property_id: string;
  conversation_id: string;
  source: string;
  tool_name: string;
  description: string;
  status: string;
  request_payload?: unknown;
  response_payload?: unknown;
  created_at: string;
};

export type ApiHostProfile = {
  id: string;
  property_id: string;
  name: string;
  location: string;
  bio: string;
  avatar_url: string | null;
  avatar_initials: string;
  reviews: number;
  rating: number;
  years_hosting: number;
  superhost: boolean;
  created_at: string;
  updated_at: string;
};

export type ApiKnowledgeFile = {
  id: string;
  property_id: string;
  name: string;
  size: string;
  storage_path: string | null;
  mime_type: string;
  created_at: string;
};

export type ApiPmsConnection = {
  id: string;
  property_id: string;
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ApiPaymentConnection = {
  id: string;
  property_id: string;
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
  created_at: string;
  updated_at: string;
};

export type ApiBookingStatus = "confirmed" | "pending" | "ai_pending" | "cancelled";

export type ApiBooking = {
  id: string;
  property_id: string;
  room_id: string;
  guest_id: string | null;
  guest_name: string;
  check_in: string;
  check_out: string;
  total_price: number;
  status: ApiBookingStatus;
  ai_handled: boolean;
  source: string | null;
  conversation_id: string | null;
  created_at: string;
  updated_at: string;
  cancelled_at: string | null;
};

export type HostProfile = {
  id: string;
  propertyId: string;
  name: string;
  location: string;
  bio: string;
  avatarUrl: string | null;
  avatarInitials: string;
  reviews: number;
  rating: number;
  yearsHosting: number;
  superhost: boolean;
  createdAt: string;
  updatedAt: string;
};

export type KnowledgeFile = {
  id: string;
  propertyId: string;
  name: string;
  size: string;
  storagePath: string | null;
  mimeType: string;
  createdAt: string;
};

export type PmsConnection = {
  id: string;
  propertyId: string;
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type PaymentConnection = {
  id: string;
  propertyId: string;
  provider: string;
  enabled: boolean;
  config: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
};

export type Booking = {
  id: string;
  propertyId: string;
  roomId: string;
  guestId: string | null;
  guestName: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: ApiBookingStatus;
  aiHandled: boolean;
  source: string | null;
  conversationId: string | null;
  createdAt: string;
  updatedAt: string;
  cancelledAt: string | null;
};

export type UpdateHostProfileInput = {
  name: string;
  location: string;
  bio: string;
};

export type CreateKnowledgeFileInput = {
  name: string;
  size: string;
  mimeType: string;
};

export type UpdatePmsConnectionInput = {
  enabled: boolean;
};

export type UpdatePaymentConnectionInput = {
  enabled: boolean;
};

export type CreateBookingInput = {
  roomId: string;
  guestId?: string | null;
  guestName: string;
  guestEmail?: string;
  checkIn: string;
  checkOut: string;
  totalPrice: number;
  status: ApiBookingStatus;
  aiHandled?: boolean;
  source?: string | null;
  conversationId?: string;
};

export type UpdateBookingInput = {
  roomId?: string;
  guestId?: string | null;
  guestName?: string;
  guestEmail?: string;
  checkIn?: string;
  checkOut?: string;
  totalPrice?: number;
  status?: ApiBookingStatus;
  aiHandled?: boolean;
  source?: string | null;
  conversationId?: string;
  cancelledAt?: string | null;
};

export type AuditEntriesResponse = {
  items: ApiAuditEntry[];
  next_cursor: string | null;
};

export type KnowledgeFilesResponse = {
  items: ApiKnowledgeFile[];
};

export type PmsConnectionsResponse = {
  items: ApiPmsConnection[];
};

export type PaymentConnectionsResponse = {
  items: ApiPaymentConnection[];
};

export type BookingsResponse = {
  items: ApiBooking[];
};

export type DeleteKnowledgeFileResponse = {
  message: string;
  id: string;
};

export type DeleteRoomResponse = {
  message: string;
  id: string;
};

export type AuditEntry = {
  id: string;
  propertyId: string;
  conversationId: string;
  source: string;
  toolName: string;
  description: string;
  status: string;
  createdAt: string;
};

export class AuthApiError extends Error {
  status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "AuthApiError";
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type AuthRequestOptions = {
  skipAutoLogoutOn401?: boolean;
};

const isAuthEndpoint = (url: string) => {
  return url.includes("/v1.0/signin/");
};

const requestWithAuthInterceptor = async (
  url: string,
  init: RequestInit,
  options?: AuthRequestOptions
) => {
  const firstResponse = await fetch(url, init);
  if (firstResponse.status !== 401) {
    return firstResponse;
  }

  const secondResponse = await fetch(url, init);
  if (secondResponse.status === 401) {
    const skipAutoLogout = options?.skipAutoLogoutOn401 ?? isAuthEndpoint(url);
    if (!skipAutoLogout) {
      logoutAndRedirectToAuth();
    }
  }

  return secondResponse;
};

const parseError = async (res: Response): Promise<AuthApiError> => {
  const body = await res.json().catch(() => null);
  const message =
    body?.detail || body?.message || `Request failed with status ${res.status}`;
  return new AuthApiError(message, res.status);
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return Boolean(value) && typeof value === "object";
};

const readStringField = (candidate: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === "string") {
      return value.trim();
    }
  }

  return undefined;
};

const hasAnyUserMeField = (candidate: Record<string, unknown>) => {
  return [
    "email",
    "email_address",
    "emailAddress",
    "first_name",
    "firstName",
    "last_name",
    "lastName",
    "default_account_id",
    "defaultAccountId",
  ].some((key) => key in candidate);
};

const extractUserMeCandidate = (value: unknown): Record<string, unknown> | null => {
  if (!isRecord(value)) return null;

  if (isRecord(value.user)) return value.user;
  if (isRecord(value.data) && hasAnyUserMeField(value.data)) return value.data;

  return value;
};

const normalizeUserMe = (value: unknown): UserMe | null => {
  const candidate = extractUserMeCandidate(value);
  if (!candidate) return null;

  const email = readStringField(candidate, ["email", "email_address", "emailAddress"]);
  if (!email) return null;

  const firstName =
    readStringField(candidate, ["first_name", "firstName", "given_name", "givenName"]) ?? "";
  const lastName =
    readStringField(candidate, ["last_name", "lastName", "family_name", "familyName"]) ?? "";
  const defaultAccountId =
    readStringField(candidate, [
      "default_account_id",
      "defaultAccountId",
      "account_id",
      "accountId",
    ]) ?? "";

  return {
    email,
    first_name: firstName,
    last_name: lastName,
    default_account_id: defaultAccountId,
  };
};

const asOptionalString = (value: unknown) => {
  return typeof value === "string" ? value : "";
};

const asOptionalNumber = (value: unknown) => {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
};

const isApiProperty = (value: unknown): value is ApiProperty => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.id === "string" && typeof candidate.name === "string";
};

const isApiGuestTier = (value: unknown): value is ApiGuestTier => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.min_guests === "number" &&
    Number.isFinite(candidate.min_guests) &&
    typeof candidate.max_guests === "number" &&
    Number.isFinite(candidate.max_guests) &&
    typeof candidate.price_per_night === "number" &&
    Number.isFinite(candidate.price_per_night)
  );
};

const isApiDateOverride = (value: unknown): value is ApiDateOverride => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.date === "string" &&
    typeof candidate.price === "number" &&
    Number.isFinite(candidate.price)
  );
};

const isApiRoom = (value: unknown): value is ApiRoom => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  const guestTiers = candidate.guest_tiers;
  const dateOverrides = candidate.date_overrides;

  const hasValidGuestTiers =
    guestTiers == null ||
    (Array.isArray(guestTiers) && guestTiers.every(isApiGuestTier));

  const hasValidDateOverrides =
    dateOverrides == null ||
    (Array.isArray(dateOverrides) && dateOverrides.every(isApiDateOverride));

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.type === "string" &&
    typeof candidate.description === "string" &&
    Array.isArray(candidate.images) &&
    candidate.images.every((item) => typeof item === "string") &&
    typeof candidate.price_per_night === "number" &&
    Number.isFinite(candidate.price_per_night) &&
    typeof candidate.max_guests === "number" &&
    Number.isFinite(candidate.max_guests) &&
    typeof candidate.bed_config === "string" &&
    Array.isArray(candidate.amenities) &&
    candidate.amenities.every((item) => typeof item === "string") &&
    typeof candidate.source === "string" &&
    (candidate.source_url == null || typeof candidate.source_url === "string") &&
    typeof candidate.sync_enabled === "boolean" &&
    (candidate.last_synced == null || typeof candidate.last_synced === "string") &&
    (candidate.status === "active" ||
      candidate.status === "draft" ||
      candidate.status === "archived") &&
    hasValidGuestTiers &&
    hasValidDateOverrides
  );
};

const isValidPropertiesResponse = (value: unknown): value is PropertiesResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiProperty);
};

const isValidRoomsResponse = (value: unknown): value is RoomsResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiRoom);
};

const isApiAuditEntry = (value: unknown): value is ApiAuditEntry => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.conversation_id === "string" &&
    typeof candidate.source === "string" &&
    typeof candidate.tool_name === "string" &&
    typeof candidate.description === "string" &&
    typeof candidate.status === "string" &&
    typeof candidate.created_at === "string"
  );
};

const isApiHostProfile = (value: unknown): value is ApiHostProfile => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.location === "string" &&
    typeof candidate.bio === "string" &&
    (candidate.avatar_url === null || typeof candidate.avatar_url === "string") &&
    typeof candidate.avatar_initials === "string" &&
    typeof candidate.reviews === "number" &&
    Number.isFinite(candidate.reviews) &&
    typeof candidate.rating === "number" &&
    Number.isFinite(candidate.rating) &&
    typeof candidate.years_hosting === "number" &&
    Number.isFinite(candidate.years_hosting) &&
    typeof candidate.superhost === "boolean" &&
    typeof candidate.created_at === "string" &&
    typeof candidate.updated_at === "string"
  );
};

const isApiKnowledgeFile = (value: unknown): value is ApiKnowledgeFile => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.size === "string" &&
    (candidate.storage_path === null || typeof candidate.storage_path === "string") &&
    typeof candidate.mime_type === "string" &&
    typeof candidate.created_at === "string"
  );
};

const isApiPmsConnection = (value: unknown): value is ApiPmsConnection => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.provider === "string" &&
    typeof candidate.enabled === "boolean" &&
    isRecord(candidate.config) &&
    typeof candidate.created_at === "string" &&
    typeof candidate.updated_at === "string"
  );
};

const isApiPaymentConnection = (value: unknown): value is ApiPaymentConnection => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.provider === "string" &&
    typeof candidate.enabled === "boolean" &&
    isRecord(candidate.config) &&
    typeof candidate.created_at === "string" &&
    typeof candidate.updated_at === "string"
  );
};

const isApiBookingStatus = (value: unknown): value is ApiBookingStatus => {
  return (
    value === "confirmed" ||
    value === "pending" ||
    value === "ai_pending" ||
    value === "cancelled"
  );
};

const isApiBooking = (value: unknown): value is ApiBooking => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.id === "string" &&
    typeof candidate.property_id === "string" &&
    typeof candidate.room_id === "string" &&
    (candidate.guest_id === null || typeof candidate.guest_id === "string") &&
    typeof candidate.guest_name === "string" &&
    typeof candidate.check_in === "string" &&
    typeof candidate.check_out === "string" &&
    typeof candidate.total_price === "number" &&
    Number.isFinite(candidate.total_price) &&
    isApiBookingStatus(candidate.status) &&
    typeof candidate.ai_handled === "boolean" &&
    (candidate.source === null || typeof candidate.source === "string") &&
    (candidate.conversation_id === null || typeof candidate.conversation_id === "string") &&
    typeof candidate.created_at === "string" &&
    typeof candidate.updated_at === "string" &&
    (candidate.cancelled_at === null || typeof candidate.cancelled_at === "string")
  );
};

const isValidAuditEntriesResponse = (value: unknown): value is AuditEntriesResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.items) &&
    candidate.items.every(isApiAuditEntry) &&
    (candidate.next_cursor === null || typeof candidate.next_cursor === "string")
  );
};

const isValidKnowledgeFilesResponse = (
  value: unknown
): value is KnowledgeFilesResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiKnowledgeFile);
};

const isValidPmsConnectionsResponse = (
  value: unknown
): value is PmsConnectionsResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiPmsConnection);
};

const isValidPaymentConnectionsResponse = (
  value: unknown
): value is PaymentConnectionsResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiPaymentConnection);
};

const isValidBookingsResponse = (value: unknown): value is BookingsResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return Array.isArray(candidate.items) && candidate.items.every(isApiBooking);
};

const isValidDeleteKnowledgeFileResponse = (
  value: unknown
): value is DeleteKnowledgeFileResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.message === "string" && typeof candidate.id === "string";
};

const isValidDeleteRoomResponse = (value: unknown): value is DeleteRoomResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return typeof candidate.message === "string" && typeof candidate.id === "string";
};

const mapApiProperty = (item: ApiProperty): Property => {
  return {
    id: item.id,
    name: item.name,
    address: {
      street: asOptionalString(item.street),
      city: asOptionalString(item.city),
      state: asOptionalString(item.state),
      postalCode: asOptionalString(item.postal_code),
      country: asOptionalString(item.country),
      lat: asOptionalNumber(item.lat),
      lng: asOptionalNumber(item.lng),
      floor: asOptionalString(item.floor) || undefined,
      section: asOptionalString(item.section) || undefined,
      propertyNumber: asOptionalString(item.property_number) || undefined,
    },
  };
};

const mapApiRoomSource = (source: string): ManagedRoom["source"] => {
  if (source === "airbnb" || source === "booking" || source === "manual") {
    return source;
  }

  return "manual";
};

const mapApiRoomToManagedRoom = (item: ApiRoom): ManagedRoom => {
  const guestTiers =
    item.guest_tiers?.map((tier) => ({
      minGuests: tier.min_guests,
      maxGuests: tier.max_guests,
      pricePerNight: tier.price_per_night,
    })) ?? [];

  const dateOverrides = (item.date_overrides ?? []).reduce<Record<string, number>>(
    (acc, override) => {
      acc[override.date] = override.price;
      return acc;
    },
    {}
  );

  return {
    id: item.id,
    propertyId: item.property_id,
    name: item.name,
    type: item.type,
    description: item.description,
    images: item.images,
    pricePerNight: item.price_per_night,
    maxGuests: item.max_guests,
    bedConfig: item.bed_config,
    amenities: item.amenities,
    source: mapApiRoomSource(item.source),
    sourceUrl: item.source_url ?? undefined,
    syncEnabled: item.sync_enabled,
    lastSynced: item.last_synced ?? undefined,
    status: item.status,
    pricing: {
      guestTiers,
      dateOverrides,
    },
  };
};

const mapApiHostProfile = (item: ApiHostProfile): HostProfile => {
  return {
    id: item.id,
    propertyId: item.property_id,
    name: item.name,
    location: item.location,
    bio: item.bio,
    avatarUrl: item.avatar_url,
    avatarInitials: item.avatar_initials,
    reviews: item.reviews,
    rating: item.rating,
    yearsHosting: item.years_hosting,
    superhost: item.superhost,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
};

const mapApiKnowledgeFile = (item: ApiKnowledgeFile): KnowledgeFile => {
  return {
    id: item.id,
    propertyId: item.property_id,
    name: item.name,
    size: item.size,
    storagePath: item.storage_path,
    mimeType: item.mime_type,
    createdAt: item.created_at,
  };
};

const mapApiPmsConnection = (item: ApiPmsConnection): PmsConnection => {
  return {
    id: item.id,
    propertyId: item.property_id,
    provider: item.provider,
    enabled: item.enabled,
    config: item.config,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
};

const mapApiPaymentConnection = (item: ApiPaymentConnection): PaymentConnection => {
  return {
    id: item.id,
    propertyId: item.property_id,
    provider: item.provider,
    enabled: item.enabled,
    config: item.config,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
};

const mapApiBooking = (item: ApiBooking): Booking => {
  return {
    id: item.id,
    propertyId: item.property_id,
    roomId: item.room_id,
    guestId: item.guest_id,
    guestName: item.guest_name,
    checkIn: item.check_in,
    checkOut: item.check_out,
    totalPrice: item.total_price,
    status: item.status,
    aiHandled: item.ai_handled,
    source: item.source,
    conversationId: item.conversation_id,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
    cancelledAt: item.cancelled_at,
  };
};

const mapApiAuditEntry = (item: ApiAuditEntry): AuditEntry => {
  return {
    id: item.id,
    propertyId: item.property_id,
    conversationId: item.conversation_id,
    source: item.source,
    toolName: item.tool_name,
    description: item.description,
    status: item.status,
    createdAt: item.created_at,
  };
};

export const isRetryableError = (error: unknown) => {
  if (error instanceof AuthApiError) {
    return error.status === 0 || error.status >= 500;
  }

  return true;
};

export const isAuthInvalidError = (error: unknown) => {
  return error instanceof AuthApiError && (error.status === 401 || error.status === 403);
};

export const fetchMe = async (accessToken: string): Promise<UserMe> => {
  const res = await requestWithAuthInterceptor(`${API_BASE}/v1.0/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  const normalized = normalizeUserMe(data);
  if (!normalized) {
    throw new AuthApiError("Invalid user profile response", res.status);
  }

  return normalized;
};

export const fetchProperties = async (accessToken: string): Promise<Property[]> => {
  const res = await requestWithAuthInterceptor(`${API_BASE}/v1.0/properties`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidPropertiesResponse(data)) {
    throw new AuthApiError("Invalid properties response", res.status);
  }

  return data.items.map(mapApiProperty);
};

export const fetchRooms = async (
  accessToken: string,
  propertyId: string
): Promise<ManagedRoom[]> => {
  const res = await requestWithAuthInterceptor(`${API_BASE}/v1.0/properties/${propertyId}/rooms`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidRoomsResponse(data)) {
    throw new AuthApiError("Invalid rooms response", res.status);
  }

  return data.items.map(mapApiRoomToManagedRoom);
};

export const fetchRoomById = async (
  accessToken: string,
  propertyId: string,
  roomId: string
): Promise<ManagedRoom> => {
  const res = await requestWithAuthInterceptor(`${API_BASE}/v1.0/properties/${propertyId}/rooms/${roomId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiRoom(data)) {
    throw new AuthApiError("Invalid room response", res.status);
  }

  return mapApiRoomToManagedRoom(data);
};

export const deleteRoom = async (
  accessToken: string,
  propertyId: string,
  roomId: string
): Promise<DeleteRoomResponse> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/rooms/${roomId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidDeleteRoomResponse(data)) {
    throw new AuthApiError("Invalid room delete response", res.status);
  }

  return data;
};

export const fetchBookings = async (
  accessToken: string,
  propertyId: string,
  options?: { status?: ApiBookingStatus }
): Promise<Booking[]> => {
  const params = new URLSearchParams();
  if (options?.status) {
    params.set("status", options.status);
  }
  const query = params.toString();
  const url = `${API_BASE}/v1.0/properties/${propertyId}/bookings${query ? `?${query}` : ""}`;

  const res = await requestWithAuthInterceptor(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidBookingsResponse(data)) {
    throw new AuthApiError("Invalid bookings response", res.status);
  }

  return data.items.map(mapApiBooking);
};

export const fetchBookingById = async (
  accessToken: string,
  propertyId: string,
  bookingId: string
): Promise<Booking> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/bookings/${bookingId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiBooking(data)) {
    throw new AuthApiError("Invalid booking response", res.status);
  }

  return mapApiBooking(data);
};

export const createBooking = async (
  accessToken: string,
  propertyId: string,
  input: CreateBookingInput
): Promise<Booking> => {
  const payload: Record<string, unknown> = {
    room_id: input.roomId,
    guest_name: input.guestName,
    check_in: input.checkIn,
    check_out: input.checkOut,
    total_price: input.totalPrice,
    status: input.status,
  };

  if (input.guestId !== undefined) payload.guest_id = input.guestId;
  if (input.guestEmail !== undefined) payload.guest_email = input.guestEmail;
  if (input.aiHandled !== undefined) payload.ai_handled = input.aiHandled;
  if (input.source !== undefined) payload.source = input.source;
  if (input.conversationId !== undefined) payload.conversation_id = input.conversationId;

  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/bookings`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiBooking(data)) {
    throw new AuthApiError("Invalid booking response", res.status);
  }

  return mapApiBooking(data);
};

export const updateBooking = async (
  accessToken: string,
  propertyId: string,
  bookingId: string,
  input: UpdateBookingInput
): Promise<Booking> => {
  const payload: Record<string, unknown> = {};
  if (input.roomId !== undefined) payload.room_id = input.roomId;
  if (input.guestId !== undefined) payload.guest_id = input.guestId;
  if (input.guestName !== undefined) payload.guest_name = input.guestName;
  if (input.guestEmail !== undefined) payload.guest_email = input.guestEmail;
  if (input.checkIn !== undefined) payload.check_in = input.checkIn;
  if (input.checkOut !== undefined) payload.check_out = input.checkOut;
  if (input.totalPrice !== undefined) payload.total_price = input.totalPrice;
  if (input.status !== undefined) payload.status = input.status;
  if (input.aiHandled !== undefined) payload.ai_handled = input.aiHandled;
  if (input.source !== undefined) payload.source = input.source;
  if (input.conversationId !== undefined) payload.conversation_id = input.conversationId;
  if (input.cancelledAt !== undefined) payload.cancelled_at = input.cancelledAt;

  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/bookings/${bookingId}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiBooking(data)) {
    throw new AuthApiError("Invalid booking response", res.status);
  }

  return mapApiBooking(data);
};

export const fetchAuditEntries = async (
  accessToken: string,
  propertyId: string,
  options?: { source?: string; limit?: number; cursor?: string | null }
): Promise<{ items: AuditEntry[]; nextCursor: string | null }> => {
  const params = new URLSearchParams();
  if (options?.source) {
    params.set("source", options.source);
  }
  if (typeof options?.limit === "number" && Number.isFinite(options.limit)) {
    params.set("limit", String(options.limit));
  }
  if (typeof options?.cursor === "string" && options.cursor.length > 0) {
    params.set("cursor", options.cursor);
  }

  const query = params.toString();
  const url = `${API_BASE}/v1.0/properties/${propertyId}/audit${query ? `?${query}` : ""}`;

  const res = await requestWithAuthInterceptor(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidAuditEntriesResponse(data)) {
    throw new AuthApiError("Invalid audit log response", res.status);
  }

  return {
    items: data.items.map(mapApiAuditEntry),
    nextCursor: data.next_cursor,
  };
};

export const fetchHostProfile = async (
  accessToken: string,
  propertyId: string
): Promise<HostProfile> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/host-profile`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiHostProfile(data)) {
    throw new AuthApiError("Invalid host profile response", res.status);
  }

  return mapApiHostProfile(data);
};

export const updateHostProfile = async (
  accessToken: string,
  propertyId: string,
  input: UpdateHostProfileInput
): Promise<HostProfile> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/host-profile`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.name,
        location: input.location,
        bio: input.bio,
      }),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiHostProfile(data)) {
    throw new AuthApiError("Invalid host profile response", res.status);
  }

  return mapApiHostProfile(data);
};

export const fetchKnowledgeFiles = async (
  accessToken: string,
  propertyId: string
): Promise<KnowledgeFile[]> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/knowledge-files`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidKnowledgeFilesResponse(data)) {
    throw new AuthApiError("Invalid knowledge files response", res.status);
  }

  return data.items.map(mapApiKnowledgeFile);
};

export const fetchPmsConnections = async (
  accessToken: string,
  propertyId: string
): Promise<PmsConnection[]> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/pms-connections`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidPmsConnectionsResponse(data)) {
    throw new AuthApiError("Invalid PMS connections response", res.status);
  }

  return data.items.map(mapApiPmsConnection);
};

export const updatePmsConnection = async (
  accessToken: string,
  propertyId: string,
  provider: string,
  input: UpdatePmsConnectionInput
): Promise<PmsConnection> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/pms-connections/${provider}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled: input.enabled,
      }),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiPmsConnection(data)) {
    throw new AuthApiError("Invalid PMS connection response", res.status);
  }

  return mapApiPmsConnection(data);
};

export const fetchPaymentConnections = async (
  accessToken: string,
  propertyId: string
): Promise<PaymentConnection[]> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/payment-connections`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidPaymentConnectionsResponse(data)) {
    throw new AuthApiError("Invalid payment connections response", res.status);
  }

  return data.items.map(mapApiPaymentConnection);
};

export const updatePaymentConnection = async (
  accessToken: string,
  propertyId: string,
  provider: string,
  input: UpdatePaymentConnectionInput
): Promise<PaymentConnection> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/payment-connections/${provider}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        enabled: input.enabled,
      }),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiPaymentConnection(data)) {
    throw new AuthApiError("Invalid payment connection response", res.status);
  }

  return mapApiPaymentConnection(data);
};

export const createKnowledgeFile = async (
  accessToken: string,
  propertyId: string,
  input: CreateKnowledgeFileInput
): Promise<KnowledgeFile> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/knowledge-files`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: input.name,
        size: input.size,
        mime_type: input.mimeType,
      }),
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isApiKnowledgeFile(data)) {
    throw new AuthApiError("Invalid knowledge file response", res.status);
  }

  return mapApiKnowledgeFile(data);
};

export const deleteKnowledgeFile = async (
  accessToken: string,
  propertyId: string,
  fileId: string
): Promise<DeleteKnowledgeFileResponse> => {
  const res = await requestWithAuthInterceptor(
    `${API_BASE}/v1.0/properties/${propertyId}/knowledge-files/${fileId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidDeleteKnowledgeFileResponse(data)) {
    throw new AuthApiError("Invalid knowledge file delete response", res.status);
  }

  return data;
};

export const fetchMeWithRetry = async (
  accessToken: string,
  attempts = 3,
  baseDelayMs = 400
): Promise<UserMe> => {
  let lastError: unknown;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fetchMe(accessToken);
    } catch (error) {
      lastError = error;

      const shouldRetry = attempt < attempts && isRetryableError(error);
      if (!shouldRetry) {
        throw error;
      }

      const delay = baseDelayMs * 2 ** (attempt - 1);
      await sleep(delay);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new AuthApiError("Failed to fetch user profile");
};

export const saveAccessToken = (token: string) => {
  localStorage.setItem("access_token", token);
};

export const saveUserMe = (me: UserMe) => {
  localStorage.setItem("user", JSON.stringify(me));
};

export const readAccessToken = () => localStorage.getItem("access_token");

export const readUserMe = (): UserMe | null => {
  const raw = localStorage.getItem("user");
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    return normalizeUserMe(parsed);
  } catch {
    return null;
  }
};

export const clearAuthStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
};

export const logoutAndRedirectToAuth = () => {
  clearAuthStorage();
  if (typeof window !== "undefined") {
    window.location.replace("/auth");
  }
};

export type SessionHydrationResult =
  | { status: "ready"; me: UserMe }
  | { status: "missing_token" }
  | { status: "invalid_session"; error: unknown };

export const hydrateSessionFromStorage = async (): Promise<SessionHydrationResult> => {
  const accessToken = readAccessToken();
  if (!accessToken) {
    return { status: "missing_token" };
  }

  try {
    const me = await fetchMe(accessToken);
    saveUserMe(me);
    return { status: "ready", me };
  } catch (error) {
    clearAuthStorage();
    return { status: "invalid_session", error };
  }
};
