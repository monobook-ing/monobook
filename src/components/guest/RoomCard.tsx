import { motion } from "framer-motion";
import { Users, BedDouble } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RoomResult } from "@/lib/chatApi";

interface RoomCardProps {
  room: RoomResult;
  onBookNow?: (roomId: string) => void;
}

export function RoomCard({ room, onBookNow }: RoomCardProps) {
  const price = parseFloat(room.price_per_night);
  const displayAmenities = room.amenities.slice(0, 3);

  return (
    <motion.div
      className="min-w-[240px] max-w-[260px] snap-start rounded-2xl bg-card apple-shadow overflow-hidden flex-shrink-0"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden">
        {room.images[0] ? (
          <img
            src={room.images[0]}
            alt={room.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <BedDouble className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Price badge */}
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full glass text-xs font-semibold text-white">
          ${isNaN(price) ? room.price_per_night : price.toFixed(0)}/night
        </div>

        {/* Capacity badge */}
        <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs text-white">
          <Users className="w-3 h-3" />
          {room.max_guests}
        </div>
      </div>

      {/* Info */}
      <div className="p-3">
        <h4 className="font-semibold text-sm text-card-foreground truncate">
          {room.name}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5 truncate">
          {room.type}
        </p>

        {/* Amenities */}
        {displayAmenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {displayAmenities.map((amenity) => (
              <Badge
                key={amenity}
                variant="secondary"
                className="text-[10px] px-1.5 py-0"
              >
                {amenity}
              </Badge>
            ))}
            {room.amenities.length > 3 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                +{room.amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Book Now */}
        <motion.button
          className="mt-2.5 w-full py-2 rounded-full bg-primary text-primary-foreground font-medium text-xs min-h-[36px]"
          whileTap={{ scale: 0.95 }}
          onClick={() => onBookNow?.(room.id)}
        >
          Book now
        </motion.button>
      </div>
    </motion.div>
  );
}
