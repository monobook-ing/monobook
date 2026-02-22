import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { type Property } from "@/data/mockPropertyData";
import { fetchProperties, readAccessToken } from "@/lib/auth";

interface PropertyContextType {
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  properties: Property[];
  isPropertiesLoading: boolean;
  propertiesError: string | null;
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const PropertyContext = createContext<PropertyContextType | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
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
    if (selectedPropertyId === "all") return;
    const exists = properties.some((property) => property.id === selectedPropertyId);
    if (!exists) {
      setSelectedPropertyId("all");
    }
  }, [properties, selectedPropertyId]);

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
