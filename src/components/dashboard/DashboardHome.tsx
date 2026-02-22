import { motion } from "framer-motion";
import { TrendingUp, DollarSign, BarChart3, Percent } from "lucide-react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { mockDashboardMetrics, mockBookings } from "@/data/mockData";

const metrics = [
  {
    label: "AI Direct Bookings",
    value: mockDashboardMetrics.aiDirectBookings,
    prefix: "",
    icon: TrendingUp,
    trend: mockDashboardMetrics.aiDirectBookingsTrend,
    color: "hsl(211, 100%, 50%)",
  },
  {
    label: "Commission Saved",
    value: mockDashboardMetrics.commissionSaved,
    prefix: "$",
    icon: DollarSign,
    trend: mockDashboardMetrics.commissionSavedTrend,
    color: "hsl(142, 58%, 49%)",
  },
  {
    label: "Occupancy Rate",
    value: mockDashboardMetrics.occupancyRate,
    prefix: "",
    suffix: "%",
    icon: Percent,
    trend: mockDashboardMetrics.occupancyTrend,
    color: "hsl(32, 95%, 55%)",
  },
  {
    label: "Revenue",
    value: mockDashboardMetrics.revenue,
    prefix: "$",
    icon: BarChart3,
    trend: mockDashboardMetrics.revenueTrend,
    color: "hsl(280, 70%, 55%)",
  },
];

export function DashboardHome() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Dashboard</h1>
      <p className="text-sm text-muted-foreground mb-6">Your AI agent performance overview</p>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {metrics.map((m, i) => (
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
              {(m as any).suffix || ""}
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
      <div className="rounded-2xl bg-card apple-shadow divide-y divide-border">
        {mockBookings.map((booking, i) => (
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
                  booking.status === "confirmed"
                    ? "bg-success/10 text-success"
                    : booking.status === "ai-pending"
                    ? "bg-primary/10 text-primary"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {booking.status === "ai-pending" ? "AI Pending" : booking.status.charAt(0).toUpperCase() + booking.status.slice(1)}
              </span>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
