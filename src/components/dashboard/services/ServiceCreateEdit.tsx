import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  Info,
  Upload,
  Plus,
  Trash2,
  Clock,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { mockServices, mockServiceCategories } from "@/data/mockServiceData";

type ServiceTypeValue = "internal" | "partner" | "product";
type PricingTypeValue = "fixed" | "per_person" | "per_night" | "per_hour" | "dynamic";
type AvailabilityTypeValue = "always" | "date_range" | "time_slot" | "linked_booking";
type VisibilityValue = "public" | "after_booking" | "during_stay";

const allSteps = [
  { key: "basic", label: "Basic Info" },
  { key: "pricing", label: "Pricing" },
  { key: "availability", label: "Availability" },
  { key: "upsell", label: "Booking & Upsell" },
  { key: "partner", label: "Partner Settings" },
  { key: "knowledge", label: "Knowledge Base" },
];

export function ServiceCreateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const existing = id ? mockServices.find((s) => s.id === id) : null;

  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceTypeValue>(existing?.type ?? "internal");
  const [title, setTitle] = useState(existing?.name ?? "");
  const [shortDesc, setShortDesc] = useState(existing?.shortDescription ?? "");
  const [fullDesc, setFullDesc] = useState(existing?.fullDescription ?? "");
  const [category, setCategory] = useState(existing?.categoryId ?? "");
  const [visibility, setVisibility] = useState<VisibilityValue>(existing?.visibility ?? "public");

  const [pricingType, setPricingType] = useState<PricingTypeValue>(existing?.pricingType ?? "fixed");
  const [price, setPrice] = useState(String(existing?.price ?? ""));
  const [currency, setCurrency] = useState(existing?.currency ?? "USD");
  const [vat, setVat] = useState(String(existing?.vatPercent ?? "20"));
  const [allowDiscount, setAllowDiscount] = useState(existing?.allowDiscount ?? false);
  const [bundleEligible, setBundleEligible] = useState(existing?.bundleEligible ?? false);

  const [availType, setAvailType] = useState<AvailabilityTypeValue>(existing?.availabilityType ?? "always");
  const [slots, setSlots] = useState(existing?.slots ?? []);

  const [preBooking, setPreBooking] = useState(true);
  const [duringBooking, setDuringBooking] = useState(true);
  const [postBooking, setPostBooking] = useState(false);
  const [qrOrdering, setQrOrdering] = useState(false);
  const [earlyDiscount, setEarlyDiscount] = useState("");

  const [partnerName, setPartnerName] = useState("");
  const [revenueShare, setRevenueShare] = useState("");
  const [payoutType, setPayoutType] = useState("manual");

  const [aiSearch, setAiSearch] = useState(true);
  const [knowledgeLang, setKnowledgeLang] = useState("en");

  const steps = allSteps.filter((s) => s.key !== "partner" || serviceType === "partner");

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="ghost"
          size="icon"
          className="rounded-xl"
          onClick={() => navigate("/services")}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
          {isEdit ? "Edit Service" : "Create Service"}
        </h1>
      </div>

      <div className="flex gap-6">
        {/* Left stepper */}
        <nav className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          {steps.map((s, i) => (
            <button
              key={s.key}
              onClick={() => setStep(i)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                step === i
                  ? "bg-primary/10 text-primary"
                  : step > i
                  ? "text-muted-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  step > i
                    ? "bg-success text-success-foreground"
                    : step === i
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {step > i ? <Check className="w-3.5 h-3.5" /> : i + 1}
              </span>
              {s.label}
            </button>
          ))}
        </nav>

        {/* Main form */}
        <div className="flex-1 min-w-0">
          <div className="rounded-2xl bg-card apple-shadow p-6">
            {/* Mobile step indicator */}
            <div className="lg:hidden mb-4">
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
              <p className="font-semibold text-foreground">{steps[step].label}</p>
            </div>

            {/* Step 1: Basic Info */}
            {steps[step].key === "basic" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Service Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["internal", "partner", "product"] as ServiceTypeValue[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setServiceType(t)}
                        className={`px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
                          serviceType === t
                            ? "border-primary bg-primary/5 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {t === "internal" ? "Internal Service" : t === "partner" ? "Partner Service" : "Physical Product"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Title</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl mt-1" placeholder="e.g. Deep Tissue Massage" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Short Description</Label>
                  <Input value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} className="rounded-xl mt-1" placeholder="One-line summary" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Full Description</Label>
                  <Textarea value={fullDesc} onChange={(e) => setFullDesc(e.target.value)} className="rounded-xl mt-1 min-h-[100px]" placeholder="Detailed description…" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Images</Label>
                  <div className="mt-1 border-2 border-dashed rounded-xl p-6 text-center">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop images or click to upload</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {mockServiceCategories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.icon} {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Visibility</Label>
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {([
                      { value: "public", label: "Public" },
                      { value: "after_booking", label: "After Booking" },
                      { value: "during_stay", label: "During Stay" },
                    ] as { value: VisibilityValue; label: string }[]).map((v) => (
                      <button
                        key={v.value}
                        onClick={() => setVisibility(v.value)}
                        className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                          visibility === v.value
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Pricing */}
            {steps[step].key === "pricing" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Pricing Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(["fixed", "per_person", "per_night", "per_hour", "dynamic"] as PricingTypeValue[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setPricingType(t)}
                        className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                          pricingType === t
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {t === "dynamic" ? (
                          <span className="flex items-center gap-1.5">
                            Dynamic <Badge variant="secondary" className="text-[10px] px-1.5 py-0">Advanced</Badge>
                          </span>
                        ) : (
                          t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Base Price</Label>
                    <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} className="rounded-xl mt-1" placeholder="0.00" />
                  </div>
                  <div>
                    <Label className="text-xs font-semibold">Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger className="rounded-xl mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="UAH">UAH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">VAT %</Label>
                  <Input type="number" value={vat} onChange={(e) => setVat(e.target.value)} className="rounded-xl mt-1 w-32" placeholder="20" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Allow discount</Label>
                  <Switch checked={allowDiscount} onCheckedChange={setAllowDiscount} />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Bundle eligible</Label>
                  <Switch checked={bundleEligible} onCheckedChange={setBundleEligible} />
                </div>
              </div>
            )}

            {/* Step 3: Availability */}
            {steps[step].key === "availability" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Availability Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(["always", "date_range", "time_slot", "linked_booking"] as AvailabilityTypeValue[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setAvailType(t)}
                        className={`px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                          availType === t
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {t.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </button>
                    ))}
                  </div>
                </div>

                {availType === "time_slot" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold">Time Slots</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        className="rounded-xl gap-1"
                        onClick={() =>
                          setSlots([
                            ...slots,
                            { id: `slot-new-${Date.now()}`, time: "09:00", capacity: 5, booked: 0 },
                          ])
                        }
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Slot
                      </Button>
                    </div>
                    {slots.map((sl, i) => (
                      <div key={sl.id} className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                          value={sl.time}
                          onChange={(e) => {
                            const updated = [...slots];
                            updated[i] = { ...sl, time: e.target.value };
                            setSlots(updated);
                          }}
                          className="rounded-xl w-28"
                          placeholder="HH:MM"
                        />
                        <Input
                          type="number"
                          value={sl.capacity}
                          onChange={(e) => {
                            const updated = [...slots];
                            updated[i] = { ...sl, capacity: Number(e.target.value) };
                            setSlots(updated);
                          }}
                          className="rounded-xl w-24"
                          placeholder="Cap."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() => setSlots(slots.filter((_, j) => j !== i))}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Recurring schedule</Label>
                      <Switch />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-semibold mb-2 block">Capacity</Label>
                  <Select defaultValue="unlimited">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="limited">Limited quantity</SelectItem>
                      <SelectItem value="per_day">Per-day limit</SelectItem>
                      <SelectItem value="per_hour">Per-hour limit</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* Step 4: Booking & Upsell */}
            {steps[step].key === "upsell" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold block">Availability Windows</Label>
                  {[
                    { label: "Available before booking", value: preBooking, set: setPreBooking },
                    { label: "Available during booking", value: duringBooking, set: setDuringBooking },
                    { label: "Post-booking upsell", value: postBooking, set: setPostBooking },
                    { label: "In-stay QR ordering", value: qrOrdering, set: setQrOrdering },
                  ].map((opt) => (
                    <div key={opt.label} className="flex items-center justify-between">
                      <Label className="text-sm">{opt.label}</Label>
                      <Switch checked={opt.value} onCheckedChange={opt.set} />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4 space-y-3">
                  <Label className="text-xs font-semibold block">Upsell Trigger</Label>
                  <p className="text-sm text-muted-foreground">When guest books</p>
                  <Select defaultValue="any">
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="any">Any Room Type</SelectItem>
                      <SelectItem value="deluxe">Deluxe Suite</SelectItem>
                      <SelectItem value="standard">Standard Room</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">→ Suggest this service</p>
                </div>

                <div>
                  <Label className="text-xs font-semibold">Early Booking Discount %</Label>
                  <Input
                    type="number"
                    value={earlyDiscount}
                    onChange={(e) => setEarlyDiscount(e.target.value)}
                    className="rounded-xl mt-1 w-32"
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Applied when booked X days before arrival</p>
                </div>
              </div>
            )}

            {/* Step 5: Partner Settings */}
            {steps[step].key === "partner" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold">Partner Name</Label>
                  <Input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="rounded-xl mt-1" placeholder="Partner company" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Revenue Share %</Label>
                  <Input type="number" value={revenueShare} onChange={(e) => setRevenueShare(e.target.value)} className="rounded-xl mt-1 w-32" placeholder="15" />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Payout Type</Label>
                  <Select value={payoutType} onValueChange={setPayoutType}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="manual">Manual Settlement</SelectItem>
                      <SelectItem value="automated">Automated Payout</SelectItem>
                      <SelectItem value="affiliate">Affiliate Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs font-semibold">External URL (optional)</Label>
                  <Input className="rounded-xl mt-1" placeholder="https://…" />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable attribution tracking</Label>
                  <Switch />
                </div>
              </div>
            )}

            {/* Step 6: Knowledge Base */}
            {steps[step].key === "knowledge" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold">Upload Documents</Label>
                  <div className="mt-1 border-2 border-dashed rounded-xl p-6 text-center">
                    <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop PDF, menus, terms, or safety instructions</p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Language</Label>
                  <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit">
                    {["en", "ua", "pl", "de"].map((l) => (
                      <button
                        key={l}
                        onClick={() => setKnowledgeLang(l)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                          knowledgeLang === l
                            ? "bg-card apple-shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Enable AI knowledge search</Label>
                    <p className="text-xs text-muted-foreground">Allow AI agent to reference these documents</p>
                  </div>
                  <Switch checked={aiSearch} onCheckedChange={setAiSearch} />
                </div>
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <div className="flex items-center justify-between mt-4">
            <Button
              variant="outline"
              className="rounded-xl"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              Back
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" className="rounded-xl" onClick={() => navigate("/services")}>
                Cancel
              </Button>
              {step < steps.length - 1 ? (
                <Button className="rounded-xl" onClick={() => setStep(step + 1)}>
                  Continue
                </Button>
              ) : (
                <Button className="rounded-xl" onClick={() => navigate("/services")}>
                  {isEdit ? "Save Changes" : "Create Service"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right preview panel */}
        {steps[step].key === "pricing" && (
          <div className="hidden xl:block w-72 shrink-0">
            <div className="sticky top-6 rounded-2xl bg-card apple-shadow overflow-hidden">
              <div className="h-32 bg-muted flex items-center justify-center">
                <span className="text-3xl">🖼️</span>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-semibold text-foreground text-sm">{title || "Service Title"}</p>
                <p className="text-xs text-muted-foreground">{shortDesc || "Short description"}</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-foreground">${price || "0"}</span>
                  <span className="text-xs text-muted-foreground capitalize">
                    / {pricingType.replace("_", " ")}
                  </span>
                </div>
                <Button className="w-full rounded-xl mt-2" size="sm">
                  Add to Booking
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
