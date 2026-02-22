import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, BedDouble, Users, RefreshCw, ExternalLink, Trash2, X, Link2, Plug, PenLine, Loader2, Wifi, Waves, Wind, UtensilsCrossed, Car, Tv, Bath, Dumbbell, Sparkles, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { mockRooms as initialRooms, mockScrapedRoom, type ManagedRoom } from "@/data/mockRoomData";
import { format } from "date-fns";

const amenityIcons: Record<string, React.ElementType> = {
  WiFi: Wifi, Pool: Waves, AC: Wind, Kitchen: UtensilsCrossed, Parking: Car,
  "Flat-screen TV": Tv, "Ocean View": Eye, "City View": Eye, "Garden View": Eye,
  Jacuzzi: Bath, "Gym Access": Dumbbell, "Spa Access": Sparkles,
};

const sourceBadge = (source: ManagedRoom["source"]) => {
  const map = { airbnb: { label: "Airbnb", cls: "bg-[#FF5A5F]/10 text-[#FF5A5F] border-[#FF5A5F]/20" }, booking: { label: "Booking.com", cls: "bg-[#003580]/10 text-[#003580] border-[#003580]/20" }, manual: { label: "Manual", cls: "bg-muted text-muted-foreground" } };
  const s = map[source];
  return <Badge variant="outline" className={s.cls}>{s.label}</Badge>;
};

export function RoomManagement() {
  const [rooms, setRooms] = useState<ManagedRoom[]>(initialRooms);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<ManagedRoom | null>(null);
  const [deleteRoom, setDeleteRoom] = useState<ManagedRoom | null>(null);

  // Add room states
  const [scrapeUrl, setScrapeUrl] = useState("");
  const [scraping, setScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<Omit<ManagedRoom, "id"> | null>(null);

  // Manual form
  const [manualForm, setManualForm] = useState({ name: "", type: "", description: "", pricePerNight: "", maxGuests: "", bedConfig: "", amenities: "" });

  // Connected platforms mock
  const [connectedPlatforms, setConnectedPlatforms] = useState({ airbnb: false, booking: false });

  const handleScrape = () => {
    if (!scrapeUrl.trim()) return;
    setScraping(true);
    setTimeout(() => {
      setScraping(false);
      setScrapedData({ ...mockScrapedRoom, sourceUrl: scrapeUrl, source: scrapeUrl.includes("booking") ? "booking" : "airbnb" });
    }, 2500);
  };

  const importScraped = () => {
    if (!scrapedData) return;
    const newRoom: ManagedRoom = { ...scrapedData, id: `room-${Date.now()}`, lastSynced: new Date().toISOString() };
    setRooms((prev) => [...prev, newRoom]);
    setScrapedData(null);
    setScrapeUrl("");
    setAddOpen(false);
  };

  const addManual = () => {
    const room: ManagedRoom = {
      id: `room-${Date.now()}`,
      name: manualForm.name || "New Room",
      type: manualForm.type || "Standard Room",
      description: manualForm.description,
      images: [],
      pricePerNight: Number(manualForm.pricePerNight) || 100,
      maxGuests: Number(manualForm.maxGuests) || 2,
      bedConfig: manualForm.bedConfig || "1 Queen Bed",
      amenities: manualForm.amenities.split(",").map((a) => a.trim()).filter(Boolean),
      source: "manual",
      syncEnabled: false,
      status: "draft",
    };
    setRooms((prev) => [...prev, room]);
    setManualForm({ name: "", type: "", description: "", pricePerNight: "", maxGuests: "", bedConfig: "", amenities: "" });
    setAddOpen(false);
  };

  const toggleSync = (id: string) => setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, syncEnabled: !r.syncEnabled } : r)));
  const syncNow = (id: string) => setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, lastSynced: new Date().toISOString() } : r)));
  const confirmDelete = () => {
    if (deleteRoom) {
      setRooms((prev) => prev.filter((r) => r.id !== deleteRoom.id));
      if (selectedRoom?.id === deleteRoom.id) setSelectedRoom(null);
      setDeleteRoom(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Rooms</h1>
        <Button onClick={() => setAddOpen(true)} size="sm" className="rounded-xl gap-2">
          <Plus className="w-4 h-4" /> Add Room
        </Button>
      </div>
      <p className="text-sm text-muted-foreground mb-6">Manage your property listings and sync with platforms</p>

      {/* Room Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {rooms.map((room) => (
          <motion.div key={room.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
            <Card className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow group" onClick={() => setSelectedRoom(room)}>
              {room.images[0] ? (
                <div className="h-40 overflow-hidden">
                  <img src={room.images[0]} alt={room.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
              ) : (
                <div className="h-40 bg-muted flex items-center justify-center"><BedDouble className="w-10 h-10 text-muted-foreground" /></div>
              )}
              <CardContent className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{room.name}</h3>
                    <p className="text-xs text-muted-foreground">{room.type}</p>
                  </div>
                  {sourceBadge(room.source)}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold text-foreground">${room.pricePerNight}<span className="text-muted-foreground font-normal">/night</span></span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-3.5 h-3.5" />{room.maxGuests}</span>
                </div>
                {room.syncEnabled && (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <RefreshCw className="w-3 h-3" />
                    {room.lastSynced ? `Synced ${format(new Date(room.lastSynced), "MMM d, HH:mm")}` : "Sync enabled"}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Add Room Dialog */}
      <Dialog open={addOpen} onOpenChange={(o) => { setAddOpen(o); if (!o) { setScrapedData(null); setScraping(false); setScrapeUrl(""); } }}>
        <DialogContent className="sm:max-w-lg rounded-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Room</DialogTitle>
            <DialogDescription>Import from a platform or add manually</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="paste" className="mt-2">
            <TabsList className="w-full rounded-xl">
              <TabsTrigger value="paste" className="flex-1 gap-1.5 rounded-lg"><Link2 className="w-3.5 h-3.5" />Paste Link</TabsTrigger>
              <TabsTrigger value="connect" className="flex-1 gap-1.5 rounded-lg"><Plug className="w-3.5 h-3.5" />Connect</TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 gap-1.5 rounded-lg"><PenLine className="w-3.5 h-3.5" />Manual</TabsTrigger>
            </TabsList>

            {/* Paste Link */}
            <TabsContent value="paste" className="space-y-4 mt-4">
              <div className="flex gap-2">
                <Input placeholder="https://airbnb.com/rooms/..." value={scrapeUrl} onChange={(e) => setScrapeUrl(e.target.value)} className="rounded-xl" />
                <Button onClick={handleScrape} disabled={scraping || !scrapeUrl.trim()} className="rounded-xl shrink-0">
                  {scraping ? <Loader2 className="w-4 h-4 animate-spin" /> : "Import"}
                </Button>
              </div>
              <AnimatePresence>
                {scraping && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col items-center gap-3 py-8">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground">AI is scraping the listing…</p>
                  </motion.div>
                )}
                {scrapedData && !scraping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 border rounded-xl p-4">
                    <h4 className="font-semibold text-foreground">{scrapedData.name}</h4>
                    <p className="text-xs text-muted-foreground line-clamp-2">{scrapedData.description}</p>
                    <div className="flex items-center gap-3 text-sm">
                      <span className="font-semibold">${scrapedData.pricePerNight}/night</span>
                      <span className="text-muted-foreground">{scrapedData.maxGuests} guests · {scrapedData.bedConfig}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">{scrapedData.amenities.slice(0, 6).map((a) => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}</div>
                    <Button onClick={importScraped} className="w-full rounded-xl mt-2">Import Room</Button>
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            {/* Connect */}
            <TabsContent value="connect" className="space-y-3 mt-4">
              {(["airbnb", "booking"] as const).map((platform) => (
                <Card key={platform} className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-foreground">{platform === "airbnb" ? "Airbnb" : "Booking.com"}</h4>
                      <p className="text-xs text-muted-foreground">{connectedPlatforms[platform] ? "Connected — rooms will sync automatically" : "Connect to import and sync rooms"}</p>
                    </div>
                    <Button variant={connectedPlatforms[platform] ? "secondary" : "default"} size="sm" className="rounded-xl" onClick={() => setConnectedPlatforms((p) => ({ ...p, [platform]: !p[platform] }))}>
                      {connectedPlatforms[platform] ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </Card>
              ))}
            </TabsContent>

            {/* Manual */}
            <TabsContent value="manual" className="space-y-3 mt-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><Label className="text-xs">Name</Label><Input value={manualForm.name} onChange={(e) => setManualForm((p) => ({ ...p, name: e.target.value }))} placeholder="Room name" className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs">Type</Label><Input value={manualForm.type} onChange={(e) => setManualForm((p) => ({ ...p, type: e.target.value }))} placeholder="e.g. Suite" className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs">Price/night ($)</Label><Input type="number" value={manualForm.pricePerNight} onChange={(e) => setManualForm((p) => ({ ...p, pricePerNight: e.target.value }))} placeholder="150" className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs">Max guests</Label><Input type="number" value={manualForm.maxGuests} onChange={(e) => setManualForm((p) => ({ ...p, maxGuests: e.target.value }))} placeholder="2" className="rounded-xl mt-1" /></div>
                <div><Label className="text-xs">Bed config</Label><Input value={manualForm.bedConfig} onChange={(e) => setManualForm((p) => ({ ...p, bedConfig: e.target.value }))} placeholder="1 King Bed" className="rounded-xl mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs">Description</Label><Textarea value={manualForm.description} onChange={(e) => setManualForm((p) => ({ ...p, description: e.target.value }))} placeholder="Room description…" className="rounded-xl mt-1" rows={3} /></div>
                <div className="col-span-2"><Label className="text-xs">Amenities (comma-separated)</Label><Input value={manualForm.amenities} onChange={(e) => setManualForm((p) => ({ ...p, amenities: e.target.value }))} placeholder="WiFi, AC, Pool" className="rounded-xl mt-1" /></div>
              </div>
              <Button onClick={addManual} className="w-full rounded-xl">Add Room</Button>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Room Detail Sheet */}
      <Sheet open={!!selectedRoom} onOpenChange={(o) => { if (!o) setSelectedRoom(null); }}>
        <SheetContent className="sm:max-w-lg overflow-y-auto p-0">
          {selectedRoom && (
            <>
              <div className="relative">
                {selectedRoom.images[0] ? (
                  <img src={selectedRoom.images[0]} alt={selectedRoom.name} className="w-full h-56 object-cover" />
                ) : (
                  <div className="w-full h-56 bg-muted flex items-center justify-center"><BedDouble className="w-12 h-12 text-muted-foreground" /></div>
                )}
                {selectedRoom.images.length > 1 && (
                  <div className="flex gap-1.5 px-4 -mt-6 relative z-10">
                    {selectedRoom.images.slice(1, 4).map((img, i) => (
                      <img key={i} src={img} alt="" className="w-16 h-12 rounded-lg object-cover border-2 border-background shadow-sm" />
                    ))}
                    {selectedRoom.images.length > 4 && (
                      <div className="w-16 h-12 rounded-lg bg-muted/80 border-2 border-background flex items-center justify-center text-xs font-medium text-muted-foreground shadow-sm">+{selectedRoom.images.length - 4}</div>
                    )}
                  </div>
                )}
              </div>
              <div className="p-5 space-y-5">
                <SheetHeader className="p-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <SheetTitle className="text-lg">{selectedRoom.name}</SheetTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{selectedRoom.type} · {selectedRoom.bedConfig}</p>
                    </div>
                    {sourceBadge(selectedRoom.source)}
                  </div>
                </SheetHeader>

                <p className="text-sm text-muted-foreground leading-relaxed">{selectedRoom.description}</p>

                <div className="flex items-center gap-4 text-sm">
                  <span className="text-xl font-bold text-foreground">${selectedRoom.pricePerNight}<span className="text-sm font-normal text-muted-foreground">/night</span></span>
                  <span className="flex items-center gap-1 text-muted-foreground"><Users className="w-4 h-4" />{selectedRoom.maxGuests} guests</span>
                </div>

                {/* Amenities */}
                <div>
                  <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Amenities</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedRoom.amenities.map((a) => {
                      const Icon = amenityIcons[a];
                      return (
                        <Badge key={a} variant="secondary" className="gap-1.5 px-2.5 py-1 text-xs">
                          {Icon && <Icon className="w-3 h-3" />}{a}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {/* Sync */}
                {selectedRoom.source !== "manual" && (
                  <div className="border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-foreground">Sync</h4>
                        <p className="text-xs text-muted-foreground">{selectedRoom.lastSynced ? `Last synced ${format(new Date(selectedRoom.lastSynced), "MMM d, yyyy HH:mm")}` : "Never synced"}</p>
                      </div>
                      <Switch checked={selectedRoom.syncEnabled} onCheckedChange={() => { toggleSync(selectedRoom.id); setSelectedRoom((r) => r ? { ...r, syncEnabled: !r.syncEnabled } : null); }} />
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={() => { syncNow(selectedRoom.id); setSelectedRoom((r) => r ? { ...r, lastSynced: new Date().toISOString() } : null); }}>
                        <RefreshCw className="w-3.5 h-3.5" /> Sync now
                      </Button>
                      {selectedRoom.sourceUrl && (
                        <Button variant="ghost" size="sm" className="rounded-xl gap-1.5" asChild>
                          <a href={selectedRoom.sourceUrl} target="_blank" rel="noopener noreferrer"><ExternalLink className="w-3.5 h-3.5" /> View listing</a>
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" size="sm" className="rounded-xl gap-1.5" onClick={() => setDeleteRoom(selectedRoom)}>
                    <Trash2 className="w-3.5 h-3.5" /> Delete
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteRoom} onOpenChange={(o) => { if (!o) setDeleteRoom(null); }}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete room?</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete "{deleteRoom?.name}"? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
