import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { mockServices } from "@/data/mockServiceData";
import { Clock, Plus, Minus } from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  serviceId: string | null;
}

export function GuestPreviewModal({ open, onOpenChange, serviceId }: Props) {
  const service = mockServices.find((s) => s.id === serviceId);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [qty, setQty] = useState(1);

  if (!service) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl p-0 overflow-hidden">
        <div className="relative">
          <img
            src={service.imageUrl}
            alt={service.name}
            className="w-full h-44 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <div className="absolute bottom-3 left-4 right-4">
            <p className="text-white font-semibold text-lg leading-tight">{service.name}</p>
            <p className="text-white/80 text-xs mt-0.5">{service.shortDescription}</p>
          </div>
        </div>
        <div className="p-4 space-y-4">
          <DialogHeader className="p-0">
            <DialogTitle className="sr-only">{service.name}</DialogTitle>
            <DialogDescription className="sr-only">Guest preview of {service.name}</DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-foreground">${service.price}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {service.pricingType.replace("_", " ")}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-xl border p-1">
              <button
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                onClick={() => setQty(Math.max(1, qty - 1))}
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium w-6 text-center">{qty}</span>
              <button
                className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center"
                onClick={() => setQty(qty + 1)}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {service.slots && service.slots.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">Select a time</p>
              <div className="grid grid-cols-2 gap-2">
                {service.slots.map((sl) => {
                  const full = sl.booked >= sl.capacity;
                  return (
                    <button
                      key={sl.id}
                      disabled={full}
                      onClick={() => setSelectedSlot(sl.id)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm transition-colors ${
                        full
                          ? "opacity-40 cursor-not-allowed bg-muted"
                          : selectedSlot === sl.id
                          ? "border-primary bg-primary/5 text-primary"
                          : "hover:bg-muted"
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {sl.time}
                      {full && <span className="text-[10px] text-destructive ml-auto">Full</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Button className="w-full rounded-xl" size="lg">
            Add to Booking — ${service.price * qty}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
