import { motion } from "framer-motion";
import type { RestaurantSearchResult } from "@/lib/chatApi";
import { RestaurantCard } from "./RestaurantCard";

interface RestaurantResultsCarouselProps {
  result: RestaurantSearchResult;
}

export function RestaurantResultsCarousel({ result }: RestaurantResultsCarouselProps) {
  const curated = result.curated || [];
  const nearby = result.nearby || [];

  if (curated.length === 0 && nearby.length === 0) {
    return (
      <div className="py-3 px-1">
        <p className="text-xs text-muted-foreground">
          No restaurant recommendations found nearby.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      className="mt-3 space-y-3"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {curated.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
            Recommended by us ({result.count_curated})
          </p>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
            {curated.map((restaurant, i) => (
              <motion.div
                key={`curated-${restaurant.place_id}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
              >
                <RestaurantCard restaurant={restaurant} />
              </motion.div>
            ))}
          </div>
        </section>
      )}

      {nearby.length > 0 && (
        <section>
          <p className="text-xs font-medium text-muted-foreground mb-2 px-1">
            More nearby ({result.count_nearby})
          </p>
          <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 hide-scrollbar">
            {nearby.map((restaurant, i) => (
              <motion.div
                key={`nearby-${restaurant.place_id}-${i}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06, duration: 0.25 }}
              >
                <RestaurantCard restaurant={restaurant} />
              </motion.div>
            ))}
          </div>
        </section>
      )}
    </motion.div>
  );
}
