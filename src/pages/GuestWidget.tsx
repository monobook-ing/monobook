import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, LayoutGrid } from "lucide-react";
import { PropertyCarousel } from "@/components/guest/PropertyCarousel";
import { BookingConfigurator } from "@/components/guest/BookingConfigurator";
import { AgenticCheckout } from "@/components/guest/AgenticCheckout";
import { ChatInterface } from "@/components/guest/ChatInterface";
import type { Property } from "@/data/mockData";

type WidgetStep = "browse" | "configure" | "checkout" | "complete";
type WidgetMode = "browse" | "chat";
const FALLBACK_PROPERTY_ID = "0ac2986f-53d8-4f5f-b217-4e133c7a0d82";

export default function GuestWidget() {
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get("propertyId");

  const [mode, setMode] = useState<WidgetMode>("chat");
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

          {/* Mode Toggle */}
          <div className="flex gap-1 mt-4 p-1 bg-secondary rounded-full w-fit">
            <button
              onClick={() => setMode("browse")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === "browse"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              Browse
            </button>
            <button
              onClick={() => setMode("chat")}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                mode === "chat"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Chat with AI
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {mode === "chat" ? (
            <motion.div
              key="chat-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {propertyId ? (
                <ChatInterface propertyId={propertyId} />
              ) : (
                <ChatInterface propertyId={FALLBACK_PROPERTY_ID} />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="browse-mode"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              {(step === "browse" || step === "configure") && (
                <PropertyCarousel onSelect={handleSelectProperty} />
              )}

              {step === "checkout" && selectedProperty && bookingConfig && (
                <AgenticCheckout
                  property={selectedProperty}
                  bookingConfig={bookingConfig}
                  onComplete={handleComplete}
                />
              )}

              {step === "complete" && (
                <div className="text-center py-12">
                  <p className="text-lg font-semibold text-foreground">All set!</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {mode === "browse" && step === "configure" && selectedProperty && (
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
