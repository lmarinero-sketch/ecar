import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("Missing OPENAI_API_KEY");
    }

    const { afip, score, deuda, cheques, peorSituacion } = await req.json();

    const systemPrompt = `Eres un experto analista de riesgo crediticio en Argentina. Tu tarea es analizar el perfil fiscal y bancario de un cliente para emitir un veredicto de crédito.
Devuelve tu respuesta ÚNICAMENTE como un objeto JSON válido con la siguiente estructura (sin formato de código markdown):
{
  "perfil": "Texto redactado del análisis, destacando puntos fuertes y débiles. Máximo 40 palabras.",
  "capacidadMaxima": "String (ej: $ 1.500.000,00)",
  "veredicto": "APROBADO | EVALUACIÓN MANUAL | RECHAZADO",
  "color": "bg-green-100 text-green-800 border-green-200 | bg-yellow-100 text-yellow-800 border-yellow-200 | bg-red-100 text-red-800 border-red-200"
}
Si la situación es peor a 2 o tiene muchos cheques, deberia ser Evaluación Manual o Rechazado.`;

    const userPrompt = `Datos del Perfil:
- Régimen AFIP: ${afip.regimen}
- Categoría AFIP: ${afip.categoria}
- Deuda Bancaria Actual: $${deuda}
- Cheques Rechazados: $${cheques}
- Peor Situación BCRA: Sit. ${peorSituacion}
- Score de Riesgo Calculado: ${score}/100

Evalúa su capacidad de repago (capacidadMaxima mensual estimada) según su categoría AFIP y descuenta su nivel de riesgo. Emite un veredicto acorde.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.2,
        response_format: { type: "json_object" }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const data = await response.json();
    const resultJson = JSON.parse(data.choices[0].message.content);

    return new Response(JSON.stringify(resultJson), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
