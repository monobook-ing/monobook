import { useEffect, useState } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import { fetchServiceAnalytics, type ServiceAnalytics } from "@/lib/servicesApi";

function AnalyticsSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <Skeleton key={`analytics-skeleton-${idx}`} className="h-72 w-full rounded-2xl" />
      ))}
    </div>
  );
}

export function ServicesAnalytics() {
  const { selectedPropertyId } = useProperty();
  const [range, setRange] = useState("6m");
  const [analytics, setAnalytics] = useState<ServiceAnalytics>({
    revenueByMonth: [],
    attachRateByService: [],
    topServices: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setAnalytics({
          revenueByMonth: [],
          attachRateByService: [],
          topServices: [],
        });
        setError(null);
        setIsLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setAnalytics({
          revenueByMonth: [],
          attachRateByService: [],
          topServices: [],
        });
        setError("You are not authenticated. Please sign in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const nextAnalytics = await fetchServiceAnalytics(accessToken, selectedPropertyId, range);
        if (!active) return;
        setAnalytics(nextAnalytics);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load analytics";
        setAnalytics({
          revenueByMonth: [],
          attachRateByService: [],
          topServices: [],
        });
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [range, selectedPropertyId]);

  const upliftData = analytics.revenueByMonth.map((point) => ({
    month: point.month,
    uplift: +(point.revenue / 50).toFixed(1),
  }));

  if (selectedPropertyId === "all") {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-base font-semibold text-foreground">
            Select a property to view analytics
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to load analytics from the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) return <AnalyticsSkeleton />;

  if (error) {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Could not load analytics</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

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
        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Revenue from Services</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={analytics.revenueByMonth}>
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
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(211, 100%, 50%)"
                  strokeWidth={2}
                  fill="url(#revGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Attach Rate per Service</h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.attachRateByService}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="name" className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <YAxis className="text-xs" tick={{ fill: "hsl(240, 2%, 53%)" }} />
                <Tooltip />
                <Bar dataKey="rate" fill="hsl(142, 58%, 49%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

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
                <Area
                  type="monotone"
                  dataKey="uplift"
                  stroke="hsl(32, 95%, 55%)"
                  strokeWidth={2}
                  fill="url(#upliftGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          className="rounded-2xl bg-card apple-shadow p-5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.24 }}
        >
          <h3 className="text-sm font-semibold text-foreground mb-4">Top Performing Services</h3>
          <div className="space-y-3">
            {analytics.topServices.map((service, index) => (
              <div key={service.id} className="flex items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground w-5">{index + 1}</span>
                <img
                  src={service.imageUrl ?? ""}
                  alt={service.name}
                  className="w-9 h-9 rounded-lg object-cover bg-muted"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{service.name}</p>
                  <p className="text-xs text-muted-foreground">{service.attachRate}% attach</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  ${service.revenue30d.toLocaleString()}
                </p>
              </div>
            ))}
            {analytics.topServices.length === 0 && (
              <p className="text-sm text-muted-foreground">No analytics data yet.</p>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
}
