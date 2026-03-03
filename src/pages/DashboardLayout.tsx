import { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { LayoutDashboard, CalendarDays, Settings, MessageSquare, ChevronsUpDown, LogOut, CircleHelp, ArrowUpCircle, BedDouble, Building2, Check, Plus, Trash2, Pencil, Loader2, Users, ChevronsLeft, ChevronsRight, PanelLeft, PanelRight, Download } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { PropertyProvider, useProperty } from "@/contexts/PropertyContext";
import { NotificationsProvider, useNotifications } from "@/contexts/NotificationsContext";
import { type Property, type PropertyAddress, formatAddress, formatAddressShort } from "@/data/mockPropertyData";
import { clearAuthStorage, hydrateSessionFromStorage, readUserMe, type UserMe } from "@/lib/auth";
import { useIsMobile } from "@/hooks/use-mobile";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const emptyAddress: PropertyAddress = { street: "", city: "", state: "", postalCode: "", country: "" };

const navItems = [
  { id: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "/inventory", label: "Inventory", icon: CalendarDays },
  { id: "/rooms", label: "Rooms", icon: BedDouble },
  { id: "/guests", label: "Guests", icon: Users },
  { id: "/settings", label: "Settings", icon: Settings },
];
const SIDEBAR_COLLAPSED_STORAGE_KEY = "dashboard_sidebar_collapsed";
const aiLayerCards = [
  {
    title: "Direct AI Booking",
    description: "Capture direct demand with an AI journey that helps guests book faster.",
  },
  {
    title: "AI Concierge",
    description: "Answer guest questions instantly and guide every stay from pre-arrival to checkout.",
  },
  {
    title: "Revenue Automation",
    description: "Continuously optimize rates and upsells with adaptive automation.",
  },
  {
    title: "Knowledge Base",
    description: "Centralize policies and property know-how so AI responses stay accurate.",
  },
];

const readStoredSidebarCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
};

function AddressFields({ value, onChange, size = "default" }: { value: PropertyAddress; onChange: (a: PropertyAddress) => void; size?: "default" | "sm" }) {
  const cls = size === "sm" ? "h-8 rounded-lg text-sm" : "rounded-xl";
  const update = (field: keyof PropertyAddress, v: string) => onChange({ ...value, [field]: v });
  const updateNum = (field: "lat" | "lng", v: string) => onChange({ ...value, [field]: v ? parseFloat(v) : undefined });

  return (
    <div className="space-y-1.5">
      <Input value={value.street} onChange={(e) => update("street", e.target.value)} placeholder="Street address" className={cls} />
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={value.city} onChange={(e) => update("city", e.target.value)} placeholder="City" className={cls} />
        <Input value={value.state} onChange={(e) => update("state", e.target.value)} placeholder="State/Region" className={cls} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Input value={value.postalCode} onChange={(e) => update("postalCode", e.target.value)} placeholder="Postal code" className={cls} />
        <Input value={value.country} onChange={(e) => update("country", e.target.value)} placeholder="Country" className={cls} />
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        <Input type="number" step="any" value={value.lat ?? ""} onChange={(e) => updateNum("lat", e.target.value)} placeholder="Latitude" className={cls} />
        <Input type="number" step="any" value={value.lng ?? ""} onChange={(e) => updateNum("lng", e.target.value)} placeholder="Longitude" className={cls} />
      </div>
      <div className="grid grid-cols-3 gap-1.5">
        <Input value={value.floor ?? ""} onChange={(e) => update("floor", e.target.value)} placeholder="Floor" className={cls} />
        <Input value={value.section ?? ""} onChange={(e) => update("section", e.target.value)} placeholder="Section" className={cls} />
        <Input value={value.propertyNumber ?? ""} onChange={(e) => update("propertyNumber", e.target.value)} placeholder="Unit #" className={cls} />
      </div>
    </div>
  );
}

function ManagePropertiesDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { properties, setProperties } = useProperty();
  const [newName, setNewName] = useState("");
  const [newAddress, setNewAddress] = useState<PropertyAddress>({ ...emptyAddress });
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editAddress, setEditAddress] = useState<PropertyAddress>({ ...emptyAddress });

  const addProperty = () => {
    if (!newName.trim()) return;
    const prop: Property = { id: `prop-${Date.now()}`, name: newName.trim(), address: { ...newAddress } };
    setProperties((prev) => [...prev, prop]);
    setNewName("");
    setNewAddress({ ...emptyAddress });
  };

  const deleteProperty = (id: string) => setProperties((prev) => prev.filter((p) => p.id !== id));

  const startEdit = (p: Property) => { setEditId(p.id); setEditName(p.name); setEditAddress({ ...p.address }); };
  const saveEdit = () => {
    if (!editId || !editName.trim()) return;
    setProperties((prev) => prev.map((p) => p.id === editId ? { ...p, name: editName.trim(), address: { ...editAddress } } : p));
    setEditId(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Properties</DialogTitle>
          <DialogDescription>Add, edit, or remove your properties</DialogDescription>
        </DialogHeader>
        <div className="space-y-3 mt-2">
          {properties.map((p) => (
            <div key={p.id} className="p-2.5 border rounded-xl">
              {editId === p.id ? (
                <div className="space-y-1.5">
                  <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="h-8 rounded-lg text-sm" placeholder="Name" />
                  <AddressFields value={editAddress} onChange={setEditAddress} size="sm" />
                  <div className="flex gap-1.5">
                    <Button size="sm" className="h-7 rounded-lg text-xs" onClick={saveEdit}>Save</Button>
                    <Button size="sm" variant="ghost" className="h-7 rounded-lg text-xs" onClick={() => setEditId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{formatAddressShort(p.address)}</p>
                    {(p.address.floor || p.address.section || p.address.propertyNumber) && (
                      <p className="text-[10px] text-muted-foreground">
                        {[p.address.floor && `Floor: ${p.address.floor}`, p.address.section && `Section: ${p.address.section}`, p.address.propertyNumber && `#${p.address.propertyNumber}`].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => startEdit(p)}>
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0 text-destructive" onClick={() => deleteProperty(p.id)}>
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
        <Separator />
        <div className="space-y-2">
          <Label className="text-xs font-semibold">Add Property</Label>
          <Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Property name" className="rounded-xl" />
          <AddressFields value={newAddress} onChange={setNewAddress} />
          <Button onClick={addProperty} disabled={!newName.trim()} className="w-full rounded-xl gap-1.5" size="sm">
            <Plus className="w-3.5 h-3.5" /> Add Property
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function PropertySwitcher({
  className,
  compact = false,
  collapsed = false,
  testIdPrefix = "property-switcher",
}: {
  className?: string;
  compact?: boolean;
  collapsed?: boolean;
  testIdPrefix?: string;
}) {
  const { selectedPropertyId, setSelectedPropertyId, properties, isPropertiesLoading, propertiesError } = useProperty();
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [manageOpen, setManageOpen] = useState(false);
  const isManageDisabled = true;

  const selectedProperty = properties.find((p) => p.id === selectedPropertyId);
  const label = selectedProperty?.name || "All Properties";

  return (
    <>
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger asChild>
          <button
            data-testid={`${testIdPrefix}-trigger`}
            aria-label={collapsed ? "Property switcher" : undefined}
            className={`w-full flex items-center rounded-xl hover:bg-secondary transition-colors text-left min-h-[44px] ${collapsed ? "justify-center px-2 py-2" : `gap-2.5 ${compact ? "px-2.5 py-2" : "px-3 py-2.5"}`} ${className ?? ""}`}
          >
            <div className="w-5 h-5 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4 text-primary" />
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  {isPropertiesLoading ? (
                    <div className="space-y-1" data-testid={`${testIdPrefix}-trigger-skeleton`}>
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-semibold text-foreground truncate leading-tight">{label}</p>
                      {selectedProperty && <p className="text-[10px] text-muted-foreground truncate">{formatAddressShort(selectedProperty.address)}</p>}
                    </>
                  )}
                </div>
                <ChevronsUpDown className="w-4 h-4 text-muted-foreground shrink-0" />
              </>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent side="bottom" align="start" className={`w-56 rounded-2xl ${compact ? "p-1" : "p-1.5"}`}>
          <button
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary transition-colors min-h-[40px] ${selectedPropertyId === "all" ? "bg-secondary font-medium" : ""}`}
            onClick={() => { setSelectedPropertyId("all"); setPopoverOpen(false); }}
          >
            <Building2 className="w-4 h-4 text-muted-foreground" />
            <span className="flex-1 text-left">All Properties</span>
            {selectedPropertyId === "all" && <Check className="w-4 h-4 text-primary" />}
          </button>
          <Separator className="my-1" />
          {isPropertiesLoading && (
            <div className="space-y-1 py-1" data-testid={`${testIdPrefix}-menu-skeleton`}>
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="flex items-center gap-2.5 px-3 py-2.5 min-h-[40px]">
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </div>
          )}
          {!isPropertiesLoading && !propertiesError && properties.map((p) => (
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
            data-testid={`${testIdPrefix}-manage`}
            aria-disabled={isManageDisabled}
            disabled={isManageDisabled}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl transition-colors text-muted-foreground min-h-[40px] opacity-60 cursor-not-allowed"
            onClick={() => {
              if (isManageDisabled) return;
              setManageOpen(true);
              setPopoverOpen(false);
            }}
          >
            <Settings className="w-4 h-4" />
            <span className="flex-1 text-left">Manage Properties</span>
            <span className="text-[10px] uppercase tracking-wide">Read-only</span>
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
  const { selectedPropertyId } = useProperty();
  const { hasUnread } = useNotifications();
  const isMobile = useIsMobile();
  const activeTab =
    navItems.find(
      (item) => location.pathname === item.id || location.pathname.startsWith(`${item.id}/`)
    )?.id || "/dashboard";
  const me = readUserMe();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(readStoredSidebarCollapsed);
  const [isAiLayerDialogOpen, setIsAiLayerDialogOpen] = useState(false);

  const buildDisplayName = (user: UserMe | null) => {
    if (!user) return "StayAI Hotel";
    const fullName = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
    return fullName || "StayAI Hotel";
  };

  const buildAvatarInitials = (user: UserMe | null) => {
    if (!user) return "SA";
    const initials = [user.first_name, user.last_name]
      .map((part) => part.trim().charAt(0))
      .join("")
      .toUpperCase();
    return initials || "SA";
  };

  const displayName = buildDisplayName(me);
  const displayEmail = me?.email || "admin@stayai.com";
  const avatarInitials = buildAvatarInitials(me);
  const handleLogout = () => {
    clearAuthStorage();
    navigate("/auth", { replace: true });
  };
  const handleActivateAiLayer = () => {
    toast.success("AI Layer activation is coming soon.");
    setIsAiLayerDialogOpen(false);
  };

  useEffect(() => {
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, isSidebarCollapsed ? "true" : "false");
    } catch {
      // Ignore storage write failures and keep in-memory state.
    }
  }, [isSidebarCollapsed]);

  return (
    <div className="min-h-screen w-full bg-background flex overflow-x-hidden">
      {/* Desktop Sidebar */}
      <aside
        data-testid="desktop-sidebar"
        data-collapsed={isSidebarCollapsed ? "true" : "false"}
        className={`hidden md:flex flex-col glass border-r border-border p-4 fixed inset-y-0 left-0 z-30 transition-[width] duration-200 ${isSidebarCollapsed ? "w-20" : "w-64"}`}
      >
        <div className={`flex items-center mb-2 ${isSidebarCollapsed ? "justify-center" : "gap-2 px-0"}`}>
          <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          {/*<h2 className="font-bold text-foreground text-md tracking-tight">monobook.ing</h2>*/}
          {!isSidebarCollapsed && <img src="/logo.png" className="w-36" />}
          <button
            type="button"
            data-testid={isSidebarCollapsed ? "sidebar-expand-button" : "sidebar-collapse-button"}
            aria-label={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            className={`h-8 w-8 rounded-lg hover:bg-secondary transition-colors flex items-center justify-center text-muted-foreground hover:text-foreground ${isSidebarCollapsed ? "absolute top-4 right-4" : "ml-auto"}`}
            onClick={() => setIsSidebarCollapsed((prev) => !prev)}
          >
            {isSidebarCollapsed ? <PanelRight className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Property Switcher */}
        <div className={`my-2 ${isSidebarCollapsed ? "flex justify-center" : ""}`}>
          <PropertySwitcher collapsed={isSidebarCollapsed} />
        </div>

        <nav className={`space-y-1 flex-1 ${isSidebarCollapsed ? "flex flex-col items-center" : ""}`}>
          {navItems.map((item) => (
            <Tooltip key={item.id} delayDuration={0}>
              <TooltipTrigger asChild>
                <motion.button
                  aria-label={item.label}
                  className={`w-full flex items-center rounded-xl text-sm font-medium transition-colors min-h-[44px] ${
                    isSidebarCollapsed ? "justify-center px-2 py-2 max-w-[44px]" : "gap-3 px-3 py-2.5"
                  } ${
                    activeTab === item.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                  }`}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(item.id)}
                >
                  <span className="relative inline-flex">
                    <item.icon className="w-5 h-5" />
                    {item.id === "/settings" && hasUnread && (
                      <span
                        data-testid="desktop-settings-unread-dot"
                        aria-hidden="true"
                        className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive"
                      />
                    )}
                  </span>
                  {!isSidebarCollapsed && item.label}
                </motion.button>
              </TooltipTrigger>
              {isSidebarCollapsed && (
                <TooltipContent side="right" align="center">
                  {item.label}
                </TooltipContent>
              )}
            </Tooltip>
          ))}
        </nav>

        {/* User Footer */}
        <div className={`mt-auto ${isSidebarCollapsed ? "flex flex-col items-center gap-1.5" : "space-y-1.5"}`}>
          {isSidebarCollapsed ? (
            <>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid="ai-layer-trigger"
                    aria-label="Get apps and extensions"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => setIsAiLayerDialogOpen(true)}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  Get apps and extensions
                </TooltipContent>
              </Tooltip>
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    aria-label="Account menu"
                    className="flex items-center justify-center rounded-xl px-2 py-2 transition-colors hover:bg-secondary min-h-[44px] max-w-[44px] mx-auto"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{avatarInitials}</AvatarFallback>
                    </Avatar>
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-56 rounded-2xl p-1.5">
                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary text-destructive transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </PopoverContent>
              </Popover>
            </>
          ) : (
            <div className="flex items-center gap-1.5">
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    className="flex flex-1 items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-secondary min-h-[44px]"
                  >
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">{avatarInitials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground leading-tight">{displayName}</p>
                      <p className="text-[10px] text-muted-foreground">Pro plan</p>
                    </div>
                    <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                </PopoverTrigger>
                <PopoverContent side="top" align="start" className="w-56 rounded-2xl p-1.5">
                  <div className="px-3 py-2">
                    <p className="text-xs text-muted-foreground">{displayEmail}</p>
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
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 text-sm rounded-xl hover:bg-secondary text-destructive transition-colors min-h-[44px]"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </PopoverContent>
              </Popover>
              <Tooltip delayDuration={0}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    data-testid="ai-layer-trigger"
                    aria-label="Get apps and extensions"
                    className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-background text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                    onClick={() => setIsAiLayerDialogOpen(true)}
                  >
                    <Download className="h-5 w-5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" align="center">
                  Get apps and extensions
                </TooltipContent>
              </Tooltip>
            </div>
          )}
        </div>
      </aside>

      <Dialog open={isAiLayerDialogOpen} onOpenChange={setIsAiLayerDialogOpen}>
        <DialogContent
          data-testid="ai-layer-dialog"
          className="h-screen w-screen max-w-none rounded-none border-0 bg-[#f3f2ee] p-0 overflow-hidden"
        >
          <div className="h-full overflow-y-auto px-6 py-16 sm:px-10 lg:px-14">
            <div className="mx-auto flex min-h-full w-full max-w-6xl flex-col">
              <DialogHeader className="text-center">
                <DialogTitle className="text-center text-3xl font-semibold tracking-tight text-foreground sm:text-5xl">
                  Do more with Estio, everywhere
                </DialogTitle>
                <DialogDescription className="sr-only">
                  Activate your AI layer across booking, concierge, pricing, and knowledge workflows.
                </DialogDescription>
              </DialogHeader>
              <div className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2">
                {aiLayerCards.map((card) => (
                  <section
                    key={card.title}
                    className="rounded-3xl border border-border/60 bg-background/80 p-6 shadow-sm sm:p-8"
                  >
                    <h3 className="text-xl font-semibold text-foreground">{card.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{card.description}</p>
                  </section>
                ))}
              </div>
              <div className="mt-10 flex justify-center pb-4">
                <Button
                  type="button"
                  data-testid="ai-layer-activate-button"
                  className="h-12 rounded-xl px-8 text-sm font-semibold"
                  onClick={handleActivateAiLayer}
                >
                  Activate AI Layer
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Main Content */}
      <main className={`flex-1 w-full min-w-0 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-6 transition-[margin] duration-200 ${isSidebarCollapsed ? "md:ml-20" : "md:ml-64"}`}>
        <div className="w-full min-w-0 max-w-4xl mx-auto p-4 md:p-8">
          {isMobile && selectedPropertyId === "all" && (
            <div className="mb-4" data-testid="mobile-empty-property-switcher">
              <PropertySwitcher compact testIdPrefix="mobile-property-switcher" />
            </div>
          )}
          <Outlet />
        </div>
      </main>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed inset-x-0 bottom-0 w-full glass-strong border-t border-border z-40">
        <div className="mx-auto flex w-full max-w-4xl items-center justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {navItems.map((item) => (
            <motion.button
              key={item.id}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px] min-h-[44px] ${
                activeTab === item.id ? "text-primary" : "text-muted-foreground"
              }`}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate(item.id)}
            >
              <span className="relative inline-flex">
                <item.icon className="w-5 h-5" />
                {item.id === "/settings" && hasUnread && (
                  <span
                    data-testid="mobile-settings-unread-dot"
                    aria-hidden="true"
                    className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-destructive"
                  />
                )}
              </span>
              <span className="text-[10px] font-medium">{item.label}</span>
            </motion.button>
          ))}
        </div>
      </nav>
    </div>
  );
}

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let active = true;

    const hydrateAuth = async () => {
      const result = await hydrateSessionFromStorage();
      if (!active) return;

      if (result.status === "missing_token") {
        navigate("/auth", { replace: true });
        return;
      }

      if (result.status === "ready") {
        setAuthReady(true);
      } else {
        toast.error("Your session expired. Please sign in again.");
        navigate("/auth", { replace: true });
      }
    };

    hydrateAuth();
    return () => {
      active = false;
    };
  }, [navigate]);

  if (!authReady) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-6">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-sm text-muted-foreground">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <PropertyProvider>
      <NotificationsProvider>
        <DashboardInner />
      </NotificationsProvider>
    </PropertyProvider>
  );
}
