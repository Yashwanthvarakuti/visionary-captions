import { useLiveStream } from '@/hooks/useLiveStream';
import { useAudioTranscription } from '@/hooks/useAudioTranscription';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Link } from 'react-router-dom';
import { Video, VideoOff, ArrowLeft, AlertTriangle, Eye, Hand, MessageSquare, Loader2, Mic, MicOff, Languages } from 'lucide-react';

export default function LiveStream() {
  const {
    isStreaming,
    isAnalyzing,
    error: videoError,
    latestResponse,
    videoRef,
    canvasRef,
    startStreaming,
    stopStreaming,
  } = useLiveStream({ intervalMs: 15000 }); // 15 seconds to avoid rate limits

  const {
    isListening,
    isTranscribing,
    error: audioError,
    latestTranscription,
    startListening,
    stopListening,
  } = useAudioTranscription({ intervalMs: 15000 }); // 15 seconds to avoid rate limits

  const error = videoError || audioError;

  const handleStartAll = async () => {
    // Start video first
    await startStreaming();
    // Stagger audio by 7.5 seconds to avoid simultaneous API calls
    setTimeout(() => startListening(), 7500);
  };

  const handleStopAll = () => {
    stopStreaming();
    stopListening();
  };

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
            {(isAnalyzing || isTranscribing) && (
              <Badge variant="secondary" className="animate-pulse">
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Processing...
              </Badge>
            )}
            {isStreaming && !isAnalyzing && (
              <Badge variant="default" className="bg-green-500">
                <Video className="h-3 w-3 mr-1" /> Video
              </Badge>
            )}
            {isListening && !isTranscribing && (
              <Badge variant="default" className="bg-blue-500">
                <Mic className="h-3 w-3 mr-1" /> Audio
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
                {!isStreaming && !isListening ? (
                  <Button 
                    onClick={handleStartAll}
                    className="flex-1"
                  >
                    <Video className="h-4 w-4 mr-2" />
                    Start Live Analysis
                  </Button>
                ) : (
                  <Button 
                    onClick={handleStopAll} 
                    variant="destructive"
                    className="flex-1"
                  >
                    <VideoOff className="h-4 w-4 mr-2" />
                    Stop All
                  </Button>
                )}
              </div>

              {/* Individual controls */}
              <div className="flex gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isStreaming ? stopStreaming : startStreaming}
                  className="flex-1"
                >
                  {isStreaming ? <VideoOff className="h-3 w-3 mr-1" /> : <Video className="h-3 w-3 mr-1" />}
                  {isStreaming ? 'Stop Video' : 'Start Video'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={isListening ? stopListening : startListening}
                  className="flex-1"
                >
                  {isListening ? <MicOff className="h-3 w-3 mr-1" /> : <Mic className="h-3 w-3 mr-1" />}
                  {isListening ? 'Stop Audio' : 'Start Audio'}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Results Panel */}
          <div className="space-y-4">
            {/* Audio Transcription */}
            <Card className="border-blue-500/50">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Languages className="h-4 w-4 text-blue-500" />
                  Audio Caption (English)
                  {isTranscribing && <Loader2 className="h-3 w-3 animate-spin ml-auto" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {latestTranscription?.english_text ? (
                  <div className="space-y-2">
                    <p className="text-lg font-semibold text-foreground">
                      {latestTranscription.english_text}
                    </p>
                    {latestTranscription.language && latestTranscription.language !== 'English' && (
                      <div className="text-xs text-muted-foreground">
                        <span className="font-medium">Original ({latestTranscription.language}):</span>{' '}
                        {latestTranscription.original_text}
                      </div>
                    )}
                    <Badge variant="outline" className="text-xs">
                      {latestTranscription.language} • {Math.round(latestTranscription.confidence * 100)}% confidence
                    </Badge>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {isListening ? 'Listening for speech...' : 'Start audio to see captions...'}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Visual Caption */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <MessageSquare className="h-4 w-4" />
                  Visual Caption
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
              Video & Audio analysis every 8 seconds • 
              Auto-translates any language to English
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
