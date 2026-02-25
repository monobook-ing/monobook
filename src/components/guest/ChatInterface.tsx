import { useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, RotateCcw } from "lucide-react";
import { useChat } from "@/hooks/useChat";
import { ChatMessage } from "./ChatMessage";
import { ChatInput } from "./ChatInput";

interface ChatInterfaceProps {
  propertyId: string;
}

export function ChatInterface({ propertyId }: ChatInterfaceProps) {
  const { messages, isLoading, error, sendMessage, clearChat } = useChat(propertyId);
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleBookRoom = useCallback(
    (roomId: string) => {
      const allResults = messages.flatMap((m) => m.toolResults || []);
      const room = allResults
        .flatMap((r) => r.rooms)
        .find((r) => r.id === roomId);
      const roomName = room?.name || "this room";
      sendMessage(`I'd like to book ${roomName}`);
    },
    [messages, sendMessage],
  );

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <motion.div
      className="flex flex-col h-[calc(100vh-180px)] min-h-[400px] rounded-2xl bg-card apple-shadow-lg overflow-hidden"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-card-foreground">AI Concierge</p>
            <p className="text-xs text-muted-foreground">
              {isLoading ? "Thinking..." : "Online"}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <motion.button
            className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center min-w-[44px] min-h-[44px]"
            whileTap={{ scale: 0.9 }}
            onClick={clearChat}
            title="New conversation"
          >
            <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          </motion.button>
        )}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-4 scroll-smooth"
      >
        {messages.length === 0 && (
          <WelcomeMessage onSuggestion={sendMessage} />
        )}

        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} onBookRoom={handleBookRoom} />
          ))}
        </AnimatePresence>
      </div>

      {/* Error */}
      {error && (
        <div className="px-4 py-2 text-xs text-red-500 bg-red-50 dark:bg-red-950/20">
          {error}
        </div>
      )}

      {/* Input */}
      <ChatInput onSend={sendMessage} isLoading={isLoading} />
    </motion.div>
  );
}

function WelcomeMessage({ onSuggestion }: { onSuggestion: (msg: string) => void }) {
  const suggestions = [
    "Show me available rooms",
    "What amenities do you have?",
    "I need a room for 2 guests",
    "What's your cancellation policy?",
  ];

  return (
    <motion.div
      className="flex flex-col items-center text-center py-8"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Bot className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-lg font-semibold text-card-foreground mb-1">
        Welcome!
      </h3>
      <p className="text-sm text-muted-foreground mb-6 max-w-[280px]">
        I'm your AI concierge. Ask me about rooms, availability, pricing, or hotel policies.
      </p>
      <div className="flex flex-wrap justify-center gap-2">
        {suggestions.map((s) => (
          <motion.button
            key={s}
            className="px-3 py-1.5 rounded-full bg-secondary text-xs font-medium text-foreground hover:bg-secondary/80 transition-colors"
            whileTap={{ scale: 0.95 }}
            onClick={() => onSuggestion(s)}
          >
            {s}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
