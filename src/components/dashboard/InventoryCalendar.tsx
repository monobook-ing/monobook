import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockRooms } from "@/data/mockData";
import { useIsMobile } from "@/hooks/use-mobile";

export function InventoryCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);
  const isMobile = useIsMobile();
  const dayCount = isMobile ? 7 : 14;
  const roomColWidth = isMobile ? 80 : 120;
  const minTableWidth = isMobile ? 420 : 700;

  const dates = useMemo(() => {
    const result: { label: string; value: string; dayNum: number; isToday: boolean }[] = [];
    const baseDate = new Date("2026-03-15");
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    for (let i = 0; i < dayCount; i++) {
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

  const statusColors: Record<string, string> = {
    confirmed: "bg-primary/80 text-primary-foreground",
    pending: "bg-accent text-accent-foreground",
    "ai-pending": "bg-success/70 text-success-foreground",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Inventory</h1>
          <p className="text-sm text-muted-foreground">Room availability calendar</p>
        </div>
        <div className="flex items-center gap-2">
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

      <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
        <div className="overflow-x-auto hide-scrollbar">
          <div style={{ minWidth: `${minTableWidth}px` }}>
            {/* Header */}
            <div className="grid" style={{ gridTemplateColumns: `${roomColWidth}px repeat(${dates.length}, 1fr)` }}>
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

            {/* Rooms */}
            {mockRooms.map((room) => (
              <div
                key={room.id}
                className="grid relative"
                style={{
                  gridTemplateColumns: `${roomColWidth}px repeat(${dates.length}, 1fr)`,
                  minHeight: isMobile ? "48px" : "52px",
                }}
              >
                <div className="p-2 md:p-3 border-b border-border flex flex-col justify-center">
                  <span className="text-xs md:text-sm font-medium text-card-foreground">{room.name}</span>
                  <span className="text-[10px] text-muted-foreground">{room.type}</span>
                </div>
                {dates.map((d) => (
                  <div key={d.value} className="border-b border-l border-border" />
                ))}
                {/* Booking blocks */}
                {room.bookings.map((b) => {
                  const span = getBookingSpan(b.checkIn, b.checkOut);
                  if (!span) return null;
                  const roomColPct = (roomColWidth / minTableWidth) * 100;
                  return (
                    <motion.div
                      key={b.id}
                      className={`absolute top-2 h-7 md:h-8 rounded-lg ${statusColors[b.status]} flex items-center px-1.5 md:px-2 text-[10px] md:text-xs font-medium truncate cursor-pointer`}
                      style={{
                        left: `calc(${roomColWidth}px + ${(span.start / dates.length) * (100 - roomColPct)}%)`,
                        width: `calc(${(span.span / dates.length) * (100 - roomColPct)}% - 4px)`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      title={`${b.guestName}: ${b.checkIn} → ${b.checkOut}`}
                    >
                      {b.guestName}
                    </motion.div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 mt-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-primary/80" />
          Confirmed
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-success/70" />
          AI Pending
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded bg-accent" />
          Pending
        </div>
      </div>
    </motion.div>
  );
}
