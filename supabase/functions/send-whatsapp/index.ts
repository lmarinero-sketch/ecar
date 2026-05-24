import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const BUILDERBOT_API_KEY = Deno.env.get("BUILDERBOT_API_KEY") || 'bb-3c45fa69-2776-4275-82b6-2d6df9e08ec6'
const BUILDERBOT_PROJECT_ID = Deno.env.get("BUILDERBOT_PROJECT_ID") || 'c3fd918b-b736-40dc-a841-cbb73d3b2a8d'
const BUILDERBOT_URL = `https://app.builderbot.cloud/api/v2/${BUILDERBOT_PROJECT_ID}/messages`


const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { number, content, mediaUrl } = await req.json()

    if (!number || !content) {
      return new Response(
        JSON.stringify({ success: false, error: 'Faltan campos: number y content son requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Strip non-numeric chars from phone
    const cleanNumber = number.replace(/\D/g, '')

    const body: Record<string, unknown> = {
      messages: {
        content,
        ...(mediaUrl ? { mediaUrl } : {}),
      },
      number: cleanNumber,
      checkIfExists: false,
    }

    const response = await fetch(BUILDERBOT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-builderbot': BUILDERBOT_API_KEY,
      },
      body: JSON.stringify(body),
    })

    const responseText = await response.text()

    if (!response.ok) {
      return new Response(
        JSON.stringify({ success: false, error: `BuilderBot error ${response.status}: ${responseText}` }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, number: cleanNumber }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ success: false, error: err.message || 'Error interno' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
