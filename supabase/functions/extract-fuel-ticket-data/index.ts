import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Sos un sistema OCR de Inteligencia Artificial especializado en la extracción precisa de comprobantes, remitos y tickets de carga de combustible en Argentina (Estaciones Shell, YPF, Axion, Estación Central, Puma, Batán, etc.).

Analiza en detalle la imagen del remito/ticket y responde ÚNICAMENTE con un objeto JSON estructurado con las siguientes claves:
- remito_number (string | null): El número correlativo de remito o comprobante impreso (ej: "0014-00004686", "091-0014-00004686", "4174", "0001-00001234"). Busca etiquetas como "Nro.:", "REMITO N°", "REMITO R", "Comprobante N°", "N° Comprobante".
- voucher_number (string | null): Número de vale o planilla de carga si figura (ej: "00006940" para Planilla, o "Vale N°: 1234").
- load_date (string | null, formato YYYY-MM-DD): Fecha de emisión del ticket (ej: si dice "13/08/2026 11:30:00", formatea como "2026-08-13").
- supplier (string | null): Estación de servicio o razón social del emisor (ej: "Estación Central", "Shell Agro", "YPF", "Axion", "Puma").
- plate (string | null): Dominio o patente del vehículo registrado en el ticket (ej: "AE167AT", "AG839PV", "AC399XV", "ISB928"). Formato estándar argentino: AB123CD o ABC123.
- vehicle_name (string | null): Descripción o marca del vehículo impreso (ej: "TOYOTA", "IVECO", "HILUX", "CAMIONETA").
- fuel_type (string | null): Tipo de combustible o producto cargado (ej: "FORMULA SUPER", "DIESEL V-POWER", "NAFTA SUPER", "DIESEL EVOLUX", "ULTRADIESEL").
- liters (number | null): Cantidad de litros cargados como valor numérico decimal con punto (ej: 35.01, 50.00). Busca la columna CANTIDAD / LITROS.
- price_per_liter (number | null): Precio por litro si figura impreso (ej: 1150.00). Si no figura, devuelve null.
- total_amount (number | null): Monto total expresado en ARS si figura impreso (ej: 40261.50). Si no figura o dice $0, devuelve null.
- driver_name (string | null): Nombre del cliente, operario o chofer impreso (ej: "CARLOS ADOLFO REGALADO BENITEZ", "ALEX PEREYRA", "ARIEL JOFRE").
- payment_method (string | null): Forma de pago (ej: "Cuenta Corriente", "Contado", "Tarjeta", "Vale").

REGLAS DE EXTRACCIÓN:
1. Sé extremadamente riguroso y preciso con el remito_number, plate, load_date y liters.
2. Si un campo no es claramente visible o no existe en el ticket, devuelve null.
3. No inventes datos ni asumas campos que no estén en la imagen.`;

const IMAGE_MIME_TYPES = new Set([
  "image/jpeg", "image/png", "image/webp", "image/gif",
]);

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
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY no está configurada en las funciones de Supabase." }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const body = await req.json();
    const { storage_path, image_base64, mime_type } = body;

    let finalBase64 = image_base64;
    let finalMimeType = mime_type || "image/jpeg";

    // If storage_path is provided, download file from Storage
    if (storage_path && !image_base64) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
      const { data, error } = await supabase.storage.from("fuel-tickets").download(storage_path);
      if (error) throw new Error(`Storage: ${error.message}`);

      const buffer = await data.arrayBuffer();
      const bytes = new Uint8Array(buffer);
      let binary = "";
      for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
      finalBase64 = btoa(binary);
      finalMimeType = data.type || "image/jpeg";
    }

    if (!finalBase64) {
      return new Response(JSON.stringify({ error: "Se requiere storage_path o image_base64" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Call OpenAI GPT-4o Vision
    const userContent: any[] = [
      { type: "text", text: "Analizá la imagen de este remito/ticket de combustible y extraé los datos:" },
      {
        type: "image_url",
        image_url: {
          url: `data:${finalMimeType};base64,${finalBase64}`,
          detail: "high",
        },
      },
    ];

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
      throw new Error(`OpenAI error: ${oaiResp.status}`);
    }

    const oaiData = await oaiResp.json();
    const raw = oaiData.choices?.[0]?.message?.content;
    if (!raw) throw new Error("Sin respuesta de OpenAI");

    const extracted = JSON.parse(raw);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido";
    console.error("extract-fuel-ticket-data error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
