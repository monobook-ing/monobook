import { BedDouble } from "lucide-react";
import { cn } from "@/lib/utils";

interface RoomImagePreviewProps {
  imageUrl?: string;
  alt: string;
  className?: string;
}

export function RoomImagePreview({ imageUrl, alt, className }: RoomImagePreviewProps) {
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt={alt}
        className={cn("w-16 h-12 rounded-lg object-cover border-2 border-background shadow-sm", className)}
      />
    );
  }

  return (
    <div
      aria-label={`${alt} image unavailable`}
      className={cn(
        "w-16 h-12 rounded-lg bg-muted/80 border-2 border-background shadow-sm flex items-center justify-center",
        className
      )}
    >
      <BedDouble className="w-4 h-4 text-muted-foreground" />
    </div>
  );
}
