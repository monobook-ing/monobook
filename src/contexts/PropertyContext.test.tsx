import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyProvider, useProperty } from "@/contexts/PropertyContext";

const fetchPropertiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());
const readUserMeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  fetchProperties: fetchPropertiesMock,
  readAccessToken: readAccessTokenMock,
  readUserMe: readUserMeMock,
}));

function ContextProbe() {
  const { properties, isPropertiesLoading, propertiesError, selectedPropertyId } = useProperty();

  return (
    <div>
      <div data-testid="loading">{String(isPropertiesLoading)}</div>
      <div data-testid="count">{properties.length}</div>
      <div data-testid="error">{propertiesError ?? ""}</div>
      <div data-testid="first-name">{properties[0]?.name ?? ""}</div>
      <div data-testid="selected-id">{selectedPropertyId}</div>
    </div>
  );
}

const accountStorageKey = (accountId: string) => `selected_property_id:${accountId}`;
const baseProperty = {
  id: "prop-1",
  name: "Mountain Lodge Retreat",
  address: {
    street: "789 Alpine Road",
    city: "Aspen",
    state: "CO",
    postalCode: "81611",
    country: "United States",
  },
};

describe("PropertyContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchPropertiesMock.mockReset();
    readAccessTokenMock.mockReset();
    readUserMeMock.mockReset();
    localStorage.clear();
    readUserMeMock.mockReturnValue({
      email: "owner@example.com",
      first_name: "Owner",
      last_name: "One",
      default_account_id: "acct-1",
    });
  });

  it("starts loading and then exposes fetched properties", async () => {
    readAccessTokenMock.mockReturnValue("jwt_key");

    let resolveFetch: ((value: unknown) => void) | null = null;
    fetchPropertiesMock.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve;
        })
    );

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    expect(screen.getByTestId("loading")).toHaveTextContent("true");

    resolveFetch?.([baseProperty]);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("first-name")).toHaveTextContent("Mountain Lodge Retreat");
      expect(screen.getByTestId("error")).toHaveTextContent("");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("all");
    });
  });

  it("sets error and keeps empty list when fetch fails", async () => {
    readAccessTokenMock.mockReturnValue("jwt_key");
    fetchPropertiesMock.mockRejectedValue(new Error("boom"));

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(screen.getByTestId("error")).toHaveTextContent("boom");
    });
  });

  it("uses missing_token error when token is absent", async () => {
    readAccessTokenMock.mockReturnValue(null);

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("count")).toHaveTextContent("0");
      expect(screen.getByTestId("error")).toHaveTextContent("missing_token");
      expect(screen.getByTestId("selected-id")).toHaveTextContent("all");
    });
    expect(fetchPropertiesMock).not.toHaveBeenCalled();
  });

  it("hydrates selected property from per-user storage on startup", async () => {
    readAccessTokenMock.mockReturnValue("jwt_key");
    localStorage.setItem(accountStorageKey("acct-1"), "prop-1");
    fetchPropertiesMock.mockResolvedValue([baseProperty]);

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-id")).toHaveTextContent("prop-1");
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
    });
  });

  it("falls back to all when stored property id is stale", async () => {
    readAccessTokenMock.mockReturnValue("jwt_key");
    localStorage.setItem(accountStorageKey("acct-1"), "prop-stale");
    fetchPropertiesMock.mockResolvedValue([baseProperty]);

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-id")).toHaveTextContent("all");
    });
    expect(localStorage.getItem(accountStorageKey("acct-1"))).toBe("all");
  });

  it("isolates selected property storage between users", async () => {
    readAccessTokenMock.mockReturnValue("jwt_key");
    localStorage.setItem(accountStorageKey("acct-1"), "prop-1");
    localStorage.setItem(accountStorageKey("acct-2"), "prop-2");
    fetchPropertiesMock.mockResolvedValue([
      baseProperty,
      {
        ...baseProperty,
        id: "prop-2",
        name: "City Loft",
      },
    ]);

    readUserMeMock.mockReturnValue({
      email: "owner-2@example.com",
      first_name: "Owner",
      last_name: "Two",
      default_account_id: "acct-2",
    });

    render(
      <PropertyProvider>
        <ContextProbe />
      </PropertyProvider>
    );

    await waitFor(() => {
      expect(screen.getByTestId("selected-id")).toHaveTextContent("prop-2");
    });
    expect(localStorage.getItem(accountStorageKey("acct-1"))).toBe("prop-1");
    expect(localStorage.getItem(accountStorageKey("acct-2"))).toBe("prop-2");
  });
});
