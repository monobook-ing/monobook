import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import {
  createServicePartner,
  fetchServicePartners,
  type PartnerStatus,
  type ServicePartner,
} from "@/lib/servicesApi";
import { toast } from "sonner";

export function PartnersPage() {
  const { selectedPropertyId } = useProperty();
  const [partners, setPartners] = useState<ServicePartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [form, setForm] = useState({
    name: "",
    revenueShare: "",
    status: "active" as PartnerStatus,
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setPartners([]);
        setError(null);
        setIsLoading(false);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setPartners([]);
        setError("You are not authenticated. Please sign in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const items = await fetchServicePartners(accessToken, selectedPropertyId);
        if (!active) return;
        setPartners(items);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load partners";
        setPartners([]);
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

  const add = async () => {
    if (!form.name.trim() || selectedPropertyId === "all") return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsSaving(true);
    try {
      const created = await createServicePartner(accessToken, selectedPropertyId, {
        name: form.name.trim(),
        revenueSharePercent: Number(form.revenueShare) || 0,
        payoutType: "manual",
        status: form.status,
      });
      setPartners((current) => [...current, created]);
      setDialogOpen(false);
      setForm({ name: "", revenueShare: "", status: "active" });
      toast.success("Partner added");
    } catch (addError) {
      const message = addError instanceof Error ? addError.message : "Failed to add partner";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (selectedPropertyId === "all") {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-base font-semibold text-foreground">
            Select a property to manage partners
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to load partners from the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={`partner-skeleton-${idx}`} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Could not load partners</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-end mb-4">
        <Button size="sm" className="rounded-xl gap-1.5" onClick={() => setDialogOpen(true)}>
          <Plus className="w-4 h-4" /> Add Partner
        </Button>
      </div>

      <div className="rounded-2xl bg-card apple-shadow overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Partner Name</TableHead>
              <TableHead className="text-right">Active Services</TableHead>
              <TableHead className="text-right">Revenue Share</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {partners.map((partner, index) => (
              <motion.tr
                key={partner.id}
                className="border-b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: index * 0.04 }}
              >
                <TableCell className="font-medium text-sm">{partner.name}</TableCell>
                <TableCell className="text-right text-sm">{partner.activeServices}</TableCell>
                <TableCell className="text-right text-sm">{partner.revenueSharePercent}%</TableCell>
                <TableCell className="text-right text-sm font-medium">
                  ${partner.revenueGenerated.toLocaleString()}
                </TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      partner.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {partner.status}
                  </span>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add Partner</DialogTitle>
            <DialogDescription>Register a new service partner</DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-semibold">Partner Name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="rounded-xl mt-1"
                placeholder="Company name"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Revenue Share %</Label>
              <Input
                type="number"
                value={form.revenueShare}
                onChange={(event) => setForm({ ...form, revenueShare: event.target.value })}
                className="rounded-xl mt-1 w-32"
                placeholder="15"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Status</Label>
              <Select
                value={form.status}
                onValueChange={(value: PartnerStatus) => setForm({ ...form, status: value })}
              >
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                void add();
              }}
              disabled={!form.name.trim() || isSaving}
            >
              Add Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
