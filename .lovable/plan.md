

# Services & Add-ons Module

## Overview
A comprehensive services management module for the hotelier dashboard, covering service CRUD, categories, partners, analytics, and guest preview. All UI-only with mock data.

## File Structure

```text
src/
├── data/
│   └── mockServiceData.ts          # Mock data for services, categories, partners
├── components/dashboard/services/
│   ├── ServicesPage.tsx             # Main page with sub-tabs + table/card views
│   ├── ServiceCreateEdit.tsx       # Multi-step form with vertical stepper
│   ├── ServiceDetail.tsx           # Detail view with tabs (overview/bookings/analytics/settings)
│   ├── CategoriesManagement.tsx    # CRUD with drag-and-drop reorder
│   ├── PartnersPage.tsx            # Partners table + Add Partner dialog
│   ├── ServicesAnalytics.tsx       # Charts page (recharts)
│   └── GuestPreviewModal.tsx       # Modal simulating AI widget card
└── pages/
    └── ServicesLayout.tsx          # Sub-navigation wrapper (tabs for All/Categories/Partners/Analytics)
```

## Routing Changes (App.tsx)

Add inside the `<DashboardLayout>` route group:
```
/services          → ServicesLayout with ServicesPage (All Services tab default)
/services/categories → CategoriesManagement
/services/partners   → PartnersPage  
/services/analytics  → ServicesAnalytics
/services/new        → ServiceCreateEdit
/services/:id        → ServiceDetail
/services/:id/edit   → ServiceCreateEdit (edit mode)
```

## Navigation Changes (DashboardLayout.tsx)

Add to `navItems` array:
```ts
{ id: "/services", label: "Services", icon: Gift }  // or Layers icon
```

This adds "Services" to both desktop sidebar and mobile bottom nav (making it 6 items).

## Key Components

### 1. ServicesLayout.tsx
- Page title "Services & Add-ons" + "+ Create Service" button
- Horizontal tabs: All Services | Categories | Partners | Analytics
- Each tab navigates to the corresponding sub-route
- Renders `<Outlet />` for child content

### 2. ServicesPage.tsx (All Services)
- Filter bar: Type dropdown, Category dropdown, Status dropdown, Search input
- Toggle: table view / card grid view (using state)
- **Table mode**: columns for Name, Type, Category, Price, Availability, Attach Rate, Status badge, Actions (Edit/Duplicate/Archive)
- **Card mode**: card grid with image, title, price, status badge, action menu
- Empty state illustration when no services

### 3. ServiceCreateEdit.tsx (Multi-step form)
- Left vertical stepper (6 steps), main form area center, sticky preview panel on right (desktop)
- Steps: Basic Info → Pricing → Availability → Booking & Upsell → Partner Settings (conditional) → Knowledge Base
- Each step is a section of the form; stepper highlights active step
- Step 5 only visible when service type is "Partner Service"
- Live preview card on right side during Step 2

### 4. ServiceDetail.tsx
- Header: image, title, status badge, 4 quick stat cards (Revenue, Attach Rate, Bookings, Conversion)
- Tabs: Overview, Bookings, Analytics, Settings
- Overview: description, pricing summary, availability preview, upsell rules
- Bookings: table with Booking ID, Guest, Date, Quantity, Total, Status

### 5. CategoriesManagement.tsx
- Simple list with drag handle, icon, name, description, order
- Add/Edit inline or via dialog
- Drag-and-drop reorder (using native drag events, no extra dependency)

### 6. PartnersPage.tsx
- Table: Partner Name, Active Services, Revenue Share %, Revenue Generated, Status
- "Add Partner" button opens dialog with form fields

### 7. ServicesAnalytics.tsx
- Date range selector at top
- 4 charts using recharts: Revenue line chart, Attach rate bar chart, Revenue per booking uplift, Top performing services list
- Consistent with existing DashboardHome chart styling

### 8. GuestPreviewModal.tsx
- Toggle button "Preview Guest Experience" on ServicesPage
- Opens Dialog simulating the AI widget card: service image, title, price, Add button, slot selector

### 9. mockServiceData.ts
- `mockServices[]` with ~6 sample services covering all types/statuses
- `mockServiceCategories[]` with ~5 categories
- `mockPartners[]` with ~3 partners
- `mockServiceBookings[]` for detail view
- Types/interfaces exported

## UI States
All components include: empty state, loading skeletons, draft/disabled/error banners, and "fully booked" badge for slot-based services.

## Design Consistency
- All cards: `rounded-2xl`, subtle borders `border-border`
- Buttons: `rounded-xl` or `rounded-full` (pill)
- Same glassmorphic patterns, motion animations, and color system as existing dashboard
- Responsive: desktop-first, stacks to single column on mobile

