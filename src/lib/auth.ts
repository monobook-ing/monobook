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

export type AuditEntriesResponse = {
  items: ApiAuditEntry[];
  next_cursor: string | null;
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

const isValidAuditEntriesResponse = (value: unknown): value is AuditEntriesResponse => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;
  return (
    Array.isArray(candidate.items) &&
    candidate.items.every(isApiAuditEntry) &&
    (candidate.next_cursor === null || typeof candidate.next_cursor === "string")
  );
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
