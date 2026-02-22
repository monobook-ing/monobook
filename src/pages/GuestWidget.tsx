import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PropertyCarousel } from "@/components/guest/PropertyCarousel";
import { BookingConfigurator } from "@/components/guest/BookingConfigurator";
import { AgenticCheckout } from "@/components/guest/AgenticCheckout";
import type { Property } from "@/data/mockData";

type WidgetStep = "browse" | "configure" | "checkout" | "complete";

export default function GuestWidget() {
  const [step, setStep] = useState<WidgetStep>("browse");
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [bookingConfig, setBookingConfig] = useState<{
    checkIn: string;
    checkOut: string;
    guests: number;
    nights: number;
  } | null>(null);

  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
    setStep("configure");
  };

  const handleConfirmConfig = (config: { checkIn: string; checkOut: string; guests: number; nights: number }) => {
    setBookingConfig(config);
    setStep("checkout");
  };

  const handleComplete = () => {
    setStep("browse");
    setSelectedProperty(null);
    setBookingConfig(null);
  };

  return (
    <motion.div
      className="min-h-screen bg-background p-4 md:p-6"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Find your stay</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-curated properties just for you</p>
        </div>

        <AnimatePresence mode="wait">
          {(step === "browse" || step === "configure") && (
            <motion.div key="carousel" exit={{ opacity: 0 }}>
              <PropertyCarousel onSelect={handleSelectProperty} />
            </motion.div>
          )}

          {step === "checkout" && selectedProperty && bookingConfig && (
            <motion.div
              key="checkout"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <AgenticCheckout
                property={selectedProperty}
                bookingConfig={bookingConfig}
                onComplete={handleComplete}
              />
            </motion.div>
          )}

          {step === "complete" && (
            <motion.div
              key="complete"
              className="text-center py-12"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <p className="text-lg font-semibold text-foreground">All set! 🎉</p>
            </motion.div>
          )}
        </AnimatePresence>

        {step === "configure" && selectedProperty && (
          <BookingConfigurator
            property={selectedProperty}
            onClose={() => setStep("browse")}
            onConfirm={handleConfirmConfig}
          />
        )}
      </div>
    </motion.div>
  );
}
