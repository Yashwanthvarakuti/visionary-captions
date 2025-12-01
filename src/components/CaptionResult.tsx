import { useState } from "react";
import { Copy, Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface CaptionResultProps {
  caption: string;
  imageUrl: string;
  isVideo?: boolean;
}

export const CaptionResult = ({ caption, imageUrl, isVideo }: CaptionResultProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(caption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
      <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-2xl">
        <div className="relative aspect-video">
          {isVideo ? (
            <video
              src={imageUrl}
              className="w-full h-full object-cover"
              controls
            />
          ) : (
            <img
              src={imageUrl}
              alt="Uploaded content"
              className="w-full h-full object-cover"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
        
        <div className="p-8">
          <div className="flex items-start gap-3 mb-4">
            <div className="bg-primary/10 p-2 rounded-lg">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Generated Caption
              </h3>
              <p className="text-xl leading-relaxed">
                {caption}
              </p>
            </div>
          </div>
          
          <Button
            onClick={handleCopy}
            variant="secondary"
            className={cn(
              "w-full mt-4 transition-all duration-300",
              copied && "bg-primary text-primary-foreground"
            )}
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" />
                Copied to clipboard!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" />
                Copy Caption
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
