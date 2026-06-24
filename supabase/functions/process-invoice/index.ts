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

REGLAS DE CLASIFICACIÓN COMPRA vs VENTA:
- ECAR posee varias denominaciones legales: "ECAR SAS", "ECAR S.A.S.", "ECAR CONSTRUCCIONES", "CARLOS ADOLFO REGALADO", "REGALADO CARLOS ADOLFO", "REGALADO CARLOS", "REGALADO". Su CUIT puede ser "30-12345678-9" u otros.
- Identifica el CUIT y Razón Social del EMISOR (arriba, emite la factura) y del RECEPTOR (abajo, recibe la factura).
- Si el EMISOR es alguna de las denominaciones de ECAR ("ECAR SAS", "CARLOS ADOLFO REGALADO", etc.) → es factura de VENTA (ECAR vende/emite).
- Si el RECEPTOR posee el CUIT de ECAR ("30-12345678-9" / "30123456789") o su nombre es ECAR → es factura de COMPRA (ECAR compra/recibe).
- Si no encuentras el CUIT de ECAR en la factura pero es subida por el usuario, asume COMPRA por defecto, a menos que quede explícito que ECAR es el emisor.
- La gran mayoría de los comprobantes cargados por los usuarios corresponden a compras de materiales o servicios a proveedores externos (COMPRAS).

EXTRACCIÓN DE NOMBRE DE LA CONTRAPARTE (proveedor_cliente) Y CUIT (cuit):
- "proveedor_cliente" debe ser la Razón Social de la OTRA parte (NO ECAR).
  - Si es COMPRA: el emisor externo es el "proveedor_cliente".
  - Si es VENTA: el receptor externo es el "proveedor_cliente".
- "cuit" es el CUIT de la OTRA parte (NO ECAR) en formato XX-XXXXXXXX-X.
- NUNCA dejes proveedor_cliente vacío. Si no lo puedes leer, pon "No legible".

Responde ÚNICAMENTE con un JSON válido, sin markdown, sin backticks, sin explicaciones:
{
  "tipo": "compra" o "venta",
  "proveedor_cliente": "Nombre/Razón Social de la otra parte (NO ECAR)",
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

IMPORTANTE sobre MONTOS:
- Todos los montos son numéricos con decimales (ej: 12100.50, NO 12100)
- Preservá siempre los centavos/decimales
- Si un campo no se puede leer, usá null
- La fecha en formato YYYY-MM-DD`;

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
    const { fileUrl, invoiceId, tipo } = body;

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

    const tipoText = tipo ? ` IMPORTANTE: El usuario indicó que esta factura es una ${tipo.toUpperCase()}. Debes clasificar "tipo" estrictamente como "${tipo}" y extraer el "proveedor_cliente" acordemente (si es compra el proveedor_cliente es el emisor, si es venta el proveedor_cliente es el receptor).` : "";
    
    userContent.push({
      type: "text",
      text: "Analiza esta factura argentina y extrae todos los datos para el Libro IVA. Responde solo con JSON." + tipoText,
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
      if (tipo) {
        extracted.tipo = tipo;
      }
    } catch {
      return jsonResponse({ success: false, error: `No se pudo parsear respuesta IA: ${rawText.substring(0, 200)}` });
    }

    // Update DB record
    if (invoiceId && SUPABASE_URL && SUPABASE_SERVICE_KEY) {
      const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
      
      // Fetch the purchase invoice record to find its tenant_id
      const { data: invoiceRec } = await sb
        .from("purchase_invoices")
        .select("tenant_id")
        .eq("id", invoiceId)
        .single();
        
      const tenantId = invoiceRec?.tenant_id || 'a0000000-0000-0000-0000-000000000001';
      
      let supplierId = null;
      if (extracted.cuit && extracted.tipo === 'compra') {
        const cleanCuit = extracted.cuit.replace(/\D/g, '');
        let formattedCuit = extracted.cuit;
        if (cleanCuit.length === 11) {
          formattedCuit = `${cleanCuit.slice(0, 2)}-${cleanCuit.slice(2, 10)}-${cleanCuit.slice(10)}`;
        }
        
        const { data: existingSuppliers } = await sb
          .from("suppliers")
          .select("id")
          .or(`cuit.eq."${extracted.cuit}",cuit.eq."${cleanCuit}",cuit.eq."${formattedCuit}"`);
          
        if (existingSuppliers && existingSuppliers.length > 0) {
          supplierId = existingSuppliers[0].id;
        } else {
          // Create new supplier
          const { data: newSupplier, error: supErr } = await sb
            .from("suppliers")
            .insert({
              tenant_id: tenantId,
              name: extracted.proveedor_cliente || 'Proveedor Nuevo',
              cuit: formattedCuit,
              tax_condition: 'RI'
            })
            .select("id")
            .single();
            
          if (!supErr && newSupplier) {
            supplierId = newSupplier.id;
          } else {
            console.error("[process-invoice] Error auto-creating supplier:", supErr);
          }
        }
      }

      await sb.from("purchase_invoices").update({
        supplier_id: supplierId,
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
