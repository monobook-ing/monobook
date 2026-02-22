export interface PropertyAddress {
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  lat?: number;
  lng?: number;
  floor?: string;
  section?: string;
  propertyNumber?: string;
}

export interface Property {
  id: string;
  name: string;
  address: PropertyAddress;
  image?: string;
}

export function formatAddress(a: PropertyAddress): string {
  const parts = [a.street, a.city, a.state, a.postalCode, a.country].filter(Boolean);
  return parts.join(", ");
}

export function formatAddressShort(a: PropertyAddress): string {
  return [a.street, a.city].filter(Boolean).join(", ");
}

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    name: "Sunset Beach Resort",
    address: {
      street: "123 Ocean Drive",
      city: "Miami Beach",
      state: "FL",
      postalCode: "33139",
      country: "United States",
      lat: 25.7825,
      lng: -80.1340,
      floor: "1-5",
      propertyNumber: "A-101",
    },
  },
  {
    id: "prop-2",
    name: "Downtown City Hotel",
    address: {
      street: "456 Main Street",
      city: "New York",
      state: "NY",
      postalCode: "10001",
      country: "United States",
      lat: 40.7484,
      lng: -73.9967,
      section: "West Wing",
    },
  },
  {
    id: "prop-3",
    name: "Mountain Lodge Retreat",
    address: {
      street: "789 Alpine Road",
      city: "Aspen",
      state: "CO",
      postalCode: "81611",
      country: "United States",
      lat: 39.1911,
      lng: -106.8175,
      floor: "Ground",
      section: "Main Lodge",
      propertyNumber: "ML-01",
    },
  },
];
