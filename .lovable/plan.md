

# File Preview Mode with Delete Confirmation

## Overview
When clicking a file name or icon in the Knowledge Base section, a full-screen preview overlay will appear showing the file title, a close button, and a 3-dot menu with a "Delete" option. Deleting triggers a confirmation dialog using the existing `AlertDialog` component.

## What will be built

**Full-screen preview overlay:**
- Fixed overlay covering the entire screen with a semi-transparent backdrop
- Top bar with: file name (left), 3-dot menu button and close (X) button (right)
- Center area showing a file preview placeholder (file icon + file details, since these are mock files)
- Smooth open/close animation using framer-motion

**3-dot menu (using Popover):**
- Single menu item: "Delete" with a Trash icon, styled in destructive red

**Delete confirmation (reusing AlertDialog):**
- Title: "Delete file?"
- Description: "Are you sure you want to delete {filename}? This action cannot be undone."
- Cancel and Delete buttons (Delete in destructive style)

## Technical Details

### File: `src/components/dashboard/MCPIntegrationSettings.tsx`

1. **New state**: Add `previewFile` state to track which file is being previewed (file object or null).

2. **Make file rows clickable**: On lines 321-339, add `onClick` to the file name/icon area (the left side `div`) to set `previewFile`.

3. **Remove inline delete button**: The delete button moves into the preview's 3-dot menu instead. (Or keep both for quick access -- keep the existing trash icon AND add delete in preview.)

4. **Preview overlay component** (inline in same file):
   - `AnimatePresence` + `motion.div` for the full-screen overlay
   - Fixed position, `z-50`, dark background
   - Header bar: file name, `MoreVertical` (3-dot) icon opening a `Popover`, `X` close button
   - Body: centered file icon + name + size display
   - `MoreVertical` popover contains a "Delete" button

5. **Delete flow**:
   - Clicking "Delete" in the 3-dot menu opens the existing `AlertDialog`
   - On confirm: calls `removeFile(id)`, closes preview, closes dialog
   - Reuses the same `AlertDialog` pattern already in the file (see `PaymentProviderItem`)

6. **New imports**: Add `MoreVertical`, `X` from lucide-react (X already imported). Add `Popover`/`PopoverContent`/`PopoverTrigger`.

