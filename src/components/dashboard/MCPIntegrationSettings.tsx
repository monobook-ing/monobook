import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, CreditCard, Link2, Loader2, MoreVertical, X, User, Star, MapPin, Award, RefreshCw, Pencil, LogOut, AlertCircle, MessageSquare } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AIProviderSettings } from "./AIProviderSettings";
import { toast } from "sonner";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProperty } from "@/contexts/PropertyContext";
import { triggerSelectionHaptic } from "@/lib/haptics";
import {
  deleteKnowledgeFile,
  fetchAuditEntries,
  fetchPaymentConnections,
  fetchKnowledgeFiles,
  fetchHostProfile,
  fetchPmsConnections,
  uploadKnowledgeFile,
  type AuditEntry,
  type KnowledgeFile,
  type PaymentConnection,
  type PmsConnection,
  clearAuthStorage,
  readAccessToken,
  type HostProfile,
  updatePaymentConnection,
  updatePmsConnection,
  type UpdateHostProfileInput,
  updateHostProfile,
} from "@/lib/auth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useIsMobile } from "@/hooks/use-mobile";
import { MobileDestructiveConfirmSheet } from "@/components/dashboard/MobileDestructiveConfirmSheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const pmsProviderDescriptions: Record<string, string> = {
  mews: "Sync rooms & rates automatically",
  cloudbeds: "Two-way calendar sync",
  servio: "POS & reservation sync",
};

const formatPmsProviderLabel = (provider: string) => {
  if (!provider) return "Unknown";
  return provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getPmsProviderDescription = (provider: string) => {
  return pmsProviderDescriptions[provider.toLowerCase()] || "PMS integration";
};

const formatPmsError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load PMS connections.";
  }
  return error;
};

const paymentProviderCatalog = [
  { provider: "stripe", label: "Stripe", description: "Card payments & Apple Pay" },
  { provider: "jpmorgan", label: "JP Morgan", description: "Enterprise payment processing" },
  { provider: "ipay", label: "iPay", description: "Mobile & online payments" },
  { provider: "liqpay", label: "LiqPay", description: "Ukrainian payment gateway" },
  { provider: "monobank", label: "MonoBank", description: "Direct bank integration" },
];

const paymentProviderLabelByProvider = new Map(
  paymentProviderCatalog.map((provider) => [provider.provider, provider.label])
);

const formatPaymentProviderLabel = (provider: string) => {
  const catalogLabel = paymentProviderLabelByProvider.get(provider);
  if (catalogLabel) return catalogLabel;
  if (!provider) return "Unknown";
  return provider
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const formatPaymentError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load payment connections.";
  }
  return error;
};

interface PmsConnectionItemProps {
  connection: PmsConnection;
  isUpdating: boolean;
  onToggle: (connection: PmsConnection) => void;
}

function PmsConnectionItem({ connection, isUpdating, onToggle }: PmsConnectionItemProps) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-card-foreground">{formatPmsProviderLabel(connection.provider)}</p>
        <p className="text-xs text-muted-foreground">{getPmsProviderDescription(connection.provider)}</p>
      </div>
      <motion.button
        data-testid={`pms-toggle-${connection.provider}`}
        className="relative w-[62px] h-[36px] rounded-full flex items-center min-w-[62px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        onClick={() => onToggle(connection)}
        whileTap={{ scale: 0.92 }}
        disabled={isUpdating}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: connection.enabled
              ? "inset 0 0 0 2.5px hsl(142 50% 42%)"
              : "inset 0 0 0 2px hsl(0 0% 0% / 0.08)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ inset: "3px" }}
          animate={{
            backgroundColor: connection.enabled ? "hsl(142 55% 55%)" : "hsl(0 0% 0% / 0.04)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-white flex items-center justify-center"
          style={{
            width: "26px",
            height: "26px",
            top: "5px",
            boxShadow: "0 1px 4px hsl(0 0% 0% / 0.18), 0 0 0 0.5px hsl(0 0% 0% / 0.04)",
          }}
          animate={{ left: connection.enabled ? "31px" : "5px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
        </motion.div>
      </motion.button>
    </div>
  );
}

interface PaymentConnectionItemProps {
  label: string;
  description: string;
  connection: PaymentConnection;
  isUpdating: boolean;
  onToggle: (connection: PaymentConnection) => void;
}

function PaymentConnectionItem({
  label,
  description,
  connection,
  isUpdating,
  onToggle,
}: PaymentConnectionItemProps) {
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <motion.button
        data-testid={`payment-toggle-${connection.provider}`}
        className="relative w-[62px] h-[36px] rounded-full flex items-center min-w-[62px] cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
        onClick={() => onToggle(connection)}
        whileTap={{ scale: 0.92 }}
        disabled={isUpdating}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: connection.enabled
              ? "inset 0 0 0 2.5px hsl(142 50% 42%)"
              : "inset 0 0 0 2px hsl(0 0% 0% / 0.08)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ inset: "3px" }}
          animate={{
            backgroundColor: connection.enabled ? "hsl(142 55% 55%)" : "hsl(0 0% 0% / 0.04)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-white flex items-center justify-center"
          style={{
            width: "26px",
            height: "26px",
            top: "5px",
            boxShadow: "0 1px 4px hsl(0 0% 0% / 0.18), 0 0 0 0.5px hsl(0 0% 0% / 0.04)",
          }}
          animate={{ left: connection.enabled ? "31px" : "5px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        >
          {isUpdating ? <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" /> : null}
        </motion.div>
      </motion.button>
    </div>
  );
}

const emptyEditForm: UpdateHostProfileInput = {
  name: "",
  location: "",
  bio: "",
};

const formatHostProfileError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load host profile.";
  }
  return error;
};

const formatKnowledgeFilesError = (error: string) => {
  if (error === "missing_token") {
    return "You are not authenticated. Please sign in again to load knowledge files.";
  }
  return error;
};

const languageOptions = [
  { value: "en", label: "English" },
  { value: "uk", label: "Ukrainian" },
  { value: "es", label: "Spanish" },
  { value: "de", label: "German" },
];

const docTypeOptions = [
  { value: "general", label: "General" },
  { value: "house_rules", label: "House rules" },
  { value: "cancellation", label: "Cancellation" },
  { value: "wifi", label: "WiFi" },
  { value: "faq", label: "FAQ" },
  { value: "amenities", label: "Amenities" },
  { value: "pricing", label: "Pricing" },
];

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const formatTimestamp = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatDocType = (value: string) => {
  const option = docTypeOptions.find((item) => item.value === value);
  return option?.label ?? value;
};

const getIndexingBadgeClasses = (status: string) => {
  if (status === "indexed") {
    return "bg-emerald-500/10 text-emerald-700 border-emerald-500/30";
  }
  if (status === "in_progress") {
    return "bg-blue-500/10 text-blue-700 border-blue-500/30";
  }
  if (status === "error") {
    return "bg-destructive/10 text-destructive border-destructive/30";
  }
  return "bg-amber-500/10 text-amber-700 border-amber-500/30";
};

const formatIndexingStatus = (status: string) => {
  if (status === "in_progress") return "In progress";
  if (status === "indexed") return "Indexed";
  if (status === "error") return "Error";
  return "Pending";
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object") return null;
  return value as Record<string, unknown>;
};

const extractQueryLogQuestion = (entry: AuditEntry) => {
  const payload = asRecord(entry.requestPayload);
  const value = payload?.question;
  return typeof value === "string" ? value : entry.description;
};

const extractQueryLogChunksCount = (entry: AuditEntry) => {
  const requestPayload = asRecord(entry.requestPayload);
  const requestChunks = requestPayload?.chunks_used;
  if (Array.isArray(requestChunks)) return requestChunks.length;
  if (typeof requestPayload?.chunks_used_count === "number") {
    return requestPayload.chunks_used_count;
  }

  const responsePayload = asRecord(entry.responsePayload);
  const responseChunks = responsePayload?.chunks_used;
  if (Array.isArray(responseChunks)) return responseChunks.length;
  if (typeof responsePayload?.chunk_count === "number") {
    return responsePayload.chunk_count;
  }

  return 0;
};

const extractQueryLogAnswerPreview = (entry: AuditEntry) => {
  const responsePayload = asRecord(entry.responsePayload);
  const answer = responsePayload?.answer;
  if (typeof answer === "string" && answer.trim().length > 0) {
    return answer.trim().slice(0, 180);
  }
  return entry.description;
};

function HostDetailsSection() {
  const { selectedPropertyId } = useProperty();
  const [host, setHost] = useState<HostProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateHostProfileInput>(emptyEditForm);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setEditing(false);

    if (selectedPropertyId === "all") {
      setHost(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setHost(null);
      setError("missing_token");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    setHost(null);

    fetchHostProfile(accessToken, selectedPropertyId)
      .then((result) => {
        if (requestIdRef.current !== requestId) return;
        setHost(result);
        setEditForm({
          name: result.name,
          location: result.location,
          bio: result.bio,
        });
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch host profile";
        setHost(null);
        setError(message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsLoading(false);
        }
      });
  }, [selectedPropertyId]);

  const saveEdit = async () => {
    if (!host || selectedPropertyId === "all") return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      setError("missing_token");
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      const updated = await updateHostProfile(accessToken, selectedPropertyId, editForm);
      setHost(updated);
      setEditForm({
        name: updated.name,
        location: updated.location,
        bio: updated.bio,
      });
      setEditing(false);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to update host profile";
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    if (!host) return;
    setEditForm({
      name: host.name,
      location: host.location,
      bio: host.bio,
    });
    setEditing(false);
  };

  return (
    <div className="rounded-2xl bg-card apple-shadow mb-6">
      <div className="p-5 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Host Details</h2>
          </div>
          {!editing && host && (
            <Button
              variant="ghost"
              size="sm"
              aria-label="Edit host profile"
              className="rounded-xl gap-1.5 h-8"
              disabled={isLoading || isSaving}
              onClick={() => {
                setEditForm({
                  name: host.name,
                  location: host.location,
                  bio: host.bio,
                });
                setEditing(true);
              }}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-1">Your host profile visible to guests</p>
      </div>

      <div className="p-5">
        {selectedPropertyId === "all" && (
          <Card className="rounded-xl border-dashed" data-testid="host-details-select-property-state">
            <CardContent className="p-6 text-center">
              <h3 className="text-base font-semibold text-foreground">Select a property to view host details</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Choose one property from the switcher to load host profile data.
              </p>
            </CardContent>
          </Card>
        )}

        {selectedPropertyId !== "all" && isLoading && (
          <div className="space-y-4" data-testid="host-details-loading-state">
            <div className="flex items-start gap-4">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-44" />
                <Skeleton className="h-4 w-36" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
              <Skeleton className="h-16 rounded-xl" />
            </div>
            <Skeleton className="h-16 rounded-xl" />
          </div>
        )}

        {selectedPropertyId !== "all" && !isLoading && error && !host && (
          <Card className="rounded-xl border-destructive/30" data-testid="host-details-error-state">
            <CardContent className="p-6">
              <h3 className="text-sm font-semibold text-foreground">Could not load host profile</h3>
              <p className="text-sm text-muted-foreground mt-1">{formatHostProfileError(error)}</p>
            </CardContent>
          </Card>
        )}

        {selectedPropertyId !== "all" && !isLoading && host && (
          <>
            {error && (
              <Card className="rounded-xl border-destructive/30 mb-4" data-testid="host-details-save-error-state">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">{formatHostProfileError(error)}</p>
                </CardContent>
              </Card>
            )}

        {editing ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {host.avatarUrl ? (
                  <img src={host.avatarUrl} alt={host.name} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">{host.avatarInitials}</AvatarFallback>
                )}
              </Avatar>
              <div className="text-xs text-muted-foreground">
                <p className="font-medium text-foreground text-sm">Profile photo</p>
                <p>Photo updates will be available soon</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label htmlFor="host-name-input" className="text-xs">Name</Label>
                <Input
                  id="host-name-input"
                  value={editForm.name}
                  onChange={(e) => setEditForm((p) => ({ ...p, name: e.target.value }))}
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="host-location-input" className="text-xs">Location</Label>
                <Input
                  id="host-location-input"
                  value={editForm.location}
                  onChange={(e) => setEditForm((p) => ({ ...p, location: e.target.value }))}
                  className="rounded-xl mt-1"
                />
              </div>
              <div className="col-span-2">
                <Label htmlFor="host-bio-input" className="text-xs">Bio</Label>
                <Textarea
                  id="host-bio-input"
                  value={editForm.bio}
                  onChange={(e) => setEditForm((p) => ({ ...p, bio: e.target.value }))}
                  className="rounded-xl mt-1"
                  rows={3}
                />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" className="rounded-xl gap-1.5" onClick={saveEdit} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Save
              </Button>
              <Button size="sm" variant="ghost" className="rounded-xl" onClick={cancelEdit} disabled={isSaving}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Profile card inspired by Airbnb */}
            <div className="flex items-start gap-4">
              <Avatar className="h-16 w-16 shrink-0">
                {host.avatarUrl ? (
                  <img src={host.avatarUrl} alt={host.name} className="h-full w-full object-cover" />
                ) : (
                  <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">{host.avatarInitials}</AvatarFallback>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg font-semibold text-foreground">{host.name}</h3>
                  {host.superhost && (
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Award className="w-3 h-3" /> Superhost
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                  <MapPin className="w-3.5 h-3.5" /> {host.location}
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-lg font-bold text-foreground">{host.reviews.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Reviews</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-lg font-bold text-foreground">{host.rating}<Star className="w-3.5 h-3.5 inline ml-0.5 -mt-0.5 text-foreground" /></p>
                <p className="text-xs text-muted-foreground">Rating</p>
              </div>
              <div className="text-center p-3 rounded-xl bg-secondary/50">
                <p className="text-lg font-bold text-foreground">{host.yearsHosting}</p>
                <p className="text-xs text-muted-foreground">Years hosting</p>
              </div>
            </div>

            {/* Bio */}
            <p className="text-sm text-muted-foreground leading-relaxed">{host.bio}</p>
          </div>
        )}

        {/* Sync buttons */}
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Sync from platform</p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              data-testid="host-sync-airbnb-button"
              disabled
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Airbnb
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-1.5"
              data-testid="host-sync-booking-button"
              disabled
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Booking.com
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
        </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MCPIntegrationSettings() {
  const truncateFileName = (name: string, maxChars = 36) =>
    name.length > maxChars ? `${name.slice(0, maxChars)}..` : name;

  const { selectedPropertyId } = useProperty();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [pmsConnections, setPmsConnections] = useState<PmsConnection[]>([]);
  const [isPmsLoading, setIsPmsLoading] = useState(false);
  const [pmsError, setPmsError] = useState<string | null>(null);
  const [updatingProviders, setUpdatingProviders] = useState<Set<string>>(new Set());
  const [paymentConnections, setPaymentConnections] = useState<PaymentConnection[]>([]);
  const [isPaymentLoading, setIsPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [updatingPaymentProviders, setUpdatingPaymentProviders] = useState<Set<string>>(new Set());
  const [pendingDisablePaymentProvider, setPendingDisablePaymentProvider] = useState<PaymentConnection | null>(null);
  const [showDisablePaymentDialog, setShowDisablePaymentDialog] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ id: string; name: string }>>([]);
  const [pendingUploadFiles, setPendingUploadFiles] = useState<File[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadLanguage, setUploadLanguage] = useState("en");
  const [uploadDocType, setUploadDocType] = useState("general");
  const [uploadEffectiveDate, setUploadEffectiveDate] = useState("");
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [pendingDeleteFile, setPendingDeleteFile] = useState<KnowledgeFile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const [queryLogs, setQueryLogs] = useState<AuditEntry[]>([]);
  const [queryLogsCursor, setQueryLogsCursor] = useState<string | null>(null);
  const [isQueryLogsLoading, setIsQueryLogsLoading] = useState(false);
  const [queryLogsError, setQueryLogsError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pmsRequestIdRef = useRef(0);
  const paymentRequestIdRef = useRef(0);
  const requestIdRef = useRef(0);

  const syncPreviewFile = useCallback((items: KnowledgeFile[], deletedId?: string) => {
    setPreviewFile((prev) => {
      if (!prev) return null;
      if (deletedId && prev.id === deletedId) return null;
      return items.find((item) => item.id === prev.id) ?? null;
    });
  }, []);

  useEffect(() => {
    const requestId = pmsRequestIdRef.current + 1;
    pmsRequestIdRef.current = requestId;
    setUpdatingProviders(new Set());

    if (selectedPropertyId === "all") {
      setPmsConnections([]);
      setPmsError(null);
      setIsPmsLoading(false);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setPmsConnections([]);
      setPmsError("missing_token");
      setIsPmsLoading(false);
      return;
    }

    setIsPmsLoading(true);
    setPmsError(null);
    setPmsConnections([]);

    fetchPmsConnections(accessToken, selectedPropertyId)
      .then((items) => {
        if (pmsRequestIdRef.current !== requestId) return;
        setPmsConnections(items);
      })
      .catch((fetchError) => {
        if (pmsRequestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch PMS connections";
        setPmsConnections([]);
        setPmsError(message);
      })
      .finally(() => {
        if (pmsRequestIdRef.current === requestId) {
          setIsPmsLoading(false);
        }
      });
  }, [selectedPropertyId]);

  useEffect(() => {
    const requestId = paymentRequestIdRef.current + 1;
    paymentRequestIdRef.current = requestId;
    setUpdatingPaymentProviders(new Set());
    setPendingDisablePaymentProvider(null);
    setShowDisablePaymentDialog(false);

    if (selectedPropertyId === "all") {
      setPaymentConnections([]);
      setPaymentError(null);
      setIsPaymentLoading(false);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setPaymentConnections([]);
      setPaymentError("missing_token");
      setIsPaymentLoading(false);
      return;
    }

    setIsPaymentLoading(true);
    setPaymentError(null);
    setPaymentConnections([]);

    fetchPaymentConnections(accessToken, selectedPropertyId)
      .then((items) => {
        if (paymentRequestIdRef.current !== requestId) return;
        setPaymentConnections(items);
      })
      .catch((fetchError) => {
        if (paymentRequestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch payment connections";
        setPaymentConnections([]);
        setPaymentError(message);
      })
      .finally(() => {
        if (paymentRequestIdRef.current === requestId) {
          setIsPaymentLoading(false);
        }
      });
  }, [selectedPropertyId]);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setShowDeleteDialog(false);
    setPendingDeleteFile(null);
    setDeletingFileId(null);
    setPendingUploadFiles([]);
    setShowUploadDialog(false);
    setUploadLanguage("en");
    setUploadDocType("general");
    setUploadEffectiveDate("");

    if (selectedPropertyId === "all") {
      setKnowledgeFiles([]);
      setKnowledgeError(null);
      setIsKnowledgeLoading(false);
      setUploadingFiles([]);
      setPreviewFile(null);
      setQueryLogs([]);
      setQueryLogsCursor(null);
      setQueryLogsError(null);
      setIsQueryLogsLoading(false);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setKnowledgeFiles([]);
      setKnowledgeError("missing_token");
      setIsKnowledgeLoading(false);
      setUploadingFiles([]);
      setPreviewFile(null);
      setQueryLogs([]);
      setQueryLogsCursor(null);
      setQueryLogsError("missing_token");
      setIsQueryLogsLoading(false);
      return;
    }

    setIsKnowledgeLoading(true);
    setKnowledgeError(null);
    setKnowledgeFiles([]);
    setUploadingFiles([]);

    fetchKnowledgeFiles(accessToken, selectedPropertyId)
      .then((items) => {
        if (requestIdRef.current !== requestId) return;
        setKnowledgeFiles(items);
        syncPreviewFile(items);
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch knowledge files";
        setKnowledgeFiles([]);
        setPreviewFile(null);
        setKnowledgeError(message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsKnowledgeLoading(false);
        }
      });

    setIsQueryLogsLoading(true);
    setQueryLogsError(null);
    setQueryLogs([]);
    setQueryLogsCursor(null);

    fetchAuditEntries(accessToken, selectedPropertyId, { source: "chatgpt", limit: 20 })
      .then(({ items, nextCursor }) => {
        if (requestIdRef.current !== requestId) return;
        const filtered = items.filter((entry) => entry.toolName === "search_knowledge");
        setQueryLogs(filtered);
        setQueryLogsCursor(nextCursor);
      })
      .catch((fetchError) => {
        if (requestIdRef.current !== requestId) return;
        const message =
          fetchError instanceof Error ? fetchError.message : "Failed to fetch query logs";
        setQueryLogs([]);
        setQueryLogsCursor(null);
        setQueryLogsError(message);
      })
      .finally(() => {
        if (requestIdRef.current === requestId) {
          setIsQueryLogsLoading(false);
        }
      });
  }, [selectedPropertyId, syncPreviewFile]);

  const refreshKnowledgeFiles = useCallback(
    async (accessToken: string, propertyId: string, deletedId?: string) => {
      const items = await fetchKnowledgeFiles(accessToken, propertyId);
      setKnowledgeFiles(items);
      syncPreviewFile(items, deletedId);
      return items;
    },
    [syncPreviewFile]
  );

  const requestDeleteKnowledgeFile = useCallback((file: KnowledgeFile) => {
    setPendingDeleteFile(file);
    setShowDeleteDialog(true);
  }, []);

  const onDeleteDialogOpenChange = useCallback((nextOpen: boolean) => {
    setShowDeleteDialog(nextOpen);
    if (!nextOpen && !deletingFileId) {
      setPendingDeleteFile(null);
    }
  }, [deletingFileId]);

  const cancelDeleteKnowledgeFile = useCallback(() => {
    if (deletingFileId) return;
    setShowDeleteDialog(false);
    setPendingDeleteFile(null);
  }, [deletingFileId]);

  const confirmDeleteKnowledgeFile = useCallback(async () => {
    if (!pendingDeleteFile || selectedPropertyId === "all" || deletingFileId) return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      setKnowledgeError("missing_token");
      return;
    }

    setDeletingFileId(pendingDeleteFile.id);
    setKnowledgeError(null);

    try {
      await deleteKnowledgeFile(accessToken, selectedPropertyId, pendingDeleteFile.id);
      await refreshKnowledgeFiles(accessToken, selectedPropertyId, pendingDeleteFile.id);
      setShowDeleteDialog(false);
      setPendingDeleteFile(null);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Failed to delete knowledge file";
      setKnowledgeError(message);
    } finally {
      setDeletingFileId(null);
    }
  }, [deletingFileId, pendingDeleteFile, refreshKnowledgeFiles, selectedPropertyId]);

  const uploadKnowledgeFiles = useCallback(
    async (
      files: File[],
      metadata: { language: string; docType: string; effectiveDate: string | null }
    ) => {
      if (selectedPropertyId === "all") return;

      const accessToken = readAccessToken();
      if (!accessToken) {
        setKnowledgeError("missing_token");
        return;
      }

      if (files.length === 0) return;

      const tempFiles = files.map((file) => ({
        id: `upload-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        name: file.name,
      }));

      setUploadingFiles((prev) => [...prev, ...tempFiles]);
      setKnowledgeError(null);

      try {
        await Promise.all(
          files.map((file) =>
            uploadKnowledgeFile(accessToken, selectedPropertyId, {
              file,
              language: metadata.language,
              docType: metadata.docType,
              effectiveDate: metadata.effectiveDate,
            })
          )
        );
        await refreshKnowledgeFiles(accessToken, selectedPropertyId);
      } catch (uploadError) {
        const message =
          uploadError instanceof Error ? uploadError.message : "Failed to upload knowledge file";
        setKnowledgeError(message);
      } finally {
        setUploadingFiles((prev) =>
          prev.filter((item) => !tempFiles.some((temp) => temp.id === item.id))
        );
      }
    },
    [refreshKnowledgeFiles, selectedPropertyId]
  );

  const queueKnowledgeFiles = useCallback((fileList: FileList) => {
    const files = Array.from(fileList);
    if (files.length === 0) return;
    setPendingUploadFiles(files);
    setShowUploadDialog(true);
  }, []);

  const confirmUploadKnowledgeFiles = useCallback(async () => {
    if (pendingUploadFiles.length === 0) return;
    const metadata = {
      language: uploadLanguage,
      docType: uploadDocType,
      effectiveDate: uploadEffectiveDate.trim().length > 0 ? uploadEffectiveDate : null,
    };
    await uploadKnowledgeFiles(pendingUploadFiles, metadata);
    setShowUploadDialog(false);
    setPendingUploadFiles([]);
    setUploadEffectiveDate("");
  }, [pendingUploadFiles, uploadDocType, uploadEffectiveDate, uploadKnowledgeFiles, uploadLanguage]);

  const loadMoreQueryLogs = useCallback(async () => {
    if (!queryLogsCursor || selectedPropertyId === "all" || isQueryLogsLoading) return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      setQueryLogsError("missing_token");
      return;
    }

    setIsQueryLogsLoading(true);
    setQueryLogsError(null);
    try {
      const { items, nextCursor } = await fetchAuditEntries(accessToken, selectedPropertyId, {
        source: "chatgpt",
        limit: 20,
        cursor: queryLogsCursor,
      });
      const filtered = items.filter((entry) => entry.toolName === "search_knowledge");
      setQueryLogs((prev) => [...prev, ...filtered]);
      setQueryLogsCursor(nextCursor);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : "Failed to load more logs";
      setQueryLogsError(message);
    } finally {
      setIsQueryLogsLoading(false);
    }
  }, [isQueryLogsLoading, queryLogsCursor, selectedPropertyId]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length > 0) {
      queueKnowledgeFiles(e.dataTransfer.files);
    }
  }, [queueKnowledgeFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      queueKnowledgeFiles(e.target.files);
      e.target.value = "";
    }
  }, [queueKnowledgeFiles]);

  const togglePmsConnection = useCallback(
    async (connection: PmsConnection) => {
      if (selectedPropertyId === "all") return;
      const accessToken = readAccessToken();
      if (!accessToken) {
        setPmsError("missing_token");
        return;
      }
      if (updatingProviders.has(connection.provider)) return;

      const nextEnabled = !connection.enabled;
      setPmsError(null);
      setUpdatingProviders((prev) => {
        const next = new Set(prev);
        next.add(connection.provider);
        return next;
      });
      setPmsConnections((prev) =>
        prev.map((item) =>
          item.provider === connection.provider
            ? { ...item, enabled: nextEnabled }
            : item
        )
      );

      try {
        const updated = await updatePmsConnection(
          accessToken,
          selectedPropertyId,
          connection.provider,
          { enabled: nextEnabled }
        );
        setPmsConnections((prev) =>
          prev.map((item) =>
            item.provider === updated.provider ? updated : item
          )
        );
        triggerSelectionHaptic();
      } catch (updateError) {
        const message =
          updateError instanceof Error ? updateError.message : "Failed to update PMS connection";
        setPmsConnections((prev) =>
          prev.map((item) =>
            item.provider === connection.provider
              ? { ...item, enabled: connection.enabled }
              : item
          )
        );
        setPmsError(message);
        toast.error(message);
      } finally {
        setUpdatingProviders((prev) => {
          const next = new Set(prev);
          next.delete(connection.provider);
          return next;
        });
      }
    },
    [selectedPropertyId, updatingProviders]
  );

  const updatePaymentConnectionEnabledState = useCallback(
    async (connection: PaymentConnection, nextEnabled: boolean) => {
      if (selectedPropertyId === "all") return false;
      const accessToken = readAccessToken();
      if (!accessToken) {
        setPaymentError("missing_token");
        return false;
      }
      if (updatingPaymentProviders.has(connection.provider)) return false;

      setPaymentError(null);
      setUpdatingPaymentProviders((prev) => {
        const next = new Set(prev);
        next.add(connection.provider);
        return next;
      });
      setPaymentConnections((prev) =>
        prev.map((item) =>
          item.provider === connection.provider
            ? { ...item, enabled: nextEnabled }
            : item
        )
      );

      try {
        const updated = await updatePaymentConnection(
          accessToken,
          selectedPropertyId,
          connection.provider,
          { enabled: nextEnabled }
        );
        setPaymentConnections((prev) =>
          prev.map((item) =>
            item.provider === updated.provider ? updated : item
          )
        );
        return true;
      } catch (updateError) {
        const message =
          updateError instanceof Error ? updateError.message : "Failed to update payment connection";
        setPaymentConnections((prev) =>
          prev.map((item) =>
            item.provider === connection.provider
              ? { ...item, enabled: connection.enabled }
              : item
          )
        );
        setPaymentError(message);
        toast.error(message);
        return false;
      } finally {
        setUpdatingPaymentProviders((prev) => {
          const next = new Set(prev);
          next.delete(connection.provider);
          return next;
        });
      }
    },
    [selectedPropertyId, updatingPaymentProviders]
  );

  const togglePaymentConnection = useCallback(
    async (connection: PaymentConnection) => {
      if (connection.enabled) {
        setPendingDisablePaymentProvider(connection);
        setShowDisablePaymentDialog(true);
        return;
      }

      const didUpdate = await updatePaymentConnectionEnabledState(connection, true);
      if (didUpdate) {
        triggerSelectionHaptic();
      }
    },
    [updatePaymentConnectionEnabledState]
  );

  const confirmDisablePaymentConnection = useCallback(async () => {
    if (!pendingDisablePaymentProvider) return;
    const didUpdate = await updatePaymentConnectionEnabledState(pendingDisablePaymentProvider, false);
    if (didUpdate) {
      triggerSelectionHaptic();
    }
    setShowDisablePaymentDialog(false);
    setPendingDisablePaymentProvider(null);
  }, [pendingDisablePaymentProvider, updatePaymentConnectionEnabledState]);

  const cancelDisablePaymentConnection = useCallback(() => {
    setShowDisablePaymentDialog(false);
    setPendingDisablePaymentProvider(null);
  }, []);

  const onDisablePaymentDialogOpenChange = useCallback((nextOpen: boolean) => {
    setShowDisablePaymentDialog(nextOpen);
    if (!nextOpen) {
      setPendingDisablePaymentProvider(null);
    }
  }, []);

  const pendingDisableProviderLabel = formatPaymentProviderLabel(
    pendingDisablePaymentProvider?.provider ?? ""
  );
  const isDisablePaymentPending =
    !pendingDisablePaymentProvider ||
    updatingPaymentProviders.has(pendingDisablePaymentProvider.provider);

  const paymentConnectionsByProvider = new Map(
    paymentConnections.map((connection) => [connection.provider, connection])
  );
  const paymentConnectionItems = paymentProviderCatalog.map((provider) => {
    const existing = paymentConnectionsByProvider.get(provider.provider);
    return {
      ...provider,
      connection:
        existing ?? {
          id: `payment-${provider.provider}`,
          propertyId: selectedPropertyId === "all" ? "" : selectedPropertyId,
          provider: provider.provider,
          enabled: false,
          config: {},
          createdAt: "",
          updatedAt: "",
        },
    };
  });

  const handleLogout = () => {
    clearAuthStorage();
    navigate("/auth", { replace: true });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <h1 className="text-2xl font-bold text-foreground tracking-tight mb-1">Settings</h1>
      <p className="text-sm text-muted-foreground mb-6">AI agent integrations & configuration</p>

      {/* Host Details */}
      <HostDetailsSection />
      <div className="rounded-2xl bg-card apple-shadow mb-6 overflow-x-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">PMS Sync</h2>
          </div>
        </div>

        {selectedPropertyId === "all" && (
          <div className="p-5">
            <Card className="rounded-xl border-dashed" data-testid="pms-select-property-state">
              <CardContent className="p-6 text-center">
                <h3 className="text-base font-semibold text-foreground">Select a property to view PMS sync</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose one property from the switcher to load PMS provider connections.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && isPmsLoading && (
          <div className="px-5 pb-3 space-y-3" data-testid="pms-loading-state">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          </div>
        )}

        {selectedPropertyId !== "all" && !isPmsLoading && pmsError && (
          <div className="p-5">
            <Card className="rounded-xl border-destructive/30" data-testid="pms-error-state">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground">Could not load PMS connections</h3>
                <p className="text-sm text-muted-foreground mt-1">{formatPmsError(pmsError)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && !isPmsLoading && !pmsError && (
          <>
            <div className="px-5 divide-y divide-border">
              {pmsConnections.map((connection) => (
                <PmsConnectionItem
                  key={connection.id}
                  connection={connection}
                  isUpdating={updatingProviders.has(connection.provider)}
                  onToggle={togglePmsConnection}
                />
              ))}
            </div>
            {pmsConnections.length === 0 && (
              <div className="p-5 pt-0">
                <Card className="rounded-xl border-dashed" data-testid="pms-empty-state">
                  <CardContent className="p-6 text-center">
                    <h3 className="text-base font-semibold text-foreground">No PMS providers found</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Available PMS connections will appear here once configured.
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </>
        )}
      </div>

      {/* Payment Providers */}
      <div className="rounded-2xl bg-card apple-shadow mb-6 overflow-x-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Payment Providers</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connect payment providers to process bookings
          </p>
        </div>

        {selectedPropertyId === "all" && (
          <div className="p-5">
            <Card className="rounded-xl border-dashed" data-testid="payment-select-property-state">
              <CardContent className="p-6 text-center">
                <h3 className="text-base font-semibold text-foreground">Select a property to view payment providers</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose one property from the switcher to load payment provider connections.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && isPaymentLoading && (
          <div className="px-5 pb-3 space-y-3" data-testid="payment-loading-state">
            <div className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-44" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
            <div className="flex items-center justify-between py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-36" />
              </div>
              <Skeleton className="h-9 w-16 rounded-full" />
            </div>
          </div>
        )}

        {selectedPropertyId !== "all" && !isPaymentLoading && paymentError && (
          <div className="p-5">
            <Card className="rounded-xl border-destructive/30" data-testid="payment-error-state">
              <CardContent className="p-6">
                <h3 className="text-sm font-semibold text-foreground">Could not load payment connections</h3>
                <p className="text-sm text-muted-foreground mt-1">{formatPaymentError(paymentError)}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && !isPaymentLoading && !paymentError && (
          <div className="px-5 divide-y divide-border">
            {paymentConnectionItems.map((item) => (
              <PaymentConnectionItem
                key={item.provider}
                label={item.label}
                description={item.description}
                connection={item.connection}
                isUpdating={updatingPaymentProviders.has(item.provider)}
                onToggle={togglePaymentConnection}
              />
            ))}
          </div>
        )}
      </div>

      {/* AI Providers */}
      <AIProviderSettings />

      {/* Knowledge Base */}
      <div className="rounded-2xl bg-card apple-shadow mb-6 overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Knowledge Base (RAG)</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Upload hotel manuals, WiFi passwords, and policies
          </p>
        </div>

        {selectedPropertyId === "all" && (
          <div className="p-5">
            <Card className="rounded-xl border-dashed" data-testid="knowledge-select-property-state">
              <CardContent className="p-6 text-center">
                <h3 className="text-base font-semibold text-foreground">Select a property to view knowledge files</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Choose one property from the switcher to load knowledge base files.
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && (
          <>
            <div className="p-5">
              <input
                ref={fileInputRef}
                data-testid="knowledge-file-input"
                type="file"
                accept=".pdf,.docx,.doc,.txt,.md,.csv,.html,.htm"
                multiple
                className="hidden"
                onChange={handleFileSelect}
              />
              <motion.div
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center cursor-pointer transition-colors ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/30"
                }`}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                animate={isDragging ? { scale: 1.01 } : { scale: 1 }}
                transition={{ duration: 0.2 }}
              >
                <Upload className={`w-8 h-8 mb-2 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
                <p className="text-sm font-medium text-card-foreground">
                  {isDragging ? "Drop to upload" : "Drop files here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">PDF, DOCX, DOC, TXT, MD, CSV, HTML up to 10MB</p>
              </motion.div>
            </div>

            {isKnowledgeLoading && (
              <div className="px-5 pb-3 space-y-3" data-testid="knowledge-loading-state">
                <div className="flex items-center gap-3 py-2">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-64" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
                <div className="flex items-center gap-3 py-2">
                  <Skeleton className="w-9 h-9 rounded-xl shrink-0" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-52" />
                    <Skeleton className="h-3 w-36" />
                  </div>
                </div>
              </div>
            )}

            {!isKnowledgeLoading && knowledgeError && (
              <div className="px-5 pb-5">
                <Card className="rounded-xl border-destructive/30" data-testid="knowledge-error-state">
                  <CardContent className="p-6">
                    <h3 className="text-sm font-semibold text-foreground">Could not load knowledge files</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatKnowledgeFilesError(knowledgeError)}
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}

            {!isKnowledgeLoading && !knowledgeError && (
              <>
                <div className="px-5 pb-3 divide-y divide-border overflow-x-hidden">
                  <AnimatePresence>
                    {uploadingFiles.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between py-3"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                            <Loader2 className="w-4 h-4 text-primary animate-spin" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Uploading...</p>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {knowledgeFiles.map((file) => (
                    <div key={file.id} className="flex items-center justify-between py-3 gap-2 min-w-0 overflow-x-hidden">
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0 overflow-x-hidden"
                        onClick={() => setPreviewFile(file)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p
                            className="block w-full overflow-hidden whitespace-nowrap text-ellipsis text-sm font-medium text-card-foreground"
                            title={file.name}
                          >
                            {truncateFileName(file.name)}
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 mt-1">
                            <Badge variant="outline" className={getIndexingBadgeClasses(file.indexingStatus)}>
                              {formatIndexingStatus(file.indexingStatus)}
                            </Badge>
                            {file.indexingStatus === "indexed" && (
                              <Badge variant="outline" className="text-xs">
                                {file.chunkCount} chunks
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs">
                              {formatDocType(file.docType)}
                            </Badge>
                            {file.indexingStatus === "error" && file.extractionError && (
                              <TooltipProvider delayDuration={150}>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <button
                                      type="button"
                                      className="inline-flex items-center text-destructive"
                                      onClick={(e) => e.stopPropagation()}
                                      aria-label="Show extraction error"
                                    >
                                      <AlertCircle className="w-4 h-4" />
                                    </button>
                                  </TooltipTrigger>
                                  <TooltipContent side="top" className="max-w-xs text-xs">
                                    {file.extractionError}
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            {file.size} · {formatCreatedAt(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        data-testid={`knowledge-delete-${file.id}`}
                        disabled={Boolean(deletingFileId)}
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 min-w-[44px] min-h-[44px] text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          requestDeleteKnowledgeFile(file);
                        }}
                      >
                        {deletingFileId === file.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </motion.button>
                    </div>
                  ))}
                </div>

                {knowledgeFiles.length === 0 && uploadingFiles.length === 0 && (
                  <div className="px-5 pb-5">
                    <Card className="rounded-xl border-dashed" data-testid="knowledge-empty-state">
                      <CardContent className="p-6 text-center">
                        <h3 className="text-base font-semibold text-foreground">No knowledge files yet</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Upload policy docs and guides to power your RAG assistant.
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      <div className="rounded-2xl bg-card apple-shadow mb-6 overflow-hidden">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Query Log</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Last ChatGPT `search_knowledge` calls
          </p>
        </div>

        {selectedPropertyId === "all" && (
          <div className="p-5">
            <Card className="rounded-xl border-dashed">
              <CardContent className="p-6 text-center">
                <h3 className="text-base font-semibold text-foreground">Select a property to view query logs</h3>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && isQueryLogsLoading && queryLogs.length === 0 && (
          <div className="px-5 py-4 space-y-3">
            <Skeleton className="h-14 rounded-xl" />
            <Skeleton className="h-14 rounded-xl" />
          </div>
        )}

        {selectedPropertyId !== "all" && queryLogsError && (
          <div className="p-5">
            <Card className="rounded-xl border-destructive/30">
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground">{queryLogsError}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {selectedPropertyId !== "all" && !queryLogsError && (
          <div className="p-5 space-y-3">
            {queryLogs.length === 0 && !isQueryLogsLoading && (
              <Card className="rounded-xl border-dashed">
                <CardContent className="p-6 text-center">
                  <p className="text-sm text-muted-foreground">No `search_knowledge` queries yet.</p>
                </CardContent>
              </Card>
            )}

            {queryLogs.map((entry) => (
              <Card key={entry.id} className="rounded-xl">
                <CardContent className="p-3.5">
                  <p className="text-xs text-muted-foreground">{formatTimestamp(entry.createdAt)}</p>
                  <p className="text-sm font-medium text-foreground mt-1">{extractQueryLogQuestion(entry)}</p>
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {extractQueryLogAnswerPreview(entry)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Chunks used: {extractQueryLogChunksCount(entry)}
                  </p>
                </CardContent>
              </Card>
            ))}

            {queryLogsCursor && (
              <Button
                variant="outline"
                className="w-full rounded-xl"
                onClick={() => {
                  void loadMoreQueryLogs();
                }}
                disabled={isQueryLogsLoading}
              >
                {isQueryLogsLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Load more
              </Button>
            )}
          </div>
        )}
      </div>

      {isMobile && (
        <div className="">
          <div className="py-2 pb-[max(1.25rem,calc(env(safe-area-inset-bottom)+0.75rem))]">
            <Button
              type="button"
              variant="outline"
              data-testid="mobile-settings-logout-button"
              onClick={handleLogout}
              className="h-12 w-full rounded-2xl border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </Button>
          </div>
        </div>
      )}

      {/* File Preview Overlay */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex flex-col"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-semibold text-foreground truncate">{previewFile.name}</h2>
              <div className="flex items-center gap-1">
                <Popover>
                  <PopoverTrigger asChild>
                    <motion.button
                      data-testid="knowledge-preview-menu-trigger"
                      className="w-9 h-9 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-secondary transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 rounded-xl p-1.5">
                    <button
                      data-testid="knowledge-preview-delete-action"
                      disabled={Boolean(deletingFileId)}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
                      onClick={() => {
                        if (previewFile) {
                          requestDeleteKnowledgeFile(previewFile);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </button>
                  </PopoverContent>
                </Popover>
                <motion.button
                  className="w-9 h-9 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-secondary transition-colors"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setPreviewFile(null)}
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>
            </div>

            {/* Body */}
            <div className="flex-1 flex items-center justify-center p-8">
              <div className="flex flex-col items-center gap-3 text-center max-w-full">
                <div
                  className="flex items-center justify-center gap-3 min-w-0 max-w-full"
                  data-testid="knowledge-preview-title-row"
                >
                  <div
                    className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center shrink-0"
                    data-testid="knowledge-preview-title-icon"
                  >
                    <FileText className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-base font-semibold text-foreground break-words">
                    {previewFile.name}
                  </p>
                </div>
                <p className="text-sm text-muted-foreground" data-testid="knowledge-preview-metadata">
                  {previewFile.size} · Uploaded {formatCreatedAt(previewFile.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Dialog
        open={showUploadDialog}
        onOpenChange={(nextOpen) => {
          setShowUploadDialog(nextOpen);
          if (!nextOpen && uploadingFiles.length === 0) {
            setPendingUploadFiles([]);
          }
        }}
      >
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Upload Knowledge Files</DialogTitle>
            <DialogDescription>
              Set metadata before indexing. {pendingUploadFiles.length} file(s) selected.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="max-h-28 overflow-auto rounded-xl border border-border p-2">
              {pendingUploadFiles.map((file) => (
                <p key={`${file.name}-${file.size}`} className="text-xs text-muted-foreground truncate">
                  {file.name}
                </p>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Language</Label>
                <Select value={uploadLanguage} onValueChange={setUploadLanguage}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languageOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Document Type</Label>
                <Select value={uploadDocType} onValueChange={setUploadDocType}>
                  <SelectTrigger className="rounded-xl">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {docTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="knowledge-effective-date" className="text-xs">Effective Date</Label>
              <Input
                id="knowledge-effective-date"
                type="date"
                value={uploadEffectiveDate}
                onChange={(e) => setUploadEffectiveDate(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setShowUploadDialog(false);
                setPendingUploadFiles([]);
              }}
              disabled={uploadingFiles.length > 0}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                void confirmUploadKnowledgeFiles();
              }}
              disabled={pendingUploadFiles.length === 0 || uploadingFiles.length > 0}
            >
              {uploadingFiles.length > 0 ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Upload & Index
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      {isMobile ? (
        <MobileDestructiveConfirmSheet
          open={showDeleteDialog}
          onOpenChange={onDeleteDialogOpenChange}
          title="Delete file?"
          description={
            <>
              Are you sure you want to delete {pendingDeleteFile?.name}? This action cannot be undone.
            </>
          }
          confirmLabel="Delete"
          onConfirm={confirmDeleteKnowledgeFile}
          onCancel={cancelDeleteKnowledgeFile}
          confirmDisabled={Boolean(deletingFileId)}
          testId="delete-knowledge-drawer"
        />
      ) : (
        <AlertDialog open={showDeleteDialog} onOpenChange={onDeleteDialogOpenChange}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Delete file?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete {pendingDeleteFile?.name}? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={Boolean(deletingFileId)}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  void confirmDeleteKnowledgeFile();
                }}
                disabled={Boolean(deletingFileId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isMobile ? (
        <MobileDestructiveConfirmSheet
          open={showDisablePaymentDialog}
          onOpenChange={onDisablePaymentDialogOpenChange}
          title={`Disable ${pendingDisableProviderLabel}?`}
          description={
            <>
              Are you sure you want to disconnect {pendingDisableProviderLabel}? This will stop
              processing payments through this provider.
            </>
          }
          confirmLabel="Disable"
          onConfirm={confirmDisablePaymentConnection}
          onCancel={cancelDisablePaymentConnection}
          confirmDisabled={isDisablePaymentPending}
          testId="disable-payment-drawer"
        />
      ) : (
        <AlertDialog open={showDisablePaymentDialog} onOpenChange={onDisablePaymentDialogOpenChange}>
          <AlertDialogContent className="rounded-2xl">
            <AlertDialogHeader>
              <AlertDialogTitle>Disable {pendingDisableProviderLabel}?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to disconnect {pendingDisableProviderLabel}? This will stop
                processing payments through this provider.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={cancelDisablePaymentConnection}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDisablePaymentConnection}
                disabled={isDisablePaymentPending}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Disable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </motion.div>
  );
}
