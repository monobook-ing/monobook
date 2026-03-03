import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutGrid,
  List,
  Search,
  MoreHorizontal,
  Copy,
  Pencil,
  Archive,
  Eye,
  Package,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { toast } from "sonner";
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import {
  createService,
  fetchServiceCategories,
  fetchServices,
  serviceTypeLabel,
  statusColor,
  updateService,
  type Service,
  type ServiceCategory,
} from "@/lib/servicesApi";
import { GuestPreviewModal } from "./GuestPreviewModal";

const formatServicesError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load services.";
  }
  return error;
};

const formatAvailability = (value: string) => {
  return value.replace(/_/g, " ");
};

function ServicesTableSkeleton() {
  return (
    <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
      <div className="p-4 space-y-3">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={`service-row-${idx}`} className="h-12 w-full" />
        ))}
      </div>
    </div>
  );
}

export function ServicesPage() {
  const navigate = useNavigate();
  const { selectedPropertyId } = useProperty();

  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewServiceId, setPreviewServiceId] = useState<string | null>(null);
  const [isMutating, setIsMutating] = useState(false);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setServices([]);
        setCategories([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setServices([]);
        setCategories([]);
        setError("missing_token");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const [nextServices, nextCategories] = await Promise.all([
          fetchServices(accessToken, selectedPropertyId),
          fetchServiceCategories(accessToken, selectedPropertyId),
        ]);
        if (!active) return;
        setServices(nextServices);
        setCategories(nextCategories);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load services";
        setServices([]);
        setCategories([]);
        setError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [selectedPropertyId]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const filtered = useMemo(() => {
    return services.filter((service) => {
      if (
        search &&
        !service.name.toLowerCase().includes(search.toLowerCase()) &&
        !service.shortDescription.toLowerCase().includes(search.toLowerCase())
      ) {
        return false;
      }
      if (typeFilter !== "all" && service.type !== typeFilter) return false;
      if (categoryFilter !== "all" && service.categoryId !== categoryFilter) return false;
      if (statusFilter !== "all" && service.status !== statusFilter) return false;
      return true;
    });
  }, [categoryFilter, search, services, statusFilter, typeFilter]);

  const previewService = filtered.find((service) => service.id === previewServiceId) ?? null;

  const getCategoryName = (service: Service) => {
    if (service.categoryName) return service.categoryName;
    if (!service.categoryId) return "—";
    return categoryById.get(service.categoryId)?.name ?? "—";
  };

  const openPreview = (id: string) => {
    setPreviewServiceId(id);
    setPreviewOpen(true);
  };

  const handleDuplicate = async (service: Service) => {
    if (selectedPropertyId === "all") return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsMutating(true);
    try {
      const duplicated = await createService(accessToken, selectedPropertyId, {
        name: `${service.name} Copy`,
        shortDescription: service.shortDescription,
        fullDescription: service.fullDescription,
        imageUrls: service.imageUrls,
        type: service.type,
        categoryId: service.categoryId,
        partnerId: service.partnerId,
        status: "draft",
        visibility: service.visibility,
        pricingType: service.pricingType,
        price: service.price,
        currencyCode: service.currencyCode,
        vatPercent: service.vatPercent,
        allowDiscount: service.allowDiscount,
        bundleEligible: service.bundleEligible,
        availabilityType: service.availabilityType,
        capacityMode: service.capacityMode,
        capacityLimit: service.capacityLimit,
        recurringScheduleEnabled: service.recurringScheduleEnabled,
        availableBeforeBooking: service.availableBeforeBooking,
        availableDuringBooking: service.availableDuringBooking,
        postBookingUpsell: service.postBookingUpsell,
        inStayQrOrdering: service.inStayQrOrdering,
        upsellTriggerRoomType: service.upsellTriggerRoomType,
        earlyBookingDiscountPercent: service.earlyBookingDiscountPercent,
        knowledgeLanguage: service.knowledgeLanguage,
        knowledgeAiSearchEnabled: service.knowledgeAiSearchEnabled,
        attachRate: service.attachRate,
        totalBookings: 0,
        revenue30d: 0,
        conversionRate: service.conversionRate,
        slots: service.slots.map((slot, index) => ({
          time: slot.time,
          capacity: slot.capacity,
          booked: 0,
          sortOrder: index,
        })),
      });
      setServices((current) => [...current, duplicated]);
      toast.success(`Duplicated "${service.name}"`);
    } catch (duplicateError) {
      const message =
        duplicateError instanceof Error ? duplicateError.message : "Failed to duplicate service";
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  };

  const handleArchive = async (service: Service) => {
    if (selectedPropertyId === "all") return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsMutating(true);
    try {
      const updated = await updateService(accessToken, selectedPropertyId, service.id, {
        status: "hidden",
      });
      setServices((current) =>
        current.map((item) => (item.id === updated.id ? updated : item))
      );
      toast.success(`Archived "${service.name}"`);
    } catch (archiveError) {
      const message =
        archiveError instanceof Error ? archiveError.message : "Failed to archive service";
      toast.error(message);
    } finally {
      setIsMutating(false);
    }
  };

  if (selectedPropertyId === "all") {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-base font-semibold text-foreground">
            Select a property to view services
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to load services from the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ServicesTableSkeleton />;
  }

  if (error) {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Could not load services</h3>
          <p className="text-sm text-muted-foreground mt-1">{formatServicesError(error)}</p>
        </CardContent>
      </Card>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-1">No services yet</h3>
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">
          Create your first service or add-on to start upselling to guests.
        </p>
        <Button className="rounded-xl" onClick={() => navigate("/services/new")}>
          Create Service
        </Button>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pl-9 rounded-xl"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] rounded-xl">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="internal">Internal</SelectItem>
            <SelectItem value="partner">Partner</SelectItem>
            <SelectItem value="product">Product</SelectItem>
          </SelectContent>
        </Select>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[170px] rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.icon} {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[120px] rounded-xl">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="hidden">Hidden</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 p-1 rounded-xl bg-muted/60">
          <button
            onClick={() => setView("table")}
            className={`p-1.5 rounded-lg transition-colors ${view === "table" ? "bg-card apple-shadow text-foreground" : "text-muted-foreground"}`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setView("card")}
            className={`p-1.5 rounded-lg transition-colors ${view === "card" ? "bg-card apple-shadow text-foreground" : "text-muted-foreground"}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => {
            setPreviewServiceId(filtered[0]?.id ?? null);
            setPreviewOpen(true);
          }}
          disabled={filtered.length === 0}
        >
          <Eye className="w-4 h-4" />
          Preview Guest Experience
        </Button>
      </div>

      {view === "table" ? (
        <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Service</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="text-right">Attach Rate</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((service, index) => (
                <motion.tr
                  key={service.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.03 }}
                  onClick={() => navigate(`/services/${service.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={service.imageUrls[0] ?? ""}
                        alt={service.name}
                        className="w-10 h-10 rounded-xl object-cover bg-muted"
                      />
                      <div>
                        <p className="font-medium text-foreground text-sm">{service.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[220px]">
                          {service.shortDescription}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{serviceTypeLabel[service.type]}</TableCell>
                  <TableCell className="text-sm">{getCategoryName(service)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${service.price}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {formatAvailability(service.availabilityType)}
                  </TableCell>
                  <TableCell className="text-right text-sm">{service.attachRate}%</TableCell>
                  <TableCell>
                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[service.status]}`}
                    >
                      {service.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(event) => event.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            navigate(`/services/${service.id}/edit`);
                          }}
                        >
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDuplicate(service);
                          }}
                          disabled={isMutating}
                        >
                          <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            openPreview(service.id);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleArchive(service);
                          }}
                          className="text-destructive"
                          disabled={isMutating || service.status === "hidden"}
                        >
                          <Archive className="w-4 h-4 mr-2" /> Archive
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((service, index) => (
            <motion.div
              key={service.id}
              className="rounded-2xl bg-card apple-shadow overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => navigate(`/services/${service.id}`)}
            >
              <div className="relative">
                <img
                  src={service.imageUrls[0] ?? ""}
                  alt={service.name}
                  className="w-full h-40 object-cover bg-muted"
                />
                <span
                  className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[service.status]}`}
                >
                  {service.status}
                </span>
                {service.slots.some((slot) => slot.booked >= slot.capacity && slot.capacity > 0) && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                    Fully Booked
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{service.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {getCategoryName(service)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-foreground">${service.price}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="rounded-lg text-xs">
                    {serviceTypeLabel[service.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{service.attachRate}% attach</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <GuestPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        service={previewService}
      />
    </>
  );
}
