export interface Property {
  id: string;
  name: string;
  address: string;
  image?: string;
}

export const mockProperties: Property[] = [
  {
    id: "prop-1",
    name: "Sunset Beach Resort",
    address: "123 Ocean Drive, Miami Beach, FL 33139",
  },
  {
    id: "prop-2",
    name: "Downtown City Hotel",
    address: "456 Main Street, New York, NY 10001",
  },
  {
    id: "prop-3",
    name: "Mountain Lodge Retreat",
    address: "789 Alpine Road, Aspen, CO 81611",
  },
];
