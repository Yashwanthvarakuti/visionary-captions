import { useState } from "react";
import { Brain, Loader2 } from "lucide-react";
import { UploadZone } from "@/components/UploadZone";
import { CaptionResult } from "@/components/CaptionResult";
import { generateCaption, extractVideoFrame } from "@/lib/caption-generator";
import { useToast } from "@/hooks/use-toast";

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [caption, setCaption] = useState<string>("");
  const [mediaUrl, setMediaUrl] = useState<string>("");
  const [isVideo, setIsVideo] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState("");
  const { toast } = useToast();

  const handleFileSelect = async (file: File) => {
    setIsProcessing(true);
    setCaption("");
    setLoadingMessage("Processing your file...");

    try {
      const isVideoFile = file.type.startsWith("video/");
      setIsVideo(isVideoFile);

      let imageUrl: string;

      if (isVideoFile) {
        setLoadingMessage("Extracting frame from video...");
        const videoUrl = URL.createObjectURL(file);
        setMediaUrl(videoUrl);
        imageUrl = await extractVideoFrame(file);
      } else {
        imageUrl = URL.createObjectURL(file);
        setMediaUrl(imageUrl);
      }

      setLoadingMessage("Generating caption with AI...");
      const generatedCaption = await generateCaption(imageUrl);
      setCaption(generatedCaption);

      toast({
        title: "Caption generated!",
        description: "Your AI-powered caption is ready.",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        title: "Error",
        description: "Failed to generate caption. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
      setLoadingMessage("");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/50 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2.5 rounded-xl border border-primary/20">
              <Brain className="w-7 h-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold gradient-text">
                VisionCaption AI
              </h1>
              <p className="text-sm text-muted-foreground">
                Powered by deep learning vision models
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <div className="max-w-5xl mx-auto">
          {/* Hero Section */}
          {!caption && !isProcessing && (
            <div className="text-center mb-12 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <h2 className="text-5xl font-bold mb-4 leading-tight">
                Transform Images & Videos
                <br />
                <span className="gradient-text">Into Perfect Captions</span>
              </h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload any image or video and let our AI generate accurate,
                descriptive English captions instantly
              </p>
            </div>
          )}

          {/* Upload Zone */}
          {!caption && !isProcessing && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-6 duration-700 delay-150">
              <UploadZone
                onFileSelect={handleFileSelect}
                isProcessing={isProcessing}
              />
            </div>
          )}

          {/* Processing State */}
          {isProcessing && (
            <div className="flex flex-col items-center justify-center py-20 animate-in fade-in-0 zoom-in-95 duration-500">
              <div className="relative mb-8">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                <div className="relative bg-card p-8 rounded-full border border-primary/30">
                  <Loader2 className="w-16 h-16 text-primary animate-spin" />
                </div>
              </div>
              <h3 className="text-2xl font-semibold mb-2">
                AI is analyzing...
              </h3>
              <p className="text-muted-foreground">{loadingMessage}</p>
            </div>
          )}

          {/* Result */}
          {caption && !isProcessing && (
            <CaptionResult
              caption={caption}
              imageUrl={mediaUrl}
              isVideo={isVideo}
            />
          )}

          {/* New Upload Button */}
          {caption && !isProcessing && (
            <div className="text-center mt-8 animate-in fade-in-0 duration-500 delay-300">
              <button
                onClick={() => {
                  setCaption("");
                  setMediaUrl("");
                }}
                className="text-primary hover:text-primary/80 transition-colors font-semibold"
              >
                ← Upload another file
              </button>
            </div>
          )}

          {/* Features */}
          {!caption && !isProcessing && (
            <div className="grid md:grid-cols-3 gap-6 mt-16 animate-in fade-in-0 slide-in-from-bottom-8 duration-700 delay-300">
              {[
                {
                  title: "AI-Powered",
                  description: "Deep CNN and transformer models for accuracy",
                },
                {
                  title: "Real-time Processing",
                  description: "Generate captions instantly in your browser",
                },
                {
                  title: "Multi-Format",
                  description: "Support for images, videos, and sign language",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                >
                  <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
