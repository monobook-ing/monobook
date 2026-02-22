export const API_BASE = "https://api-fexi.onrender.com";

export type UserMe = {
  email: string;
  first_name: string;
  last_name: string;
  default_account_id: string;
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

const parseError = async (res: Response): Promise<AuthApiError> => {
  const body = await res.json().catch(() => null);
  const message =
    body?.detail || body?.message || `Request failed with status ${res.status}`;
  return new AuthApiError(message, res.status);
};

const isValidUserMe = (value: unknown): value is UserMe => {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.email === "string" &&
    typeof candidate.first_name === "string" &&
    typeof candidate.last_name === "string" &&
    typeof candidate.default_account_id === "string"
  );
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
  const res = await fetch(`${API_BASE}/v1.0/users/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw await parseError(res);
  }

  const data = await res.json().catch(() => null);
  if (!isValidUserMe(data)) {
    throw new AuthApiError("Invalid user profile response", res.status);
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

export const clearAuthStorage = () => {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
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
