import { useState, useRef, useCallback, useEffect } from 'react';

export interface DetectedObject {
  label: string;
  confidence: number;
}

export interface Signal {
  type: string;
  message: string;
}

export interface StreamResponse {
  caption?: string;
  sign_language?: string | null;
  objects?: DetectedObject[];
  signals?: Signal[];
}

interface UseLiveStreamOptions {
  intervalMs?: number; // milliseconds between frame analysis
}

export function useLiveStream({ intervalMs = 2000 }: UseLiveStreamOptions = {}) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResponse, setLatestResponse] = useState<StreamResponse | null>(null);
  
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      
      mediaStreamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      setError(null);
      return true;
    } catch (e) {
      console.error('Camera access error:', e);
      setError('Failed to access camera. Please allow camera permissions.');
      return false;
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const captureFrame = useCallback((): string | null => {
    if (!videoRef.current || !canvasRef.current) return null;
    
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return null;
    
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/jpeg', 0.6);
  }, []);

  const analyzeFrame = useCallback(async (frame: string) => {
    try {
      setIsAnalyzing(true);
      
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-frame`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ frame }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze frame');
      }

      const data = await response.json();
      setLatestResponse(data);
      setError(null);
    } catch (e) {
      console.error('Frame analysis error:', e);
      setError(e instanceof Error ? e.message : 'Failed to analyze frame');
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  const startStreaming = useCallback(async () => {
    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    setIsStreaming(true);
    setError(null);
    
    // Initial frame capture after a short delay for camera to initialize
    setTimeout(() => {
      const frame = captureFrame();
      if (frame) {
        analyzeFrame(frame);
      }
    }, 500);
    
    streamIntervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame) {
        analyzeFrame(frame);
      }
    }, intervalMs);
  }, [startCamera, captureFrame, analyzeFrame, intervalMs]);

  const stopStreaming = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    stopCamera();
    setIsStreaming(false);
    setIsAnalyzing(false);
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    isStreaming,
    isAnalyzing,
    error,
    latestResponse,
    videoRef,
    canvasRef,
    startStreaming,
    stopStreaming,
  };
}
