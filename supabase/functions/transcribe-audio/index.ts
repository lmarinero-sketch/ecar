import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY not configured");
    }

    // Expect a FormData request containing an 'audio' file
    const formData = await req.formData();
    const audioFile = formData.get('file');

    if (!audioFile || !(audioFile instanceof File)) {
      throw new Error('No audio file provided');
    }

    // Prepare FormData for OpenAI
    const openaiFormData = new FormData();
    // OpenAI Whisper accepts these formats: flac, mp3, mp4, mpeg, mpga, m4a, ogg, wav, or webm.
    openaiFormData.append('file', audioFile, 'audio.webm'); // Default to webm for browser recordings
    openaiFormData.append('model', 'whisper-1');
    openaiFormData.append('language', 'es'); // Default to Spanish for this context

    const res = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: openaiFormData
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error('OpenAI Error:', res.status, errorData);
      throw new Error(`OpenAI API error: ${res.status}`);
    }

    const data = await res.json();

    return new Response(JSON.stringify({ text: data.text }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
