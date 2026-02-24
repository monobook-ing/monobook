import { type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { cn } from "@/lib/utils";

interface MobileDestructiveConfirmSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  confirmDisabled?: boolean;
  cancelDisabled?: boolean;
  testId?: string;
  confirmButtonClassName?: string;
  contentClassName?: string;
}

export function MobileDestructiveConfirmSheet({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  confirmDisabled = false,
  cancelDisabled = false,
  testId,
  confirmButtonClassName,
  contentClassName,
}: MobileDestructiveConfirmSheetProps) {
  const handleCancel = () => {
    if (onCancel) {
      onCancel();
      return;
    }
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent
        data-testid={testId}
        className={cn(
          "rounded-t-[32px] border-white/40 bg-background/80 backdrop-blur-2xl max-h-[85vh] overflow-y-auto pb-[max(1rem,env(safe-area-inset-bottom))] apple-shadow-lg",
          contentClassName,
        )}
      >
        <div className="px-5 pb-4 pt-1">
          <DrawerHeader className="px-0 pt-3 text-center">
            <DrawerTitle>{title}</DrawerTitle>
            <DrawerDescription className="mt-1 text-sm text-muted-foreground">{description}</DrawerDescription>
          </DrawerHeader>
          <div className="mt-4 space-y-3">
            <Button
              type="button"
              onClick={onConfirm}
              disabled={confirmDisabled}
              className={cn(
                "h-12 w-full rounded-2xl bg-destructive text-destructive-foreground hover:bg-destructive/90",
                confirmButtonClassName,
              )}
            >
              {confirmLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={cancelDisabled}
              className="h-12 w-full rounded-2xl border-white/45 bg-background/65 hover:bg-background/80"
            >
              {cancelLabel}
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
