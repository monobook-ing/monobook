
# Dynamic Pricing by Date and Guest Count

## Overview
Add a pricing management section to each room's detail sheet, allowing hosts to set different prices per day and per guest count. Includes a calendar-based date picker showing price per day, a guest-tier pricing table, and the ability to edit/override prices.

## What will be built

### 1. Pricing data model
- New `RoomPricing` interface with:
  - `basePrice`: the default per-night price (existing `pricePerNight`)
  - `dateOverrides`: a map of date string to custom price (e.g. `{ "2026-02-25": 350 }`)
  - `guestPricing`: array of `{ minGuests, maxGuests, pricePerNight }` tiers (e.g. 1-2 guests = $289, 3-4 guests = $339)
- Add optional `pricing` field to `ManagedRoom` interface
- Populate mock data with sample date overrides and guest tiers for existing rooms

### 2. Pricing section in Room Detail Sheet
Located between the current price display and amenities section:

- **"Pricing" card** with a collapsible/expandable section:
  - **Calendar view**: A `DayPicker` calendar showing the next 2 months. Days with custom prices are highlighted with the price displayed below the day number. Clicking a day opens an inline editor to set/change the override price for that date.
  - **Guest pricing table**: A simple table/list showing price tiers by guest count (e.g. "1-2 guests: $289/night", "3-4 guests: $339/night"). Each row is editable with an edit button.
  - **Base price editor**: Ability to change the base (default) price inline.

### 3. Price display updates
- Room cards in the grid will continue showing `pricePerNight` (base price) with a "from" prefix if date/guest overrides exist
- The detail sheet price area will show "from $X/night" when overrides exist

## Technical Details

### Modified: `src/data/mockRoomData.ts`
- Add `RoomPricing` interface:
```text
interface GuestTier { minGuests: number; maxGuests: number; pricePerNight: number }
interface RoomPricing {
  dateOverrides: Record<string, number>;  // "YYYY-MM-DD" -> price
  guestTiers: GuestTier[];
}
```
- Add optional `pricing?: RoomPricing` to `ManagedRoom`
- Add sample pricing to 2-3 mock rooms (weekend surcharges, holiday prices, guest tiers)

### Modified: `src/components/dashboard/RoomManagement.tsx`
- Import `Calendar` component, `Popover`, `PopoverTrigger`, `PopoverContent`, and `format` from date-fns
- Add a new **"Pricing" section** in the room detail sheet (between the price display and amenities):
  - Calendar with `react-day-picker` showing custom-priced days with colored dots/badges
  - Click a day to set/edit its price via a small popover with an input field
  - Guest tier list below the calendar with add/edit/delete capability
  - Base price inline editor
- Update the price display line to show "from" prefix when overrides exist
- Update room card price to show "from $X" when the room has pricing overrides

### UI layout in the detail sheet
```text
[Existing header, property selector, description]

[$289/night]  or  [from $289/night]   [4 guests]

PRICING
+------------------------------------------+
| Base price: $289/night        [Edit]     |
|                                          |
| Calendar (react-day-picker)              |
| [Feb 2026         ]  [Mar 2026        ] |
|  Days with overrides shown in primary    |
|  color with price label                  |
|  Click day -> popover to set price       |
|                                          |
| Guest pricing                            |
|  1-2 guests   $289/night    [Edit][Del] |
|  3-4 guests   $339/night    [Edit][Del] |
|  5-6 guests   $389/night    [Edit][Del] |
|  [+ Add tier]                            |
+------------------------------------------+

AMENITIES
[existing amenities section]
```

### Calendar day rendering
- Default days: normal style
- Days with price overrides: primary-colored background with small price text below
- Past days: disabled/greyed out
- Clicking a day opens a `Popover` with:
  - Current price (or "Base: $X")
  - Input to set override price
  - "Save" and "Remove override" buttons

### Guest tier editing
- Each tier row shows range and price with edit/delete buttons
- "Add tier" button at bottom opens inline inputs for min guests, max guests, and price
- Validation: tiers should not overlap
