
# Audit Log Page

## Overview
Add a new "Audit Log" page accessible from the dashboard navigation. It will display a chronological list of API/tool call records, each containing conversation_id, type, tool name, text, date, and status. Data will be mock-based, matching the existing project pattern.

## What will be built

A new `/audit` route with a filterable, scrollable audit log table showing records like:

| Field | Description |
|-------|-------------|
| conversation_id | Unique conversation identifier (e.g., `conv_abc123`) |
| type | Source system: `mcp`, `chatGPT`, `claude`, `gemini`, `widget` |
| tool_name | Name of the tool/function called (e.g., `search_rooms`, `create_booking`) |
| text | Brief description of what happened |
| date | Timestamp of the call |
| status | `success`, `error`, `pending` |

The page will include:
- Filter chips to filter by type (MCP, ChatGPT, Claude, Gemini, Widget)
- Each log entry displayed as a card row with color-coded type badge and status indicator
- Mobile-friendly layout consistent with existing pages

## Technical Details

### 1. Mock Data (`src/data/mockData.ts`)
- Add `AuditLogEntry` interface and `mockAuditLog` array with ~10-12 sample entries covering all types

### 2. New Component (`src/components/dashboard/AuditLog.tsx`)
- Scrollable list of audit log entries
- Filter bar with type chips (all, mcp, chatGPT, claude, gemini, widget)
- Each entry shows: type badge, tool name, text, conversation_id (truncated), date, status badge
- Uses existing design patterns: `rounded-2xl bg-card apple-shadow`, `motion.div` animations

### 3. Route & Navigation Updates
- Add `/audit` route in `src/App.tsx` inside the `DashboardLayout` group
- Add "Audit Log" nav item in `src/pages/DashboardLayout.tsx` with `ScrollText` icon from lucide-react
- Position it after Settings in the nav order
