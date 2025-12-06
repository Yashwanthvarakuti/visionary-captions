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
  sign_language?: string;
  objects?: DetectedObject[];
  signals?: Signal[];
}

interface UseLiveStreamOptions {
  wsUrl: string;
  frameRate?: number; // frames per second
}

export function useLiveStream({ wsUrl, frameRate = 5 }: UseLiveStreamOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestResponse, setLatestResponse] = useState<StreamResponse | null>(null);
  
  const wsRef = useRef<WebSocket | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      console.log('WebSocket already connected');
      return;
    }

    try {
      console.log('Connecting to WebSocket:', wsUrl);
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        setError(null);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        setIsStreaming(false);
      };

      ws.onerror = (event) => {
        console.error('WebSocket error:', event);
        setError('Failed to connect to Python server. Make sure it is running.');
        setIsConnected(false);
      };

      ws.onmessage = (event) => {
        try {
          const data: StreamResponse = JSON.parse(event.data);
          console.log('Received:', data);
          setLatestResponse(data);
        } catch (e) {
          console.error('Failed to parse response:', e);
        }
      };

      wsRef.current = ws;
    } catch (e) {
      console.error('Connection error:', e);
      setError('Failed to create WebSocket connection');
    }
  }, [wsUrl]);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

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
    
    return canvas.toDataURL('image/jpeg', 0.7);
  }, []);

  const startStreaming = useCallback(async () => {
    if (!isConnected) {
      setError('Not connected to server');
      return;
    }

    const cameraStarted = await startCamera();
    if (!cameraStarted) return;

    setIsStreaming(true);
    
    const intervalMs = 1000 / frameRate;
    
    streamIntervalRef.current = setInterval(() => {
      const frame = captureFrame();
      if (frame && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ frame }));
      }
    }, intervalMs);
  }, [isConnected, startCamera, captureFrame, frameRate]);

  const stopStreaming = useCallback(() => {
    if (streamIntervalRef.current) {
      clearInterval(streamIntervalRef.current);
      streamIntervalRef.current = null;
    }
    stopCamera();
    setIsStreaming(false);
  }, [stopCamera]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
      disconnect();
    };
  }, [stopStreaming, disconnect]);

  return {
    isConnected,
    isStreaming,
    error,
    latestResponse,
    videoRef,
    canvasRef,
    connect,
    disconnect,
    startStreaming,
    stopStreaming,
  };
}
