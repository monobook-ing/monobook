import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, CalendarDays, User, CreditCard, BedDouble, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { type ManagedRoom } from "@/data/mockRoomData";
import { useProperty } from "@/contexts/PropertyContext";
import {
  fetchBookings,
  fetchRooms,
  readAccessToken,
  type ApiBookingStatus,
  type Booking,
} from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { RoomImagePreview } from "@/components/dashboard/RoomImagePreview";

type InventoryVisibleStatus = Exclude<ApiBookingStatus, "cancelled">;
type InventoryStatusFilter = "all" | InventoryVisibleStatus;

interface InventoryBookingDetail extends Booking {
  roomName: string;
  roomType: string;
}

type PendingGuestNavigation = {
  guestId: string | null;
  guestName: string;
};

const statusColors: Record<ApiBookingStatus, string> = {
  confirmed: "bg-primary/80 text-primary-foreground",
  ai_pending: "bg-emerald-500/80 text-emerald-50",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<ApiBookingStatus, string> = {
  confirmed: "Confirmed",
  ai_pending: "AI Pending",
  pending: "Pending",
  cancelled: "Cancelled",
};

const statusBadgeVariant: Record<ApiBookingStatus, string> = {
  confirmed: "bg-primary/15 text-primary border-primary/20",
  ai_pending: "bg-emerald-500/15 text-emerald-700 border-emerald-500/25",
  pending: "bg-muted text-muted-foreground border-border",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const formatInventoryError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load bookings.";
  }
  return error;
};

export function InventoryCalendar() {
  const navigate = useNavigate();
  const { selectedPropertyId } = useProperty();
  const [weekOffset, setWeekOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<InventoryStatusFilter>("all");
  const [rooms, setRooms] = useState<ManagedRoom[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isInventoryLoading, setIsInventoryLoading] = useState(false);
  const [inventoryError, setInventoryError] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<InventoryBookingDetail | null>(null);
  const [pendingGuestNavigation, setPendingGuestNavigation] = useState<PendingGuestNavigation | null>(null);
  const requestIdRef = useRef(0);
  const isMobile = useIsMobile();
  const dayCount = isMobile ? 7 : 14;
  const roomColWidth = isMobile ? 80 : 120;
  const minTableWidth = isMobile ? 420 : 700;

  useEffect(() => {
    let active = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadInventory = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setRooms([]);
        setBookings([]);
        setInventoryError(null);
        setIsInventoryLoading(false);
        setSelectedBooking(null);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setRooms([]);
        setBookings([]);
        setInventoryError("missing_token");
        setIsInventoryLoading(false);
        setSelectedBooking(null);
        return;
      }

      setIsInventoryLoading(true);
      setInventoryError(null);
      setSelectedBooking(null);

      try {
        const [fetchedRooms, fetchedBookings] = await Promise.all([
          fetchRooms(accessToken, selectedPropertyId),
          fetchBookings(
            accessToken,
            selectedPropertyId,
            statusFilter === "all" ? undefined : { status: statusFilter }
          ),
        ]);
        if (!active || requestIdRef.current !== requestId) return;
        setRooms(fetchedRooms);
        setBookings(fetchedBookings);
      } catch (error) {
        if (!active || requestIdRef.current !== requestId) return;
        const message = error instanceof Error ? error.message : "Failed to fetch inventory";
        setRooms([]);
        setBookings([]);
        setInventoryError(message);
      } finally {
        if (active && requestIdRef.current === requestId) {
          setIsInventoryLoading(false);
        }
      }
    };

    loadInventory();

    return () => {
      active = false;
    };
  }, [selectedPropertyId, statusFilter]);

  const dates = useMemo(() => {
    const result: { label: string; value: string; dayNum: number; isToday: boolean }[] = [];
    const baseDate = new Date();
    baseDate.setHours(0, 0, 0, 0);
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    for (let i = 0; i < dayCount; i += 1) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i);
      const today = new Date();
      result.push({
        label: d.toLocaleDateString("en-US", { weekday: "short" }),
        value: d.toISOString().split("T")[0],
        dayNum: d.getDate(),
        isToday: d.toDateString() === today.toDateString(),
      });
    }
    return result;
  }, [weekOffset, dayCount]);

  const bookingsByRoomId = useMemo(() => {
    const roomIds = new Set(rooms.map((room) => room.id));
    const mapped = new Map<string, Booking[]>();
    for (const booking of bookings) {
      if (!roomIds.has(booking.roomId)) continue;
      const roomBookings = mapped.get(booking.roomId) ?? [];
      roomBookings.push(booking);
      mapped.set(booking.roomId, roomBookings);
    }
    return mapped;
  }, [bookings, rooms]);

  const visibleBookingsCount = useMemo(() => {
    let count = 0;
    for (const roomBookings of bookingsByRoomId.values()) {
      count += roomBookings.length;
    }
    return count;
  }, [bookingsByRoomId]);

  const getBookingSpan = (checkIn: string, checkOut: string) => {
    const startIdx = dates.findIndex((d) => d.value === checkIn);
    const endIdx = dates.findIndex((d) => d.value === checkOut);
    if (startIdx === -1 && endIdx === -1) {
      const firstDate = dates[0]?.value;
      const lastDate = dates[dates.length - 1]?.value;
      if (checkIn < firstDate && checkOut > lastDate) {
        return { start: 0, span: dates.length };
      }
      return null;
    }
    const s = startIdx === -1 ? 0 : startIdx;
    const e = endIdx === -1 ? dates.length : endIdx;
    return { start: s, span: Math.max(1, e - s) };
  };

  const getNights = (checkIn: string, checkOut: string) => {
    const d1 = new Date(checkIn);
    const d2 = new Date(checkOut);
    return Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(`${dateStr}T00:00:00`);
    return d.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const closeBookingDetails = () => {
    setSelectedBooking(null);
  };

  const navigateToGuestDetails = (target: PendingGuestNavigation) => {
    const params = new URLSearchParams();
    if (target.guestId) {
      params.set("guestId", target.guestId);
    }
    params.set("guestName", target.guestName);
    navigate(`/guests?${params.toString()}`);
  };

  const openGuestDetails = (booking: InventoryBookingDetail) => {
    const target = {
      guestId: booking.guestId,
      guestName: booking.guestName,
    };

    if (!isMobile) {
      navigateToGuestDetails(target);
      return;
    }

    setPendingGuestNavigation(target);
    closeBookingDetails();
  };

  useEffect(() => {
    if (!isMobile || selectedBooking || !pendingGuestNavigation) return;

    const timer = window.setTimeout(() => {
      navigateToGuestDetails(pendingGuestNavigation);
      setPendingGuestNavigation(null);
    }, 200);

    return () => window.clearTimeout(timer);
  }, [isMobile, navigate, pendingGuestNavigation, selectedBooking]);

  const selectedRoomImage = useMemo(() => {
    if (!selectedBooking) return undefined;
    return rooms.find((room) => room.id === selectedBooking.roomId)?.images[0];
  }, [rooms, selectedBooking]);

  const bookingDetailsBody = selectedBooking ? (
    <div className="space-y-4 pt-2">
      <div className="flex items-center justify-between">
        <Badge
          variant="outline"
          className={`${statusBadgeVariant[selectedBooking.status]} text-xs px-2.5 py-0.5`}
        >
          {statusLabels[selectedBooking.status]}
        </Badge>
        <span className="text-xs text-muted-foreground">ID: {selectedBooking.id}</span>
      </div>

      <Separator />

      <button
        type="button"
        className="w-full flex items-center gap-3 rounded-lg p-1 -m-1 text-left transition-colors hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        onClick={() => openGuestDetails(selectedBooking)}
        aria-label={`Open guest profile for ${selectedBooking.guestName}`}
      >
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <User className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{selectedBooking.guestName}</p>
          <p className="text-xs text-muted-foreground">Guest</p>
        </div>
      </button>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <BedDouble className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">{selectedBooking.roomName}</p>
          <p className="text-xs text-muted-foreground">{selectedBooking.roomType}</p>
        </div>
      </div>

      <div className="rounded-xl">
        <RoomImagePreview
          imageUrl={selectedRoomImage}
          alt={`${selectedBooking.roomName} preview`}
          className="w-full h-40 md:h-44 rounded-lg border-0 shadow-none"
        />
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CalendarDays className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Check-in</p>
              <p className="text-sm font-medium text-foreground">{formatDate(selectedBooking.checkIn)}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Check-out</p>
              <p className="text-sm font-medium text-foreground">{formatDate(selectedBooking.checkOut)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <Clock className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">
            {getNights(selectedBooking.checkIn, selectedBooking.checkOut)} nights
          </p>
          <p className="text-xs text-muted-foreground">Duration</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <CreditCard className="w-4 h-4 text-primary" />
        </div>
        <div>
          <p className="text-sm font-semibold text-foreground">${selectedBooking.totalPrice.toFixed(2)}</p>
          <p className="text-xs text-muted-foreground">Total price</p>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      <div className="flex items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Availability calendar</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as InventoryStatusFilter)}>
            <SelectTrigger className="w-[140px] h-9 rounded-xl text-sm" data-testid="inventory-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="ai_pending">AI Pending</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
          <motion.button
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center min-w-[44px] min-h-[44px]"
            whileTap={{ scale: 0.9 }}
            onClick={() => setWeekOffset((p) => p - 1)}
          >
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button
            className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center min-w-[44px] min-h-[44px]"
            whileTap={{ scale: 0.9 }}
            onClick={() => setWeekOffset((p) => p + 1)}
          >
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {selectedPropertyId === "all" && (
        <Card className="rounded-xl border-dashed" data-testid="inventory-select-property-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">Select a property to view inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose one property from the switcher to load rooms and bookings from the API.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && isInventoryLoading && (
        <Card className="rounded-2xl" data-testid="inventory-loading-state">
          <CardContent className="p-4 space-y-2">
            {Array.from({ length: 6 }).map((_, idx) => (
              <Skeleton key={`inventory-loading-${idx}`} className="h-12 w-full" />
            ))}
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isInventoryLoading && inventoryError && (
        <Card className="rounded-xl border-destructive/30" data-testid="inventory-error-state">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">Could not load inventory</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatInventoryError(inventoryError)}</p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" &&
        !isInventoryLoading &&
        !inventoryError &&
        (rooms.length === 0 || visibleBookingsCount === 0) && (
          <Card className="rounded-xl border-dashed" data-testid="inventory-empty-state">
            <CardContent className="p-8 text-center">
              <h3 className="text-base font-semibold text-foreground">No bookings found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                This property currently has no bookings for the selected status filter.
              </p>
            </CardContent>
          </Card>
        )}

      {selectedPropertyId !== "all" &&
        !isInventoryLoading &&
        !inventoryError &&
        rooms.length > 0 &&
        visibleBookingsCount > 0 && (
          <>
            <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
              <div className="overflow-x-auto hide-scrollbar">
                <div style={!isMobile ? { minWidth: `${minTableWidth}px` } : undefined}>
                  <div
                    className="grid"
                    style={{ gridTemplateColumns: `${roomColWidth}px repeat(${dates.length}, 1fr)` }}
                  >
                    <div className="p-2 md:p-3 border-b border-border" />
                    {dates.map((d) => (
                      <div
                        key={d.value}
                        className={`p-1.5 md:p-2 text-center border-b border-border ${d.isToday ? "bg-primary/5" : ""}`}
                      >
                        <span className="text-[10px] text-muted-foreground block">{d.label}</span>
                        <span className={`text-xs md:text-sm font-semibold ${d.isToday ? "text-primary" : "text-card-foreground"}`}>
                          {d.dayNum}
                        </span>
                      </div>
                    ))}
                  </div>

                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="grid relative"
                      style={{
                        gridTemplateColumns: `${roomColWidth}px repeat(${dates.length}, 1fr)`,
                        minHeight: isMobile ? "48px" : "52px",
                      }}
                    >
                      <div className="p-2 md:p-3 border-b border-border flex items-center">
                        <HoverCard openDelay={0} closeDelay={100}>
                          <HoverCardTrigger asChild>
                            <button
                              type="button"
                              className="w-full text-left flex flex-col justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                              data-testid={`inventory-room-hover-trigger-${room.id}`}
                              aria-label={`Preview ${room.name}`}
                            >
                              <span className="text-xs md:text-sm font-medium text-card-foreground">{room.name}</span>
                              <span className="text-[10px] text-muted-foreground">{room.type}</span>
                            </button>
                          </HoverCardTrigger>
                          <HoverCardContent
                            align="start"
                            side="right"
                            className="w-auto p-1.5"
                            data-testid={`inventory-room-hover-content-${room.id}`}
                          >
                            <RoomImagePreview imageUrl={room.images[0]} alt={`${room.name} preview`} />
                          </HoverCardContent>
                        </HoverCard>
                      </div>
                      {dates.map((d) => (
                        <div key={d.value} className="border-b border-l border-border" />
                      ))}
                      {(bookingsByRoomId.get(room.id) ?? []).map((booking) => {
                        const span = getBookingSpan(booking.checkIn, booking.checkOut);
                        if (!span) return null;
                        const roomColPct = (roomColWidth / minTableWidth) * 100;
                        return (
                          <motion.div
                            key={booking.id}
                            className={`absolute top-2 h-7 md:h-8 rounded-lg ${statusColors[booking.status]} flex items-center px-1.5 md:px-2 text-[10px] md:text-xs font-medium truncate cursor-pointer`}
                            style={{
                              left: `calc(${roomColWidth}px + ${(span.start / dates.length) * (100 - roomColPct)}%)`,
                              width: `calc(${(span.span / dates.length) * (100 - roomColPct)}% - 4px)`,
                            }}
                            whileHover={{ scale: 1.02 }}
                            onClick={() =>
                              setSelectedBooking({
                                ...booking,
                                roomName: room.name,
                                roomType: room.type,
                              })
                            }
                            title={`${booking.guestName}: ${booking.checkIn} → ${booking.checkOut}`}
                          >
                            {booking.guestName}
                          </motion.div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-primary/80" />
                Confirmed
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-emerald-500/80" />
                AI Pending
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded bg-muted" />
                Pending
              </div>
            </div>
          </>
        )}

      {isMobile ? (
        <Drawer
          open={!!selectedBooking}
          onOpenChange={(open) => {
            if (!open) closeBookingDetails();
          }}
        >
          <DrawerContent
            data-testid="inventory-booking-drawer"
            className="rounded-t-[32px] border-white/40 bg-background/80 shadow-xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] apple-shadow-lg"
          >
            {selectedBooking && (
              <div className="px-5 pb-4">
                <DrawerHeader className="px-0 pt-3 text-center">
                  <DrawerTitle className="text-lg">Booking Details</DrawerTitle>
                  <DrawerDescription className="sr-only">
                    Booking details for the selected reservation.
                  </DrawerDescription>
                </DrawerHeader>
                {bookingDetailsBody}
              </div>
            )}
          </DrawerContent>
        </Drawer>
      ) : (
        <Dialog
          open={!!selectedBooking}
          onOpenChange={(open) => {
            if (!open) closeBookingDetails();
          }}
        >
          <DialogContent className="sm:max-w-md rounded-2xl">
            {selectedBooking && (
              <>
                <DialogHeader>
                  <DialogTitle className="text-lg">Booking Details</DialogTitle>
                  <DialogDescription className="sr-only">
                    Booking details for the selected reservation.
                  </DialogDescription>
                </DialogHeader>
                {bookingDetailsBody}
              </>
            )}
          </DialogContent>
        </Dialog>
      )}
    </motion.div>
  );
}
