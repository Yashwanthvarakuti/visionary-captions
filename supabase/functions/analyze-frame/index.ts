import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { frame } = await req.json();

    if (!frame) {
      return new Response(
        JSON.stringify({ error: 'No frame provided' }),
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

    console.log('Analyzing frame...');

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
                text: `Analyze this image and respond with ONLY a JSON object (no markdown, no code blocks) in this exact format:
{
  "caption": "A brief description of what's happening in the scene",
  "sign_language": "If someone is making hand gestures that look like sign language, describe what they might mean. Otherwise use null",
  "objects": [{"label": "object name", "confidence": 0.95}],
  "signals": [{"type": "alert type", "message": "description"}]
}

For objects: list the main objects/people you can see with confidence scores (0-1).
For signals: note any important activities like "motion detected", "person waving", "thumbs up gesture", etc. If nothing notable, use an empty array.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: frame
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
        JSON.stringify({ error: 'Failed to analyze frame' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || '';
    
    console.log('AI Response:', content);

    // Parse the JSON response from AI
    try {
      // Remove any markdown code blocks if present
      let jsonStr = content.trim();
      if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
      }
      
      const analysis = JSON.parse(jsonStr);
      
      return new Response(
        JSON.stringify({
          caption: analysis.caption || 'No description available',
          sign_language: analysis.sign_language || null,
          objects: analysis.objects || [],
          signals: analysis.signals || []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Return a basic caption if JSON parsing fails
      return new Response(
        JSON.stringify({
          caption: content.substring(0, 200),
          sign_language: null,
          objects: [],
          signals: []
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error('Error in analyze-frame:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
