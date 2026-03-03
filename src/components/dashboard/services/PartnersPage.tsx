import { useState } from "react";
import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { mockPartners, type Partner } from "@/data/mockServiceData";

export function PartnersPage() {
  const [partners, setPartners] = useState<Partner[]>([...mockPartners]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", revenueShare: "", status: "active" as "active" | "inactive" });

  const add = () => {
    if (!form.name.trim()) return;
    setPartners((prev) => [
      ...prev,
      {
        id: `ptr-${Date.now()}`,
        name: form.name,
        activeServices: 0,
        revenueSharePercent: Number(form.revenueShare) || 0,
        revenueGenerated: 0,
        status: form.status,
      },
    ]);
    setDialogOpen(false);
    setForm({ name: "", revenueShare: "", status: "active" });
  };

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
            {partners.map((p, i) => (
              <motion.tr
                key={p.id}
                className="border-b"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.04 }}
              >
                <TableCell className="font-medium text-sm">{p.name}</TableCell>
                <TableCell className="text-right text-sm">{p.activeServices}</TableCell>
                <TableCell className="text-right text-sm">{p.revenueSharePercent}%</TableCell>
                <TableCell className="text-right text-sm font-medium">${p.revenueGenerated.toLocaleString()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${
                      p.status === "active"
                        ? "bg-success/10 text-success"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {p.status}
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
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" placeholder="Company name" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Revenue Share %</Label>
              <Input type="number" value={form.revenueShare} onChange={(e) => setForm({ ...form, revenueShare: e.target.value })} className="rounded-xl mt-1 w-32" placeholder="15" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Status</Label>
              <Select value={form.status} onValueChange={(v: "active" | "inactive") => setForm({ ...form, status: v })}>
                <SelectTrigger className="rounded-xl mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full rounded-xl" onClick={add} disabled={!form.name.trim()}>
              Add Partner
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
