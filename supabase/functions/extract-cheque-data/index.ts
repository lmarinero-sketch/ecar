import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYSTEM_PROMPT = `Sos un sistema OCR de inteligencia artificial especializado en la extracción de datos de cheques argentinos (físicos y echeqs).
Analiza detalladamente la imagen o PDF y responde ÚNICAMENTE con un objeto JSON estructurado que contenga los siguientes campos:
- cheque_number (string): El número correlativo del cheque (generalmente impreso en tinta magnética o arriba a la derecha).
- bank_name (string): El nombre de la entidad bancaria emisora (ej: Banco Galicia, Banco Nación, Banco Macro, etc.).
- amount (number): El monto total expresado con centavos como decimal (ej: 250000.50). Si no tiene centavos, agrega .00 (ej: 180000.00).
- issue_date (string, format YYYY-MM-DD): La fecha de emisión del cheque. En cheques argentinos suele encontrarse junto al lugar de emisión, ej: "San Juan, 15 de Mayo de 2026". Traduce a formato YYYY-MM-DD.
- due_date (string o null, format YYYY-MM-DD): La fecha de cobro o pago diferido (ej: "Páguese el..." o "Páguese desde el..."). Si es un cheque corriente (donde solo figura la fecha de emisión) o el campo de pago diferido está vacío, pon null.
- beneficiary (string o null): El nombre de la persona física o jurídica a favor de quien se emite ("Páguese a...", "Páguese a la orden de..."). 
  REGLA CRÍTICA DE BENEFICIARIO 1: Si el cheque está al portador (ej: dice "Al Portador", "a la orden de: al portador", o la línea de beneficiario está en blanco, vacía, tiene líneas continuas o firmas encima sin aclarar), debes retornar estrictamente null. NUNCA uses el nombre del librador/firmante/emisor como beneficiario.
  REGLA CRÍTICA DE BENEFICIARIO 2 (Comprobantes de Emisión): Si el documento es un "Comprobante de emisión de Echeq", el beneficiario suele figurar como la Razón Social central en el documento (ejemplo: "Agromaq San Juan S A" arriba del CUIT).
- issuer_name (string o null): El nombre/razón social del librador/firmante (quien emite el cheque, dueño de la cuenta bancaria). Suele estar impreso en el cheque en la esquina inferior izquierda o superior, o aclarado bajo las firmas.
- branch (string o null): Sucursal del banco.
- type (string): "physical" (si es un cheque físico escaneado/fotografiado) o "echeq" (si es un comprobante digital de echeq).
- direction (string): "payable" o "receivable". 
  REGLA CRÍTICA DE DIRECCIÓN: Si el documento explícitamente dice ser un "Comprobante de emisión de Echeq", entonces nosotros emitimos el cheque, por lo tanto, establécelo como "payable" (cheque a pagar). Para el resto de cheques estándar que recibimos de terceros, establécelo como "receivable" (cheque a cobrar).

REGLAS DE EXTRACCIÓN ADICIONALES:
1. Las fechas manuscritas o impresas en Argentina son en formato DD/MM/AAAA. Por favor parsealas correctamente. Si el año es manuscrito e ilegible o ambiguo, asume el año actual (2026) a menos que la imagen muestre otra cosa con claridad.
2. Si un campo no es legible o no está presente, devuelve null. No intentes adivinar ni inventar datos.`;

// Supported image MIME types for OpenAI Vision image_url
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
    return new Response(JSON.stringify({ error: "OPENAI_API_KEY not configured" }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }

  try {
    const { storage_path } = await req.json();
    if (!storage_path) {
      return new Response(JSON.stringify({ error: "storage_path required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Download file from Storage
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data, error } = await supabase.storage.from("cheque-scans").download(storage_path);
    if (error) throw new Error(`Storage: ${error.message}`);

    const buffer = await data.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    const fileBase64 = btoa(binary);
    const mimeType = data.type || "image/jpeg";

    const isPdf = mimeType === "application/pdf" || storage_path.toLowerCase().endsWith(".pdf");
    const isImage = IMAGE_MIME_TYPES.has(mimeType);

    if (!isPdf && !isImage) {
      return new Response(JSON.stringify({ error: `Tipo de archivo no soportado: ${mimeType}. Usá JPG, PNG, WebP o PDF.` }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }

    // Build the content array for the user message
    // PDFs use the "file" content type; images use "image_url"
    const userContent: any[] = [
      { type: "text", text: "Extraé los datos de este cheque:" },
    ];

    if (isPdf) {
      // GPT-4o supports PDF input via file content type with base64
      userContent.push({
        type: "file",
        file: {
          filename: storage_path.split("/").pop() || "cheque.pdf",
          file_data: `data:application/pdf;base64,${fileBase64}`,
        },
      });
    } else {
      // Standard image_url for images
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${mimeType};base64,${fileBase64}`,
          detail: "high",
        },
      });
    }

    // Call OpenAI GPT-4o Vision
    const oaiResp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 500,
        response_format: { type: "json_object" },
      }),
    });

    if (!oaiResp.ok) {
      const errText = await oaiResp.text();
      console.error(`OpenAI error ${oaiResp.status}:`, errText);
      throw new Error(`OpenAI ${oaiResp.status}: ${errText}`);
    }

    const oaiData = await oaiResp.json();
    const raw = oaiData.choices?.[0]?.message?.content;
    if (!raw) throw new Error("No response from OpenAI");

    const extracted = JSON.parse(raw);

    return new Response(JSON.stringify({ success: true, data: extracted }), {
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    console.error("extract-cheque-data error:", msg);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
    });
  }
});
