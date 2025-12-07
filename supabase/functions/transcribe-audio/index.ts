import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Validation constants
const MAX_AUDIO_BASE64_LENGTH = 20 * 1024 * 1024; // ~20MB base64 string limit

function isValidAudioBase64(str: string): boolean {
  if (!str || typeof str !== 'string') return false;
  if (str.length > MAX_AUDIO_BASE64_LENGTH) return false;
  
  // Check if it starts with expected data URL prefix for audio
  if (!str.startsWith('data:audio/')) return false;
  
  // Basic format validation
  const parts = str.split(',');
  if (parts.length !== 2) return false;
  
  const header = parts[0];
  if (!header.includes('base64')) return false;
  
  return true;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { audio } = await req.json();

    if (!audio) {
      return new Response(
        JSON.stringify({ error: 'No audio provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate audio format
    if (!isValidAudioBase64(audio)) {
      console.error('Invalid audio format received');
      return new Response(
        JSON.stringify({ error: 'Invalid audio format. Expected base64-encoded audio data URL' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');
    if (!lovableApiKey) {
      console.error('LOVABLE_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Transcribing audio...');

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `You are a speech-to-text transcriber and translator. Listen to this audio and:
1. Transcribe what is being said
2. If the speech is NOT in English, translate it to English
3. Respond with ONLY a JSON object (no markdown, no code blocks) in this exact format:
{
  "original_text": "The transcribed text in the original language",
  "language": "The detected language (e.g., 'English', 'Spanish', 'Hindi', etc.)",
  "english_text": "The English translation (same as original if already English)",
  "confidence": 0.95
}

If the audio is silent, unclear, or has no speech, respond with:
{
  "original_text": null,
  "language": null,
  "english_text": null,
  "confidence": 0
}`
              },
              {
                type: 'input_audio',
                input_audio: {
                  data: audio.replace(/^data:audio\/\w+;base64,/, ''),
                  format: 'wav'
                }
              }
            ]
          }
        ]
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI error:', response.status, errorText);

      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded, please slow down' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'Payment required' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ error: 'Failed to transcribe audio' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    console.log('Transcription response:', content);

    try {
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      
      const transcription = JSON.parse(jsonStr);
      
      return new Response(
        JSON.stringify({
          original_text: transcription.original_text || null,
          language: transcription.language || null,
          english_text: transcription.english_text || null,
          confidence: transcription.confidence || 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse transcription response:', parseError);
      return new Response(
        JSON.stringify({
          original_text: null,
          language: null,
          english_text: null,
          confidence: 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in transcribe-audio:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
