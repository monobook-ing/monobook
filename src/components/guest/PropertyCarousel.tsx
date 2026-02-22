import { useRef } from "react";
import { motion } from "framer-motion";
import { PropertyCard } from "./PropertyCard";
import type { Property } from "@/data/mockData";
import { mockProperties } from "@/data/mockData";

interface PropertyCarouselProps {
  onSelect: (property: Property) => void;
}

export function PropertyCarousel({ onSelect }: PropertyCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h2 className="text-lg font-semibold text-foreground mb-3 px-1">
        Recommended for you
      </h2>
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
      >
        {mockProperties.map((property, i) => (
          <motion.div
            key={property.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1, duration: 0.3 }}
          >
            <PropertyCard property={property} onSelect={onSelect} />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
