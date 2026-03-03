import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, DollarSign, TrendingUp, ShoppingCart, Percent, Pencil } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  mockServices,
  mockServiceBookings,
  getCategoryName,
  serviceTypeLabel,
  statusColor,
} from "@/data/mockServiceData";

const detailTabs = ["Overview", "Bookings", "Analytics", "Settings"];

export function ServiceDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tab, setTab] = useState("Overview");

  const service = mockServices.find((s) => s.id === id);
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

  const bookings = mockServiceBookings.filter((b) => b.serviceId === service.id);

  const stats = [
    { label: "Revenue (30d)", value: `$${service.revenue30d.toLocaleString()}`, icon: DollarSign, color: "hsl(142, 58%, 49%)" },
    { label: "Attach Rate", value: `${service.attachRate}%`, icon: TrendingUp, color: "hsl(211, 100%, 50%)" },
    { label: "Total Bookings", value: service.totalBookings, icon: ShoppingCart, color: "hsl(32, 95%, 55%)" },
    { label: "Conversion", value: `${service.conversionRate}%`, icon: Percent, color: "hsl(280, 70%, 55%)" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => navigate("/services")}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground truncate">{service.name}</h1>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[service.status]}`}>
              {service.status}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            {serviceTypeLabel[service.type]} · {getCategoryName(service.categoryId)}
          </p>
        </div>
        <Button className="rounded-xl gap-1.5" size="sm" onClick={() => navigate(`/services/${service.id}/edit`)}>
          <Pencil className="w-4 h-4" /> Edit
        </Button>
      </div>

      {/* Image + stats */}
      <div className="rounded-2xl overflow-hidden mb-6">
        <img src={service.imageUrl} alt={service.name} className="w-full h-48 object-cover" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card apple-shadow p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${s.color}15` }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
              </div>
            </div>
            <p className="text-lg font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit mb-6">
        {detailTabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              tab === t
                ? "bg-card text-foreground apple-shadow"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
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
              ${service.price} / {service.pricingType.replace("_", " ")} · VAT {service.vatPercent}%
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-1">Availability</h3>
            <p className="text-sm text-muted-foreground capitalize">{service.availabilityType.replace("_", " ")}</p>
            {service.slots && (
              <div className="flex flex-wrap gap-2 mt-2">
                {service.slots.map((sl) => (
                  <span
                    key={sl.id}
                    className={`px-2.5 py-1 rounded-lg border text-xs ${
                      sl.booked >= sl.capacity
                        ? "bg-destructive/10 text-destructive border-destructive/20"
                        : "bg-muted"
                    }`}
                  >
                    {sl.time} ({sl.booked}/{sl.capacity})
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
                bookings.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="text-sm font-mono">{b.id}</TableCell>
                    <TableCell className="text-sm">{b.guestName}</TableCell>
                    <TableCell className="text-sm">{b.date}</TableCell>
                    <TableCell className="text-sm text-right">{b.quantity}</TableCell>
                    <TableCell className="text-sm text-right font-medium">${b.total}</TableCell>
                    <TableCell>
                      <span
                        className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                          b.status === "confirmed"
                            ? "bg-success/10 text-success"
                            : b.status === "pending"
                            ? "bg-primary/10 text-primary"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {b.status}
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
          <p className="text-muted-foreground text-sm">Analytics charts coming soon</p>
        </div>
      )}

      {tab === "Settings" && (
        <div className="rounded-2xl bg-card apple-shadow p-5 text-center py-16">
          <p className="text-muted-foreground text-sm">Service settings coming soon</p>
        </div>
      )}
    </motion.div>
  );
}
