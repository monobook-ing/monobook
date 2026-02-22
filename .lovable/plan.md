

# Property (Hotel/Building) Entity with Sidebar Selector

## Overview
Add an optional "Property" entity so rooms can be grouped under a hotel/building. A property switcher dropdown will appear in the sidebar header, allowing users to switch between properties. The rooms page will filter by the selected property. A "Manage Properties" option lets users add/edit properties.

## What will be built

### 1. Property data model and mock data
- New `Property` interface: id, name, address, image (optional), roomCount (derived)
- 3 mock properties: "Sunset Beach Resort", "Downtown City Hotel", "Mountain Lodge Retreat"
- Add optional `propertyId` field to `ManagedRoom` interface
- Assign existing mock rooms to different properties
- Add an "All Properties" option for viewing everything

### 2. Sidebar property switcher
- Replace the static "StayAI" header in the sidebar with a clickable property selector
- Uses a `Popover` showing a list of properties + "All Properties" option
- Each property row shows name and room count
- "Manage Properties" link at the bottom of the popover
- Selected property shows its name and a `ChevronsUpDown` icon
- The StayAI branding moves to a smaller line or stays as the app name above

### 3. Property context shared across pages
- Selected property stored in `DashboardLayout` state and passed via React context (or URL search param)
- `RoomManagement` filters rooms by selected property (or shows all)
- Other pages can optionally use the context later

### 4. Manage Properties dialog
- Simple dialog accessible from the popover's "Manage Properties" button
- Lists properties with edit/delete options
- "Add Property" form with name and address fields

## Technical Details

### New file: `src/data/mockPropertyData.ts`
- `Property` interface: `{ id, name, address, image? }`
- 3 mock properties with IDs like "prop-1", "prop-2", "prop-3"

### New file: `src/contexts/PropertyContext.tsx`
- React context providing `{ selectedPropertyId, setSelectedPropertyId, properties }`
- Provider wraps the dashboard layout
- "all" as default value (show all properties)

### Modified: `src/data/mockRoomData.ts`
- Add optional `propertyId?: string` to `ManagedRoom` interface
- Assign propertyId to each mock room (room-1, room-2 to "prop-1"; room-3 to "prop-2"; room-4 to "prop-3")

### Modified: `src/pages/DashboardLayout.tsx`
- Wrap content with `PropertyProvider`
- Replace the static StayAI header block with a property switcher:
  - Clickable button showing selected property name (or "All Properties")
  - Popover listing all properties + "All Properties" option
  - "Manage Properties" button at bottom opening a dialog
- Keep StayAI branding as a small label above the switcher
- On mobile: property name shown in a compact selector at the top of the page or in the header

### Modified: `src/components/dashboard/RoomManagement.tsx`
- Import and consume `PropertyContext`
- Filter displayed rooms by `selectedPropertyId` (skip filter if "all")
- When adding a room, auto-assign the current `selectedPropertyId` (if not "all")
- Show property name badge on room cards when viewing "All Properties"

### Modified: `src/App.tsx`
- No route changes needed (properties managed via dialog, not a separate page)

### Component structure for sidebar switcher
```text
Sidebar Header
  [StayAI logo + name]          (smaller, stays as branding)
  [Property Switcher Button]    (shows current property + chevron)
    -> Popover
       - "All Properties" option
       - List of properties (name + room count)
       - Separator
       - "Manage Properties" button -> opens Dialog
```

### Manage Properties Dialog
- List view of properties with name, address, and delete button
- "Add Property" section at bottom with name + address inputs
- Simple inline editing (click to edit name/address)
