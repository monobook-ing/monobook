import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Percent,
  Pencil,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import {
  fetchServiceBookings,
  fetchServiceById,
  serviceTypeLabel,
  statusColor,
  type Service,
  type ServiceBooking,
} from "@/lib/servicesApi";

const detailTabs = ["Overview", "Bookings", "Analytics", "Settings"];

function ServiceDetailSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-11 w-full max-w-md" />
      <Skeleton className="h-52 w-full rounded-2xl" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, idx) => (
          <Skeleton key={`svc-stat-${idx}`} className="h-24 w-full rounded-2xl" />
        ))}
      </div>
      <Skeleton className="h-10 w-80" />
      <Skeleton className="h-52 w-full rounded-2xl" />
    </div>
  );
}

export function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedPropertyId } = useProperty();
  const [tab, setTab] = useState("Overview");

  const [service, setService] = useState<Service | null>(null);
  const [bookings, setBookings] = useState<ServiceBooking[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!id || selectedPropertyId === "all") {
        if (!active) return;
        setService(null);
        setBookings([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setError("You are not authenticated. Please sign in again.");
        setService(null);
        setBookings([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [nextService, nextBookings] = await Promise.all([
          fetchServiceById(accessToken, selectedPropertyId, id),
          fetchServiceBookings(accessToken, selectedPropertyId, id),
        ]);
        if (!active) return;
        setService(nextService);
        setBookings(nextBookings);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load service details";
        setError(message);
        setService(null);
        setBookings([]);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, selectedPropertyId]);

  if (selectedPropertyId === "all") {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-base font-semibold text-foreground">
            Select a property to view service details
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to load details from the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ServiceDetailSkeleton />;
  }

  if (error) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">{error}</p>
        <Button variant="outline" className="rounded-xl mt-4" onClick={() => navigate("/services")}>
          Back to Services
        </Button>
      </div>
    );
  }

  if (!service) {
    return (
      <div className="py-20 text-center">
        <p className="text-muted-foreground">Service not found.</p>
        <Button variant="outline" className="rounded-xl mt-4" onClick={() => navigate("/services")}>
          Back to Services
        </Button>
      </div>
    );
  }

  const stats = [
    {
      label: "Revenue (30d)",
      value: `$${service.revenue30d.toLocaleString()}`,
      icon: DollarSign,
      color: "hsl(142, 58%, 49%)",
    },
    {
      label: "Attach Rate",
      value: `${service.attachRate}%`,
      icon: TrendingUp,
      color: "hsl(211, 100%, 50%)",
    },
    {
      label: "Total Bookings",
      value: service.totalBookings,
      icon: ShoppingCart,
      color: "hsl(32, 95%, 55%)",
    },
    {
      label: "Conversion",
      value: `${service.conversionRate}%`,
      icon: Percent,
      color: "hsl(280, 70%, 55%)",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/services")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground truncate">{service.name}</h1>
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[service.status]}`}
            >
              {service.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {serviceTypeLabel[service.type]} · {service.categoryName ?? "—"}
          </p>
        </div>
        <Button className="rounded-xl gap-1.5" size="sm" onClick={() => navigate(`/services/${service.id}/edit`)}>
          <Pencil className="w-4 h-4" /> Edit
        </Button>
      </div>

      <div className="rounded-2xl overflow-hidden mb-6">
        <img
          src={service.imageUrls[0] ?? ""}
          alt={service.name}
          className="w-full h-48 object-cover bg-muted"
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl bg-card apple-shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}15` }}
              >
                <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">{stat.value}</p>
            <p className="text-xs text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit mb-6">
        {detailTabs.map((label) => (
          <button
            key={label}
            onClick={() => setTab(label)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === label
                ? "bg-card text-foreground apple-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="rounded-2xl bg-card apple-shadow p-5 space-y-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Description</h3>
            <p className="text-sm text-muted-foreground">{service.fullDescription}</p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Pricing</h3>
            <p className="text-sm text-muted-foreground">
              ${service.price} / {service.pricingType.replace(/_/g, " ")} · VAT {service.vatPercent}%
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Availability</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {service.availabilityType.replace(/_/g, " ")}
            </p>
            {service.slots.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {service.slots.map((slot) => (
                  <span
                    key={slot.id}
                    className={`px-2.5 py-1 rounded-lg border text-xs ${
                      slot.booked >= slot.capacity && slot.capacity > 0
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted"
                    }`}
                  >
                    {slot.time} ({slot.booked}/{slot.capacity})
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "Bookings" && (
        <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Booking ID</TableHead>
                <TableHead>Guest</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Qty</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground py-10">
                    No bookings yet
                  </TableCell>
                </TableRow>
              ) : (
                bookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="text-sm font-mono">{booking.externalRef}</TableCell>
                    <TableCell className="text-sm">{booking.guestName}</TableCell>
                    <TableCell className="text-sm">{booking.serviceDate}</TableCell>
                    <TableCell className="text-sm text-right">{booking.quantity}</TableCell>
                    <TableCell className="text-sm text-right font-medium">${booking.total}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          booking.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : booking.status === "pending"
                              ? "bg-primary/10 text-primary"
                              : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {booking.status}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {tab === "Analytics" && (
        <div className="rounded-2xl bg-card apple-shadow p-5 text-center py-16">
          <p className="text-muted-foreground text-sm">
            Use the Services Analytics tab for full charts.
          </p>
        </div>
      )}

      {tab === "Settings" && (
        <div className="rounded-2xl bg-card apple-shadow p-5 text-center py-16">
          <p className="text-muted-foreground text-sm">
            Service settings are managed in Edit Service.
          </p>
        </div>
      )}
    </motion.div>
  );
}
