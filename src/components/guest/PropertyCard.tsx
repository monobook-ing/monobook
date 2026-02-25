import { motion } from "framer-motion";
import { Star, MapPin } from "lucide-react";
import type { Property } from "@/data/mockData";
import { formatCurrencyAmount } from "@/lib/currency";

import hotel1 from "@/assets/hotel-1.jpg";
import hotel2 from "@/assets/hotel-2.jpg";
import hotel3 from "@/assets/hotel-3.jpg";
import hotel4 from "@/assets/hotel-4.jpg";

const imageMap: Record<string, string> = {
  "hotel-1": hotel1,
  "hotel-2": hotel2,
  "hotel-3": hotel3,
  "hotel-4": hotel4,
};

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
}

export function PropertyCard({ property, onSelect }: PropertyCardProps) {
  const imageSrc = imageMap[property.image] ?? property.image;

  return (
    <motion.div
      className="min-w-[280px] max-w-[300px] snap-start rounded-2xl bg-card apple-shadow overflow-hidden cursor-pointer"
      whileTap={{ scale: 0.97 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      onClick={() => onSelect(property)}
    >
      <div className="relative aspect-video overflow-hidden">
        <img
          src={imageSrc}
          alt={property.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" />
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          AI Match: {property.aiMatchScore}%
        </div>
        <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs font-medium">
          <Star className="w-3 h-3 fill-current" style={{ color: "hsl(45, 93%, 47%)" }} />
          {property.rating}
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="font-semibold text-card-foreground truncate">{property.name}</h3>
            <p className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
              <MapPin className="w-3 h-3 flex-shrink-0" />
              <span className="truncate">{property.location}</span>
            </p>
          </div>
          <div className="text-right flex-shrink-0">
            <span className="text-lg font-bold text-card-foreground">
              {formatCurrencyAmount(
                property.pricePerNight,
                property.currencyDisplay,
                property.currencyCode
              )}
            </span>
            <span className="block text-xs text-muted-foreground">/ night</span>
          </div>
        </div>
        <motion.button
          className="mt-3 w-full py-2.5 rounded-full bg-primary text-primary-foreground font-medium text-sm min-h-[44px]"
          whileTap={{ scale: 0.95 }}
        >
          Select
        </motion.button>
      </div>
    </motion.div>
  );
}
