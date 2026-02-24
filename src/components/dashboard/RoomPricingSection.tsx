import { useState } from "react";
import { format, addMonths, isBefore, startOfDay } from "date-fns";
import { DayPicker } from "react-day-picker";
import { CalendarDays, Plus, Pencil, Trash2, X, Check, DollarSign, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import type { RoomPricing, GuestTier } from "@/data/mockRoomData";

interface RoomPricingSectionProps {
  pricing: RoomPricing;
  basePrice: number;
  maxGuests: number;
  onPricingChange: (pricing: RoomPricing) => void;
  onBasePriceChange: (price: number) => void;
  readOnly?: boolean;
}

export function RoomPricingSection({
  pricing,
  basePrice,
  maxGuests,
  onPricingChange,
  onBasePriceChange,
  readOnly = false,
}: RoomPricingSectionProps) {
  const [editingBase, setEditingBase] = useState(false);
  const [baseDraft, setBaseDraft] = useState(String(basePrice));
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [dayPriceDraft, setDayPriceDraft] = useState("");
  const [addingTier, setAddingTier] = useState(false);
  const [tierDraft, setTierDraft] = useState({ min: "", max: "", price: "" });
  const [editingTierId, setEditingTierId] = useState<number | null>(null);
  const [editTierDraft, setEditTierDraft] = useState({ min: "", max: "", price: "" });

  const today = startOfDay(new Date());
  const twoMonthsLater = addMonths(today, 2);

  const hasPricingOverrides = Object.keys(pricing.dateOverrides).length > 0 || pricing.guestTiers.length > 0;

  // Calendar day rendering
  const overrideDates = Object.keys(pricing.dateOverrides).map((d) => new Date(d + "T00:00:00"));

  const handleDayClick = (day: Date) => {
    if (readOnly) return;
    if (isBefore(day, today)) return;
    const key = format(day, "yyyy-MM-dd");
    setSelectedDay(day);
    setDayPriceDraft(pricing.dateOverrides[key] ? String(pricing.dateOverrides[key]) : "");
  };

  const saveDayPrice = () => {
    if (!selectedDay) return;
    const key = format(selectedDay, "yyyy-MM-dd");
    const price = Number(dayPriceDraft);
    if (!price || price <= 0) return;
    onPricingChange({
      ...pricing,
      dateOverrides: { ...pricing.dateOverrides, [key]: price },
    });
    setSelectedDay(null);
  };

  const removeDayOverride = () => {
    if (!selectedDay) return;
    const key = format(selectedDay, "yyyy-MM-dd");
    const { [key]: _, ...rest } = pricing.dateOverrides;
    onPricingChange({ ...pricing, dateOverrides: rest });
    setSelectedDay(null);
  };

  const addTier = () => {
    const min = Number(tierDraft.min);
    const max = Number(tierDraft.max);
    const price = Number(tierDraft.price);
    if (!min || !max || !price || min > max || min < 1) return;
    onPricingChange({
      ...pricing,
      guestTiers: [...pricing.guestTiers, { minGuests: min, maxGuests: max, pricePerNight: price }].sort((a, b) => a.minGuests - b.minGuests),
    });
    setTierDraft({ min: "", max: "", price: "" });
    setAddingTier(false);
  };

  const deleteTier = (idx: number) => {
    onPricingChange({ ...pricing, guestTiers: pricing.guestTiers.filter((_, i) => i !== idx) });
  };

  const saveEditTier = (idx: number) => {
    const min = Number(editTierDraft.min);
    const max = Number(editTierDraft.max);
    const price = Number(editTierDraft.price);
    if (!min || !max || !price || min > max || min < 1) return;
    const updated = [...pricing.guestTiers];
    updated[idx] = { minGuests: min, maxGuests: max, pricePerNight: price };
    onPricingChange({ ...pricing, guestTiers: updated.sort((a, b) => a.minGuests - b.minGuests) });
    setEditingTierId(null);
  };

  return (
    <div className="border rounded-xl p-4 space-y-4">
      <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
        <DollarSign className="w-3.5 h-3.5" /> Pricing
      </h4>

      {/* Base price */}
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Base price</span>
        {editingBase && !readOnly ? (
          <div className="flex items-center gap-1.5">
            <span className="text-sm text-muted-foreground">$</span>
            <Input
              type="number"
              value={baseDraft}
              onChange={(e) => setBaseDraft(e.target.value)}
              className="w-20 h-7 text-sm rounded-lg"
              autoFocus
            />
            <span className="text-sm text-muted-foreground">/night</span>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { onBasePriceChange(Number(baseDraft) || basePrice); setEditingBase(false); }}>
              <Check className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditingBase(false)}>
              <X className="w-3.5 h-3.5" />
            </Button>
          </div>
        ) : (
          <button
            disabled={readOnly}
            onClick={() => { setBaseDraft(String(basePrice)); setEditingBase(true); }}
            className="text-sm font-semibold text-foreground hover:text-primary transition-colors disabled:cursor-not-allowed disabled:text-muted-foreground"
          >
            ${basePrice}/night <Pencil className="w-3 h-3 inline ml-1 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Calendar */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
          <CalendarDays className="w-3.5 h-3.5" />
          {readOnly ? "Date overrides" : "Date overrides — click a day to set custom price"}
        </p>
        <Popover
          open={!readOnly && !!selectedDay}
          onOpenChange={(o) => { if (!o) setSelectedDay(null); }}
        >
          <PopoverTrigger asChild>
            <div className="w-full">
              <DayPicker
                mode="single"
                numberOfMonths={2}
                defaultMonth={today}
                fromDate={today}
                toDate={twoMonthsLater}
                className="w-full p-2 pointer-events-auto text-xs"
                classNames={{
                  months: "w-full flex flex-col sm:flex-row gap-2",
                  month: "w-full space-y-2 sm:w-auto",
                  caption: "flex justify-center pt-1 relative items-center",
                  caption_label: "text-xs font-medium",
                  nav: "space-x-1 flex items-center",
                  nav_button: cn(buttonVariants({ variant: "outline" }), "h-6 w-6 bg-transparent p-0 opacity-50 hover:opacity-100"),
                  nav_button_previous: "absolute left-0",
                  nav_button_next: "absolute right-0",
                  table: "w-full border-collapse",
                  head_row: "grid grid-cols-7",
                  head_cell: "text-muted-foreground rounded-md w-full sm:w-8 font-normal text-[0.65rem] text-center",
                  row: "grid grid-cols-7 w-full mt-1",
                  cell: "h-10 w-full sm:w-8 text-center text-[0.65rem] p-0 relative",
                  day: cn(buttonVariants({ variant: "ghost" }), "h-10 w-full sm:w-8 p-0 font-normal text-[0.65rem] flex flex-col items-center justify-center gap-0"),
                  day_selected: "bg-primary text-primary-foreground hover:bg-primary",
                  day_today: "bg-accent text-accent-foreground",
                  day_outside: "text-muted-foreground opacity-50",
                  day_disabled: "text-muted-foreground opacity-30",
                }}
                modifiers={{
                  override: overrideDates,
                }}
                modifiersClassNames={{
                  override: "bg-primary/15 text-primary font-semibold rounded-md",
                }}
                onDayClick={handleDayClick}
                components={{
                  DayContent: ({ date }) => {
                    const key = format(date, "yyyy-MM-dd");
                    const override = pricing.dateOverrides[key];
                    return (
                      <div className="flex flex-col items-center leading-none">
                        <span>{date.getDate()}</span>
                        {override && <span className="text-[0.5rem] text-primary font-bold">${override}</span>}
                      </div>
                    );
                  },
                }}
              />
            </div>
          </PopoverTrigger>
          {!readOnly && selectedDay && (
            <PopoverContent className="w-56 p-3 space-y-2" side="top" align="center">
              <p className="text-xs font-medium text-foreground">{format(selectedDay, "EEEE, MMM d, yyyy")}</p>
              <p className="text-xs text-muted-foreground">Base: ${basePrice}/night</p>
              <div className="flex items-center gap-1.5">
                <span className="text-sm">$</span>
                <Input
                  type="number"
                  placeholder={String(basePrice)}
                  value={dayPriceDraft}
                  onChange={(e) => setDayPriceDraft(e.target.value)}
                  className="h-7 text-sm rounded-lg"
                  autoFocus
                />
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" className="flex-1 h-7 text-xs rounded-lg" onClick={saveDayPrice}>Save</Button>
                {pricing.dateOverrides[format(selectedDay, "yyyy-MM-dd")] && (
                  <Button size="sm" variant="outline" className="h-7 text-xs rounded-lg" onClick={removeDayOverride}>Remove</Button>
                )}
              </div>
            </PopoverContent>
          )}
        </Popover>
      </div>

      {/* Guest tiers */}
      <div>
        <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Guest pricing</p>
        <div className="space-y-1.5">
          {pricing.guestTiers.map((tier, idx) => (
            <div key={idx} className="flex items-center justify-between text-sm bg-muted/50 rounded-lg px-3 py-1.5">
              {editingTierId === idx ? (
                <div className="flex items-center gap-1.5 flex-1">
                  <Input type="number" value={editTierDraft.min} onChange={(e) => setEditTierDraft((d) => ({ ...d, min: e.target.value }))} className="w-12 h-6 text-xs rounded" placeholder="Min" />
                  <span className="text-xs text-muted-foreground">–</span>
                  <Input type="number" value={editTierDraft.max} onChange={(e) => setEditTierDraft((d) => ({ ...d, max: e.target.value }))} className="w-12 h-6 text-xs rounded" placeholder="Max" />
                  <span className="text-xs text-muted-foreground">guests $</span>
                  <Input type="number" value={editTierDraft.price} onChange={(e) => setEditTierDraft((d) => ({ ...d, price: e.target.value }))} className="w-16 h-6 text-xs rounded" placeholder="Price" />
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => saveEditTier(idx)}><Check className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setEditingTierId(null)}><X className="w-3 h-3" /></Button>
                </div>
              ) : (
                <>
                  <span className="text-muted-foreground">{tier.minGuests}–{tier.maxGuests} guests</span>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">${tier.pricePerNight}/night</span>
                    <Button size="icon" variant="ghost" className="h-5 w-5" disabled={readOnly} onClick={() => { setEditingTierId(idx); setEditTierDraft({ min: String(tier.minGuests), max: String(tier.maxGuests), price: String(tier.pricePerNight) }); }}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-5 w-5 text-destructive" disabled={readOnly} onClick={() => deleteTier(idx)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {!readOnly && addingTier ? (
            <div className="flex items-center gap-1.5 bg-muted/50 rounded-lg px-3 py-1.5">
              <Input type="number" value={tierDraft.min} onChange={(e) => setTierDraft((d) => ({ ...d, min: e.target.value }))} className="w-12 h-6 text-xs rounded" placeholder="Min" />
              <span className="text-xs text-muted-foreground">–</span>
              <Input type="number" value={tierDraft.max} onChange={(e) => setTierDraft((d) => ({ ...d, max: e.target.value }))} className="w-12 h-6 text-xs rounded" placeholder="Max" />
              <span className="text-xs text-muted-foreground">guests $</span>
              <Input type="number" value={tierDraft.price} onChange={(e) => setTierDraft((d) => ({ ...d, price: e.target.value }))} className="w-16 h-6 text-xs rounded" placeholder="Price" />
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={addTier}><Check className="w-3 h-3" /></Button>
              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setAddingTier(false)}><X className="w-3 h-3" /></Button>
            </div>
          ) : !readOnly ? (
            <Button variant="ghost" size="sm" className="text-xs gap-1 h-7 rounded-lg" onClick={() => setAddingTier(true)}>
              <Plus className="w-3 h-3" /> Add tier
            </Button>
          ) : null
          }
        </div>
      </div>
    </div>
  );
}

export function hasOverrides(pricing?: RoomPricing): boolean {
  if (!pricing) return false;
  return Object.keys(pricing.dateOverrides).length > 0 || pricing.guestTiers.length > 0;
}
