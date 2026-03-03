import { useState } from "react";
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
import {
  mockServices,
  mockServiceCategories,
  getCategoryName,
  serviceTypeLabel,
  statusColor,
  type ServiceType,
  type ServiceStatus,
} from "@/data/mockServiceData";
import { GuestPreviewModal } from "./GuestPreviewModal";

export function ServicesPage() {
  const navigate = useNavigate();
  const [view, setView] = useState<"table" | "card">("table");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewServiceId, setPreviewServiceId] = useState<string | null>(null);

  const filtered = mockServices.filter((s) => {
    if (search && !s.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (typeFilter !== "all" && s.type !== typeFilter) return false;
    if (categoryFilter !== "all" && s.categoryId !== categoryFilter) return false;
    if (statusFilter !== "all" && s.status !== statusFilter) return false;
    return true;
  });

  const openPreview = (id: string) => {
    setPreviewServiceId(id);
    setPreviewOpen(true);
  };

  if (mockServices.length === 0) {
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
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search services…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
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
          <SelectTrigger className="w-[150px] rounded-xl">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">All Categories</SelectItem>
            {mockServiceCategories.map((c) => (
              <SelectItem key={c.id} value={c.id}>
                {c.icon} {c.name}
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

      {/* Preview Guest button */}
      <div className="mb-4 flex justify-end">
        <Button
          variant="outline"
          size="sm"
          className="rounded-xl gap-1.5"
          onClick={() => {
            setPreviewServiceId(filtered[0]?.id ?? null);
            setPreviewOpen(true);
          }}
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
              {filtered.map((s, i) => (
                <motion.tr
                  key={s.id}
                  className="border-b transition-colors hover:bg-muted/50 cursor-pointer"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                  onClick={() => navigate(`/services/${s.id}`)}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <img
                        src={s.imageUrl}
                        alt={s.name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div>
                        <p className="font-medium text-foreground text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                          {s.shortDescription}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{serviceTypeLabel[s.type]}</TableCell>
                  <TableCell className="text-sm">{getCategoryName(s.categoryId)}</TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    ${s.price}
                  </TableCell>
                  <TableCell className="text-sm capitalize">
                    {s.availabilityType.replace("_", " ")}
                  </TableCell>
                  <TableCell className="text-right text-sm">{s.attachRate}%</TableCell>
                  <TableCell>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[s.status]}`}>
                      {s.status}
                    </span>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="rounded-xl">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); navigate(`/services/${s.id}/edit`); }}>
                          <Pencil className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()}>
                          <Copy className="w-4 h-4 mr-2" /> Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); openPreview(s.id); }}>
                          <Eye className="w-4 h-4 mr-2" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => e.stopPropagation()} className="text-destructive">
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
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              className="rounded-2xl bg-card apple-shadow overflow-hidden cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => navigate(`/services/${s.id}`)}
            >
              <div className="relative">
                <img src={s.imageUrl} alt={s.name} className="w-full h-40 object-cover" />
                <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColor[s.status]}`}>
                  {s.status}
                </span>
                {s.slots?.some((sl) => sl.booked >= sl.capacity) && (
                  <span className="absolute top-2 left-2 px-2.5 py-1 rounded-full text-xs font-medium bg-destructive/10 text-destructive">
                    Fully Booked
                  </span>
                )}
              </div>
              <div className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-foreground text-sm">{s.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{getCategoryName(s.categoryId)}</p>
                  </div>
                  <p className="text-sm font-bold text-foreground">${s.price}</p>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <Badge variant="secondary" className="rounded-lg text-xs">
                    {serviceTypeLabel[s.type]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {s.attachRate}% attach
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <GuestPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        serviceId={previewServiceId}
      />
    </>
  );
}
