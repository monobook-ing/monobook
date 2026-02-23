import { useState, useRef, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Upload, Trash2, FileText, CreditCard, Link2, Loader2, MoreVertical, X, User, Star, MapPin, Award, RefreshCw, Pencil } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useProperty } from "@/contexts/PropertyContext";
import {
  createKnowledgeFile,
  deleteKnowledgeFile,
  fetchKnowledgeFiles,
  fetchHostProfile,
  type KnowledgeFile,
  readAccessToken,
  type HostProfile,
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

interface ToggleItemProps {
  label: string;
  description: string;
  defaultOn?: boolean;
}

function ToggleItem({ label, description, defaultOn = false }: ToggleItemProps) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5">
      <div>
        <p className="text-sm font-medium text-card-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <motion.button
        className="relative w-[62px] h-[36px] rounded-full flex items-center min-w-[62px] min-h-[44px] cursor-pointer"
        onClick={() => setOn(!on)}
        whileTap={{ scale: 0.92 }}
      >
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: on
              ? "inset 0 0 0 2.5px hsl(142 50% 42%)"
              : "inset 0 0 0 2px hsl(0 0% 0% / 0.08)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ inset: "3px" }}
          animate={{
            backgroundColor: on ? "hsl(142 55% 55%)" : "hsl(0 0% 0% / 0.04)",
          }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute rounded-full bg-white"
          style={{
            width: "26px",
            height: "26px",
            top: "5px",
            boxShadow: "0 1px 4px hsl(0 0% 0% / 0.18), 0 0 0 0.5px hsl(0 0% 0% / 0.04)",
          }}
          animate={{ left: on ? "31px" : "5px" }}
          transition={{ type: "spring", stiffness: 500, damping: 35 }}
        />
      </motion.button>
    </div>
  );
}

interface PaymentProviderItemProps {
  label: string;
  description: string;
  defaultConnected?: boolean;
}

function PaymentProviderItem({ label, description, defaultConnected = false }: PaymentProviderItemProps) {
  const [connected, setConnected] = useState(defaultConnected);
  const [showDisableDialog, setShowDisableDialog] = useState(false);

  const handleToggle = () => {
    if (connected) {
      setShowDisableDialog(true);
    }
  };

  const handleConnect = () => {
    setConnected(true);
  };

  const handleConfirmDisable = () => {
    setConnected(false);
    setShowDisableDialog(false);
  };

  return (
    <>
      <div className="flex items-center justify-between py-3.5">
        <div>
          <p className="text-sm font-medium text-card-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {connected ? (
          <motion.button
            className="relative w-[62px] h-[36px] rounded-full flex items-center min-w-[62px] min-h-[44px] cursor-pointer"
            onClick={handleToggle}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: "inset 0 0 0 2.5px hsl(142 50% 42%)" }}
            />
            <motion.div
              className="absolute rounded-full"
              style={{ inset: "3px", backgroundColor: "hsl(142 55% 55%)" }}
            />
            <motion.div
              className="absolute rounded-full bg-white"
              style={{
                width: "26px",
                height: "26px",
                top: "5px",
                left: "31px",
                boxShadow: "0 1px 4px hsl(0 0% 0% / 0.18), 0 0 0 0.5px hsl(0 0% 0% / 0.04)",
              }}
            />
          </motion.button>
        ) : (
          <motion.button
            className="px-5 py-2 rounded-full bg-foreground text-background font-medium text-sm min-h-[44px]"
            whileTap={{ scale: 0.95 }}
            onClick={handleConnect}
          >
            Connect {label}
          </motion.button>
        )}
      </div>

      <AlertDialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable {label}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disconnect {label}? This will stop processing payments through this provider.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisable} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
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

const mimeTypeByExtension: Record<string, string> = {
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  txt: "text/plain",
};

const getMimeType = (file: File) => {
  if (file.type && file.type.trim().length > 0) return file.type;
  const parts = file.name.toLowerCase().split(".");
  const extension = parts.length > 1 ? parts[parts.length - 1] : "";
  return mimeTypeByExtension[extension] || "application/octet-stream";
};

const formatFileSize = (bytes: number) => {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  let value = bytes;
  let idx = 0;

  while (value >= 1024 && idx < units.length - 1) {
    value /= 1024;
    idx += 1;
  }

  if (idx === 0) {
    return `${Math.round(value)} ${units[idx]}`;
  }

  const rounded = value >= 10 ? value.toFixed(0) : value.toFixed(1);
  return `${rounded} ${units[idx]}`;
};

const formatCreatedAt = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown date";
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
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
              <Pencil className="w-3.5 h-3.5" /> Edit
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
  const { selectedPropertyId } = useProperty();
  const [knowledgeFiles, setKnowledgeFiles] = useState<KnowledgeFile[]>([]);
  const [isKnowledgeLoading, setIsKnowledgeLoading] = useState(false);
  const [knowledgeError, setKnowledgeError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Array<{ id: string; name: string }>>([]);
  const [previewFile, setPreviewFile] = useState<KnowledgeFile | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const requestIdRef = useRef(0);

  const syncPreviewFile = useCallback((items: KnowledgeFile[], deletedId?: string) => {
    setPreviewFile((prev) => {
      if (!prev) return null;
      if (deletedId && prev.id === deletedId) return null;
      return items.find((item) => item.id === prev.id) ?? null;
    });
  }, []);

  useEffect(() => {
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;
    setShowDeleteDialog(false);
    setDeletingFileId(null);

    if (selectedPropertyId === "all") {
      setKnowledgeFiles([]);
      setKnowledgeError(null);
      setIsKnowledgeLoading(false);
      setUploadingFiles([]);
      setPreviewFile(null);
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      setKnowledgeFiles([]);
      setKnowledgeError("missing_token");
      setIsKnowledgeLoading(false);
      setUploadingFiles([]);
      setPreviewFile(null);
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

  const handleDeleteFromPreview = useCallback(async () => {
    if (!previewFile || selectedPropertyId === "all" || deletingFileId) return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      setKnowledgeError("missing_token");
      return;
    }

    setDeletingFileId(previewFile.id);
    setKnowledgeError(null);

    try {
      await deleteKnowledgeFile(accessToken, selectedPropertyId, previewFile.id);
      await refreshKnowledgeFiles(accessToken, selectedPropertyId, previewFile.id);
      setShowDeleteDialog(false);
    } catch (deleteError) {
      const message =
        deleteError instanceof Error ? deleteError.message : "Failed to delete knowledge file";
      setKnowledgeError(message);
    } finally {
      setDeletingFileId(null);
    }
  }, [deletingFileId, previewFile, refreshKnowledgeFiles, selectedPropertyId]);

  const removeKnowledgeFile = useCallback(
    async (id: string) => {
      if (selectedPropertyId === "all" || deletingFileId) return;
      const accessToken = readAccessToken();
      if (!accessToken) {
        setKnowledgeError("missing_token");
        return;
      }

      setDeletingFileId(id);
      setKnowledgeError(null);

      try {
        await deleteKnowledgeFile(accessToken, selectedPropertyId, id);
        await refreshKnowledgeFiles(accessToken, selectedPropertyId, id);
      } catch (deleteError) {
        const message =
          deleteError instanceof Error ? deleteError.message : "Failed to delete knowledge file";
        setKnowledgeError(message);
      } finally {
        setDeletingFileId(null);
      }
    },
    [deletingFileId, refreshKnowledgeFiles, selectedPropertyId]
  );

  const uploadKnowledgeFiles = useCallback(
    async (fileList: FileList) => {
      if (selectedPropertyId === "all") return;

      const accessToken = readAccessToken();
      if (!accessToken) {
        setKnowledgeError("missing_token");
        return;
      }

      const files = Array.from(fileList);
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
            createKnowledgeFile(accessToken, selectedPropertyId, {
              name: file.name,
              size: formatFileSize(file.size),
              mimeType: getMimeType(file),
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
      void uploadKnowledgeFiles(e.dataTransfer.files);
    }
  }, [uploadKnowledgeFiles]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      void uploadKnowledgeFiles(e.target.files);
      e.target.value = "";
    }
  }, [uploadKnowledgeFiles]);

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
      <div className="rounded-2xl bg-card apple-shadow mb-6">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <Link2 className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">PMS Sync</h2>
          </div>
        </div>
        <div className="px-5 divide-y divide-border">
          <ToggleItem label="Mews" description="Sync rooms & rates automatically" defaultOn />
          <ToggleItem label="Cloudbeds" description="Two-way calendar sync" />
          <ToggleItem label="Servio" description="POS & reservation sync" />
        </div>
      </div>

      {/* Payment Providers */}
      <div className="rounded-2xl bg-card apple-shadow mb-6">
        <div className="p-5 border-b border-border">
          <div className="flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-semibold text-card-foreground">Payment Providers</h2>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Connect payment providers to process bookings
          </p>
        </div>
        <div className="px-5 divide-y divide-border">
          <PaymentProviderItem label="Stripe" description="Card payments & Apple Pay" defaultConnected />
          <PaymentProviderItem label="JP Morgan" description="Enterprise payment processing" />
          <PaymentProviderItem label="iPay" description="Mobile & online payments" />
          <PaymentProviderItem label="LiqPay" description="Ukrainian payment gateway" />
          <PaymentProviderItem label="MonoBank" description="Direct bank integration" />
        </div>
      </div>

      {/* Knowledge Base */}
      <div className="rounded-2xl bg-card apple-shadow mb-6">
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
                accept=".pdf,.docx,.doc,.txt"
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
                <p className="text-xs text-muted-foreground">PDF, DOCX up to 10MB</p>
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
                <div className="px-5 pb-3 divide-y divide-border">
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
                    <div key={file.id} className="flex items-center justify-between py-3">
                      <div
                        className="flex items-center gap-3 cursor-pointer flex-1 min-w-0"
                        onClick={() => setPreviewFile(file)}
                      >
                        <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4 text-muted-foreground" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-card-foreground truncate">{file.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {file.size} · {formatCreatedAt(file.createdAt)}
                          </p>
                        </div>
                      </div>
                      <motion.button
                        data-testid={`knowledge-delete-${file.id}`}
                        disabled={Boolean(deletingFileId)}
                        className="w-9 h-9 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px] text-destructive hover:bg-destructive/10 transition-colors disabled:opacity-60"
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          void removeKnowledgeFile(file.id);
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
                      className="w-9 h-9 rounded-full flex items-center justify-center min-w-[44px] min-h-[44px] hover:bg-secondary transition-colors"
                      whileTap={{ scale: 0.9 }}
                    >
                      <MoreVertical className="w-5 h-5 text-muted-foreground" />
                    </motion.button>
                  </PopoverTrigger>
                  <PopoverContent align="end" className="w-48 rounded-xl p-1.5">
                    <button
                      disabled={Boolean(deletingFileId)}
                      className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-lg text-sm text-destructive hover:bg-destructive/10 transition-colors min-h-[44px]"
                      onClick={() => setShowDeleteDialog(true)}
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
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center">
                <FileText className="w-10 h-10 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-base font-semibold text-foreground">{previewFile.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {previewFile.size} · Uploaded {formatCreatedAt(previewFile.createdAt)}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete file?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {previewFile?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                void handleDeleteFromPreview();
              }}
              disabled={Boolean(deletingFileId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
