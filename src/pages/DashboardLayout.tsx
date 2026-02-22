import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, Settings, ScrollText, MessageSquare, ChevronsUpDown, LogOut, CircleHelp, ArrowUpCircle, BedDouble, Building2, Check, Plus, Trash2, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PropertyProvider, useProperty } from "@/contexts/PropertyContext";
import type { Property } from "@/data/mockPropertyData";

const navItems = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/inventory", label: "Inventory", icon: CalendarDays },
  { id: "/rooms", label: "Rooms", icon: BedDouble },
  { id: "/settings", label: "Settings", icon: Settings },
  { id: "/audit", label: "Audit Log", icon: ScrollText },
];

function ManagePropertiesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { properties, setProperties } = useProperty();
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState("");

  const addProperty = () => {
    if (!newName.trim()) return;
    const prop: Property = { id: `prop-${Date.now()}`, name: newName.trim(), address: newAddress.trim() };
    setProperties((prev) => [...prev, prop]);
    setNewName("");
    setNewAddress("");
  };

  const deleteProperty = (id: string) => setProperties((prev) => prev.filter((p) => p.id !== id));

  const startEdit = (p: Property) => { setEditId(p.id); setEditName(p.name); setEditAddress(p.address); };
  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    setProperties((prev) => prev.map((p) => p.id === editId ? { ...p, name: editName.trim(), address: editAddress.trim() } : p));
    setEditId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>Manage Properties</DialogTitle>
          <DialogDescription>Add, edit, or remove your properties</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {properties.map((p) => (
            <div key={p.id} className="flex items-center gap-2 p-2.5 border rounded-xl">
              {editId === p.id ? (
                <div className="flex-1 space-y-1.5">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 rounded-lg text-sm" />
                  <Input value={editAddress} onChange={(e) => setEditAddress(e.target.value)} className="h-8 rounded-lg text-sm" placeholder="Address" />
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 rounded-lg text-xs" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.address}</p>
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => startEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => deleteProperty(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Add Property</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Property name" className="rounded-xl" />
          <Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address" className="rounded-xl" />
          <Button onClick={addProperty} disabled={!newName.trim()} className="w-full rounded-xl gap-1.5" size="sm">
            <Plus className="w-3.5 h-3.5" /> Add Property
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function PropertySwitcher() {
  const { selectedPropertyId, setSelectedPropertyId, properties } = useProperty();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const label = selectedProperty?.name || "All Properties";

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors text-left min-h-[44px]">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground truncate leading-tight">{label}</p>
              {selectedProperty && <p className="text-[10px] text-muted-foreground truncate">{selectedProperty.address.split(",")[0]}</p>}
            </div>
            <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className="w-56 rounded-2xl p-1.5">
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[40px] ${selectedPropertyId === "all" ? "bg-secondary font-medium" : ""}`}
            onClick={() => { setSelectedPropertyId("all"); setPopoverOpen(false); }}
          >
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-left">All Properties</span>
            {selectedPropertyId === "all" && <Check className="w-4 h-4 text-primary" />}
          </button>
          <Separator className="my-1" />
          {properties.map((p) => (
            <button
              key={p.id}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[40px] ${selectedPropertyId === p.id ? "bg-secondary font-medium" : ""}`}
              onClick={() => { setSelectedPropertyId(p.id); setPopoverOpen(false); }}
            >
              <Building2 className="w-4 h-4 text-muted-foreground" />
              <span className="flex-1 text-left truncate">{p.name}</span>
              {selectedPropertyId === p.id && <Check className="w-4 h-4 text-primary" />}
            </button>
          ))}
          <Separator className="my-1" />
          <button
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors text-muted-foreground min-h-[40px]"
            onClick={() => { setManageOpen(true); setPopoverOpen(false); }}
          >
            <Settings className="w-4 h-4" />
            Manage Properties
          </button>
        </PopoverContent>
      </Popover>
      <ManagePropertiesDialog open={manageOpen} onOpenChange={setManageOpen} />
    </>
  );
}

function DashboardInner() {
  const location = useLocation();
  const navigate = useNavigate();
  const activeTab = navItems.find((item) => item.id === location.pathname)?.id || "/dashboard";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-col glass border-r border-border p-4 fixed inset-y-0 left-0 z-30">
        <div className="flex items-center gap-2 mb-2 px-2">
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <h2 className="font-bold text-foreground text-xs tracking-tight">StayAI</h2>
        </div>

        {/* Property Switcher */}
        <div className="mb-6">
          <PropertySwitcher />
        </div>

        <nav className="space-y-1 flex-1">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                activeTab === item.id
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              }`}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(item.id)}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </motion.button>
          ))}
        </nav>

        {/* User Footer */}
        <Popover>
          <PopoverTrigger asChild>
            <button className="mt-auto flex items-center gap-3 w-full px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors min-h-[44px]">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">SA</AvatarFallback>
              </Avatar>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground leading-tight">StayAI Hotel</p>
                <p className="text-[10px] text-muted-foreground">Pro plan</p>
              </div>
              <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent side="top" align="start" className="w-56 rounded-2xl p-1.5">
            <div className="px-3 py-2">
              <p className="text-xs text-muted-foreground">admin@stayai.com</p>
            </div>
            <Separator />
            <button onClick={() => navigate("/settings")} className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[44px]">
              <Settings className="w-4 h-4" /> Settings
            </button>
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[44px]">
              <CircleHelp className="w-4 h-4" /> Get help
            </button>
            <Separator />
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[44px]">
              <ArrowUpCircle className="w-4 h-4" /> Upgrade plan
            </button>
            <Separator />
            <button className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary text-destructive transition-colors min-h-[44px]">
              <LogOut className="w-4 h-4" /> Log out
            </button>
          </PopoverContent>
        </Popover>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 pb-24 md:pb-6">
        <div className="max-w-4xl mx-auto p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 glass-strong border-t border-border z-30">
        <div className="flex items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] min-h-[44px] ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.id)}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function DashboardLayout() {
  return (
    <PropertyProvider>
      <DashboardInner />
    </PropertyProvider>
  );
}
