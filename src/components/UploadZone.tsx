import { useCallback, useState } from "react";
import { Upload, Image, Video } from "lucide-react";
import { cn } from "@/lib/utils";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const UploadZone = ({ onFileSelect, isProcessing }: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = Array.from(e.dataTransfer.files);
      if (files.length > 0) {
        const file = files[0];
        if (file.type.startsWith("image/") || file.type.startsWith("video/")) {
          onFileSelect(file);
        }
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onFileSelect(files[0]);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
      className={cn(
        "relative border-2 border-dashed rounded-2xl p-12 transition-all duration-300",
        isDragging
          ? "border-primary bg-primary/10 scale-105"
          : "border-border hover:border-primary/50",
        isProcessing && "opacity-50 pointer-events-none"
      )}
    >
      <input
        type="file"
        id="file-upload"
        className="hidden"
        accept="image/*,video/*"
        onChange={handleFileInput}
        disabled={isProcessing}
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center justify-center cursor-pointer"
      >
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse-glow" />
          <div className="relative bg-card p-6 rounded-full border border-primary/30">
            <Upload className="w-12 h-12 text-primary animate-float" />
          </div>
        </div>
        <h3 className="text-2xl font-semibold mb-2">
          Drop your files here
        </h3>
        <p className="text-muted-foreground mb-4">
          or click to browse
        </p>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
            <Image className="w-4 h-4 text-primary" />
            <span className="text-sm">Images</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-lg">
            <Video className="w-4 h-4 text-accent" />
            <span className="text-sm">Videos</span>
          </div>
        </div>
      </label>
    </div>
  );
};
