import { useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  mockServiceRevenueByMonth,
  mockAttachRateByService,
  mockServices,
} from "@/data/mockServiceData";

export function ServicesAnalytics() {
  const [range, setRange] = useState("6m");

  const topServices = [...mockServices]
    .sort((a, b) => b.revenue30d - a.revenue30d)
    .slice(0, 5);

  const upliftData = mockServiceRevenueByMonth.map((d) => ({
    month: d.month,
    uplift: +(d.revenue / 50).toFixed(1),
  }));

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-[120px] rounded-xl">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="3m">3 Months</SelectItem>
            <SelectItem value="6m">6 Months</SelectItem>
            <SelectItem value="1y">1 Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue */}
        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue from Services</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={mockServiceRevenueByMonth}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(211, 100%, 50%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <Tooltip />
                <Area type="monotone" dataKey="revenue" stroke="hsl(211, 100%, 50%)" strokeWidth={2} fill="url(#revGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Attach rate */}
        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Attach Rate per Service</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={mockAttachRateByService}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <Tooltip />
                <Bar dataKey="rate" fill="hsl(142, 58%, 49%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Uplift */}
        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue per Booking Uplift</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={upliftData}>
                <defs>
                  <linearGradient id="upliftGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0.2} />
                    <stop offset="100%" stopColor="hsl(32, 95%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="month" className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <Tooltip />
                <Area type="monotone" dataKey="uplift" stroke="hsl(32, 95%, 55%)" strokeWidth={2} fill="url(#upliftGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Top performing */}
        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Performing Services</h3>
          <div className="space-y-3">
            {topServices.map((s, i) => (
              <div key={s.id} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground w-5">{i + 1}</span>
                <img src={s.imageUrl} alt={s.name} className="w-9 h-9 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.attachRate}% attach</p>
                </div>
                <p className="text-sm font-semibold text-foreground">${s.revenue30d.toLocaleString()}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </>
  );
}
