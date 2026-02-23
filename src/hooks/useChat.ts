import { useState, useCallback, useRef } from "react";
import {
  createChatSession,
  sendChatMessage,
  type ChatMessage,
  type SSEEvent,
} from "@/lib/chatApi";

export interface DisplayMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  isStreaming?: boolean;
  timestamp: string;
}

export function useChat(propertyId: string) {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const sessionInitRef = useRef(false);

  const ensureSession = useCallback(async (): Promise<string> => {
    if (sessionId) return sessionId;
    if (sessionInitRef.current) {
      // Wait for existing init to complete
      while (!sessionId) {
        await new Promise((r) => setTimeout(r, 50));
      }
      return sessionId!;
    }

    sessionInitRef.current = true;
    try {
      const session = await createChatSession(propertyId);
      setSessionId(session.id);
      return session.id;
    } finally {
      sessionInitRef.current = false;
    }
  }, [propertyId, sessionId]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      setError(null);
      setIsLoading(true);

      // Add user message
      const userMsg: DisplayMessage = {
        id: `user-${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMsg]);

      // Add placeholder for assistant
      const assistantId = `assistant-${Date.now()}`;
      setMessages((prev) => [
        ...prev,
        {
          id: assistantId,
          role: "assistant",
          content: "",
          isStreaming: true,
          timestamp: new Date().toISOString(),
        },
      ]);

      try {
        const sid = await ensureSession();

        await sendChatMessage(propertyId, sid, content.trim(), (event: SSEEvent) => {
          switch (event.type) {
            case "text_delta":
              if (event.delta) {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId
                      ? { ...m, content: m.content + event.delta }
                      : m,
                  ),
                );
              }
              break;
            case "tool_use":
              // Could show a "searching..." indicator
              break;
            case "agent_handoff":
              // Could show which agent is handling
              break;
            case "message_end":
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === assistantId
                    ? { ...m, isStreaming: false, content: m.content || event.content || "" }
                    : m,
                ),
              );
              break;
          }
        });

        // Ensure streaming flag is cleared
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId ? { ...m, isStreaming: false } : m,
          ),
        );
      } catch (e) {
        const errorMsg = e instanceof Error ? e.message : "Something went wrong";
        setError(errorMsg);
        setMessages((prev) =>
          prev.map((m) =>
            m.id === assistantId
              ? { ...m, content: "Sorry, I couldn't process your request. Please try again.", isStreaming: false }
              : m,
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [propertyId, isLoading, ensureSession],
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setSessionId(null);
    setError(null);
    sessionInitRef.current = false;
  }, []);

  return {
    messages,
    isLoading,
    error,
    sessionId,
    sendMessage,
    clearChat,
  };
}
