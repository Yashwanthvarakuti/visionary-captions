import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TranscriptionResult {
  original_text: string | null;
  language: string | null;
  english_text: string | null;
  confidence: number;
}

interface UseAudioTranscriptionOptions {
  intervalMs?: number;
}

export function useAudioTranscription({ intervalMs = 5000 }: UseAudioTranscriptionOptions = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [latestTranscription, setLatestTranscription] = useState<TranscriptionResult | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startMicrophone = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 16000
        } 
      });
      audioStreamRef.current = stream;
      return stream;
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Failed to access microphone. Please grant permission.');
      throw err;
    }
  }, []);

  const stopMicrophone = useCallback(() => {
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }
  }, []);

  const recordAndTranscribe = useCallback(async () => {
    if (!audioStreamRef.current || isTranscribing) return;

    return new Promise<void>((resolve) => {
      chunksRef.current = [];
      
      const mediaRecorder = new MediaRecorder(audioStreamRef.current!, {
        mimeType: 'audio/webm;codecs=opus'
      });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (chunksRef.current.length === 0) {
          resolve();
          return;
        }

        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Audio = reader.result as string;
          
          setIsTranscribing(true);
          setError(null);

          try {
            const { data, error: fnError } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (fnError) {
              throw fnError;
            }

            if (data.error) {
              if (data.error.includes('Rate limit')) {
                setError('Rate limit reached. Waiting...');
                await new Promise(r => setTimeout(r, 10000));
              } else {
                throw new Error(data.error);
              }
            } else if (data.english_text) {
              setLatestTranscription(data);
              setError(null);
            }
          } catch (err) {
            console.error('Transcription error:', err);
            setError(err instanceof Error ? err.message : 'Transcription failed');
          } finally {
            setIsTranscribing(false);
            resolve();
          }
        };
        reader.readAsDataURL(audioBlob);
      };

      // Record for 3 seconds
      mediaRecorder.start();
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 3000);
    });
  }, [isTranscribing]);

  const startListening = useCallback(async () => {
    try {
      setError(null);
      await startMicrophone();
      setIsListening(true);

      // Start periodic recording and transcription
      intervalRef.current = setInterval(async () => {
        await recordAndTranscribe();
      }, intervalMs);

      // Do first transcription immediately
      await recordAndTranscribe();
    } catch (err) {
      setIsListening(false);
    }
  }, [startMicrophone, recordAndTranscribe, intervalMs]);

  const stopListening = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    stopMicrophone();
    setIsListening(false);
  }, [stopMicrophone]);

  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    isTranscribing,
    error,
    latestTranscription,
    startListening,
    stopListening,
  };
}
