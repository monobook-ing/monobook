import { API_BASE } from "./auth";

export interface ChatMessage {
  id: string;
  session_id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  tool_calls?: unknown;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface ChatSession {
  id: string;
  property_id: string;
  created_at: string;
}

export interface RoomResult {
  id: string;
  property_id: string;
  name: string;
  type: string;
  description: string;
  price_per_night: string;
  max_guests: number;
  amenities: string[];
  images: string[];
}

export interface RoomSearchResult {
  property_id: string;
  property_name: string;
  rooms: RoomResult[];
  count: number;
}

export interface SSEEvent {
  type: "message_start" | "text_delta" | "tool_use" | "agent_handoff" | "message_end" | "tool_result";
  delta?: string;
  content?: string;
  tool?: string;
  agent?: string;
  data?: RoomSearchResult;
}

export async function createChatSession(
  propertyId: string,
  guestName?: string,
  guestEmail?: string,
): Promise<ChatSession> {
  const response = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/chat/sessions`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guest_name: guestName || null,
        guest_email: guestEmail || null,
        source: "widget",
      }),
    },
  );
  if (!response.ok) {
    throw new Error(`Failed to create session: ${response.status}`);
  }
  return response.json();
}

export async function sendChatMessage(
  propertyId: string,
  sessionId: string,
  content: string,
  onEvent: (event: SSEEvent) => void,
): Promise<void> {
  const response = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/chat/sessions/${sessionId}/messages`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    },
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Chat error: ${response.status} — ${error}`);
  }

  const reader = response.body?.getReader();
  if (!reader) throw new Error("No response stream");

  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (line.startsWith("data: ")) {
        try {
          const event: SSEEvent = JSON.parse(line.slice(6));
          onEvent(event);
        } catch {
          // Skip malformed events
        }
      }
    }
  }
}

export async function getChatMessages(
  propertyId: string,
  sessionId: string,
): Promise<ChatMessage[]> {
  const response = await fetch(
    `${API_BASE}/v1.0/properties/${propertyId}/chat/sessions/${sessionId}/messages`,
  );
  if (!response.ok) {
    throw new Error(`Failed to get messages: ${response.status}`);
  }
  const data = await response.json();
  return data.items;
}
