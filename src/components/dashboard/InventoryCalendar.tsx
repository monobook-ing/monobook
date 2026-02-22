import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { mockRooms } from "@/data/mockData";

export function InventoryCalendar() {
  const [weekOffset, setWeekOffset] = useState(0);

  const dates = useMemo(() => {
    const result: { label: string; value: string; dayNum: number; isToday: boolean }[] = [];
    const baseDate = new Date("2026-03-15");
    baseDate.setDate(baseDate.getDate() + weekOffset * 7);
    for (let i = 0; i < 14; i++) {
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
  }, [weekOffset]);

  const getBookingSpan = (checkIn: string, checkOut: string) => {
    const startIdx = dates.findIndex((d) => d.value === checkIn);
    const endIdx = dates.findIndex((d) => d.value === checkOut);
    if (startIdx === -1 && endIdx === -1) {
      // Check if booking spans entire visible range
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
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid" style={{ gridTemplateColumns: `120px repeat(${dates.length}, 1fr)` }}>
              <div className="p-3 border-b border-border" />
              {dates.map((d) => (
                <div
                  key={d.value}
                  className={`p-2 text-center border-b border-border ${d.isToday ? "bg-primary/5" : ""}`}
                >
                  <span className="text-[10px] text-muted-foreground block">{d.label}</span>
                  <span className={`text-sm font-semibold ${d.isToday ? "text-primary" : "text-card-foreground"}`}>
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
                  gridTemplateColumns: `120px repeat(${dates.length}, 1fr)`,
                  minHeight: "52px",
                }}
              >
                <div className="p-3 border-b border-border flex flex-col justify-center">
                  <span className="text-sm font-medium text-card-foreground">{room.name}</span>
                  <span className="text-[10px] text-muted-foreground">{room.type}</span>
                </div>
                {dates.map((d) => (
                  <div key={d.value} className="border-b border-l border-border" />
                ))}
                {/* Booking blocks */}
                {room.bookings.map((b) => {
                  const span = getBookingSpan(b.checkIn, b.checkOut);
                  if (!span) return null;
                  return (
                    <motion.div
                      key={b.id}
                      className={`absolute top-2 h-8 rounded-lg ${statusColors[b.status]} flex items-center px-2 text-xs font-medium truncate cursor-pointer`}
                      style={{
                        left: `calc(120px + ${(span.start / dates.length) * (100 - (120 / 700) * 100)}%)`,
                        width: `calc(${(span.span / dates.length) * (100 - (120 / 700) * 100)}% - 4px)`,
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
