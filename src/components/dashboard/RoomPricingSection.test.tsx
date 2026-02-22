import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RoomPricingSection } from "@/components/dashboard/RoomPricingSection";

const pricing = {
  dateOverrides: {
    "2026-02-28": 350,
  },
  guestTiers: [{ minGuests: 1, maxGuests: 2, pricePerNight: 289 }],
};

describe("RoomPricingSection", () => {
  it("disables editing controls in read-only mode while showing values", () => {
    render(
      <RoomPricingSection
        pricing={pricing}
        basePrice={289}
        maxGuests={3}
        readOnly
        onPricingChange={vi.fn()}
        onBasePriceChange={vi.fn()}
      />
    );

    expect(screen.getByText("Date overrides")).toBeInTheDocument();
    expect(screen.queryByText("Date overrides — click a day to set custom price")).not.toBeInTheDocument();
    expect(screen.getByText("1–2 guests")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /add tier/i })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /\$289\/night/i })).toBeDisabled();
  });

  it("shows editable affordances when read-only is false", () => {
    render(
      <RoomPricingSection
        pricing={pricing}
        basePrice={289}
        maxGuests={3}
        onPricingChange={vi.fn()}
        onBasePriceChange={vi.fn()}
      />
    );

    expect(screen.getByText("Date overrides — click a day to set custom price")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add tier/i })).toBeInTheDocument();
  });
});
