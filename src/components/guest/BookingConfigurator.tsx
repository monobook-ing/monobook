import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Minus, Plus, Calendar } from "lucide-react";
import type { Property } from "@/data/mockData";
import { useMCPBridge } from "@/hooks/useMCPBridge";
import { formatCurrencyAmount } from "@/lib/currency";

interface BookingConfiguratorProps {
  property: Property;
  onClose: () => void;
  onConfirm: (config: { checkIn: string; checkOut: string; guests: number; nights: number }) => void;
}

const generateDates = () => {
  const dates: { label: string; value: string; day: string; month: string }[] = [];
  const today = new Date();
  for (let i = 0; i < 14; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    dates.push({
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      value: d.toISOString().split("T")[0],
      day: d.getDate().toString(),
      month: d.toLocaleDateString("en-US", { month: "short" }),
    });
  }
  return dates;
};

export function BookingConfigurator({ property, onClose, onConfirm }: BookingConfiguratorProps) {
  const dates = generateDates();
  const [checkInIdx, setCheckInIdx] = useState(2);
  const [checkOutIdx, setCheckOutIdx] = useState(5);
  const [guests, setGuests] = useState(2);
  const { updateModelContext } = useMCPBridge();

  const nights = checkOutIdx - checkInIdx;
  const total = nights * property.pricePerNight;

  const handleDateSelect = useCallback(
    (idx: number) => {
      if (checkInIdx === -1 || (checkInIdx !== -1 && checkOutIdx !== -1)) {
        setCheckInIdx(idx);
        setCheckOutIdx(-1);
      } else if (idx > checkInIdx) {
        setCheckOutIdx(idx);
        updateModelContext({
          selectedProperty: property.id,
          checkIn: dates[checkInIdx].value,
          checkOut: dates[idx].value,
          guests,
        });
      }
    },
    [checkInIdx, checkOutIdx, guests, property.id, dates, updateModelContext]
  );

  const handleGuestChange = (delta: number) => {
    const next = Math.max(1, Math.min(8, guests + delta));
    setGuests(next);
    updateModelContext({
      selectedProperty: property.id,
      checkIn: dates[checkInIdx]?.value,
      checkOut: dates[checkOutIdx]?.value,
      guests: next,
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-end justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <motion.div
          className="absolute inset-0 bg-foreground/20"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />
        <motion.div
          className="relative w-full max-w-lg glass-strong rounded-t-3xl p-6 pb-8 apple-shadow-lg"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          exit={{ y: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">{property.name}</h3>
              <p className="text-sm text-muted-foreground">{property.location}</p>
            </div>
            <motion.button
              className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center min-w-[44px] min-h-[44px]"
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
            >
              <X className="w-4 h-4 text-foreground" />
            </motion.button>
          </div>

          {/* Date Selector */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Select dates</span>
            </div>
            <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
              {dates.map((date, idx) => {
                const isCheckIn = idx === checkInIdx;
                const isCheckOut = idx === checkOutIdx;
                const isInRange = checkInIdx !== -1 && checkOutIdx !== -1 && idx > checkInIdx && idx < checkOutIdx;
                const isSelected = isCheckIn || isCheckOut;

                return (
                  <motion.button
                    key={date.value}
                    className={`flex flex-col items-center px-3 py-2 rounded-xl min-w-[52px] min-h-[44px] transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : isInRange
                        ? "bg-primary/10 text-primary"
                        : "bg-secondary text-foreground"
                    }`}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDateSelect(idx)}
                  >
                    <span className="text-[10px] font-medium opacity-70">{date.label}</span>
                    <span className="text-base font-semibold">{date.day}</span>
                    <span className="text-[10px] opacity-70">{date.month}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Guest Counter */}
          <div className="flex items-center justify-between mb-6 p-4 rounded-2xl bg-secondary">
            <span className="text-sm font-medium text-foreground">Guests</span>
            <div className="flex items-center gap-4">
              <motion.button
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center min-w-[44px] min-h-[44px]"
                whileTap={{ scale: 0.9 }}
                onClick={() => handleGuestChange(-1)}
                disabled={guests <= 1}
              >
                <Minus className="w-4 h-4 text-foreground" />
              </motion.button>
              <span className="text-lg font-semibold text-foreground w-6 text-center">{guests}</span>
              <motion.button
                className="w-9 h-9 rounded-full border border-border flex items-center justify-center min-w-[44px] min-h-[44px]"
                whileTap={{ scale: 0.9 }}
                onClick={() => handleGuestChange(1)}
                disabled={guests >= 8}
              >
                <Plus className="w-4 h-4 text-foreground" />
              </motion.button>
            </div>
          </div>

          {/* Summary & Confirm */}
          {nights > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="flex justify-between text-sm mb-4">
                <span className="text-muted-foreground">
                  {formatCurrencyAmount(
                    property.pricePerNight,
                    property.currencyDisplay,
                    property.currencyCode
                  )}{" "}
                  × {nights} nights
                </span>
                <span className="font-semibold text-foreground">
                  {formatCurrencyAmount(
                    total,
                    property.currencyDisplay,
                    property.currencyCode
                  )}
                </span>
              </div>
              <motion.button
                className="w-full py-3.5 rounded-full bg-primary text-primary-foreground font-semibold text-base min-h-[44px]"
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  onConfirm({
                    checkIn: dates[checkInIdx].value,
                    checkOut: dates[checkOutIdx].value,
                    guests,
                    nights,
                  })
                }
              >
                Continue —{" "}
                {formatCurrencyAmount(
                  total,
                  property.currencyDisplay,
                  property.currencyCode
                )}
              </motion.button>
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
