import { useLiveStream } from '@/hooks/useLiveStream';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Video, VideoOff, ArrowLeft, AlertTriangle, Eye, Hand, MessageSquare, Loader2 } from 'lucide-react';

export default function LiveStream() {
  const {
    isStreaming,
    isAnalyzing,
    error,
    latestResponse,
    videoRef,
    canvasRef,
    startStreaming,
    stopStreaming,
  } = useLiveStream({ intervalMs: 5000 }); // Analyze every 5 seconds to avoid rate limits

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-2xl font-bold text-foreground">Live Stream Analysis</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {isAnalyzing && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Analyzing...
              </Badge>
            )}
            {isStreaming && !isAnalyzing && (
              <Badge variant="default" className="bg-green-500">
                <Video className="h-3 w-3 mr-1" /> Live
              </Badge>
            )}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Feed */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Camera Feed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {!isStreaming && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-muted/80 gap-4">
                    <VideoOff className="h-16 w-16 text-muted-foreground" />
                    <p className="text-muted-foreground text-sm">Camera is off</p>
                  </div>
                )}

                {isAnalyzing && (
                  <div className="absolute top-3 right-3">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full p-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex gap-3 mt-4">
                {!isStreaming ? (
                  <Button 
                    onClick={startStreaming}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Live Analysis
                  </Button>
                ) : (
                  <Button 
                    onClick={stopStreaming} 
                    variant="destructive"
                    className="flex-1"
                  >
                    <VideoOff className="h-4 w-4 mr-2" />
                    Stop
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Caption */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Caption
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-foreground">
                  {latestResponse?.caption || 'Start streaming to see captions...'}
                </p>
              </CardContent>
            </Card>

            {/* Sign Language */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Hand className="h-4 w-4" />
                  Sign Language
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg font-semibold text-primary">
                  {latestResponse?.sign_language || '—'}
                </p>
              </CardContent>
            </Card>

            {/* Detected Objects */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Eye className="h-4 w-4" />
                  Detected Objects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestResponse?.objects && latestResponse.objects.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {latestResponse.objects.map((obj, idx) => (
                      <Badge key={idx} variant="secondary">
                        {obj.label} ({Math.round(obj.confidence * 100)}%)
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No objects detected</p>
                )}
              </CardContent>
            </Card>

            {/* Signals/Alerts */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <AlertTriangle className="h-4 w-4" />
                  Signals
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestResponse?.signals && latestResponse.signals.length > 0 ? (
                  <div className="space-y-2">
                    {latestResponse.signals.map((signal, idx) => (
                      <Alert key={idx} variant="default" className="py-2">
                        <AlertDescription className="text-xs">
                          <span className="font-semibold">{signal.type}:</span> {signal.message}
                        </AlertDescription>
                      </Alert>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No signals</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Info */}
        <Card className="bg-muted/50">
          <CardContent className="py-3">
            <p className="text-xs text-muted-foreground text-center">
              Powered by Lovable AI (Gemini 2.5 Flash) • 
              Analyzes frames every 2.5 seconds • 
              No Python server required
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
