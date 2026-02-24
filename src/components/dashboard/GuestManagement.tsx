import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import {
  Search,
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Bot,
  User,
  ChevronRight,
  X,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@/components/ui/sheet";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useProperty } from "@/contexts/PropertyContext";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  fetchGuestById,
  fetchGuests,
  readAccessToken,
  type GuestDetail,
  type GuestSummary,
  type GuestBooking,
  type GuestConversation,
} from "@/lib/auth";
import { format } from "date-fns";

const statusColor: Record<string, string> = {
  confirmed: "bg-primary/10 text-primary border-primary/20",
  checked_in: "bg-success/10 text-success border-success/20",
  checked_out: "bg-muted text-muted-foreground",
  pending: "bg-muted text-muted-foreground",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  ai_pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
};

const statusLabel: Record<string, string> = {
  confirmed: "Confirmed",
  checked_in: "Checked In",
  checked_out: "Checked Out",
  pending: "Pending",
  cancelled: "Cancelled",
  ai_pending: "AI Pending",
};

const channelLabel: Record<string, string> = {
  widget: "Website Widget",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  mcp: "MCP",
};

const channelIcon: Record<string, React.ElementType> = {
  widget: MessageSquare,
  chatgpt: Bot,
  claude: Bot,
  gemini: Bot,
  mcp: Bot,
};

const formatGuestsError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load guests.";
  }
  return error;
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((p) => p.charAt(0))
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

function GuestCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="h-5 w-20" />
      </CardContent>
    </Card>
  );
}

function GuestDetailSkeleton() {
  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-5 w-1/2" />
          <Skeleton className="h-3 w-2/3" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-20 w-full rounded-xl" />
      </div>
      <Skeleton className="h-28 w-full rounded-xl" />
      <Skeleton className="h-28 w-full rounded-xl" />
    </div>
  );
}

function BookingRow({ booking }: { booking: GuestBooking }) {
  return (
    <div className="flex items-center justify-between gap-2 py-2.5 text-sm">
      <div className="min-w-0 flex-1">
        <p className="font-medium text-foreground truncate">{booking.roomName}</p>
        <p className="text-xs text-muted-foreground">
          {format(new Date(booking.checkIn), "MMM d")} - {format(new Date(booking.checkOut), "MMM d, yyyy")}
        </p>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-semibold text-foreground">${booking.totalPrice.toLocaleString()}</span>
        <Badge variant="outline" className={`text-[10px] ${statusColor[booking.status] || ""}`}>
          {statusLabel[booking.status] || booking.status}
        </Badge>
      </div>
    </div>
  );
}

function ConversationThread({ conversation }: { conversation: GuestConversation }) {
  const [open, setOpen] = useState(false);
  const channelKey = conversation.channel.toLowerCase();
  const ChannelIcon = channelIcon[channelKey] || MessageSquare;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[40px]">
        <ChannelIcon className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">
            {channelLabel[channelKey] || conversation.channel}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {format(new Date(conversation.startedAt), "MMM d, yyyy · h:mm a")} · {conversation.messages.length} messages
          </p>
        </div>
        <ChevronRight className={`w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-90" : ""}`} />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="ml-6 mr-2 mb-2 space-y-2 border-l-2 border-border pl-3 pt-2">
          {conversation.messages.map((msg, i) => (
            <div key={`${conversation.id}-msg-${i}`} className="text-sm">
              <div className="flex items-center gap-1.5 mb-0.5">
                {msg.role === "guest" ? (
                  <User className="w-3 h-3 text-muted-foreground" />
                ) : (
                  <Bot className="w-3 h-3 text-primary" />
                )}
                <span className="text-[10px] font-medium text-muted-foreground uppercase">
                  {msg.role === "guest" ? "Guest" : "AI"}
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {format(new Date(msg.timestamp), "h:mm a")}
                </span>
              </div>
              <p className="text-foreground leading-relaxed">{msg.text}</p>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

function GuestDetailContent({
  guest,
  onClose,
}: {
  guest: GuestDetail;
  onClose: () => void;
}) {
  const latestBooking = guest.bookings[0];

  return (
    <ScrollArea className="h-full">
      <div className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <Avatar className="h-12 w-12">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
              {getInitials(guest.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-foreground">{guest.name}</h3>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Mail className="w-3.5 h-3.5" />
              <span className="truncate">{guest.email || "-"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
              <Phone className="w-3.5 h-3.5" />
              <span>{guest.phone || "-"}</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">{guest.totalStays}</p>
              <p className="text-xs text-muted-foreground">Total Stays</p>
            </CardContent>
          </Card>
          <Card className="rounded-xl">
            <CardContent className="p-3 text-center">
              <p className="text-2xl font-bold text-foreground">${guest.totalSpent.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Spent</p>
            </CardContent>
          </Card>
        </div>

        {guest.notes && (
          <Card className="rounded-xl bg-muted/30">
            <CardContent className="p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-foreground">{guest.notes}</p>
            </CardContent>
          </Card>
        )}

        <Separator />

        {latestBooking && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Latest Booking
            </h4>
            <Card className="rounded-xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <p className="font-medium text-foreground">{latestBooking.roomName}</p>
                  <Badge variant="outline" className={statusColor[latestBooking.status] || ""}>
                    {statusLabel[latestBooking.status] || latestBooking.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-1">
                  <Calendar className="w-3.5 h-3.5" />
                  {format(new Date(latestBooking.checkIn), "MMM d")} - {format(new Date(latestBooking.checkOut), "MMM d, yyyy")}
                </div>
                <p className="text-lg font-bold text-foreground">${latestBooking.totalPrice.toLocaleString()}</p>
                {latestBooking.aiHandled && (
                  <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                    <Bot className="w-3 h-3" />
                    Booked via AI
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {guest.bookings.length > 1 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Booking History
            </h4>
            <Card className="rounded-xl">
              <CardContent className="p-3 divide-y divide-border">
                {guest.bookings.slice(1).map((booking) => (
                  <BookingRow key={booking.id} booking={booking} />
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        <Separator />

        {guest.conversations.length > 0 && (
          <div>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Conversations ({guest.conversations.length})
            </h4>
            <div className="space-y-1">
              {guest.conversations.map((conversation) => (
                <ConversationThread key={conversation.id} conversation={conversation} />
              ))}
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

export function GuestManagement() {
  const { selectedPropertyId } = useProperty();
  const isMobile = useIsMobile();
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [guests, setGuests] = useState<GuestSummary[]>([]);
  const [isGuestsLoading, setIsGuestsLoading] = useState(false);
  const [isGuestsResolved, setIsGuestsResolved] = useState(false);
  const [guestsError, setGuestsError] = useState<string | null>(null);
  const [selectedGuestId, setSelectedGuestId] = useState<string | null>(null);
  const [selectedGuestDetail, setSelectedGuestDetail] = useState<GuestDetail | null>(null);
  const [isGuestDetailLoading, setIsGuestDetailLoading] = useState(false);
  const [guestDetailError, setGuestDetailError] = useState<string | null>(null);
  const [detailReloadKey, setDetailReloadKey] = useState(0);
  const listRequestIdRef = useRef(0);
  const detailRequestIdRef = useRef(0);
  const guestIdFromQuery = searchParams.get("guestId");
  const guestNameFromQuery = searchParams.get("guestName");
  const hasGuestQuery = Boolean(guestIdFromQuery || guestNameFromQuery);

  useEffect(() => {
    let active = true;
    const requestId = listRequestIdRef.current + 1;
    listRequestIdRef.current = requestId;

    const loadGuests = async () => {
      setIsGuestsResolved(false);
      setSelectedGuestId(null);
      setSelectedGuestDetail(null);
      setGuestDetailError(null);
      setIsGuestDetailLoading(false);

      if (selectedPropertyId === "all") {
        if (!active) return;
        setGuests([]);
        setGuestsError(null);
        setIsGuestsLoading(false);
        setIsGuestsResolved(true);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setGuests([]);
        setGuestsError("missing_token");
        setIsGuestsLoading(false);
        setIsGuestsResolved(true);
        return;
      }

      setIsGuestsLoading(true);
      setGuestsError(null);

      try {
        const fetchedGuests = await fetchGuests(accessToken, selectedPropertyId);
        if (!active || listRequestIdRef.current !== requestId) return;
        setGuests(fetchedGuests);
      } catch (error) {
        if (!active || listRequestIdRef.current !== requestId) return;
        const message = error instanceof Error ? error.message : "Failed to fetch guests";
        setGuests([]);
        setGuestsError(message);
      } finally {
        if (active && listRequestIdRef.current === requestId) {
          setIsGuestsLoading(false);
          setIsGuestsResolved(true);
        }
      }
    };

    loadGuests();

    return () => {
      active = false;
    };
  }, [selectedPropertyId]);

  useEffect(() => {
    let active = true;
    const requestId = detailRequestIdRef.current + 1;
    detailRequestIdRef.current = requestId;

    const loadGuestDetail = async () => {
      if (!selectedGuestId || selectedPropertyId === "all") {
        if (!active) return;
        setSelectedGuestDetail(null);
        setGuestDetailError(null);
        setIsGuestDetailLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setSelectedGuestDetail(null);
        setGuestDetailError("missing_token");
        setIsGuestDetailLoading(false);
        return;
      }

      setIsGuestDetailLoading(true);
      setGuestDetailError(null);
      setSelectedGuestDetail(null);

      try {
        const detail = await fetchGuestById(accessToken, selectedPropertyId, selectedGuestId);
        if (!active || detailRequestIdRef.current !== requestId) return;
        setSelectedGuestDetail(detail);
      } catch (error) {
        if (!active || detailRequestIdRef.current !== requestId) return;
        const message = error instanceof Error ? error.message : "Failed to fetch guest details";
        setSelectedGuestDetail(null);
        setGuestDetailError(message);
      } finally {
        if (active && detailRequestIdRef.current === requestId) {
          setIsGuestDetailLoading(false);
        }
      }
    };

    loadGuestDetail();

    return () => {
      active = false;
    };
  }, [selectedGuestId, selectedPropertyId, detailReloadKey]);

  const filteredGuests = useMemo(() => {
    if (!search.trim()) {
      return guests;
    }

    const query = search.toLowerCase();
    return guests.filter(
      (guest) =>
        guest.name.toLowerCase().includes(query) ||
        (guest.email || "").toLowerCase().includes(query) ||
        (guest.phone || "").toLowerCase().includes(query)
    );
  }, [guests, search]);

  const selectedGuestFromList = selectedGuestId
    ? guests.find((guest) => guest.id === selectedGuestId) || null
    : null;

  const closeDetail = (clearQuery = true) => {
    detailRequestIdRef.current += 1;
    setSelectedGuestId(null);
    setSelectedGuestDetail(null);
    setIsGuestDetailLoading(false);
    setGuestDetailError(null);

    if (!clearQuery) return;
    if (!guestIdFromQuery && !guestNameFromQuery) return;
    const next = new URLSearchParams(searchParams);
    next.delete("guestId");
    next.delete("guestName");
    setSearchParams(next);
  };

  const retryDetail = () => {
    if (!selectedGuestId) return;
    setDetailReloadKey((current) => current + 1);
  };

  const openDetail = (guestId: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("guestId", guestId);
    next.delete("guestName");
    setSearchParams(next);
  };

  const matchedGuestIdFromQuery = useMemo(() => {
    if (guestIdFromQuery && guests.some((guest) => guest.id === guestIdFromQuery)) {
      return guestIdFromQuery;
    }

    if (!guestNameFromQuery) return null;
    const normalizedName = guestNameFromQuery.trim().toLowerCase();
    if (!normalizedName) return null;

    return guests.find((guest) => guest.name.trim().toLowerCase() === normalizedName)?.id ?? null;
  }, [guestIdFromQuery, guestNameFromQuery, guests]);

  useEffect(() => {
    if (!hasGuestQuery) {
      if (!selectedGuestId) return;
      detailRequestIdRef.current += 1;
      setSelectedGuestId(null);
      setSelectedGuestDetail(null);
      setIsGuestDetailLoading(false);
      setGuestDetailError(null);
      return;
    }

    if (selectedPropertyId === "all") {
      const next = new URLSearchParams(searchParams);
      next.delete("guestId");
      next.delete("guestName");
      setSearchParams(next, { replace: true });
      return;
    }

    if (!isGuestsResolved || isGuestsLoading || guestsError) return;

    if (!matchedGuestIdFromQuery) {
      detailRequestIdRef.current += 1;
      setSelectedGuestId(null);
      setSelectedGuestDetail(null);
      setIsGuestDetailLoading(false);
      setGuestDetailError(null);
      const next = new URLSearchParams(searchParams);
      next.delete("guestId");
      next.delete("guestName");
      setSearchParams(next, { replace: true });
      return;
    }

    if (selectedGuestId !== matchedGuestIdFromQuery) {
      setSelectedGuestId(matchedGuestIdFromQuery);
    }

    if (guestIdFromQuery !== matchedGuestIdFromQuery || guestNameFromQuery) {
      const next = new URLSearchParams(searchParams);
      next.set("guestId", matchedGuestIdFromQuery);
      next.delete("guestName");
      setSearchParams(next, { replace: true });
    }
  }, [
    guestIdFromQuery,
    guestNameFromQuery,
    guestsError,
    isGuestsResolved,
    hasGuestQuery,
    isGuestsLoading,
    matchedGuestIdFromQuery,
    searchParams,
    selectedGuestId,
    selectedPropertyId,
    setSearchParams,
  ]);

  const detailContent = isGuestDetailLoading ? (
    <GuestDetailSkeleton />
  ) : guestDetailError ? (
    <div className="p-5 space-y-3">
      <h3 className="text-sm font-semibold text-foreground">Could not load guest details</h3>
      <p className="text-sm text-muted-foreground">{formatGuestsError(guestDetailError)}</p>
      <Button variant="outline" size="sm" className="rounded-xl" onClick={retryDetail}>
        Retry
      </Button>
    </div>
  ) : selectedGuestDetail ? (
    <GuestDetailContent guest={selectedGuestDetail} onClose={closeDetail} />
  ) : null;

  const isDetailOpen = !!selectedGuestId;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Guests</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {filteredGuests.length} guest{filteredGuests.length !== 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search guests..."
          className="pl-9 rounded-xl"
        />
      </div>

      {selectedPropertyId === "all" ? (
        <div className="text-center py-16">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">Select a property to view guests</p>
        </div>
      ) : isGuestsLoading ? (
        <div className="space-y-2" data-testid="guests-loading-state">
          {Array.from({ length: 6 }).map((_, index) => (
            <GuestCardSkeleton key={`guest-skeleton-${index}`} />
          ))}
        </div>
      ) : guestsError ? (
        <Card className="rounded-xl border-destructive/30" data-testid="guests-error-state">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">Could not load guests</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatGuestsError(guestsError)}</p>
          </CardContent>
        </Card>
      ) : filteredGuests.length === 0 ? (
        <div className="text-center py-16">
          <User className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">
            {search ? "No guests match your search" : "No guests found"}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {filteredGuests.map((guest, index) => {
              const latest = guest.latestBooking;
              return (
                <motion.div
                  key={guest.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: index * 0.03 }}
                >
                  <Card
                    className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => openDetail(guest.id)}
                  >
                    <CardContent className="p-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10 shrink-0">
                        <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                          {getInitials(guest.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">{guest.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{guest.email || "-"}</p>
                        {latest && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            Last: {latest.roomName} · {format(new Date(latest.checkIn), "MMM d")} - {format(new Date(latest.checkOut), "MMM d")}
                          </p>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        {latest && (
                          <Badge variant="outline" className={`text-[10px] ${statusColor[latest.status] || ""}`}>
                            {statusLabel[latest.status] || latest.status}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{guest.totalStays} stays</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {isMobile ? (
        <Drawer open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
          <DrawerContent className="max-h-[85vh]">
            <DrawerHeader className="sr-only">
              <DrawerTitle>{selectedGuestDetail?.name || selectedGuestFromList?.name || "Guest Details"}</DrawerTitle>
              <DrawerDescription>Guest booking and conversation history</DrawerDescription>
            </DrawerHeader>
            {detailContent}
          </DrawerContent>
        </Drawer>
      ) : (
        <Sheet open={isDetailOpen} onOpenChange={(open) => !open && closeDetail()}>
          <SheetContent className="w-[420px] sm:max-w-[420px] p-0 overflow-hidden">
            <SheetTitle className="sr-only">{selectedGuestDetail?.name || selectedGuestFromList?.name || "Guest Details"}</SheetTitle>
            <SheetDescription className="sr-only">Guest booking and conversation history</SheetDescription>
            {detailContent}
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
