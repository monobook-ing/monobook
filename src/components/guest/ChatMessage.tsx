import { motion } from "framer-motion";
import { Bot, User } from "lucide-react";
import type { DisplayMessage } from "@/hooks/useChat";
import { RoomResultsCarousel } from "./RoomResultsCarousel";

interface ChatMessageProps {
  message: DisplayMessage;
  onBookRoom?: (roomId: string) => void;
}

export function ChatMessage({ message, onBookRoom }: ChatMessageProps) {
  const isUser = message.role === "user";
  const hasToolResults = message.toolResults && message.toolResults.length > 0;

  return (
    <motion.div
      className={`flex gap-2.5 ${isUser ? "flex-row-reverse" : "flex-row"}`}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* Avatar */}
      <div
        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center ${
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-secondary text-muted-foreground"
        }`}
      >
        {isUser ? (
          <User className="w-3.5 h-3.5" />
        ) : (
          <Bot className="w-3.5 h-3.5" />
        )}
      </div>

      {/* Content column */}
      <div
        className={`${
          hasToolResults ? "max-w-[90%]" : "max-w-[80%]"
        } flex flex-col gap-2`}
      >
        {/* Text bubble */}
        {(message.content || message.isStreaming) && (
          <div
            className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
              isUser
                ? "bg-primary text-primary-foreground rounded-tr-sm"
                : "bg-secondary text-foreground rounded-tl-sm"
            }`}
          >
            {message.content ? (
              <MessageContent content={message.content} />
            ) : message.isStreaming ? (
              <TypingIndicator />
            ) : null}
          </div>
        )}

        {/* Searching indicator */}
        {message.isSearching && !hasToolResults && (
          <SearchingIndicator />
        )}

        {/* Room results carousel */}
        {message.toolResults?.map((result, i) => (
          <RoomResultsCarousel
            key={`rooms-${i}`}
            result={result}
            onBookNow={onBookRoom}
          />
        ))}
      </div>
    </motion.div>
  );
}

function MessageContent({ content }: { content: string }) {
  const parts = content.split("\n");
  return (
    <div className="space-y-1">
      {parts.map((line, i) => (
        <p key={i} className={line.trim() === "" ? "h-2" : ""}>
          {line.split(/(\*\*.*?\*\*)/).map((segment, j) => {
            if (segment.startsWith("**") && segment.endsWith("**")) {
              return (
                <strong key={j} className="font-semibold">
                  {segment.slice(2, -2)}
                </strong>
              );
            }
            return <span key={j}>{segment}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </div>
  );
}

function SearchingIndicator() {
  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 text-xs text-muted-foreground"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-3 h-3 border-2 border-primary/30 border-t-primary rounded-full"
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      />
      Searching rooms...
    </motion.div>
  );
}
