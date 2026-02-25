import { useRef } from "react";
import { motion } from "framer-motion";
import { RoomCard } from "./RoomCard";
import type { RoomSearchResult } from "@/lib/chatApi";

interface RoomResultsCarouselProps {
  result: RoomSearchResult;
  onBookNow?: (roomId: string) => void;
}

export function RoomResultsCarousel({
  result,
  onBookNow,
}: RoomResultsCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  if (result.rooms.length === 0) {
    return (
      <div className="py-3 px-1">
        <p className="text-xs text-muted-foreground">
          No rooms found matching your criteria.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="mt-2"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {result.property_name && (
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
          {result.count} room{result.count !== 1 ? "s" : ""} at{" "}
          {result.property_name}
        </p>
      )}
      <div
        ref={scrollRef}
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar"
      >
        {result.rooms.map((room, i) => (
          <motion.div
            key={room.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.08, duration: 0.25 }}
          >
            <RoomCard room={room} onBookNow={onBookNow} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
