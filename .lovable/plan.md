

## Rename "Stripe Account" to "Payment Providers" and Add Multiple Providers

### Changes

**File: `src/components/dashboard/MCPIntegrationSettings.tsx`**

Replace the current single "Stripe Account" card with a new "Payment Providers" section styled like the PMS Sync section (iOS Settings grouped list with toggles):

- Rename header from "Stripe Account" to "Payment Providers"
- Update description to "Connect payment providers to process bookings"
- Convert from a single "Connect Stripe" button to a grouped list with iOS 26 Liquid Glass toggles (reusing the existing `ToggleItem` component) for each provider:
  - **Stripe** - "Card payments & Apple Pay"
  - **JP Morgan** - "Enterprise payment processing"
  - **iPay** - "Mobile & online payments"
  - **LiqPay** - "Ukrainian payment gateway"
  - **MonoBank** - "Direct bank integration"
- Use the `CreditCard` icon (from lucide-react) instead of `Wifi` to better represent payments
- Keep the same card styling (rounded-2xl, bg-card, apple-shadow, bordered header) consistent with the PMS Sync section above it

### Technical Details

- Only `MCPIntegrationSettings.tsx` needs to be modified
- No new components or dependencies required -- reuses existing `ToggleItem` with the Liquid Glass toggle
- Stripe will default to `defaultOn` since it was previously the primary provider

