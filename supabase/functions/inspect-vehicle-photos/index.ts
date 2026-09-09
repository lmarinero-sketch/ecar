import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const SYSTEM_PROMPT = `Sos un perito mecánico y auditor senior de flotas de vehículos pesados y livianos de construcción y minería (ECAR).
Tu misión es inspeccionar minuciosamente las fotografías de los 4 ángulos de un vehículo (Frente, Lateral Izquierdo, Lateral Derecho, Trasera) en su Parte Diario.

OBJETIVO PRINCIPAL:
Distinguir con máxima precisión entre DAÑOS ESTRUCTURALES/MECÁNICOS REALES vs. SUCIEDAD NORMAL DE TRABAJO.

DAÑOS A DETECTAR (SÍ SON DAÑOS):
1. Abolladuras significativas en puertas, guardabarros, caja de carga, capot o techo.
2. Paragolpes caídos, desprendidos, rajados o partidos.
3. Ópticas, faros, balizas o luces traseras rotas, astilladas o faltantes.
4. Espejos retrovisores partidos o ausentes.
5. Parabrisas, lunetas o ventanillas rajadas o estrelladas.
6. Neumáticos visiblemente desinflados, deformados o rotos.

ELEMENTOS A IGNORAR (NO SON DAÑOS):
1. Polvo, tierra, barro seco o salpicaduras de ruta y obra.
2. Manchas superficiales de agua o polvo en carrocería o vidrios.
3. Pequeños desgastes cosméticos normales del trabajo en obra sin compromiso de la chapa.

Responde ÚNICAMENTE con un JSON con el siguiente formato estricto:
{
  "has_damage": boolean,
  "severity": "ninguno" | "leve" | "moderado" | "critico",
  "detected_issues": [
    "Ángulo: descripción concisa del daño detectado"
  ],
  "summary": "Resumen claro de 1 o 2 frases del estado visual del vehículo",
  "recommended_condition": "operativo" | "con_observaciones" | "fuera_de_servicio"
}

Criterio para recommended_condition:
- "operativo": Sin daños estructurales ni de seguridad (puede tener suciedad de obra).
- "con_observaciones": Abolladuras menores o raspones que no comprometen la seguridad ni operatividad inmediata.
- "fuera_de_servicio": Daños graves que impiden circular seguro (falta de luz principal, parabrisas destruido, paragolpe desprendido rozando rueda, neumático en llanta).`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  if (!OPENAI_API_KEY) {
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY no configurada" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();
    const { photos, vehicle_info } = body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return new Response(JSON.stringify({ error: "Se requiere al menos una foto para inspección" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    const userContent: any[] = [
      {
        type: "text",
        text: `Inspección fotográfica de vehículo ${vehicle_info?.code || ''} (${vehicle_info?.plate || 'Sin patente'}, ${vehicle_info?.description || 'Vehículo'}). Evaluá los ángulos adjuntos y detectá si presenta daños estructurales reales:`,
      },
    ];

    for (const p of photos) {
      if (p.image_base64) {
        userContent.push({
          type: "text",
          text: `--- Ángulo: ${p.angle || 'Vista'} ---`,
        });
        userContent.push({
          type: "image_url",
          image_url: {
            url: `data:${p.mime_type || 'image/jpeg'};base64,${p.image_base64}`,
            detail: "high",
          },
        });
      } else if (p.url) {
        userContent.push({
          type: "text",
          text: `--- Ángulo: ${p.angle || 'Vista'} ---`,
        });
        userContent.push({
          type: "image_url",
          image_url: {
            url: p.url,
            detail: "high",
          },
        });
      }
    }

    const oaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 600,
        response_format: { type: "json_object" },
      }),
    });

    if (!oaiResp.ok) {
      const errText = await oaiResp.text();
      console.error(`OpenAI error ${oaiResp.status}:`, errText);
      throw new Error(`OpenAI Vision Error: ${oaiResp.status}`);
    }

    const oaiData = await oaiResp.json();
    const raw = oaiData.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Sin respuesta del peritaje de IA");

    const inspection = JSON.parse(raw);

    return new Response(JSON.stringify({ success: true, data: inspection }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err: any) {
    const msg = err instanceof Error ? err.message : "Error en inspección";
    console.error("inspect-vehicle-photos error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
