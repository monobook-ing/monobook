import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { GripVertical, Plus, Pencil, Trash2 } from "lucide-react";
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
import { mockServiceCategories, type ServiceCategory } from "@/data/mockServiceData";

export function CategoriesManagement() {
  const [categories, setCategories] = useState<ServiceCategory[]>([...mockServiceCategories]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", description: "", icon: "" });
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const openAdd = () => {
    setEditId(null);
    setForm({ name: "", description: "", icon: "" });
    setDialogOpen(true);
  };

  const openEdit = (c: ServiceCategory) => {
    setEditId(c.id);
    setForm({ name: c.name, description: c.description, icon: c.icon });
    setDialogOpen(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editId) {
      setCategories((prev) =>
        prev.map((c) =>
          c.id === editId ? { ...c, name: form.name, description: form.description, icon: form.icon } : c
        )
      );
    } else {
      setCategories((prev) => [
        ...prev,
        {
          id: `cat-${Date.now()}`,
          name: form.name,
          description: form.description,
          icon: form.icon || "📦",
          order: prev.length + 1,
        },
      ]);
    }
    setDialogOpen(false);
  };

  const remove = (id: string) => setCategories((prev) => prev.filter((c) => c.id !== id));

  const handleDragStart = (idx: number) => {
    dragItem.current = idx;
  };

  const handleDragEnter = (idx: number) => {
    dragOverItem.current = idx;
  };

  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...categories];
    const [dragged] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, dragged);
    setCategories(items.map((c, i) => ({ ...c, order: i + 1 })));
    dragItem.current = null;
    dragOverItem.current = null;
  };

  return (
    <>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm text-muted-foreground">Drag to reorder categories</p>
        <Button size="sm" className="rounded-xl gap-1.5" onClick={openAdd}>
          <Plus className="w-4 h-4" /> Add Category
        </Button>
      </div>

      <div className="rounded-2xl bg-card apple-shadow divide-y divide-border">
        {categories.map((c, i) => (
          <motion.div
            key={c.id}
            className="flex items-center gap-3 p-4 cursor-grab active:cursor-grabbing"
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragEnter={() => handleDragEnter(i)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => e.preventDefault()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <GripVertical className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xl">{c.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{c.name}</p>
              <p className="text-xs text-muted-foreground truncate">{c.description}</p>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(c)}>
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => remove(c.id)}>
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
              <Input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="rounded-xl mt-1 w-20" placeholder="🧖" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl mt-1" placeholder="Category name" />
            </div>
            <div>
              <Label className="text-xs font-semibold">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="rounded-xl mt-1" placeholder="Short description" />
            </div>
            <Button className="w-full rounded-xl" onClick={save} disabled={!form.name.trim()}>
              {editId ? "Save" : "Add Category"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
