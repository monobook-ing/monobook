import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Property } from "@/data/mockPropertyData";
import { fetchProperties, readAccessToken, readUserMe } from "@/lib/auth";

interface PropertyContextType {
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  properties: Property[];
  isPropertiesLoading: boolean;
  propertiesError: string | null;
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const PropertyContext = createContext<PropertyContextType | null>(null);
const SELECTED_PROPERTY_STORAGE_KEY = "selected_property_id";
const DEFAULT_PROPERTY_ID = "all";

const buildSelectedPropertyStorageKey = () => {
  const accountId = readUserMe()?.default_account_id || "anonymous";
  return `${SELECTED_PROPERTY_STORAGE_KEY}:${accountId}`;
};

const readStoredSelectedPropertyId = (storageKey: string) => {
  try {
    const value = localStorage.getItem(storageKey);
    return value && value.trim() ? value : DEFAULT_PROPERTY_ID;
  } catch {
    return DEFAULT_PROPERTY_ID;
  }
};

export function PropertyProvider({ children }: { children: ReactNode }) {
  const storageKey = buildSelectedPropertyStorageKey();
  const [selectedPropertyId, setSelectedPropertyId] = useState(() =>
    readStoredSelectedPropertyId(storageKey)
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [isPropertiesLoading, setIsPropertiesLoading] = useState(true);
  const [propertiesError, setPropertiesError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const loadProperties = async () => {
      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setProperties([]);
        setPropertiesError("missing_token");
        setIsPropertiesLoading(false);
        return;
      }

      try {
        const fetchedProperties = await fetchProperties(accessToken);
        if (!active) return;
        setProperties(fetchedProperties);
        setPropertiesError(null);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to fetch properties";
        setProperties([]);
        setPropertiesError(message);
      } finally {
        if (active) {
          setIsPropertiesLoading(false);
        }
      }
    };

    loadProperties();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (isPropertiesLoading) return;
    if (selectedPropertyId === DEFAULT_PROPERTY_ID) return;
    const exists = properties.some((property) => property.id === selectedPropertyId);
    if (!exists) {
      setSelectedPropertyId(DEFAULT_PROPERTY_ID);
    }
  }, [isPropertiesLoading, properties, selectedPropertyId]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, selectedPropertyId);
    } catch {
      // Ignore storage write failures to keep in-memory selection usable.
    }
  }, [selectedPropertyId, storageKey]);

  return (
    <PropertyContext.Provider
      value={{
        selectedPropertyId,
        setSelectedPropertyId,
        properties,
        isPropertiesLoading,
        propertiesError,
        setProperties,
      }}
    >
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}
