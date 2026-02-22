import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { mockAuditLog, type AuditLogEntry } from "@/data/mockData";
import { CheckCircle2, XCircle, Clock, Terminal } from "lucide-react";

const typeFilters = ["all", "mcp", "chatGPT", "claude", "gemini", "widget"] as const;

const typeColors: Record<AuditLogEntry["type"], string> = {
  mcp: "bg-primary/10 text-primary",
  chatGPT: "bg-emerald-500/10 text-emerald-600",
  claude: "bg-amber-500/10 text-amber-600",
  gemini: "bg-violet-500/10 text-violet-600",
  widget: "bg-rose-500/10 text-rose-600",
};

const typeLabels: Record<AuditLogEntry["type"], string> = {
  mcp: "MCP",
  chatGPT: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  widget: "Widget",
};

const statusConfig = {
  success: { icon: CheckCircle2, class: "text-emerald-500" },
  error: { icon: XCircle, class: "text-destructive" },
  pending: { icon: Clock, class: "text-amber-500" },
};

export function AuditLog() {
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const filtered = activeFilter === "all"
    ? mockAuditLog
    : mockAuditLog.filter((e) => e.type === activeFilter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">API & tool call history across all integrations</p>
      </div>

      {/* Filter chips */}
      <div className="flex gap-2 flex-wrap">
        {typeFilters.map((f) => (
          <motion.button
            key={f}
            whileTap={{ scale: 0.95 }}
            onClick={() => setActiveFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors min-h-[32px] ${
              activeFilter === f
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {f === "all" ? "All" : typeLabels[f as AuditLogEntry["type"]]}
          </motion.button>
        ))}
      </div>

      {/* Log entries */}
      <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
        <ScrollArea className="max-h-[600px]">
          <div className="divide-y divide-border">
            <AnimatePresence mode="popLayout">
              {filtered.map((entry, i) => {
                const StatusIcon = statusConfig[entry.status].icon;
                return (
                  <motion.div
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-start gap-3 p-4 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0 mt-0.5">
                      <Terminal className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${typeColors[entry.type]}`}>
                          {typeLabels[entry.type]}
                        </span>
                        <code className="text-xs font-mono text-foreground">{entry.toolName}</code>
                        <StatusIcon className={`w-3.5 h-3.5 ${statusConfig[entry.status].class}`} />
                      </div>
                      <p className="text-sm text-card-foreground">{entry.text}</p>
                      <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="font-mono">{entry.conversationId}</span>
                        <span>{format(new Date(entry.date), "MMM d, HH:mm")}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
            {filtered.length === 0 && (
              <div className="p-8 text-center text-sm text-muted-foreground">No entries found</div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
