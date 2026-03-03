import { motion } from "framer-motion";
import { MapPin, Phone, Star, Store, UtensilsCrossed } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { RestaurantResult } from "@/lib/chatApi";

interface RestaurantCardProps {
  restaurant: RestaurantResult;
}

function renderPriceLevel(priceLevel: number | null): string {
  if (priceLevel === null || priceLevel < 0) return "";
  return "$".repeat(Math.min(priceLevel + 1, 5));
}

function directionsUrl(restaurant: RestaurantResult): string | null {
  if (restaurant.maps_url) return restaurant.maps_url;
  if (restaurant.address) {
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.address)}`;
  }
  return null;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  const cuisine = restaurant.cuisine.slice(0, 3);
  const bestFor = restaurant.best_for.slice(0, 2);
  const price = renderPriceLevel(restaurant.price_level);
  const directions = directionsUrl(restaurant);

  return (
    <motion.div
      className="min-w-[240px] max-w-[260px] snap-start rounded-2xl bg-card apple-shadow overflow-hidden flex-shrink-0"
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        {restaurant.photo_url ? (
          <img
            src={restaurant.photo_url}
            alt={restaurant.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted flex items-center justify-center">
            <UtensilsCrossed className="w-8 h-8 text-muted-foreground" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />

        <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 rounded-full glass text-xs text-white">
          <Star className="w-3 h-3 fill-current" />
          <span>{restaurant.rating ? restaurant.rating.toFixed(1) : "N/A"}</span>
          {!!restaurant.review_count && <span>({restaurant.review_count})</span>}
        </div>

        {restaurant.walking_minutes !== null && (
          <div className="absolute top-2 right-2 px-2 py-1 rounded-full glass text-xs font-medium text-white">
            {restaurant.walking_minutes} min walk
          </div>
        )}

        {restaurant.is_curated && (
          <div className="absolute bottom-2 left-2 px-2 py-1 rounded-full bg-emerald-500/90 text-[11px] font-semibold text-white">
            Recommended
          </div>
        )}
      </div>

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="font-semibold text-sm text-card-foreground line-clamp-2">{restaurant.name}</h4>
          {price && <span className="text-xs font-semibold text-muted-foreground">{price}</span>}
        </div>

        {restaurant.address && (
          <p className="mt-1 text-xs text-muted-foreground truncate">{restaurant.address}</p>
        )}

        {cuisine.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {cuisine.map((item) => (
              <Badge key={item} variant="secondary" className="text-[10px] px-1.5 py-0">
                {item}
              </Badge>
            ))}
          </div>
        )}

        {bestFor.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {bestFor.map((item) => (
              <Badge key={item} className="text-[10px] px-1.5 py-0 bg-primary/15 text-primary hover:bg-primary/20">
                {item}
              </Badge>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <a
            href={directions || "#"}
            target="_blank"
            rel="noreferrer"
            className={`h-8 rounded-full text-[11px] font-medium inline-flex items-center justify-center gap-1 ${
              directions
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground pointer-events-none"
            }`}
          >
            <MapPin className="w-3 h-3" />
            Directions
          </a>
          <a
            href={restaurant.website || "#"}
            target="_blank"
            rel="noreferrer"
            className={`h-8 rounded-full text-[11px] font-medium inline-flex items-center justify-center gap-1 ${
              restaurant.website
                ? "bg-secondary text-foreground"
                : "bg-secondary text-muted-foreground pointer-events-none"
            }`}
          >
            <Store className="w-3 h-3" />
            Reserve
          </a>
          <a
            href={restaurant.phone ? `tel:${restaurant.phone}` : "#"}
            className={`h-8 rounded-full text-[11px] font-medium inline-flex items-center justify-center gap-1 ${
              restaurant.phone
                ? "bg-secondary text-foreground"
                : "bg-secondary text-muted-foreground pointer-events-none"
            }`}
          >
            <Phone className="w-3 h-3" />
            Call
          </a>
        </div>
      </div>
    </motion.div>
  );
}
