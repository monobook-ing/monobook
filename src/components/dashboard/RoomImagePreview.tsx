import { BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomImagePreviewProps {
  imageUrl?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  buttonClassName?: string;
}

export function RoomImagePreview({
  imageUrl,
  alt,
  className,
  onClick,
  isActive = false,
  buttonClassName,
}: RoomImagePreviewProps) {
  const previewClasses = cn(
    "w-16 h-12 rounded-lg border-2 border-background shadow-sm shrink-0 transition-all",
    className
  );

  const previewContent = imageUrl ? (
    <img src={imageUrl} alt={alt} className={cn("w-full h-full rounded-lg object-cover", previewClasses)} />
  ) : (
    <div
      aria-label={`${alt} image unavailable`}
      className={cn(
        "bg-muted/80 flex items-center justify-center",
        previewClasses
      )}
    >
      <BedDouble className="w-4 h-4 text-muted-foreground" />
    </div>
  );

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-label={alt}
        aria-pressed={isActive}
        className={cn(
          "rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          isActive ? "ring-2 ring-primary" : "opacity-80 hover:opacity-100",
          buttonClassName
        )}
      >
        {previewContent}
      </button>
    );
  }

  return previewContent;
}
