import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, Percent } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { useProperty } from "@/contexts/PropertyContext";
import {
  fetchDashboardMetrics,
  fetchRecentActivity,
  readAccessToken,
  type DashboardMetrics,
  type DashboardMetricsRange,
  type RecentActivityItem,
} from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const emptyMetrics: DashboardMetrics = {
  aiDirectBookings: 0,
  commissionSaved: 0,
  occupancyRate: 0,
  revenue: 0,
  aiDirectBookingsTrend: [],
  commissionSavedTrend: [],
  occupancyTrend: [],
  revenueTrend: [],
};

const formatDashboardError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load dashboard.";
  }
  return error;
};

export function DashboardHome() {
  const { selectedPropertyId } = useProperty();
  const [period, setPeriod] = useState<DashboardMetricsRange>("month");
  const [metrics, setMetrics] = useState<DashboardMetrics>(emptyMetrics);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [isDashboardLoading, setIsDashboardLoading] = useState(false);
  const [dashboardError, setDashboardError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    let active = true;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    const loadDashboard = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setMetrics(emptyMetrics);
        setRecentActivity([]);
        setDashboardError(null);
        setIsDashboardLoading(false);
        return;
      }

      if (period === "custom") {
        if (!active) return;
        setMetrics(emptyMetrics);
        setRecentActivity([]);
        setDashboardError(null);
        setIsDashboardLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setMetrics(emptyMetrics);
        setRecentActivity([]);
        setDashboardError("missing_token");
        setIsDashboardLoading(false);
        return;
      }

      setIsDashboardLoading(true);
      setDashboardError(null);

      try {
        const [fetchedMetrics, fetchedRecentActivity] = await Promise.all([
          fetchDashboardMetrics(accessToken, selectedPropertyId, { range: period }),
          fetchRecentActivity(accessToken, selectedPropertyId, { limit: 5 }),
        ]);

        if (!active || requestIdRef.current !== requestId) return;
        setMetrics(fetchedMetrics);
        setRecentActivity(fetchedRecentActivity);
      } catch (error) {
        if (!active || requestIdRef.current !== requestId) return;
        const message = error instanceof Error ? error.message : "Failed to load dashboard";
        setMetrics(emptyMetrics);
        setRecentActivity([]);
        setDashboardError(message);
      } finally {
        if (active && requestIdRef.current === requestId) {
          setIsDashboardLoading(false);
        }
      }
    };

    loadDashboard();
    return () => {
      active = false;
    };
  }, [period, selectedPropertyId]);

  const metricCards = useMemo(
    () => [
      {
        label: "AI Direct Bookings",
        value: metrics.aiDirectBookings,
        prefix: "",
        icon: TrendingUp,
        trend: metrics.aiDirectBookingsTrend,
        color: "hsl(211, 100%, 50%)",
      },
      {
        label: "Commission Saved",
        value: metrics.commissionSaved,
        prefix: "$",
        icon: DollarSign,
        trend: metrics.commissionSavedTrend,
        color: "hsl(142, 58%, 49%)",
      },
      {
        label: "Occupancy Rate",
        value: metrics.occupancyRate,
        prefix: "",
        suffix: "%",
        icon: Percent,
        trend: metrics.occupancyTrend,
        color: "hsl(32, 95%, 55%)",
      },
      {
        label: "Revenue",
        value: metrics.revenue,
        prefix: "$",
        icon: BarChart3,
        trend: metrics.revenueTrend,
        color: "hsl(280, 70%, 55%)",
      },
    ],
    [metrics]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[130px] h-9 rounded-xl text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="week">Week</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
            <SelectItem value="custom" disabled>
              Custom (Coming soon)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Your AI agent performance overview</p>

      {selectedPropertyId === "all" && (
        <Card className="rounded-xl border-dashed mb-8" data-testid="dashboard-select-property-state">
          <CardContent className="p-8 text-center">
            <h3 className="text-base font-semibold text-foreground">Select a property to view dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Choose one property from the switcher to load metrics and recent activity.
            </p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && isDashboardLoading && (
        <Card className="rounded-2xl mb-8" data-testid="dashboard-loading-state">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <Skeleton key={`dashboard-metric-loading-${idx}`} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-14 w-full rounded-xl" />
            <Skeleton className="h-14 w-full rounded-xl" />
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isDashboardLoading && dashboardError && (
        <Card className="rounded-xl border-destructive/30 mb-8" data-testid="dashboard-error-state">
          <CardContent className="p-6">
            <h3 className="text-sm font-semibold text-foreground">Could not load dashboard</h3>
            <p className="text-sm text-muted-foreground mt-1">{formatDashboardError(dashboardError)}</p>
          </CardContent>
        </Card>
      )}

      {selectedPropertyId !== "all" && !isDashboardLoading && !dashboardError && (
        <>
          {/* Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {metricCards.map((m, i) => (
              <motion.div
                key={m.label}
                className="rounded-2xl bg-card apple-shadow p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${m.color}15` }}>
                    <m.icon className="w-4 h-4" style={{ color: m.color }} />
                  </div>
                  <span className="text-sm text-muted-foreground">{m.label}</span>
                </div>
                <div className="text-2xl font-bold text-card-foreground mb-3">
                  {m.prefix}
                  {m.value.toLocaleString()}
                  {(m as { suffix?: string }).suffix || ""}
                </div>
                <div className="h-12">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={m.trend.map((v, j) => ({ v, x: j }))}>
                      <defs>
                        <linearGradient id={`g-${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={m.color} stopOpacity={0.2} />
                          <stop offset="100%" stopColor={m.color} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <Area
                        type="monotone"
                        dataKey="v"
                        stroke={m.color}
                        strokeWidth={2}
                        fill={`url(#g-${i})`}
                        dot={false}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Recent Activity */}
          <h2 className="text-lg font-semibold text-foreground mb-3">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <Card className="rounded-xl border-dashed" data-testid="dashboard-activity-empty-state">
              <CardContent className="p-8 text-center">
                <h3 className="text-base font-semibold text-foreground">No recent activity</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Recent bookings for this property will appear here.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="rounded-2xl bg-card apple-shadow divide-y divide-border">
              {recentActivity.map((booking, i) => {
                const normalizedStatus = booking.status === "ai_pending" ? "ai-pending" : booking.status;
                return (
                  <motion.div
                    key={booking.id}
                    className="flex items-center justify-between p-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                  >
                    <div>
                      <p className="font-medium text-card-foreground text-sm">{booking.guestName}</p>
                      <p className="text-xs text-muted-foreground">
                        {booking.checkIn} → {booking.checkOut}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {booking.aiHandled && (
                        <span className="px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                          AI Handled
                        </span>
                      )}
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          normalizedStatus === "confirmed"
                            ? "bg-success/10 text-success"
                            : normalizedStatus === "ai-pending"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent text-accent-foreground"
                        }`}
                      >
                        {normalizedStatus === "ai-pending"
                          ? "AI Pending"
                          : normalizedStatus.charAt(0).toUpperCase() + normalizedStatus.slice(1)}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
