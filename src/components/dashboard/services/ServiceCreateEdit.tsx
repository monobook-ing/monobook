import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
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
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import {
  createService,
  createServicePartner,
  fetchServiceById,
  fetchServiceCategories,
  fetchServicePartners,
  updateServicePartner,
  updateService,
  type AvailabilityType,
  type CapacityMode,
  type PricingType,
  type Service,
  type ServiceCategory,
  type ServicePartner,
  type ServiceStatus,
  type ServiceType,
  type Visibility,
} from "@/lib/servicesApi";

interface LocalSlot {
  id: string;
  time: string;
  capacity: number;
  booked: number;
  sortOrder: number;
}

const allSteps = [
  { key: "basic", label: "Basic Info" },
  { key: "pricing", label: "Pricing" },
  { key: "availability", label: "Availability" },
  { key: "upsell", label: "Booking & Upsell" },
  { key: "partner", label: "Partner Settings" },
  { key: "knowledge", label: "Knowledge Base" },
];

function ServiceFormSkeleton() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-[420px] w-full rounded-2xl" />
    </div>
  );
}

export function ServiceCreateEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { selectedPropertyId } = useProperty();
  const isEdit = Boolean(id);

  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [partners, setPartners] = useState<ServicePartner[]>([]);
  const [existing, setExisting] = useState<Service | null>(null);

  const [step, setStep] = useState(0);
  const [serviceType, setServiceType] = useState<ServiceType>("internal");
  const [status, setStatus] = useState<ServiceStatus>("active");
  const [title, setTitle] = useState("");
  const [shortDesc, setShortDesc] = useState("");
  const [fullDesc, setFullDesc] = useState("");
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [category, setCategory] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("public");

  const [pricingType, setPricingType] = useState<PricingType>("fixed");
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [vat, setVat] = useState("20");
  const [allowDiscount, setAllowDiscount] = useState(false);
  const [bundleEligible, setBundleEligible] = useState(false);

  const [availType, setAvailType] = useState<AvailabilityType>("always");
  const [slots, setSlots] = useState<LocalSlot[]>([]);
  const [recurringScheduleEnabled, setRecurringScheduleEnabled] = useState(false);
  const [capacityMode, setCapacityMode] = useState<CapacityMode>("unlimited");
  const [capacityLimit, setCapacityLimit] = useState("");

  const [preBooking, setPreBooking] = useState(true);
  const [duringBooking, setDuringBooking] = useState(true);
  const [postBooking, setPostBooking] = useState(false);
  const [qrOrdering, setQrOrdering] = useState(false);
  const [upsellTriggerRoomType, setUpsellTriggerRoomType] = useState("any");
  const [earlyDiscount, setEarlyDiscount] = useState("");

  const [partnerName, setPartnerName] = useState("");
  const [revenueShare, setRevenueShare] = useState("");
  const [payoutType, setPayoutType] = useState<"manual" | "automated" | "affiliate">("manual");
  const [partnerExternalUrl, setPartnerExternalUrl] = useState("");
  const [partnerAttributionTracking, setPartnerAttributionTracking] = useState(false);

  const [aiSearch, setAiSearch] = useState(true);
  const [knowledgeLang, setKnowledgeLang] = useState("en");

  const steps = useMemo(
    () => allSteps.filter((item) => item.key !== "partner" || serviceType === "partner"),
    [serviceType]
  );

  useEffect(() => {
    if (step > steps.length - 1) {
      setStep(steps.length - 1);
    }
  }, [step, steps.length]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setIsLoading(false);
        setLoadError(null);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setIsLoading(false);
        setLoadError("You are not authenticated. Please sign in again.");
        return;
      }

      setIsLoading(true);
      setLoadError(null);
      try {
        const categoriesPromise = fetchServiceCategories(accessToken, selectedPropertyId);
        const partnersPromise = fetchServicePartners(accessToken, selectedPropertyId);
        const servicePromise =
          isEdit && id
            ? fetchServiceById(accessToken, selectedPropertyId, id)
            : Promise.resolve(null);

        const [nextCategories, nextPartners, nextService] = await Promise.all([
          categoriesPromise,
          partnersPromise,
          servicePromise,
        ]);
        if (!active) return;

        setCategories(nextCategories);
        setPartners(nextPartners);
        setExisting(nextService);

        if (nextService) {
          setServiceType(nextService.type);
          setStatus(nextService.status);
          setTitle(nextService.name);
          setShortDesc(nextService.shortDescription);
          setFullDesc(nextService.fullDescription);
          setImageUrls(nextService.imageUrls);
          setCategory(nextService.categoryId ?? "");
          setVisibility(nextService.visibility);
          setPricingType(nextService.pricingType);
          setPrice(String(nextService.price));
          setCurrency(nextService.currencyCode);
          setVat(String(nextService.vatPercent));
          setAllowDiscount(nextService.allowDiscount);
          setBundleEligible(nextService.bundleEligible);
          setAvailType(nextService.availabilityType);
          setSlots(
            nextService.slots.map((slot, index) => ({
              id: slot.id,
              time: slot.time,
              capacity: slot.capacity,
              booked: slot.booked,
              sortOrder: slot.sortOrder ?? index,
            }))
          );
          setRecurringScheduleEnabled(nextService.recurringScheduleEnabled);
          setCapacityMode(nextService.capacityMode);
          setCapacityLimit(
            nextService.capacityLimit == null ? "" : String(nextService.capacityLimit)
          );
          setPreBooking(nextService.availableBeforeBooking);
          setDuringBooking(nextService.availableDuringBooking);
          setPostBooking(nextService.postBookingUpsell);
          setQrOrdering(nextService.inStayQrOrdering);
          setUpsellTriggerRoomType(nextService.upsellTriggerRoomType || "any");
          setEarlyDiscount(
            nextService.earlyBookingDiscountPercent == null
              ? ""
              : String(nextService.earlyBookingDiscountPercent)
          );
          setAiSearch(nextService.knowledgeAiSearchEnabled);
          setKnowledgeLang(nextService.knowledgeLanguage || "en");

          if (nextService.partnerId) {
            const partner = nextPartners.find((item) => item.id === nextService.partnerId);
            if (partner) {
              setPartnerName(partner.name);
              setRevenueShare(String(partner.revenueSharePercent));
              setPayoutType(partner.payoutType);
              setPartnerExternalUrl(partner.externalUrl ?? "");
              setPartnerAttributionTracking(partner.attributionTracking);
            }
          }
        } else {
          if (nextCategories.length > 0) {
            setCategory((current) => current || nextCategories[0].id);
          }
        }
      } catch (error) {
        if (!active) return;
        const message =
          error instanceof Error ? error.message : "Failed to load service form";
        setLoadError(message);
      } finally {
        if (active) setIsLoading(false);
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [id, isEdit, selectedPropertyId]);

  const selectedPartner = partners.find(
    (partner) => partner.name.trim().toLowerCase() === partnerName.trim().toLowerCase()
  );

  const save = async () => {
    if (!title.trim()) {
      toast.error("Service title is required.");
      return;
    }
    if (selectedPropertyId === "all") return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsSaving(true);
    try {
      let partnerId: string | null = existing?.partnerId ?? null;
      if (serviceType === "partner") {
        if (!partnerName.trim()) {
          toast.error("Partner name is required for partner services.");
          setIsSaving(false);
          return;
        }
        if (selectedPartner) {
          partnerId = selectedPartner.id;
          const shouldUpdatePartner =
            selectedPartner.revenueSharePercent !== (Number(revenueShare) || 0) ||
            selectedPartner.payoutType !== payoutType ||
            (selectedPartner.externalUrl ?? "") !== (partnerExternalUrl.trim() || "") ||
            selectedPartner.attributionTracking !== partnerAttributionTracking;
          if (shouldUpdatePartner) {
            const updatedPartner = await updateServicePartner(
              accessToken,
              selectedPropertyId,
              selectedPartner.id,
              {
                revenueSharePercent: Number(revenueShare) || 0,
                payoutType,
                externalUrl: partnerExternalUrl.trim() || null,
                attributionTracking: partnerAttributionTracking,
              }
            );
            setPartners((current) =>
              current.map((item) => (item.id === updatedPartner.id ? updatedPartner : item))
            );
          }
        } else {
          const createdPartner = await createServicePartner(accessToken, selectedPropertyId, {
            name: partnerName.trim(),
            revenueSharePercent: Number(revenueShare) || 0,
            payoutType,
            externalUrl: partnerExternalUrl.trim() || null,
            attributionTracking: partnerAttributionTracking,
            status: "active",
          });
          partnerId = createdPartner.id;
          setPartners((current) => [...current, createdPartner]);
        }
      } else {
        partnerId = null;
      }

      const payload = {
        name: title.trim(),
        shortDescription: shortDesc.trim(),
        fullDescription: fullDesc.trim(),
        imageUrls,
        type: serviceType,
        categoryId: category || null,
        partnerId,
        status,
        visibility,
        pricingType,
        price: Number(price) || 0,
        currencyCode: currency,
        vatPercent: Number(vat) || 0,
        allowDiscount,
        bundleEligible,
        availabilityType: availType,
        capacityMode,
        capacityLimit:
          capacityMode === "unlimited" || !capacityLimit.trim()
            ? null
            : Number(capacityLimit),
        recurringScheduleEnabled,
        availableBeforeBooking: preBooking,
        availableDuringBooking: duringBooking,
        postBookingUpsell: postBooking,
        inStayQrOrdering: qrOrdering,
        upsellTriggerRoomType,
        earlyBookingDiscountPercent: earlyDiscount.trim() ? Number(earlyDiscount) : null,
        knowledgeLanguage: knowledgeLang,
        knowledgeAiSearchEnabled: aiSearch,
        attachRate: existing?.attachRate ?? 0,
        totalBookings: existing?.totalBookings ?? 0,
        revenue30d: existing?.revenue30d ?? 0,
        conversionRate: existing?.conversionRate ?? 0,
        slots:
          availType === "time_slot"
            ? slots.map((slot, index) => ({
                time: slot.time,
                capacity: Number(slot.capacity) || 0,
                booked: Number(slot.booked) || 0,
                sortOrder: index,
              }))
            : [],
      };

      if (isEdit && id) {
        const updated = await updateService(accessToken, selectedPropertyId, id, payload);
        toast.success("Service updated");
        navigate(`/services/${updated.id}`);
      } else {
        const created = await createService(accessToken, selectedPropertyId, payload);
        toast.success("Service created");
        navigate(`/services/${created.id}`);
      }
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : "Failed to save service";
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
            Select a property to manage services
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to create or edit services.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <ServiceFormSkeleton />;
  }

  if (loadError) {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Could not load service form</h3>
          <p className="text-sm text-muted-foreground mt-1">{loadError}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
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
        <nav className="hidden lg:flex flex-col gap-1 w-52 shrink-0">
          {steps.map((item, index) => (
            <button
              key={item.key}
              onClick={() => setStep(index)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors text-left ${
                step === index
                  ? "bg-primary/10 text-primary"
                  : step > index
                    ? "text-muted-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <span
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold shrink-0 ${
                  step > index
                    ? "bg-success text-success-foreground"
                    : step === index
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground"
                }`}
              >
                {step > index ? <Check className="w-3.5 h-3.5" /> : index + 1}
              </span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex-1 min-w-0">
          <div className="rounded-2xl bg-card apple-shadow p-6">
            <div className="lg:hidden mb-4">
              <p className="text-xs text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
              <p className="font-semibold text-foreground">{steps[step].label}</p>
            </div>

            {steps[step].key === "basic" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Service Type</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {(["internal", "partner", "product"] as ServiceType[]).map((type) => (
                      <button
                        key={type}
                        onClick={() => setServiceType(type)}
                        className={`px-3 py-3 rounded-xl border text-sm font-medium transition-colors ${
                          serviceType === type
                            ? "border-primary bg-primary/5 text-primary"
                            : "hover:bg-muted"
                        }`}
                      >
                        {type === "internal"
                          ? "Internal Service"
                          : type === "partner"
                            ? "Partner Service"
                            : "Physical Product"}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Title</Label>
                  <Input
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="e.g. Deep Tissue Massage"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Short Description</Label>
                  <Input
                    value={shortDesc}
                    onChange={(event) => setShortDesc(event.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="One-line summary"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Full Description</Label>
                  <Textarea
                    value={fullDesc}
                    onChange={(event) => setFullDesc(event.target.value)}
                    className="rounded-xl mt-1 min-h-[100px]"
                    placeholder="Detailed description..."
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Images</Label>
                  <div className="mt-1 border-2 border-dashed rounded-xl p-6 text-center">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Drop images or click to upload</p>
                    {imageUrls.length > 0 && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {imageUrls.length} image URL(s) currently saved
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold">Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="rounded-xl mt-1">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categories.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.icon} {item.name}
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
                    ] as { value: Visibility; label: string }[]).map((item) => (
                      <button
                        key={item.value}
                        onClick={() => setVisibility(item.value)}
                        className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                          visibility === item.value
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {steps[step].key === "pricing" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Pricing Type</Label>
                  <div className="flex flex-wrap gap-2">
                    {(
                      ["fixed", "per_person", "per_night", "per_hour", "dynamic"] as PricingType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() => setPricingType(type)}
                        className={`px-3 py-2 rounded-xl border text-sm transition-colors ${
                          pricingType === type
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {type === "dynamic" ? (
                          <span className="flex items-center gap-1.5">
                            Dynamic{" "}
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                              Advanced
                            </Badge>
                          </span>
                        ) : (
                          type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())
                        )}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs font-semibold">Base Price</Label>
                    <Input
                      type="number"
                      value={price}
                      onChange={(event) => setPrice(event.target.value)}
                      className="rounded-xl mt-1"
                      placeholder="0.00"
                    />
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
                  <Input
                    type="number"
                    value={vat}
                    onChange={(event) => setVat(event.target.value)}
                    className="rounded-xl mt-1 w-32"
                    placeholder="20"
                  />
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

            {steps[step].key === "availability" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Availability Type</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {(
                      ["always", "date_range", "time_slot", "linked_booking"] as AvailabilityType[]
                    ).map((type) => (
                      <button
                        key={type}
                        onClick={() => setAvailType(type)}
                        className={`px-3 py-2.5 rounded-xl border text-sm transition-colors ${
                          availType === type
                            ? "border-primary bg-primary/5 text-primary font-medium"
                            : "hover:bg-muted text-muted-foreground"
                        }`}
                      >
                        {type.replace("_", " ").replace(/\b\w/g, (char) => char.toUpperCase())}
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
                          setSlots((current) => [
                            ...current,
                            {
                              id: `slot-new-${Date.now()}`,
                              time: "09:00",
                              capacity: 1,
                              booked: 0,
                              sortOrder: current.length,
                            },
                          ])
                        }
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Slot
                      </Button>
                    </div>
                    {slots.map((slot, index) => (
                      <div key={slot.id} className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                        <Input
                          value={slot.time}
                          onChange={(event) => {
                            const updated = [...slots];
                            updated[index] = { ...slot, time: event.target.value };
                            setSlots(updated);
                          }}
                          className="rounded-xl w-28"
                          placeholder="HH:MM"
                        />
                        <Input
                          type="number"
                          value={slot.capacity}
                          onChange={(event) => {
                            const updated = [...slots];
                            updated[index] = {
                              ...slot,
                              capacity: Number(event.target.value) || 0,
                            };
                            setSlots(updated);
                          }}
                          className="rounded-xl w-24"
                          placeholder="Cap."
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive"
                          onClick={() =>
                            setSlots((current) => current.filter((_, slotIndex) => slotIndex !== index))
                          }
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">Recurring schedule</Label>
                      <Switch
                        checked={recurringScheduleEnabled}
                        onCheckedChange={setRecurringScheduleEnabled}
                      />
                    </div>
                  </div>
                )}

                <div>
                  <Label className="text-xs font-semibold mb-2 block">Capacity</Label>
                  <Select value={capacityMode} onValueChange={(value: CapacityMode) => setCapacityMode(value)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="unlimited">Unlimited</SelectItem>
                      <SelectItem value="limited_quantity">Limited quantity</SelectItem>
                      <SelectItem value="per_day_limit">Per-day limit</SelectItem>
                      <SelectItem value="per_hour_limit">Per-hour limit</SelectItem>
                    </SelectContent>
                  </Select>
                  {capacityMode !== "unlimited" && (
                    <Input
                      type="number"
                      value={capacityLimit}
                      onChange={(event) => setCapacityLimit(event.target.value)}
                      className="rounded-xl mt-2 w-40"
                      placeholder="Limit"
                    />
                  )}
                </div>
              </div>
            )}

            {steps[step].key === "upsell" && (
              <div className="space-y-5">
                <div className="space-y-3">
                  <Label className="text-xs font-semibold block">Availability Windows</Label>
                  {[
                    {
                      label: "Available before booking",
                      value: preBooking,
                      set: setPreBooking,
                    },
                    {
                      label: "Available during booking",
                      value: duringBooking,
                      set: setDuringBooking,
                    },
                    { label: "Post-booking upsell", value: postBooking, set: setPostBooking },
                    { label: "In-stay QR ordering", value: qrOrdering, set: setQrOrdering },
                  ].map((option) => (
                    <div key={option.label} className="flex items-center justify-between">
                      <Label className="text-sm">{option.label}</Label>
                      <Switch checked={option.value} onCheckedChange={option.set} />
                    </div>
                  ))}
                </div>

                <div className="rounded-xl border p-4 space-y-3">
                  <Label className="text-xs font-semibold block">Upsell Trigger</Label>
                  <p className="text-sm text-muted-foreground">When guest books</p>
                  <Select value={upsellTriggerRoomType} onValueChange={setUpsellTriggerRoomType}>
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
                    onChange={(event) => setEarlyDiscount(event.target.value)}
                    className="rounded-xl mt-1 w-32"
                    placeholder="10"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Applied when booked X days before arrival
                  </p>
                </div>
              </div>
            )}

            {steps[step].key === "partner" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold">Partner Name</Label>
                  <Input
                    value={partnerName}
                    onChange={(event) => setPartnerName(event.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="Partner company"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Revenue Share %</Label>
                  <Input
                    type="number"
                    value={revenueShare}
                    onChange={(event) => setRevenueShare(event.target.value)}
                    className="rounded-xl mt-1 w-32"
                    placeholder="15"
                  />
                </div>
                <div>
                  <Label className="text-xs font-semibold">Payout Type</Label>
                  <Select
                    value={payoutType}
                    onValueChange={(value: "manual" | "automated" | "affiliate") =>
                      setPayoutType(value)
                    }
                  >
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
                  <Input
                    value={partnerExternalUrl}
                    onChange={(event) => setPartnerExternalUrl(event.target.value)}
                    className="rounded-xl mt-1"
                    placeholder="https://..."
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-sm">Enable attribution tracking</Label>
                  <Switch
                    checked={partnerAttributionTracking}
                    onCheckedChange={setPartnerAttributionTracking}
                  />
                </div>
              </div>
            )}

            {steps[step].key === "knowledge" && (
              <div className="space-y-5">
                <div>
                  <Label className="text-xs font-semibold">Upload Documents</Label>
                  <div className="mt-1 border-2 border-dashed rounded-xl p-6 text-center">
                    <FileText className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">
                      Drop PDF, menus, terms, or safety instructions
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-xs font-semibold mb-2 block">Language</Label>
                  <div className="flex gap-1 p-1 rounded-xl bg-muted/60 w-fit">
                    {["en", "ua", "pl", "de"].map((language) => (
                      <button
                        key={language}
                        onClick={() => setKnowledgeLang(language)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium uppercase transition-colors ${
                          knowledgeLang === language
                            ? "bg-card apple-shadow text-foreground"
                            : "text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">Enable AI knowledge search</Label>
                    <p className="text-xs text-muted-foreground">
                      Allow AI agent to reference these documents
                    </p>
                  </div>
                  <Switch checked={aiSearch} onCheckedChange={setAiSearch} />
                </div>
              </div>
            )}
          </div>

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
                <Button
                  className="rounded-xl"
                  onClick={() => {
                    void save();
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : isEdit ? "Save Changes" : "Create Service"}
                </Button>
              )}
            </div>
          </div>
        </div>

        {steps[step].key === "pricing" && (
          <div className="hidden xl:block w-72 shrink-0">
            <div className="sticky top-6 rounded-2xl bg-card apple-shadow overflow-hidden">
              <div className="h-32 bg-muted flex items-center justify-center overflow-hidden">
                {imageUrls[0] ? (
                  <img src={imageUrls[0]} alt={title || "Service"} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl">🖼️</span>
                )}
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
