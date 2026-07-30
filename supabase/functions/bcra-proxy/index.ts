import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { endpoint, type, id } = await req.json()
    
    // Construct BCRA URL based on type
    let url = ''
    if (type === 'deudores') {
      url = `https://api.bcra.gob.ar/centraldedeudores/v1/cuit/${id}`
    } else if (type === 'cheques') {
      url = `https://api.bcra.gob.ar/chequesdenunciados/v1/numero/${id}`
    } else if (endpoint) {
       // Fallback for direct endpoints
       url = endpoint
    } else {
       throw new Error('Tipo de consulta no soportado')
    }

    console.log('Fetching BCRA URL:', url)

    const bcraResponse = await fetch(url, {
      // It's a public API, no auth needed usually
      headers: {
        'Accept': 'application/json',
      }
    })

    if (!bcraResponse.ok) {
      const errorText = await bcraResponse.text()
      return new Response(
        JSON.stringify({ 
          error: `BCRA API error: ${bcraResponse.status}`, 
          details: errorText,
          status: bcraResponse.status 
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data = await bcraResponse.json()

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message, status: 500 }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }
})
