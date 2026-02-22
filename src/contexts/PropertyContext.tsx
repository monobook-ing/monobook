import { createContext, useContext, useState, type ReactNode } from "react";
import { mockProperties, type Property } from "@/data/mockPropertyData";

interface PropertyContextType {
  selectedPropertyId: string;
  setSelectedPropertyId: (id: string) => void;
  properties: Property[];
  setProperties: React.Dispatch<React.SetStateAction<Property[]>>;
}

const PropertyContext = createContext<PropertyContextType | null>(null);

export function PropertyProvider({ children }: { children: ReactNode }) {
  const [selectedPropertyId, setSelectedPropertyId] = useState("all");
  const [properties, setProperties] = useState<Property[]>(mockProperties);

  return (
    <PropertyContext.Provider value={{ selectedPropertyId, setSelectedPropertyId, properties, setProperties }}>
      {children}
    </PropertyContext.Provider>
  );
}

export function useProperty() {
  const ctx = useContext(PropertyContext);
  if (!ctx) throw new Error("useProperty must be used within PropertyProvider");
  return ctx;
}
