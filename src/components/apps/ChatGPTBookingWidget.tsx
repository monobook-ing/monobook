import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle2, Loader2 } from "lucide-react";

import { AgenticCheckout } from "@/components/guest/AgenticCheckout";
import { BookingConfigurator } from "@/components/guest/BookingConfigurator";
import { PropertyCarousel } from "@/components/guest/PropertyCarousel";
import type { Property } from "@/data/mockData";
import { useMCPBridge } from "@/hooks/useMCPBridge";

type WidgetMode = "search_rooms" | "check_availability" | "create_booking";
type WidgetStep = "browse" | "configure" | "checkout" | "complete";

type MCPRoom = {
  id: string;
  property_id?: string;
  name: string;
  type?: string;
  description?: string;
  price_per_night?: string | number;
  max_guests?: number;
  amenities?: string[];
  images?: string[];
  location?: string;
  rating?: number;
  ai_match_score?: number;
};

type MCPStructuredPayload = {
  property_id?: string;
  rooms?: MCPRoom[];
  room?: MCPRoom;
  available?: boolean;
  check_in?: string;
  check_out?: string;
  booking_id?: string;
  guest_name?: string;
  total?: number;
  message?: string;
  error?: string;
};

type ConfirmationState = {
  bookingId: string;
  guestName?: string;
  checkIn?: string;
  checkOut?: string;
  total?: number;
};

type OpenAIWithState = {
  callTool?: (name: string, args?: Record<string, unknown>) => Promise<unknown>;
  getInitialState?: () => Promise<unknown> | unknown;
  getState?: () => Promise<unknown> | unknown;
  getContext?: () => Promise<unknown> | unknown;
  getToolOutput?: () => Promise<unknown> | unknown;
  toolOutput?: unknown;
  output?: unknown;
};

declare global {
  interface Window {
    openai?: OpenAIWithState;
  }
}

const WIDGET_MODES: WidgetMode[] = [
  "search_rooms",
  "check_availability",
  "create_booking",
];

const toWidgetMode = (value: string | null | undefined): WidgetMode => {
  if (value && WIDGET_MODES.includes(value as WidgetMode)) {
    return value as WidgetMode;
  }
  return "search_rooms";
};

const parseJson = (value: string | null): unknown => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const extractStructuredContent = (payload: unknown): MCPStructuredPayload | null => {
  if (!payload || typeof payload !== "object") return null;
  const data = payload as Record<string, unknown>;

  if (data.structuredContent && typeof data.structuredContent === "object") {
    return data.structuredContent as MCPStructuredPayload;
  }
  if (data.result && typeof data.result === "object") {
    const nested = data.result as Record<string, unknown>;
    if (nested.structuredContent && typeof nested.structuredContent === "object") {
      return nested.structuredContent as MCPStructuredPayload;
    }
  }
  if (
    Object.prototype.hasOwnProperty.call(data, "rooms") ||
    Object.prototype.hasOwnProperty.call(data, "room") ||
    Object.prototype.hasOwnProperty.call(data, "booking_id")
  ) {
    return data as MCPStructuredPayload;
  }
  return null;
};

const bootstrapFromScript = (): { widget: WidgetMode; payload?: MCPStructuredPayload } => {
  const node = document.getElementById("monobook-widget-bootstrap");
  const fromScript = parseJson(node?.textContent ?? null) as
    | { widget?: string; payload?: unknown }
    | null;
  const query = new URLSearchParams(window.location.search);
  const queryWidget = query.get("widget");
  const queryPayload = parseJson(query.get("payload"));

  const widget = toWidgetMode(fromScript?.widget ?? queryWidget ?? "search_rooms");
  const payload =
    extractStructuredContent(fromScript?.payload) ??
    extractStructuredContent(queryPayload);

  return { widget, payload: payload ?? undefined };
};

const mapRoomToProperty = (room: MCPRoom, index: number): Property => {
  const price = Number(room.price_per_night ?? 0);
  const fallbackImage = `hotel-${(index % 4) + 1}`;

  return {
    id: room.id,
    name: room.name,
    location: room.location ?? "Selected property",
    pricePerNight: Number.isFinite(price) ? price : 0,
    rating: Number(room.rating ?? 4.8),
    aiMatchScore: Number(room.ai_match_score ?? Math.max(80, 98 - index * 3)),
    image: room.images?.[0] || fallbackImage,
    amenities: room.amenities ?? [],
    roomType: room.type ?? "Room",
  };
};

const isoDateDistance = (checkIn?: string, checkOut?: string): number => {
  if (!checkIn || !checkOut) return 1;
  const ci = new Date(checkIn);
  const co = new Date(checkOut);
  if (Number.isNaN(ci.getTime()) || Number.isNaN(co.getTime())) return 1;
  const days = Math.floor((co.getTime() - ci.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(days, 1);
};

export function ChatGPTBookingWidget() {
  const { callTool } = useMCPBridge();

  const [{ widget, payload: bootstrapPayload }] = useState(() => bootstrapFromScript());
  const [payload, setPayload] = useState<MCPStructuredPayload | null>(
    bootstrapPayload ?? null
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [roomById, setRoomById] = useState<Record<string, MCPRoom>>({});
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingConfig, setBookingConfig] = useState<{
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
  } | null>(null);
  const [confirmation, setConfirmation] = useState<ConfirmationState | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<WidgetStep>("browse");

  const loadInitialFromBridge = useCallback(async () => {
    const bridge = window.openai;
    if (!bridge) return null;

    const candidates: unknown[] = [bridge.toolOutput, bridge.output];
    for (const methodName of ["getInitialState", "getState", "getContext", "getToolOutput"]) {
      const candidateMethod = bridge[methodName as keyof OpenAIWithState];
      if (typeof candidateMethod === "function") {
        try {
          candidates.push(await candidateMethod.call(bridge));
        } catch {
          // Ignore bridge method failures and continue with fallbacks.
        }
      }
    }

    for (const candidate of candidates) {
      const extracted = extractStructuredContent(candidate);
      if (extracted) return extracted;
    }
    return null;
  }, []);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (bootstrapPayload) return;
      const bridgePayload = await loadInitialFromBridge();
      if (!cancelled && bridgePayload) {
        setPayload(bridgePayload);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [bootstrapPayload, loadInitialFromBridge]);

  useEffect(() => {
    if (!payload) return;

    const rooms = payload.rooms ?? (payload.room ? [payload.room] : []);
    const roomMap = Object.fromEntries(rooms.map((room) => [room.id, room]));
    setRoomById(roomMap);
    setProperties(rooms.map(mapRoomToProperty));

    if (payload.error) {
      setError(payload.error);
    }

    if (payload.booking_id) {
      setConfirmation({
        bookingId: payload.booking_id,
        guestName: payload.guest_name,
        checkIn: payload.check_in,
        checkOut: payload.check_out,
        total: payload.total,
      });
      setStep("complete");
      return;
    }

    if (widget === "check_availability" && payload.available === false) {
      setError("Selected room is unavailable for those dates. Try different dates.");
    }
  }, [payload, widget]);

  const selectedRoom = useMemo(
    () => (selectedProperty ? roomById[selectedProperty.id] : null),
    [selectedProperty, roomById]
  );

  const handleSelectProperty = useCallback((property: Property) => {
    setError(null);
    setSelectedProperty(property);
    setStep("configure");
  }, []);

  const handleConfirmConfig = useCallback(
    async (config: { checkIn: string; checkOut: string; guests: number; nights: number }) => {
      if (!selectedProperty) return;
      const room = roomById[selectedProperty.id];
      if (!room) {
        setError("Room details are missing. Please re-run search.");
        return;
      }
      const propertyId = room.property_id ?? payload?.property_id;
      if (!propertyId) {
        setError("property_id is required for availability checks.");
        return;
      }

      setIsBusy(true);
      setError(null);

      try {
        const availabilityRaw = await callTool("check_availability", {
          property_id: propertyId,
          room_id: room.id,
          check_in: config.checkIn,
          check_out: config.checkOut,
        });
        const availability = extractStructuredContent(availabilityRaw) ?? {};
        if (availability.available === false) {
          setError("This room is unavailable for selected dates. Pick different dates.");
          setStep("configure");
          return;
        }

        setBookingConfig(config);
        setStep("checkout");
      } catch (availabilityError) {
        setError(
          availabilityError instanceof Error
            ? availabilityError.message
            : "Availability check failed."
        );
      } finally {
        setIsBusy(false);
      }
    },
    [callTool, payload?.property_id, roomById, selectedProperty]
  );

  const handleCreateBooking = useCallback(
    async ({
      total,
      bookingConfig: checkoutConfig,
    }: {
      property: Property;
      bookingConfig: { checkIn: string; checkOut: string; guests: number; nights: number };
      total: number;
    }) => {
      if (!selectedRoom) {
        throw new Error("No room selected.");
      }

      const propertyId = selectedRoom.property_id ?? payload?.property_id;
      if (!propertyId) {
        throw new Error("property_id is required to create booking.");
      }

      const bookingRaw = await callTool("create_booking", {
        property_id: propertyId,
        room_id: selectedRoom.id,
        guest_name: "ChatGPT Guest",
        check_in: checkoutConfig.checkIn,
        check_out: checkoutConfig.checkOut,
        guest_email: null,
        guests: checkoutConfig.guests,
      });
      const bookingResult = extractStructuredContent(bookingRaw) ?? {};

      if (bookingResult.error) {
        throw new Error(String(bookingResult.error));
      }
      if (!bookingResult.booking_id) {
        throw new Error("Booking failed: missing booking ID.");
      }

      const confirmationId = `AH-${String(bookingResult.booking_id).slice(0, 8).toUpperCase()}`;
      setConfirmation({
        bookingId: String(bookingResult.booking_id),
        guestName: String(bookingResult.guest_name ?? "ChatGPT Guest"),
        checkIn: String(bookingResult.check_in ?? checkoutConfig.checkIn),
        checkOut: String(bookingResult.check_out ?? checkoutConfig.checkOut),
        total: Number(bookingResult.total ?? total),
      });

      return {
        confirmationId,
        total: Number(bookingResult.total ?? total),
      };
    },
    [callTool, payload?.property_id, selectedRoom]
  );

  const resetToBrowse = useCallback(() => {
    setStep("browse");
    setSelectedProperty(null);
    setBookingConfig(null);
    setError(null);
  }, []);

  return (
    <motion.div
      className="min-h-[420px] bg-background p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="max-w-2xl mx-auto">
        {step === "complete" && confirmation ? (
          <BookingCompleteCard
            confirmation={confirmation}
            onBookAnother={resetToBrowse}
          />
        ) : (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Find your stay</h2>
            <p className="text-sm text-muted-foreground mb-4">AI-curated properties just for you</p>

            {error && (
              <div className="rounded-xl border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive mb-3">
                {error}
              </div>
            )}

            {(step === "browse" || step === "configure") && (
              <PropertyCarousel
                properties={properties}
                onSelect={handleSelectProperty}
                title={widget === "search_rooms" ? "Recommended for you" : "Room options"}
              />
            )}

            {step === "checkout" && selectedProperty && bookingConfig && (
              <AgenticCheckout
                property={selectedProperty}
                bookingConfig={bookingConfig}
                onPay={handleCreateBooking}
                onComplete={() => setStep("complete")}
              />
            )}

            {step === "configure" && selectedProperty && (
              <BookingConfigurator
                property={selectedProperty}
                onClose={() => setStep("browse")}
                onConfirm={handleConfirmConfig}
              />
            )}

            {isBusy && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" />
                Working...
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
}

function BookingCompleteCard({
  confirmation,
  onBookAnother,
}: {
  confirmation: ConfirmationState;
  onBookAnother: () => void;
}) {
  const previewId = `AH-${confirmation.bookingId.slice(0, 8).toUpperCase()}`;
  const nights = isoDateDistance(confirmation.checkIn, confirmation.checkOut);

  return (
    <motion.div
      className="rounded-2xl bg-card apple-shadow-lg p-8 text-center"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-16 h-16 rounded-full bg-success/20 text-success mx-auto flex items-center justify-center mb-4">
        <CheckCircle2 className="w-8 h-8" />
      </div>
      <h3 className="text-2xl font-semibold text-card-foreground">Booking Confirmed!</h3>
      <p className="text-sm text-muted-foreground mt-1">
        Confirmation ID: {previewId}
      </p>
      <div className="mt-5 text-sm text-muted-foreground space-y-1">
        {confirmation.guestName && <p>Guest: {confirmation.guestName}</p>}
        {confirmation.checkIn && confirmation.checkOut && (
          <p>
            {confirmation.checkIn} → {confirmation.checkOut} ({nights} nights)
          </p>
        )}
        {typeof confirmation.total === "number" && (
          <p className="text-base font-semibold text-foreground">
            ${confirmation.total.toLocaleString()}
          </p>
        )}
      </div>
      <button
        className="mt-6 px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium min-h-[44px]"
        onClick={onBookAnother}
      >
        Book another room
      </button>
    </motion.div>
  );
}

