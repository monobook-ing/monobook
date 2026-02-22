

# Room Management Page

## Overview
A new "Rooms" page in the dashboard sidebar for managing room/property listings. Each room has images (with a main image), description, amenities, pricing, and more -- inspired by Booking.com and Airbnb listing detail pages. Includes the ability to add rooms by connecting to Airbnb/Booking.com or pasting a URL for AI-powered scraping and import, plus a sync toggle per room.

## What will be built

### 1. Room listing page (`/rooms`)
- Grid of room cards showing main image, name, type, price, sync status badge
- "Add Room" button in the header
- Each card is clickable to open a detail/edit view

### 2. Room detail view (inline expandable or separate view)
- **Image gallery**: Main hero image with smaller thumbnail grid (up to 5 images), click to view full-screen
- **Details section**: Room name, type, description, price per night, max guests, bed configuration
- **Amenities**: Tag/badge list (WiFi, Pool, AC, Kitchen, Parking, etc.)
- **Source info**: Shows if imported from Airbnb/Booking.com with sync status and last synced date
- **Actions**: Edit, Delete, Toggle sync on/off

### 3. Add Room dialog
Three import methods presented as tabs/cards:
- **Paste Link**: Input field for Airbnb/Booking.com URL + "Import" button. Shows a mock AI scraping animation, then populates the room form with scraped data
- **Connect Platform**: Buttons to "Connect Airbnb" and "Connect Booking.com" (mock OAuth flow showing connected state)
- **Manual Entry**: Form with all fields to fill in manually

### 4. Sync feature
- Per-room sync toggle (on/off)
- "Last synced" timestamp display
- "Sync now" button per room
- Visual badge showing source platform (Airbnb/Booking.com/Manual)

## Technical Details

### New files

**`src/components/dashboard/RoomManagement.tsx`**
- Main page component with room grid, add room dialog, and room detail view
- Uses existing UI components: Card, Dialog, Button, Input, Tabs, Badge, Switch, AlertDialog
- framer-motion for animations (consistent with rest of app)
- State management with useState for rooms list, selected room, dialog open state

**`src/data/mockRoomData.ts`**
- Extended room data model with images array, description, amenities, pricing, source info, sync status
- 3-4 pre-populated mock rooms with realistic data

### Modified files

**`src/pages/DashboardLayout.tsx`**
- Add "Rooms" nav item with `BedDouble` icon between Inventory and Settings
- Route: `/rooms`

**`src/App.tsx`**
- Add route: `<Route path="/rooms" element={<RoomManagement />} />`

### Data model

```text
ManagedRoom {
  id: string
  name: string
  type: string (e.g. "Deluxe Suite", "Standard Room")
  description: string
  images: string[] (URLs or asset paths, first = main)
  pricePerNight: number
  maxGuests: number
  bedConfig: string (e.g. "1 King Bed", "2 Queen Beds")
  amenities: string[]
  source: "airbnb" | "booking" | "manual"
  sourceUrl?: string
  syncEnabled: boolean
  lastSynced?: string (ISO date)
  status: "active" | "draft" | "archived"
}
```

### Add Room flow (Paste Link)
1. User pastes a URL (e.g. airbnb.com/rooms/12345)
2. Mock loading animation with "AI is scraping the listing..." text
3. After 2 seconds, form auto-fills with mock scraped data
4. User reviews and clicks "Import Room"
5. Room added to the list with source badge and sync enabled

### Component structure
- `RoomManagement` (main page)
  - Room grid (cards)
  - `AddRoomDialog` (Dialog with Tabs: Paste Link / Connect / Manual)
  - `RoomDetailSheet` (Sheet/overlay showing full room details with image gallery)
  - Delete confirmation (reuses AlertDialog)

