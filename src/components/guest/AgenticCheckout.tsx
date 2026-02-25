import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2, Shield, CreditCard } from "lucide-react";
import type { Property } from "@/data/mockData";
import { useMCPBridge } from "@/hooks/useMCPBridge";
import { formatCurrencyAmount } from "@/lib/currency";

type CheckoutResult = {
  confirmationId?: string;
  total?: number;
  message?: string;
};

interface AgenticCheckoutProps {
  property: Property;
  bookingConfig: { checkIn: string; checkOut: string; guests: number; nights: number };
  onComplete: () => void;
  paymentToolName?: string;
  onPay?: (payload: {
    property: Property;
    bookingConfig: { checkIn: string; checkOut: string; guests: number; nights: number };
    total: number;
  }) => Promise<CheckoutResult | void> | CheckoutResult | void;
}

export function AgenticCheckout({
  property,
  bookingConfig,
  onComplete,
  paymentToolName = "stripe/create-payment-intent",
  onPay,
}: AgenticCheckoutProps) {
  const [status, setStatus] = useState<"review" | "processing" | "success">("review");
  const [error, setError] = useState<string | null>(null);
  const [resolvedTotal, setResolvedTotal] = useState<number | null>(null);
  const [resolvedConfirmationId, setResolvedConfirmationId] = useState<string | null>(null);
  const { callTool } = useMCPBridge();

  const subtotal = property.pricePerNight * bookingConfig.nights;
  const taxes = Math.round(subtotal * 0.12);
  const fees = Math.round(subtotal * 0.04);
  const total = subtotal + taxes + fees;

  const fallbackConfirmationIdRef = useRef(
    `AH-${Date.now().toString(36).toUpperCase().slice(-6)}`
  );

  const handlePay = async () => {
    setError(null);
    setStatus("processing");
    try {
      let checkoutResult: CheckoutResult | void;

      if (onPay) {
        checkoutResult = await onPay({
          property,
          bookingConfig,
          total,
        });
      } else {
        await Promise.resolve(
          callTool(paymentToolName, {
            amount: total,
            currency: (property.currencyCode ?? "USD").toLowerCase(),
          })
        );
        await new Promise((resolve) => setTimeout(resolve, 2200));
      }

      const nextTotal = (checkoutResult && "total" in checkoutResult ? checkoutResult.total : undefined) ?? total;
      const nextConfirmationId =
        (checkoutResult && "confirmationId" in checkoutResult ? checkoutResult.confirmationId : undefined) ?? fallbackConfirmationIdRef.current;

      setResolvedTotal(nextTotal);
      setResolvedConfirmationId(nextConfirmationId);
      setStatus("success");
    } catch (payError) {
      setStatus("review");
      setError(
        payError instanceof Error
          ? payError.message
          : "Payment failed. Please try again."
      );
    }
  };

  return (
    <motion.div
      className="rounded-2xl bg-card apple-shadow-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        {status === "review" && (
          <motion.div key="review" className="p-6" exit={{ opacity: 0 }}>
            <h3 className="text-lg font-semibold text-card-foreground mb-1">Booking Summary</h3>
            <p className="text-sm text-muted-foreground mb-5">
              {property.name} · {bookingConfig.nights} nights · {bookingConfig.guests} guests
            </p>

            <div className="space-y-3 mb-5">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="text-card-foreground">
                  {formatCurrencyAmount(
                    subtotal,
                    property.currencyDisplay,
                    property.currencyCode
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Taxes (12%)</span>
                <span className="text-card-foreground">
                  {formatCurrencyAmount(
                    taxes,
                    property.currencyDisplay,
                    property.currencyCode
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Service fee</span>
                <span className="text-card-foreground">
                  {formatCurrencyAmount(
                    fees,
                    property.currencyDisplay,
                    property.currencyCode
                  )}
                </span>
              </div>
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="font-semibold text-card-foreground">Total</span>
                <span className="text-xl font-bold text-card-foreground">
                  {formatCurrencyAmount(
                    total,
                    property.currencyDisplay,
                    property.currencyCode
                  )}
                </span>
              </div>
            </div>

            <motion.button
              className="w-full py-3.5 rounded-full bg-foreground text-background font-semibold text-base min-h-[44px] flex items-center justify-center gap-2"
              whileTap={{ scale: 0.95 }}
              onClick={handlePay}
            >
              <CreditCard className="w-4 h-4" />
              Pay securely
            </motion.button>
            {error && (
              <p className="text-xs text-destructive mt-3 text-center">{error}</p>
            )}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              <Shield className="w-3 h-3 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">Secured by Stripe ACP</span>
            </div>
          </motion.div>
        )}

        {status === "processing" && (
          <motion.div
            key="processing"
            className="p-12 flex flex-col items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-4" />
            <p className="font-medium text-card-foreground">Processing payment…</p>
            <p className="text-sm text-muted-foreground mt-1">Please wait</p>
          </motion.div>
        )}

        {status === "success" && (
          <motion.div
            key="success"
            className="p-8 flex flex-col items-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <motion.div
              className="w-16 h-16 rounded-full bg-success flex items-center justify-center mb-4"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.1, damping: 15 }}
            >
              <Check className="w-8 h-8 text-success-foreground" />
            </motion.div>
            <h3 className="text-xl font-semibold text-card-foreground mb-1">Booking Confirmed!</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Confirmation ID: {resolvedConfirmationId ?? fallbackConfirmationIdRef.current}
            </p>
            <div className="text-sm text-center text-muted-foreground mb-6">
              <p>{property.name}</p>
              <p>
                {bookingConfig.checkIn} → {bookingConfig.checkOut}
              </p>
              <p className="font-semibold text-card-foreground mt-1">
                {formatCurrencyAmount(
                  resolvedTotal ?? total,
                  property.currencyDisplay,
                  property.currencyCode
                )}
              </p>
            </div>
            <motion.button
              className="px-8 py-3 rounded-full bg-primary text-primary-foreground font-medium min-h-[44px]"
              whileTap={{ scale: 0.95 }}
              onClick={onComplete}
            >
              Done
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
