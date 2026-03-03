import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";
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
import { useProperty } from "@/contexts/PropertyContext";
import { readAccessToken } from "@/lib/auth";
import {
  createServiceCategory,
  deleteServiceCategory,
  fetchServiceCategories,
  reorderServiceCategories,
  updateServiceCategory,
  type ServiceCategory,
} from "@/lib/servicesApi";
import { toast } from "sonner";

export function CategoriesManagement() {
  const { selectedPropertyId } = useProperty();
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (selectedPropertyId === "all") {
        if (!active) return;
        setCategories([]);
        setIsLoading(false);
        setError(null);
        return;
      }

      const accessToken = readAccessToken();
      if (!accessToken) {
        if (!active) return;
        setCategories([]);
        setError("You are not authenticated. Please sign in again.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);
      try {
        const items = await fetchServiceCategories(accessToken, selectedPropertyId);
        if (!active) return;
        setCategories(items);
      } catch (loadError) {
        if (!active) return;
        const message =
          loadError instanceof Error ? loadError.message : "Failed to load categories";
        setCategories([]);
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

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", description: "", icon: "" });
    setDialogOpen(true);
  };

  const openEdit = (category: ServiceCategory) => {
    setEditId(category.id);
    setForm({
      name: category.name,
      description: category.description,
      icon: category.icon,
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.name.trim() || selectedPropertyId === "all") return;

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    setIsSaving(true);
    try {
      if (editId) {
        const updated = await updateServiceCategory(accessToken, selectedPropertyId, editId, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || "📦",
        });
        setCategories((current) =>
          current.map((category) => (category.id === updated.id ? updated : category))
        );
        toast.success("Category updated");
      } else {
        const created = await createServiceCategory(accessToken, selectedPropertyId, {
          name: form.name.trim(),
          description: form.description.trim(),
          icon: form.icon.trim() || "📦",
          sortOrder: categories.length + 1,
        });
        setCategories((current) => [...current, created]);
        toast.success("Category added");
      }
      setDialogOpen(false);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : "Failed to save category";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (selectedPropertyId === "all") return;
    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    try {
      await deleteServiceCategory(accessToken, selectedPropertyId, id);
      setCategories((current) => current.filter((category) => category.id !== id));
      toast.success("Category deleted");
    } catch (removeError) {
      const message =
        removeError instanceof Error ? removeError.message : "Failed to delete category";
      toast.error(message);
    }
  };

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };

  const handleDragEnd = async () => {
    if (
      dragItem.current === null ||
      dragOverItem.current === null ||
      selectedPropertyId === "all"
    ) {
      return;
    }

    const accessToken = readAccessToken();
    if (!accessToken) {
      toast.error("You are not authenticated. Please sign in again.");
      return;
    }

    const items = [...categories];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    const reordered = items.map((category, index) => ({
      ...category,
      sortOrder: index + 1,
    }));
    setCategories(reordered);

    dragItem.current = null;
    dragOverItem.current = null;

    try {
      const saved = await reorderServiceCategories(
        accessToken,
        selectedPropertyId,
        reordered.map((item, index) => ({ id: item.id, sortOrder: index + 1 }))
      );
      setCategories(saved);
    } catch (reorderError) {
      const message =
        reorderError instanceof Error ? reorderError.message : "Failed to reorder categories";
      toast.error(message);
    }
  };

  if (selectedPropertyId === "all") {
    return (
      <Card className="rounded-xl border-dashed">
        <CardContent className="p-8 text-center">
          <h3 className="text-base font-semibold text-foreground">
            Select a property to manage categories
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Choose one property from the switcher to load categories from the API.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, idx) => (
          <Skeleton key={`category-skeleton-${idx}`} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card className="rounded-xl border-destructive/30">
        <CardContent className="p-6">
          <h3 className="text-sm font-semibold text-foreground">Could not load categories</h3>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Drag to reorder categories</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-2xl bg-card apple-shadow divide-y divide-border">
        {categories.map((category, index) => (
          <motion.div
            key={category.id}
            className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragEnter={() => handleDragEnter(index)}
            onDragEnd={() => {
              void handleDragEnd();
            }}
            onDragOver={(event) => event.preventDefault()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: index * 0.04 }}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xl">{category.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{category.name}</p>
              <p className="text-xs text-muted-foreground truncate">{category.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => openEdit(category)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive"
              onClick={() => {
                void remove(category.id);
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </motion.div>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Category" : "Add Category"}</DialogTitle>
            <DialogDescription>
              {editId ? "Update category details" : "Create a new service category"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <div>
              <Label className="text-xs font-semibold">Icon (emoji)</Label>
              <Input
                value={form.icon}
                onChange={(event) => setForm({ ...form, icon: event.target.value })}
                className="rounded-xl mt-1 w-20"
                placeholder="🧖"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Name</Label>
              <Input
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
                className="rounded-xl mt-1"
                placeholder="Category name"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="rounded-xl mt-1"
                placeholder="Short description"
              />
            </div>
            <Button
              className="w-full rounded-xl"
              onClick={() => {
                void save();
              }}
              disabled={!form.name.trim() || isSaving}
            >
              {editId ? "Save" : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
