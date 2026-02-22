
# Sidebar User Footer with Popup Menu

## Overview
Add a user section at the bottom of the desktop sidebar showing user name, plan, and avatar (like the Claude reference). Clicking it opens a popover menu with options like Settings, Upgrade plan, Get help, and Log out.

## What will be built

**Sidebar footer** (bottom of desktop sidebar):
- Avatar circle with initials (e.g., "SA" for StayAI)
- User name ("StayAI Hotel") and plan label ("Pro plan")
- ChevronsUpDown icon on the right
- Clickable - opens a popover above

**Popover menu** (appears on click):
- Email at top
- Menu items: Settings, Get help, Upgrade plan, Log out
- Separated by dividers matching the reference screenshot
- Rounded corners, shadow, clean styling

## Technical Details

### File: `src/pages/DashboardLayout.tsx`

1. **Imports**: Add `Popover`, `PopoverContent`, `PopoverTrigger` from UI, plus `ChevronsUpDown`, `LogOut`, `CircleHelp`, `ArrowUpCircle` icons from lucide-react.

2. **Sidebar structure change**: Wrap the existing `<nav>` in a flex column with `flex-1` so the user footer sits at the bottom using `mt-auto`.

3. **User footer section**: Add a clickable trigger at the bottom of the sidebar `<aside>`:
   - Avatar with initials in a dark circle
   - Name + plan text
   - ChevronsUpDown icon aligned right
   - Wrapped in a `PopoverTrigger`

4. **Popover content**: Menu items including:
   - Email text (e.g., "admin@stayai.com")
   - Separator
   - Settings (navigates to /settings)
   - Get help
   - Separator
   - Upgrade plan
   - Separator
   - Log out
   - Each item has an icon + label, min 44px touch target

5. **Styling**: Glass-consistent, matching existing sidebar aesthetic with `rounded-2xl` popover, `hover:bg-secondary` on items.
