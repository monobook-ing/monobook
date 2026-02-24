

## Guests Page

A new "Guests" section in the dashboard that shows a list of guests with their latest booking info, and allows clicking into a guest detail view with booking history and conversation history.

### What You'll Get

- A **Guests** nav item in the sidebar/bottom nav (using the `Users` icon)
- A **guest list** showing each guest's name, email, phone, last booking dates, room, and status
- A **guest detail panel** (sheet on desktop, drawer on mobile -- matching the Rooms page pattern) with:
  - Guest profile header (name, email, phone, total stays count)
  - Latest booking details (room, dates, status, price)
  - Booking history table showing all past bookings
  - Conversation history showing AI and widget interactions tied to this guest
- Mock data for guests, their bookings, and conversation messages

---

### Technical Details

**1. New file: `src/data/mockGuestData.ts`**

Define interfaces and mock data:
- `Guest` interface: `id`, `name`, `email`, `phone`, `totalStays`, `lastStayDate`, `notes`
- `GuestBooking` interface: `id`, `guestId`, `roomName`, `checkIn`, `checkOut`, `status`, `totalPrice`, `aiHandled`
- `GuestConversation` interface: `id`, `guestId`, `channel` (widget/chatGPT/claude), `messages[]` (role, text, timestamp)
- ~6 mock guests with 2-4 bookings each and 1-2 conversation threads

**2. New file: `src/components/dashboard/GuestManagement.tsx`**

Follow `RoomManagement.tsx` patterns:
- Guest list as cards with `motion` animations
- Search/filter input at top
- Click a guest card to open detail panel
- Desktop: `Sheet` side panel; Mobile: `Drawer` bottom panel (same as Rooms)
- Detail panel sections:
  - Profile header with avatar (initials), name, email, phone
  - "Latest Booking" card with room, dates, status badge, price
  - "Booking History" section with a compact list/table of past bookings
  - "Conversations" section showing conversation threads with expandable message lists
- Loading skeletons matching the existing skeleton patterns
- Property filtering via `useProperty()` context (if bookings are tied to properties)

**3. Update `src/App.tsx`**

Add route: `<Route path="/guests" element={<GuestManagement />} />`  inside the dashboard layout group.

**4. Update `src/pages/DashboardLayout.tsx`**

Add nav item `{ id: "/guests", label: "Guests", icon: Users }` to `navItems` array (after "Rooms").

**5. Fix existing build errors**

- `InventoryCalendar.test.tsx`: Add type assertions for `ReactNode` issues
- `AgenticCheckout.tsx`: Add null check before accessing `.total` and `.confirmationId` on the `void | CheckoutResult` union
