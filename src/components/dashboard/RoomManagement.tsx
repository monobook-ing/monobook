import { useCallback, useEffect, useRef, useState } from "react";
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
  X,
  Link,
  Plug,
  PenLine,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { type ManagedRoom } from "@/data/mockRoomData";
import { RoomPricingSection, hasOverrides } from "@/components/dashboard/RoomPricingSection";
import { RoomImagePreview } from "@/components/dashboard/RoomImagePreview";
import { MobileDestructiveConfirmSheet } from "@/components/dashboard/MobileDestructiveConfirmSheet";
import { useProperty } from "@/contexts/PropertyContext";
import { deleteRoom, fetchRoomById, fetchRooms, importRoomFromUrl, readAccessToken } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { format } from "date-fns";
import { toast } from "sonner";

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

function RoomCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1 space-y-2">
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3.5 w-1/3" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-10" />
        </div>
        <Skeleton className="h-3.5 w-40" />
      </CardContent>
    </Card>
  );
}

function RoomDetailSkeleton() {
  return (
    <>
      <Skeleton
        data-testid="room-detail-loading-hero"
        className="h-56 w-full rounded-none"
      />
      <div
        data-testid="room-detail-loading-thumbnails"
        className="flex gap-1.5 px-4 -mt-6 relative z-10 overflow-x-auto hide-scrollbar pb-1 pt-1"
      >
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton
            key={`room-detail-thumbnail-${idx}`}
            className="h-12 w-16 shrink-0 rounded-lg"
          />
        ))}
      </div>
      <div className="p-5 space-y-5" data-testid="room-detail-loading-state">
        <div className="space-y-2">
          <Skeleton className="h-6 w-2/3" />
          <Skeleton className="h-4 w-1/3" />
        </div>
        <Card data-testid="room-detail-loading-property-card" className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-3.5 w-20" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </CardContent>
        </Card>
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Card data-testid="room-detail-loading-pricing-card" className="rounded-2xl">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-7 w-full rounded-lg" />
              <Skeleton className="h-7 w-full rounded-lg" />
            </div>
          </CardContent>
        </Card>
        <div data-testid="room-detail-loading-amenities">
          <Skeleton className="h-3.5 w-20 mb-2" />
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton
                key={`room-detail-amenity-${idx}`}
                className="h-6 w-20 rounded-full"
              />
            ))}
          </div>
        </div>
        <Card className="rounded-xl">
          <CardContent className="p-4 space-y-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3.5 w-40" />
            <div className="flex gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-8 w-24 rounded-lg" />
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

export function RoomManagement() {
  const { selectedPropertyId, properties } = useProperty();
  const isMobile = useIsMobile();
  const [rooms, setRooms] = useState<ManagedRoom[]>([]);
  const [isRoomsLoading, setIsRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState<string | null>(null);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [selectedRoomPropertyId, setSelectedRoomPropertyId] = useState<string | null>(null);
  const [selectedRoom, setSelectedRoom] = useState<ManagedRoom | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isRoomDetailLoading, setIsRoomDetailLoading] = useState(false);
  const [roomDetailError, setRoomDetailError] = useState<string | null>(null);
  const [showDeleteRoomDialog, setShowDeleteRoomDialog] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [showAddRoomDialog, setShowAddRoomDialog] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const roomDetailRequestIdRef = useRef(0);
  const isReadOnly = false;
  const isRoomDetailOpen = !!selectedRoomId;

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

  const loadRoomDetail = useCallback(async (propertyId: string, roomId: string) => {
    const requestId = roomDetailRequestIdRef.current + 1;
    roomDetailRequestIdRef.current = requestId;

    setIsRoomDetailLoading(true);
    setRoomDetailError(null);
    setSelectedRoom(null);

    const accessToken = readAccessToken();
    if (!accessToken) {
      const message = "You are not authenticated. Please sign in again to load room details.";
      if (roomDetailRequestIdRef.current !== requestId) return;
      setRoomDetailError(message);
      setIsRoomDetailLoading(false);
      toast.error(message);
      return;
    }

    try {
      const room = await fetchRoomById(accessToken, propertyId, roomId);
      if (roomDetailRequestIdRef.current !== requestId) return;
      setSelectedRoom(room);
      setSelectedImageIndex(0);
    } catch (error) {
      if (roomDetailRequestIdRef.current !== requestId) return;
      const message = error instanceof Error ? error.message : "Failed to fetch room details";
      setRoomDetailError(message);
      toast.error(message);
    } finally {
      if (roomDetailRequestIdRef.current === requestId) {
        setIsRoomDetailLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (selectedPropertyId === "all") {
      roomDetailRequestIdRef.current += 1;
      setSelectedRoomId(null);
      setSelectedRoomPropertyId(null);
      setSelectedRoom(null);
      setSelectedImageIndex(0);
      setIsRoomDetailLoading(false);
      setRoomDetailError(null);
      return;
    }

    if (!selectedRoomId || !selectedRoomPropertyId) {
      return;
    }

    const roomStillPresent = rooms.some((room) => room.id === selectedRoomId);
    if (!roomStillPresent && !isRoomsLoading) {
      roomDetailRequestIdRef.current += 1;
      setSelectedRoomId(null);
      setSelectedRoomPropertyId(null);
      setSelectedRoom(null);
      setSelectedImageIndex(0);
      setIsRoomDetailLoading(false);
      setRoomDetailError(null);
    }
  }, [isRoomsLoading, rooms, selectedPropertyId, selectedRoomId, selectedRoomPropertyId]);

  useEffect(() => {
    if (!selectedRoom || selectedRoom.images.length === 0) {
      setSelectedImageIndex(0);
      return;
    }

    setSelectedImageIndex((currentIndex) =>
      currentIndex >= selectedRoom.images.length ? 0 : currentIndex
    );
  }, [selectedRoom]);

  const filteredRooms =
    selectedPropertyId === "all"
      ? rooms
      : rooms.filter((room) => room.propertyId === selectedPropertyId);

  const getPropertyName = (id?: string) => properties.find((property) => property.id === id)?.name;

  const openRoomDetails = (room: ManagedRoom) => {
    const propertyId =
      room.propertyId && room.propertyId !== "all"
        ? room.propertyId
        : selectedPropertyId !== "all"
          ? selectedPropertyId
          : null;

    if (!propertyId) {
      toast.error("Could not determine property for this room.");
      return;
    }

    setSelectedRoomId(room.id);
    setSelectedRoomPropertyId(propertyId);
    loadRoomDetail(propertyId, room.id);
  };

  const closeRoomDetails = () => {
    roomDetailRequestIdRef.current += 1;
    setSelectedRoomId(null);
    setSelectedRoomPropertyId(null);
    setSelectedRoom(null);
    setSelectedImageIndex(0);
    setIsRoomDetailLoading(false);
    setRoomDetailError(null);
    setShowDeleteRoomDialog(false);
  };

  const handleImportFromUrl = async () => {
    if (!importUrl.trim() || !selectedPropertyId || selectedPropertyId === "all") return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsImporting(true);
    setImportError(null);

    try {
      const room = await importRoomFromUrl(accessToken, selectedPropertyId, importUrl.trim());
      toast.success(`"${room.name}" imported successfully`);
      setRooms((current) => [...current, room]);
      setShowAddRoomDialog(false);
      setImportUrl("");
      setImportError(null);
      openRoomDetails(room);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to import listing";
      setImportError(message);
      toast.error(message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (!selectedRoomId || !selectedRoomPropertyId) {
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again to delete this room.");
      return;
    }

    setIsDeletingRoom(true);

    try {
      const response = await deleteRoom(accessToken, selectedRoomPropertyId, selectedRoomId);
      toast.success(response.message || "Room deleted");
      setRooms((current) => current.filter((room) => room.id !== selectedRoomId));
      closeRoomDetails();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to delete room";
      toast.error(message);
    } finally {
      setShowDeleteRoomDialog(false);
      setIsDeletingRoom(false);
    }
  }, [selectedRoomId, selectedRoomPropertyId]);

  const retryRoomDetails = () => {
    if (!selectedRoomId || !selectedRoomPropertyId) {
      return;
    }
    loadRoomDetail(selectedRoomPropertyId, selectedRoomId);
  };

  const roomDetailHero =
    selectedRoom && !isRoomDetailLoading && !roomDetailError ? (
      <div className="relative">
        {selectedRoom.images[selectedImageIndex] ? (
          <img
            src={selectedRoom.images[selectedImageIndex]}
            alt={selectedRoom.name}
            data-testid="room-detail-main-image"
            className="w-full h-56 object-cover"
          />
        ) : (
          <div
            data-testid="room-detail-main-image-fallback"
            className="w-full h-56 bg-muted flex items-center justify-center"
          >
            <BedDouble className="w-12 h-12 text-muted-foreground" />
          </div>
        )}
        {selectedRoom.images.length > 0 && (
          <div
            data-testid="room-image-thumbnail-strip"
            className="flex gap-1.5 px-4 -mt-6 relative z-10 overflow-x-auto hide-scrollbar pb-1 pt-1"
          >
            {selectedRoom.images.map((img, i) => (
              <RoomImagePreview
                key={`${img}-${i}`}
                imageUrl={img}
                alt={`${selectedRoom.name} preview ${i + 1}`}
                onClick={() => setSelectedImageIndex(i)}
                isActive={selectedImageIndex === i}
              />
            ))}
          </div>
        )}
      </div>
    ) : null;

  const roomDetailDetails =
    selectedRoom && !isRoomDetailLoading && !roomDetailError ? (
      <div className="p-5 space-y-5">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h3 className="text-lg font-semibold text-foreground">{selectedRoom.name}</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {selectedRoom.type} · {selectedRoom.bedConfig}
            </p>
          </div>
          {sourceBadge(selectedRoom.source)}
        </div>

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
            disabled={isDeletingRoom || !selectedRoomId || !selectedRoomPropertyId}
            onClick={() => setShowDeleteRoomDialog(true)}
          >
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        </div>
      </div>
    ) : null;

  const roomDetailBody = (
    <>
      {isRoomDetailLoading && <RoomDetailSkeleton />}

      {!isRoomDetailLoading && roomDetailError && (
        <div className="p-5 space-y-4" data-testid="room-detail-error-state">
          <h3 className="text-sm font-semibold text-foreground">Could not load room details</h3>
          <p className="text-sm text-muted-foreground">{roomDetailError}</p>
          <Button variant="outline" size="sm" className="rounded-xl" onClick={retryRoomDetails}>
            Retry
          </Button>
        </div>
      )}

      {!isRoomDetailLoading && !roomDetailError && selectedRoom && (
        <>
          {roomDetailHero}
          {roomDetailDetails}
        </>
      )}
    </>
  );

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rooms</h1>
        <Button
          size="sm"
          className="rounded-xl gap-2"
          disabled={isReadOnly}
          data-testid="add-room-button"
          onClick={() => setShowAddRoomDialog(true)}
        >
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Manage your property listings and sync with platforms
      </p>
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
            <motion.div key={`room-skeleton-${idx}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <RoomCardSkeleton />
            </motion.div>
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
                onClick={() => openRoomDetails(room)}
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

      {isMobile ? (
        <Drawer
          open={isRoomDetailOpen}
          onOpenChange={(open) => {
            if (!open) closeRoomDetails();
          }}
        >
          <DrawerContent
            data-testid="room-detail-drawer"
            className="rounded-t-[32px] h-[90vh] overflow-hidden p-0 [&>div:first-child]:hidden"
          >
            <DrawerHeader className="sr-only">
              <DrawerTitle>Room details</DrawerTitle>
              <DrawerDescription>
                View room details including images, pricing, amenities, and sync state.
              </DrawerDescription>
            </DrawerHeader>
            <button
              type="button"
              aria-label="Close room details"
              onClick={closeRoomDetails}
              className="absolute right-4 top-6 z-20 inline-flex h-10 w-10 items-center justify-center rounded-full bg-muted/70 text-muted-foreground ring-1 ring-border shadow-sm transition hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <X className="h-4 w-4" />
            </button>
            <div
              className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-[max(1rem,env(safe-area-inset-bottom))]"
              data-testid="room-detail-scroll-body"
            >
              {roomDetailBody}
            </div>
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet
          open={isRoomDetailOpen}
          onOpenChange={(open) => {
            if (!open) closeRoomDetails();
          }}
        >
          <SheetContent
            className="w-full max-w-full sm:max-w-xl overflow-y-auto p-0 [&>button]:rounded-full [&>button]:bg-muted/70 [&>button]:text-muted-foreground [&>button]:ring-1 [&>button]:ring-border [&>button]:shadow-sm [&>button]:opacity-100 [&>button]:transition [&>button:hover]:bg-muted/80 [&>button:focus-visible]:outline-none [&>button:focus-visible]:ring-2 [&>button:focus-visible]:ring-ring [&>button:focus-visible]:ring-offset-2 [&>button:focus-visible]:ring-offset-background"
          >
            <SheetTitle className="sr-only">Room details</SheetTitle>
            <SheetDescription className="sr-only">
              View room details including images, pricing, amenities, and sync state.
            </SheetDescription>
            {roomDetailBody}
          </SheetContent>
        </Sheet>
      )}

      {isMobile ? (
        <MobileDestructiveConfirmSheet
          open={showDeleteRoomDialog}
          onOpenChange={setShowDeleteRoomDialog}
          title="Delete room?"
          description="Are you sure you want to delete room?"
          confirmLabel="Yes"
          onConfirm={() => {
            void handleConfirmDeleteRoom();
          }}
          onCancel={() => setShowDeleteRoomDialog(false)}
          confirmDisabled={isDeletingRoom}
          cancelDisabled={isDeletingRoom}
          testId="delete-room-drawer"
        />
      ) : (
        <AlertDialog open={showDeleteRoomDialog} onOpenChange={setShowDeleteRoomDialog}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete room?</AlertDialogTitle>
              <AlertDialogDescription>Are you sure you want to delete room?</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeletingRoom}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void handleConfirmDeleteRoom();
                }}
                disabled={isDeletingRoom}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Yes
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      <Dialog
        open={showAddRoomDialog}
        onOpenChange={(open) => {
          setShowAddRoomDialog(open);
          if (!open) {
            setImportUrl("");
            setImportError(null);
          }
        }}
      >
        <DialogContent className="rounded-2xl sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Import from a platform or add manually
            </DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="paste-link" className="mt-2">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="paste-link" className="gap-1.5 text-xs">
                <Link className="h-3.5 w-3.5" />
                Paste Link
              </TabsTrigger>
              <TabsTrigger value="connect" className="gap-1.5 text-xs">
                <Plug className="h-3.5 w-3.5" />
                Connect
              </TabsTrigger>
              <TabsTrigger value="manual" className="gap-1.5 text-xs">
                <PenLine className="h-3.5 w-3.5" />
                Manual
              </TabsTrigger>
            </TabsList>

            <TabsContent value="paste-link" className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="airbnb-url">Airbnb listing URL</Label>
                <Input
                  id="airbnb-url"
                  placeholder="https://www.airbnb.com/rooms/12345678"
                  value={importUrl}
                  onChange={(e) => {
                    setImportUrl(e.target.value);
                    setImportError(null);
                  }}
                  disabled={isImporting}
                />
                {importError && (
                  <p className="text-xs text-destructive">{importError}</p>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                We'll fetch the listing details including photos, price, amenities, and description.
              </p>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowAddRoomDialog(false)}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportFromUrl}
                  disabled={isImporting || !importUrl.trim()}
                >
                  {isImporting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isImporting ? "Importing…" : "Import"}
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="connect" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Connect your Airbnb or Booking.com account to automatically sync listings.
                This feature is coming soon.
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowAddRoomDialog(false)}>
                  Close
                </Button>
              </div>
            </TabsContent>

            <TabsContent value="manual" className="space-y-4 pt-4">
              <p className="text-sm text-muted-foreground">
                Manually create a room listing with custom details.
                This feature is coming soon.
              </p>
              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowAddRoomDialog(false)}>
                  Close
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
