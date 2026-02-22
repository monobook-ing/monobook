import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  BedDouble,
  Users,
  RefreshCw,
  ExternalLink,
  Trash2,
  Wifi,
  Waves,
  Wind,
  UtensilsCrossed,
  Car,
  Tv,
  Bath,
  Dumbbell,
  Sparkles,
  Eye,
  Building2,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { type ManagedRoom } from "@/data/mockRoomData";
import { RoomPricingSection, hasOverrides } from "@/components/dashboard/RoomPricingSection";
import { useProperty } from "@/contexts/PropertyContext";
import { fetchRooms, readAccessToken } from "@/lib/auth";
import { format } from "date-fns";

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi,
  Pool: Waves,
  AC: Wind,
  Kitchen: UtensilsCrossed,
  Parking: Car,
  "Flat-screen TV": Tv,
  "Ocean View": Eye,
  "City View": Eye,
  "Garden View": Eye,
  Jacuzzi: Bath,
  "Gym Access": Dumbbell,
  "Spa Access": Sparkles,
};

const sourceBadge = (source: ManagedRoom["source"]) => {
  const map = {
    airbnb: { label: "Airbnb", cls: "bg-[#FF5A5F]/10 text-[#FF5A5F] border-[#FF5A5F]/20" },
    booking: { label: "Booking.com", cls: "bg-[#003580]/10 text-[#003580] border-[#003580]/20" },
    manual: { label: "Manual", cls: "bg-muted text-muted-foreground" },
  };
  const s = map[source];
  return (
    <Badge variant="outline" className={s.cls}>
      {s.label}
    </Badge>
  );
};

const formatRoomsError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load rooms.";
  }

  return error;
};

export function RoomManagement() {
  const { selectedPropertyId, properties } = useProperty();
  const [rooms, setRooms] = useState<ManagedRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ManagedRoom | null>(null);
  const isReadOnly = true;

  useEffect(() => {
    let active = true;

    const loadRooms = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setRooms([]);
        setRoomsError(null);
        setIsRoomsLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setRooms([]);
        setRoomsError("missing_token");
        setIsRoomsLoading(false);
        return;
      }

      setIsRoomsLoading(true);
      setRoomsError(null);

      try {
        const fetchedRooms = await fetchRooms(accessToken, selectedPropertyId);
        if (!active) return;
        setRooms(fetchedRooms);
      } catch (error) {
        if (!active) return;
        const message = error instanceof Error ? error.message : "Failed to fetch rooms";
        setRooms([]);
        setRoomsError(message);
      } finally {
        if (active) {
          setIsRoomsLoading(false);
        }
      }
    };

    loadRooms();

    return () => {
      active = false;
    };
  }, [selectedPropertyId]);

  useEffect(() => {
    if (!selectedRoom) return;
    const refreshedSelectedRoom = rooms.find((room) => room.id === selectedRoom.id) ?? null;
    if (!refreshedSelectedRoom) {
      setSelectedRoom(null);
      return;
    }

    if (refreshedSelectedRoom !== selectedRoom) {
      setSelectedRoom(refreshedSelectedRoom);
    }
  }, [rooms, selectedRoom]);

  const filteredRooms =
    selectedPropertyId === "all"
      ? rooms
      : rooms.filter((room) => room.propertyId === selectedPropertyId);

  const getPropertyName = (id?: string) => properties.find((property) => property.id === id)?.name;

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rooms</h1>
        <Button
          size="sm"
          className="rounded-xl gap-2"
          disabled={isReadOnly}
          data-testid="add-room-button"
        >
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your property listings and sync with platforms
      </p>
      {isReadOnly && (
        <p className="text-xs text-muted-foreground mb-6">Rooms are currently read-only.</p>
      )}

      {selectedPropertyId === "all" && (
        <Card className="rounded-xl border-dashed" data-testid="rooms-select-property-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">Select a property to view rooms</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose one property from the switcher to load rooms from the API.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && isRoomsLoading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="rooms-loading-state">
          {Array.from({ length: 4 }).map((_, idx) => (
            <Card key={idx} className="rounded-xl">
              <CardContent className="p-6 flex items-center gap-3">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Loading rooms…</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedPropertyId !== "all" && !isRoomsLoading && roomsError && (
        <Card className="rounded-xl border-destructive/30" data-testid="rooms-error-state">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">Could not load rooms</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatRoomsError(roomsError)}</p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isRoomsLoading && !roomsError && filteredRooms.length === 0 && (
        <Card className="rounded-xl border-dashed" data-testid="rooms-empty-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">No rooms found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This property currently has no rooms from the API.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isRoomsLoading && !roomsError && filteredRooms.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4" data-testid="rooms-grid">
          {filteredRooms.map((room) => (
            <motion.div
              key={room.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card
                className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group"
                onClick={() => setSelectedRoom(room)}
              >
                {room.images[0] ? (
                  <div className="h-40 overflow-hidden">
                    <img
                      src={room.images[0]}
                      alt={room.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ) : (
                  <div className="h-40 bg-muted flex items-center justify-center">
                    <BedDouble className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{room.name}</h3>
                      <p className="text-xs text-muted-foreground">{room.type}</p>
                    </div>
                    {sourceBadge(room.source)}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-foreground">
                      {hasOverrides(room.pricing) && (
                        <span className="text-xs font-normal text-muted-foreground">from </span>
                      )}
                      ${room.pricePerNight}
                      <span className="text-muted-foreground font-normal">/night</span>
                    </span>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Users className="w-3.5 h-3.5" />
                      {room.maxGuests}
                    </span>
                  </div>
                  {selectedPropertyId === "all" && room.propertyId && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Building2 className="w-3 h-3" />
                      <span className="truncate">{getPropertyName(room.propertyId)}</span>
                    </div>
                  )}
                  {room.syncEnabled && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <RefreshCw className="w-3 h-3" />
                      {room.lastSynced
                        ? `Synced ${format(new Date(room.lastSynced), "MMM d, HH:mm")}`
                        : "Sync enabled"}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <Sheet
        open={!!selectedRoom}
        onOpenChange={(open) => {
          if (!open) setSelectedRoom(null);
        }}
      >
        <SheetContent className="sm:max-w-lg overflow-y-auto p-0">
          {selectedRoom && (
            <>
              <div className="relative">
                {selectedRoom.images[0] ? (
                  <img
                    src={selectedRoom.images[0]}
                    alt={selectedRoom.name}
                    className="w-full h-56 object-cover"
                  />
                ) : (
                  <div className="w-full h-56 bg-muted flex items-center justify-center">
                    <BedDouble className="w-12 h-12 text-muted-foreground" />
                  </div>
                )}
                {selectedRoom.images.length > 1 && (
                  <div className="flex gap-1.5 px-4 -mt-6 relative z-10">
                    {selectedRoom.images.slice(1, 4).map((img, i) => (
                      <img
                        key={i}
                        src={img}
                        alt=""
                        className="w-16 h-12 rounded-lg object-cover border-2 border-background shadow-sm"
                      />
                    ))}
                    {selectedRoom.images.length > 4 && (
                      <div className="w-16 h-12 rounded-lg bg-muted/80 border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm">
                        +{selectedRoom.images.length - 4}
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-5">
                <SheetHeader className="p-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <SheetTitle className="text-lg">{selectedRoom.name}</SheetTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {selectedRoom.type} · {selectedRoom.bedConfig}
                      </p>
                    </div>
                    {sourceBadge(selectedRoom.source)}
                  </div>
                </SheetHeader>

                <div className="border rounded-xl p-4">
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Property
                  </h4>
                  <div className="flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                    <select
                      value={selectedRoom.propertyId || ""}
                      disabled={isReadOnly}
                      className="flex-1 h-9 rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <option value="">Unassigned</option>
                      {properties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRoom.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-xl font-bold text-foreground">
                    {hasOverrides(selectedRoom.pricing) && (
                      <span className="text-sm font-normal text-muted-foreground">from </span>
                    )}
                    ${selectedRoom.pricePerNight}
                    <span className="text-sm font-normal text-muted-foreground">/night</span>
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Users className="w-4 h-4" />
                    {selectedRoom.maxGuests} guests
                  </span>
                </div>

                <RoomPricingSection
                  pricing={selectedRoom.pricing || { dateOverrides: {}, guestTiers: [] }}
                  basePrice={selectedRoom.pricePerNight}
                  maxGuests={selectedRoom.maxGuests}
                  readOnly={isReadOnly}
                  onPricingChange={() => {}}
                  onBasePriceChange={() => {}}
                />

                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Amenities
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((amenity) => {
                      const Icon = amenityIcons[amenity];
                      return (
                        <Badge key={amenity} variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
                          {Icon && <Icon className="w-3 h-3" />}
                          {amenity}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {selectedRoom.source !== "manual" && (
                  <div className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Sync</h4>
                        <p className="text-xs text-muted-foreground">
                          {selectedRoom.lastSynced
                            ? `Last synced ${format(new Date(selectedRoom.lastSynced), "MMM d, yyyy HH:mm")}`
                            : "Never synced"}
                        </p>
                      </div>
                      <Switch checked={selectedRoom.syncEnabled} disabled={isReadOnly} />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1.5"
                        disabled={isReadOnly}
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Sync now
                      </Button>
                      {selectedRoom.sourceUrl && (
                        <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" asChild>
                          <a href={selectedRoom.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="w-3.5 h-3.5" /> View listing
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="destructive"
                    size="sm"
                    className="rounded-xl gap-1.5"
                    disabled={isReadOnly}
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </motion.div>
  );
}
