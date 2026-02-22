import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { PropertyProvider, useProperty } from "@/contexts/PropertyContext";

const fetchPropertiesMock = vi.hoisted(() => vi.fn());
const readAccessTokenMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/auth", () => ({
  fetchProperties: fetchPropertiesMock,
  readAccessToken: readAccessTokenMock,
}));

function ContextProbe() {
  const { properties, isPropertiesLoading, propertiesError } = useProperty();

  return (
    <div>
      <div data-testid="loading">{String(isPropertiesLoading)}</div>
      <div data-testid="count">{properties.length}</div>
      <div data-testid="error">{propertiesError ?? ""}</div>
      <div data-testid="first-name">{properties[0]?.name ?? ""}</div>
    </div>
  );
}

describe("PropertyContext", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    fetchPropertiesMock.mockReset();
    readAccessTokenMock.mockReset();
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

    resolveFetch?.([
      {
        id: "prop-1",
        name: "Mountain Lodge Retreat",
        address: {
          street: "789 Alpine Road",
          city: "Aspen",
          state: "CO",
          postalCode: "81611",
          country: "United States",
        },
      },
    ]);

    await waitFor(() => {
      expect(screen.getByTestId("loading")).toHaveTextContent("false");
      expect(screen.getByTestId("count")).toHaveTextContent("1");
      expect(screen.getByTestId("first-name")).toHaveTextContent("Mountain Lodge Retreat");
      expect(screen.getByTestId("error")).toHaveTextContent("");
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
    });
    expect(fetchPropertiesMock).not.toHaveBeenCalled();
  });
});
