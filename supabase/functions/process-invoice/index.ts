import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const SYSTEM_PROMPT = `Eres un experto contable argentino especializado en lectura de facturas. Tu trabajo es analizar imágenes de facturas y extraer todos los datos relevantes para el Libro IVA.

REGLAS DE CLASIFICACIÓN:
- Si el REMITENTE/EMISOR de la factura es "ECAR", "REGALADO" o "ECAR CONSTRUCCIONES" → es factura de VENTA (ECAR vende)
- Si el DESTINATARIO/RECEPTOR/SEÑOR(ES) es "ECAR", "REGALADO" o "ECAR CONSTRUCCIONES" → es factura de COMPRA (ECAR compra)
- Si no se identifica ECAR en ningún lado, clasifica como COMPRA por defecto

Responde ÚNICAMENTE con un JSON válido, sin markdown, sin backticks, sin explicaciones:
{
  "tipo": "compra" o "venta",
  "proveedor_cliente": "Nombre/Razón Social de la otra parte (no ECAR)",
  "cuit": "XX-XXXXXXXX-X",
  "tipo_factura": "A", "B" o "C",
  "punto_venta": "0003",
  "numero_factura": "00001234",
  "fecha_emision": "2026-04-07",
  "neto_gravado": 10000.00,
  "iva_21": 2100.00,
  "iva_105": 0,
  "iva_27": 0,
  "exento": 0,
  "percepciones_iva": 0,
  "percepciones_iibb": 0,
  "imp_neto_no_gravado": 0,
  "total": 12100.00,
  "iva_liquidado": 0,
  "cae": "12345678901234",
  "descripcion_items": "Resumen breve de lo facturado"
}

Si algún campo no se puede leer, usa null. Los montos son numéricos sin signo $. La fecha en formato YYYY-MM-DD.`;

function jsonResponse(data: Record<string, unknown>) {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function toBase64(uint8: Uint8Array): string {
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < uint8.length; i += chunkSize) {
    const chunk = uint8.subarray(i, Math.min(i + chunkSize, uint8.length));
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { fileUrl, invoiceId } = body;

    if (!fileUrl) return jsonResponse({ success: false, error: "fileUrl es requerido" });
    if (!OPENAI_API_KEY) return jsonResponse({ success: false, error: "OPENAI_API_KEY no configurada" });

    console.log("[process-invoice] Downloading:", fileUrl);

    const fileRes = await fetch(fileUrl);
    if (!fileRes.ok) {
      return jsonResponse({ success: false, error: `No se pudo descargar: ${fileRes.status}` });
    }

    const buffer = await fileRes.arrayBuffer();
    const uint8 = new Uint8Array(buffer);
    const base64 = toBase64(uint8);
    const contentType = fileRes.headers.get("content-type") || "image/jpeg";
    const isPdf = contentType.includes("pdf");

    console.log("[process-invoice] Type:", contentType, "Size:", uint8.length, "PDF:", isPdf);

    // Build content parts based on file type
    const userContent: unknown[] = [];

    if (isPdf) {
      // PDFs: use OpenAI file input format
      userContent.push({
        type: "file",
        file: {
          filename: "factura.pdf",
          file_data: `data:application/pdf;base64,${base64}`,
        },
      });
    } else {
      // Images: use image_url format
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${contentType};base64,${base64}`,
          detail: "high",
        },
      });
    }

    userContent.push({
      type: "text",
      text: "Analiza esta factura argentina y extrae todos los datos para el Libro IVA. Responde solo con JSON.",
    });

    console.log("[process-invoice] Calling OpenAI GPT-4o...");

    const openaiRes = await fetch("https://api.openai.com/v1/chat/completions", {
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
        max_tokens: 1024,
        temperature: 0.1,
      }),
    });

    if (!openaiRes.ok) {
      const errBody = await openaiRes.text();
      console.error("[process-invoice] OpenAI error:", openaiRes.status, errBody);
      return jsonResponse({ success: false, error: `OpenAI error ${openaiRes.status}: ${errBody.substring(0, 300)}` });
    }

    const openaiData = await openaiRes.json();
    const rawText = openaiData.choices?.[0]?.message?.content || "";
    console.log("[process-invoice] Response:", rawText.substring(0, 300));

    // Parse JSON
    const jsonStr = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let extracted;
    try {
      extracted = JSON.parse(jsonStr);
    } catch {
      return jsonResponse({ success: false, error: `No se pudo parsear respuesta IA: ${rawText.substring(0, 200)}` });
    }

    // Update DB record
    if (invoiceId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      await sb.from("purchase_invoices").update({
        invoice_type: extracted.tipo_factura,
        point_of_sale: extracted.punto_venta,
        invoice_number: extracted.numero_factura,
        issue_date: extracted.fecha_emision,
        net_amount_ars: extracted.neto_gravado || 0,
        iva_21_ars: extracted.iva_21 || 0,
        iva_105_ars: extracted.iva_105 || 0,
        iva_27_ars: extracted.iva_27 || 0,
        exempt_ars: extracted.exento || 0,
        perceptions_iva_ars: extracted.percepciones_iva || 0,
        perceptions_iibb_ars: extracted.percepciones_iibb || 0,
        total_ars: extracted.total || 0,
        cae_number: extracted.cae,
        ocr_raw_data: extracted,
        status: "pending_review",
      }).eq("id", invoiceId);
    }

    console.log("[process-invoice] ✅ Success:", extracted.tipo, extracted.proveedor_cliente);
    return jsonResponse({ success: true, data: extracted });

  } catch (err) {
    console.error("[process-invoice] Error:", err);
    return jsonResponse({ success: false, error: `Error: ${String(err)}` });
  }
});
