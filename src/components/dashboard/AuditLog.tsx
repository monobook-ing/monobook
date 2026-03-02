import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import type { DateRange } from "react-day-picker";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/contexts/PropertyContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { fetchAuditEntries, readAccessToken, type AuditEntry } from "@/lib/auth";
import { CheckCircle2, XCircle, Clock, Terminal, CalendarIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const typeFilters = ["all", "mcp", "chatgpt", "claude", "gemini", "widget"] as const;
const PAGE_SIZE = 20;

const typeColors: Record<string, string> = {
  mcp: "bg-primary/10 text-primary",
  chatgpt: "bg-emerald-500/10 text-emerald-600",
  claude: "bg-amber-500/10 text-amber-600",
  gemini: "bg-violet-500/10 text-violet-600",
  widget: "bg-rose-500/10 text-rose-600",
};

const typeLabels: Record<string, string> = {
  mcp: "MCP",
  chatgpt: "ChatGPT",
  claude: "Claude",
  gemini: "Gemini",
  widget: "Widget",
};

const statusConfig = {
  success: { icon: CheckCircle2, class: "text-emerald-500" },
  error: { icon: XCircle, class: "text-destructive" },
  pending: { icon: Clock, class: "text-amber-500" },
};

const formatAuditError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load audit logs.";
  }

  return error;
};

const getSourceLabel = (source: string) => {
  return typeLabels[source] || source.toUpperCase();
};

const getSourceClass = (source: string) => {
  return typeColors[source] || "bg-secondary text-muted-foreground";
};

const isKnownStatus = (value: string): value is keyof typeof statusConfig => {
  return value === "success" || value === "error" || value === "pending";
};

const toRangeParams = (dateRange: DateRange | undefined): { from?: string; to?: string } => {
  if (!dateRange?.from) return {};

  const fromDate = new Date(dateRange.from);
  fromDate.setHours(0, 0, 0, 0);

  const endDate = new Date(dateRange.to ?? dateRange.from);
  endDate.setHours(23, 59, 59, 999);

  return {
    from: fromDate.toISOString(),
    to: endDate.toISOString(),
  };
};

export function AuditLog() {
  const { selectedPropertyId } = useProperty();
  const isMobile = useIsMobile();
  const [activeFilter, setActiveFilter] = useState<string>("all");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [isDateDrawerOpen, setIsDateDrawerOpen] = useState(false);
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const requestIdRef = useRef(0);
  const rangeParams = toRangeParams(dateRange);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    if (selectedPropertyId === "all") {
      setEntries([]);
      setError(null);
      setIsLoading(false);
      setNextCursor(null);
      setIsLoadingMore(false);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setEntries([]);
      setError("missing_token");
      setIsLoading(false);
      setNextCursor(null);
      setIsLoadingMore(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setEntries([]);
    setNextCursor(null);
    setIsLoadingMore(false);

    const source = activeFilter === "all" ? undefined : activeFilter;
    fetchAuditEntries(accessToken, selectedPropertyId, {
      source,
      from: rangeParams.from,
      to: rangeParams.to,
      limit: PAGE_SIZE,
    })
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setEntries(result.items);
        setNextCursor(result.nextCursor);
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch audit logs";
        setEntries([]);
        setError(message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, [activeFilter, rangeParams.from, rangeParams.to, selectedPropertyId]);

  const loadMore = async () => {
    if (selectedPropertyId === "all" || !nextCursor || isLoadingMore) return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("missing_token");
      return;
    }

    setIsLoadingMore(true);
    const source = activeFilter === "all" ? undefined : activeFilter;

    try {
      const result = await fetchAuditEntries(accessToken, selectedPropertyId, {
        source,
        from: rangeParams.from,
        to: rangeParams.to,
        limit: PAGE_SIZE,
        cursor: nextCursor,
      });
      setEntries((prev) => [...prev, ...result.items]);
      setNextCursor(result.nextCursor);
    } catch (fetchError) {
      const message =
        fetchError instanceof Error ? fetchError.message : "Failed to fetch audit logs";
      setError(message);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const filteredEntries = entries;
  const dateRangeLabel = dateRange?.from
    ? dateRange.to
      ? `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d")}`
      : format(dateRange.from, "MMM d")
    : "Date range";

  const handleDateRangeSelect = (nextRange: DateRange | undefined) => {
    setDateRange(nextRange);
    if (isMobile && nextRange?.from && nextRange?.to) {
      setIsDateDrawerOpen(false);
    }
  };

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Audit Log</h1>
        <p className="text-sm text-muted-foreground mt-1">API & tool call history across all integrations</p>
      </div>

      {/* Filter chips + date range */}
      <div className="flex items-center gap-2 flex-wrap">
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
            {f === "all" ? "All" : getSourceLabel(f)}
          </motion.button>
        ))}

        <div className="ml-auto flex items-center gap-2">
          {isMobile ? (
            <>
              <Button
                variant="outline"
                size="sm"
                className={cn("h-8 text-xs gap-1.5 rounded-full", !dateRange && "text-muted-foreground")}
                onClick={() => setIsDateDrawerOpen(true)}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                {dateRangeLabel}
              </Button>
              <Drawer open={isDateDrawerOpen} onOpenChange={setIsDateDrawerOpen}>
                <DrawerContent
                  data-testid="audit-date-drawer"
                  className="rounded-t-[32px] border-white/40 bg-background/80 shadow-xl backdrop-blur-2xl max-h-[85vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] apple-shadow-lg"
                >
                  <div className="px-5 pb-2">
                    <DrawerHeader className="px-0 pt-3 text-center">
                      <DrawerTitle className="text-lg">Date range</DrawerTitle>
                      <DrawerDescription className="sr-only">
                        Select a date range to filter audit log entries.
                      </DrawerDescription>
                    </DrawerHeader>
                  </div>
                  <div className="pb-4">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateRangeSelect}
                      numberOfMonths={1}
                      className="w-full p-0 pointer-events-auto"
                      classNames={{
                        months: "w-full",
                        month: "w-full space-y-4 px-4",
                        nav_button: "h-14 w-14 p-0 rounded-full",
                        nav_button_previous: "absolute left-4",
                        nav_button_next: "absolute right-4",
                        table: "w-full border-collapse space-y-1",
                        head_row: "grid grid-cols-7",
                        head_cell: "text-muted-foreground rounded-md w-full font-normal text-[0.8rem] text-center",
                        row: "grid grid-cols-7 w-full mt-2",
                        cell: "h-9 w-full text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                        day: "h-9 w-full p-0 font-normal rounded-md aria-selected:opacity-100",
                      }}
                    />
                  </div>
                </DrawerContent>
              </Drawer>
            </>
          ) : (
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 rounded-full", !dateRange && "text-muted-foreground")}>
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {dateRangeLabel}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="range"
                  selected={dateRange}
                  onSelect={handleDateRangeSelect}
                  numberOfMonths={2}
                  initialFocus
                  className="p-3 pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          )}
          {dateRange && (
            <Button variant="ghost" size="sm" className="h-8 text-xs rounded-full px-2" onClick={() => setDateRange(undefined)}>
              Clear
            </Button>
          )}
        </div>
      </div>

      {selectedPropertyId === "all" && (
        <Card className="rounded-xl border-dashed" data-testid="audit-select-property-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">Select a property to view audit logs</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose one property from the switcher to load audit entries from the API.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && isLoading && (
        <div className="rounded-2xl bg-card apple-shadow overflow-hidden p-4 space-y-4" data-testid="audit-loading-state">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div key={`audit-skeleton-${idx}`} className="flex items-start gap-3">
              <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3.5 w-52" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedPropertyId !== "all" && !isLoading && error && (
        <Card className="rounded-xl border-destructive/30" data-testid="audit-error-state">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">Could not load audit logs</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatAuditError(error)}</p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isLoading && !error && filteredEntries.length === 0 && (
        <Card className="rounded-xl border-dashed" data-testid="audit-empty-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">No entries found</h3>
            <p className="text-sm text-muted-foreground mt-1">
              No audit entries matched your current filters.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isLoading && !error && filteredEntries.length > 0 && (
        <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
          <ScrollArea>
            <div className="divide-y divide-border">
              <AnimatePresence mode="popLayout">
                {filteredEntries.map((entry, i) => {
                  const normalizedStatus = isKnownStatus(entry.status) ? entry.status : "pending";
                  const StatusIcon = statusConfig[normalizedStatus].icon;
                  const createdAtDate = new Date(entry.createdAt);
                  const createdAtLabel = Number.isNaN(createdAtDate.getTime())
                    ? entry.createdAt
                    : format(createdAtDate, "MMM d, HH:mm");

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
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${getSourceClass(entry.source)}`}
                          >
                            {getSourceLabel(entry.source)}
                          </span>
                          <code className="text-xs font-mono text-foreground">{entry.toolName}</code>
                          <StatusIcon
                            className={`w-3.5 h-3.5 ${statusConfig[normalizedStatus].class}`}
                          />
                        </div>
                        <p className="text-sm text-card-foreground">{entry.description}</p>
                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="font-mono">{entry.conversationId ?? "-"}</span>
                          <span>{createdAtLabel}</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </ScrollArea>
        </div>
      )}

      {selectedPropertyId !== "all" && !isLoading && !error && !!nextCursor && (
        <div className="flex justify-center">
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={loadMore}
            disabled={isLoadingMore}
            data-testid="audit-load-more-button"
          >
            {isLoadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isLoadingMore ? "Loading..." : "Load more"}
          </Button>
        </div>
      )}
    </motion.div>
  );
}
