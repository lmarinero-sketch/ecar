import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ==================== TOOL DEFINITIONS (Chat Completions format) ====================
const tools = [
  {
    type: 'function' as const,
    function: {
      name: 'query_employees',
      description: 'Buscar empleados activos.',
      parameters: { type: 'object', properties: { search: { type: 'string' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_cheques',
      description: 'Consultar cheques. Filtrar por estado y dirección.',
      parameters: { type: 'object', properties: { status: { type: 'string' }, direction: { type: 'string' }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_cheque',
      description: 'Cargar un nuevo cheque.',
      parameters: {
        type: 'object',
        properties: {
          cheque_number: { type: 'string' },
          bank_name: { type: 'string' },
          amount_ars: { type: 'number' },
          direction: { type: 'string', description: 'payable o receivable' },
          type: { type: 'string', description: 'physical o echeq' },
          issue_date: { type: 'string' },
          due_date: { type: 'string' },
          beneficiary_or_issuer: { type: 'string' }
        },
        required: ['cheque_number', 'bank_name', 'amount_ars', 'direction', 'due_date']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_obligations',
      description: 'Consultar obligaciones fiscales.',
      parameters: { type: 'object', properties: { status: { type: 'string' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_attendance',
      description: 'Consultar asistencia.',
      parameters: { type: 'object', properties: { date: { type: 'string' }, employee_name: { type: 'string' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_invoices',
      description: 'Consultar facturas de compra.',
      parameters: { type: 'object', properties: { month: { type: 'string' }, supplier_name: { type: 'string' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_daily_summary',
      description: 'Resumen ejecutivo del día: cheques próximos, obligaciones pendientes, asistencia.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'update_obligation_status',
      description: 'Marcar obligación como pagada.',
      parameters: { type: 'object', properties: { obligation_name: { type: 'string' }, new_status: { type: 'string' } }, required: ['obligation_name', 'new_status'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'calculate_cashflow',
      description: 'Calcular flujo de caja próximos N días.',
      parameters: { type: 'object', properties: { days_ahead: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_purchase_invoice',
      description: 'Cargar una factura de compra con todos sus datos fiscales (proveedor, montos, IVA, percepciones). Usá esta herramienta cuando recibas los datos extraídos de una foto de factura.',
      parameters: {
        type: 'object',
        properties: {
          supplier_name: { type: 'string', description: 'Razón social del proveedor' },
          supplier_cuit: { type: 'string', description: 'CUIT del proveedor (XX-XXXXXXXX-X)' },
          supplier_tax_condition: { type: 'string', description: 'Condición fiscal: RI, Monotributo, Exento' },
          invoice_type: { type: 'string', description: 'Tipo: A, B, C, M, X' },
          point_of_sale: { type: 'string', description: 'Punto de venta (ej: 0001)' },
          invoice_number: { type: 'string', description: 'Número completo (ej: 0001-00012345)' },
          issue_date: { type: 'string', description: 'Fecha emisión YYYY-MM-DD' },
          net_amount_ars: { type: 'number', description: 'Neto gravado' },
          iva_21_ars: { type: 'number', description: 'IVA 21%' },
          iva_105_ars: { type: 'number', description: 'IVA 10.5%' },
          iva_27_ars: { type: 'number', description: 'IVA 27%' },
          exempt_ars: { type: 'number', description: 'Exento de IVA' },
          perceptions_iva_ars: { type: 'number', description: 'Percepciones IVA' },
          perceptions_iibb_ars: { type: 'number', description: 'Percepciones IIBB' },
          total_ars: { type: 'number', description: 'Total de la factura' },
          cae_number: { type: 'string', description: 'Número de CAE' }
        },
        required: ['supplier_name', 'invoice_type', 'invoice_number', 'issue_date', 'total_ars']
      }
    }
  },
];

const SYSTEM_PROMPT = `Sos *Rombo* 🤖, el asistente IA de ECAR Constructora. Respondés por WhatsApp.
Hablás en español argentino (vos/vosotros). Sos profesional, cercano y eficiente.

## TU ROL
Sos el copiloto digital de ECAR. Podés crear y consultar registros del ERP: cheques, obligaciones fiscales, empleados, asistencia, facturas, gastos y proyectos.

## FORMATO DE RESPUESTA (MUY IMPORTANTE)
- Usá formato *WhatsApp nativo*: asteriscos simples para *negrita* (ej: *Cheque cargado*).
- NUNCA uses markdown de Slack/Discord (no ### ni ** doble ni __nada__).
- Usá emojis para dar estructura visual y hacer las respuestas legibles en el celular.
- Dejá líneas en blanco entre secciones para que "respire" el texto.
- Sé conciso: mensajes de máximo 3-4 párrafos cortos.

## EJEMPLOS DE FORMATO CORRECTO

Cuando confirmes una acción:
✅ *Cheque cargado exitosamente*

🏦 Banco: Macro
💰 Monto: $1.500.000
📅 Vencimiento: 15/06/2026
📋 Número: 00123456

Cuando falte información:
⚠️ Me falta info para cargar el cheque:

1️⃣ *Número de cheque*
2️⃣ *Banco emisor*
3️⃣ ¿Es *emitido* o *recibido*?

📝 Mandame esos datos y lo cargo.

Cuando muestres una lista:
📊 *Cheques pendientes (3)*

🔹 N° 001234 — Macro — $500.000 — Vence 10/05
🔹 N° 005678 — Galicia — $1.200.000 — Vence 15/05
🔹 N° 009012 — BBVA — $800.000 — Vence 20/05

💰 *Total: $2.500.000*

## REGLAS CRÍTICAS
1. Cuando el usuario quiera CREAR un registro, extraé toda la info posible del mensaje.
2. Si falta información obligatoria, PREGUNTÁ específicamente qué falta usando el formato numerado con emojis.
3. Cuando tengas todos los datos, ejecutá la herramienta y confirmá con ✅.
4. NUNCA inventes datos. Si no sabés algo, preguntá.
5. Valores monetarios siempre con $ y separador de miles con punto: $1.500.000
6. Para cheques necesitás: número, banco, monto, dirección (emitido/recibido), fecha vencimiento.
7. Si el usuario manda un audio, ya fue transcrito. Tratá el texto como si lo hubiera escrito.
8. Cuando el usuario salude, respondé brevemente y preguntá en qué podés ayudar.
9. Si te piden un resumen, usá el formato con emojis y negritas para que sea escaneable.
10. SIEMPRE terminá tu mensaje con un CTA (call to action) contextual. Ejemplos:
   - Después de cargar un cheque: "¿Querés cargar otro o consultar los pendientes? 📋"
   - Después de una consulta: "¿Necesitás algo más o queres que profundice en alguno? 🔍"
   - Después de un resumen: "¿Querés ver el detalle de algún punto? 👆"
   - Nunca repitas el mismo CTA dos veces seguidas, variá las opciones.`;

// ==================== TOOL EXECUTION ====================
async function executeTool(supabase: any, name: string, args: Record<string, any>): Promise<string> {
  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]

  try {
    switch (name) {
      case 'query_employees': {
        let q = supabase.from('employees').select('full_name, cuil, employment_status, hire_date, category').eq('employment_status', 'active')
        if (args.search) q = q.ilike('full_name', `%${args.search}%`)
        const { data } = await q.order('full_name').limit(20)
        return JSON.stringify(data || [])
      }
      case 'query_cheques': {
        let q = supabase.from('cheques').select('cheque_number, bank_name, beneficiary_or_issuer, amount_ars, due_date, status, direction')
        if (args.status) q = q.eq('status', args.status)
        if (args.direction) q = q.eq('direction', args.direction)
        const { data } = await q.order('due_date').limit(args.limit || 15)
        if (!data?.length) return '[]'
        const total = data.reduce((s: number, c: any) => s + (c.amount_ars || 0), 0)
        return JSON.stringify({ cheques: data, total_ars: total, count: data.length })
      }
      case 'create_cheque': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const { data, error } = await supabase.from('cheques').insert({
          tenant_id: tenant?.id,
          cheque_number: args.cheque_number,
          bank_name: args.bank_name,
          amount_ars: args.amount_ars,
          direction: args.direction,
          type: args.type || 'physical',
          issue_date: args.issue_date || null,
          due_date: args.due_date,
          beneficiary_or_issuer: args.beneficiary_or_issuer || null,
          status: 'pending'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, message: `Cheque ${args.cheque_number} cargado.`, id: data.id })
      }
      case 'query_obligations': {
        let q = supabase.from('obligations').select('name, description, due_day_of_month, amount_ars, status')
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('due_day_of_month')
        return JSON.stringify(data || [])
      }
      case 'query_attendance': {
        let q = supabase.from('attendance_records').select('employee_id, clock_in, clock_out, status, worked_hours, date, employees(full_name)')
        if (args.date) q = q.eq('date', args.date)
        else q = q.eq('date', todayStr)
        const { data } = await q.order('date', { ascending: false }).limit(50)
        return JSON.stringify(data || [])
      }
      case 'query_invoices': {
        let q = supabase.from('purchase_invoices').select('supplier_name, invoice_number, invoice_date, total_ars, status')
        if (args.month) { q = q.gte('invoice_date', `${args.month}-01`).lte('invoice_date', `${args.month}-31`) }
        if (args.supplier_name) q = q.ilike('supplier_name', `%${args.supplier_name}%`)
        const { data } = await q.order('invoice_date', { ascending: false }).limit(20)
        return JSON.stringify(data || [])
      }
      case 'calculate_cashflow': {
        const days = args.days_ahead || 30
        const futureDate = new Date(today.getTime() + days * 86400000).toISOString().split('T')[0]
        const [receivable, payable, obls] = await Promise.all([
          supabase.from('cheques').select('amount_ars').eq('status', 'pending').eq('direction', 'receivable').gte('due_date', todayStr).lte('due_date', futureDate),
          supabase.from('cheques').select('amount_ars').eq('status', 'pending').eq('direction', 'payable').gte('due_date', todayStr).lte('due_date', futureDate),
          supabase.from('obligations').select('amount_ars').eq('status', 'pending'),
        ])
        const inflow = (receivable.data || []).reduce((s: number, c: any) => s + (c.amount_ars || 0), 0)
        const outCheques = (payable.data || []).reduce((s: number, c: any) => s + (c.amount_ars || 0), 0)
        const outObls = (obls.data || []).reduce((s: number, o: any) => s + (o.amount_ars || 0), 0)
        return JSON.stringify({ periodo: `${days} días`, ingresos: inflow, egresos_cheques: outCheques, egresos_obligaciones: outObls, neto: inflow - outCheques - outObls })
      }
      case 'update_obligation_status': {
        const { data: obl } = await supabase.from('obligations').select('id, name').ilike('name', `%${args.obligation_name}%`).limit(1).single()
        if (!obl) return JSON.stringify({ error: `No encontré "${args.obligation_name}"` })
        await supabase.from('obligations').update({ status: args.new_status }).eq('id', obl.id)
        return JSON.stringify({ success: true, message: `${obl.name} → ${args.new_status}` })
      }
      case 'get_daily_summary': {
        const weekAhead = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
        const [chequesDue, oblsPending, att] = await Promise.all([
          supabase.from('cheques').select('cheque_number, amount_ars, due_date, direction').eq('status', 'pending').gte('due_date', todayStr).lte('due_date', weekAhead),
          supabase.from('obligations').select('name, amount_ars, due_day_of_month').eq('status', 'pending'),
          supabase.from('attendance_records').select('status').eq('date', todayStr),
        ])
        return JSON.stringify({
          fecha: todayStr,
          cheques_7dias: chequesDue.data?.length || 0,
          obligaciones_pendientes: oblsPending.data?.length || 0,
          presentes_hoy: (att.data || []).filter((a: any) => a.status === 'present').length,
        })
      }
      case 'create_purchase_invoice': {
        console.log('=== CREATE_PURCHASE_INVOICE: Inicio ===')
        console.log('Args recibidos:', JSON.stringify(args))

        // Get tenant - try multiple approaches
        let tenantId = null
        const { data: tenant, error: tenantErr } = await supabase.from('tenants').select('id').limit(1).single()
        if (tenantErr) {
          console.error('Error buscando tenant:', tenantErr.message)
          // Try getting tenant from an existing invoice
          const { data: existingInv } = await supabase.from('purchase_invoices').select('tenant_id').limit(1).single()
          if (existingInv?.tenant_id) {
            tenantId = existingInv.tenant_id
            console.log('Tenant obtenido de factura existente:', tenantId)
          }
        } else {
          tenantId = tenant?.id
          console.log('Tenant encontrado:', tenantId)
        }

        // Upsert supplier (create if not exists)
        let supplierId = null
        if (args.supplier_name) {
          let supplierQuery = supabase.from('suppliers').select('id, name')
          if (args.supplier_cuit) {
            const cleanCuit = args.supplier_cuit.replace(/\D/g, '')
            supplierQuery = supplierQuery.eq('cuit', cleanCuit)
          } else {
            supplierQuery = supplierQuery.ilike('name', `%${args.supplier_name}%`)
          }
          const { data: existing, error: findErr } = await supplierQuery.limit(1).single()
          
          if (findErr) console.log('Proveedor no encontrado (normal si es nuevo):', findErr.message)

          if (existing) {
            supplierId = existing.id
            console.log(`Proveedor existente: ${existing.name} (${existing.id})`)
          } else {
            const supplierInsert = {
              tenant_id: tenantId,
              name: args.supplier_name,
              cuit: args.supplier_cuit ? args.supplier_cuit.replace(/\D/g, '') : null,
              tax_condition: args.supplier_tax_condition || 'RI',
            }
            console.log('Creando proveedor:', JSON.stringify(supplierInsert))
            const { data: newSupplier, error: supErr } = await supabase.from('suppliers').insert(supplierInsert).select().single()
            if (supErr) {
              console.error('ERROR creando proveedor:', supErr.message, supErr.details, supErr.hint)
            } else if (newSupplier) {
              supplierId = newSupplier.id
              console.log(`Proveedor creado OK: ${args.supplier_name} (${newSupplier.id})`)
            } else {
              console.error('Proveedor insert: sin error pero sin data (posible RLS block)')
            }
          }
        }

        // Insert invoice
        const invoiceData: Record<string, any> = {
          supplier_id: supplierId,
          invoice_type: args.invoice_type || 'A',
          point_of_sale: args.point_of_sale || null,
          invoice_number: args.invoice_number,
          issue_date: args.issue_date,
          net_amount_ars: args.net_amount_ars || 0,
          iva_21_ars: args.iva_21_ars || 0,
          iva_105_ars: args.iva_105_ars || 0,
          iva_27_ars: args.iva_27_ars || 0,
          exempt_ars: args.exempt_ars || 0,
          perceptions_iva_ars: args.perceptions_iva_ars || 0,
          perceptions_iibb_ars: args.perceptions_iibb_ars || 0,
          total_ars: args.total_ars || 0,
          cae_number: args.cae_number || null,
          status: 'pending_review',
          ocr_validated: false,
          ocr_raw_data: args,
        }
        // Only include tenant_id if we found one
        if (tenantId) invoiceData.tenant_id = tenantId

        console.log('Insertando factura:', JSON.stringify(invoiceData))
        const { data: inv, error: invErr } = await supabase.from('purchase_invoices').insert(invoiceData).select().single()
        
        if (invErr) {
          console.error('ERROR insertando factura:', invErr.message, invErr.details, invErr.hint, invErr.code)
          return JSON.stringify({ error: `Error al guardar: ${invErr.message}. Detalle: ${invErr.details || 'ninguno'}. Hint: ${invErr.hint || 'ninguno'}` })
        }
        
        if (!inv) {
          console.error('INSERT sin error pero sin data retornada (RLS posible)')
          // Try insert without .select() as fallback
          const { error: fallbackErr } = await supabase.from('purchase_invoices').insert(invoiceData)
          if (fallbackErr) {
            console.error('FALLBACK también falló:', fallbackErr.message)
            return JSON.stringify({ error: `No se pudo guardar la factura. Error: ${fallbackErr.message}` })
          }
          console.log('FALLBACK insert OK (sin select)')
          return JSON.stringify({
            success: true,
            message: `Factura ${args.invoice_type} N° ${args.invoice_number} cargada (pendiente de revisión)`,
            supplier: args.supplier_name,
            total: args.total_ars,
          })
        }

        console.log('=== Factura cargada OK. ID:', inv.id, '===')
        return JSON.stringify({
          success: true,
          message: `Factura ${args.invoice_type} N° ${args.invoice_number} cargada`,
          id: inv.id,
          supplier: args.supplier_name,
          total: args.total_ars,
          iva_21: args.iva_21_ars || 0,
          iva_105: args.iva_105_ars || 0,
          percepciones: (args.perceptions_iva_ars || 0) + (args.perceptions_iibb_ars || 0),
        })
      }
      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${name}` })
    }
  } catch (err: any) {
    return JSON.stringify({ error: err.message })
  }
}

// ==================== MAIN HANDLER ====================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("=== INICIO WEBHOOK ROMBO-WHATSAPP ===");
    const payload = await req.json();
    console.log("Payload recibido:", JSON.stringify(payload, null, 2));

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // ── Detectar dirección usando eventName ──
    const eventName = payload.eventName || "unknown";
    const data = payload.data || payload;

    const isOutgoing = eventName === "message.outgoing";

    // Solo procesar incoming
    if (isOutgoing || eventName !== "message.incoming") {
      console.log(`Evento ${eventName} ignorado (solo procesamos message.incoming)`);
      return new Response(JSON.stringify({ success: true, skipped: eventName }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ── Extraer datos del payload ──
    const body = data.body || data.message || "";
    let phone = data.from || data.phone || "";
    const attachments = data.attachment || data.attachments || [];
    const urlTempFile = payload.urlTempFile || data.urlTempFile || null;

    console.log(`Mensaje: ${body}`);
    console.log(`Teléfono crudo: ${phone}`);

    // Limpiar teléfono (como en Gallo)
    if (phone.includes("@")) {
      phone = phone.split("@")[0];
    }
    console.log(`Teléfono limpio: ${phone}`);

    // Detectar media
    let attachmentUrls: string[] | null = null;
    if (urlTempFile) {
      attachmentUrls = [urlTempFile];
    } else if (Array.isArray(attachments) && attachments.length > 0) {
      attachmentUrls = attachments;
    }

    // Validar campos mínimos
    if (!phone || (!body && !attachmentUrls)) {
      console.warn("Payload ignorado: falta phone o body/media.");
      return new Response(JSON.stringify({ status: "ignored - missing fields" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let bodyText = body;
    let visionImageUrl: string | null = null;
    const openaiKey = Deno.env.get("OPENAI_API_KEY") || "";

    // ── Procesamiento de Multimedia (Audios → Whisper, Imágenes → Vision OCR) ──
    if (attachmentUrls && attachmentUrls.length > 0 && openaiKey) {
      const mediaUrl = attachmentUrls[0];
      try {
        console.log(`Descargando media para análisis: ${mediaUrl}`);
        const mediaRes = await fetch(mediaUrl);
        const contentType = mediaRes.headers.get("Content-Type") || "";

        if (contentType.includes("audio") || contentType.includes("ogg") || contentType.includes("opus")) {
          console.log("Audio detectado. Usando Whisper...");
          const audioBlob = await mediaRes.blob();
          const formData = new FormData();
          formData.append('file', audioBlob, 'audio.ogg');
          formData.append('model', 'whisper-1');
          formData.append('language', 'es');

          const transcribeRes = await fetch('https://api.openai.com/v1/audio/transcriptions', {
            method: "POST",
            headers: { Authorization: `Bearer ${openaiKey}` },
            body: formData
          });
          const transcribeJson = await transcribeRes.json();
          if (transcribeJson.text) {
            bodyText = transcribeJson.text;
            console.log(`Transcripción exitosa: ${bodyText}`);
          }
        } else if (contentType.includes("image")) {
          console.log("Imagen detectada. Procesando como posible factura con Vision OCR...");
          visionImageUrl = mediaUrl;
          if (!bodyText || !bodyText.trim()) {
            bodyText = "Te envié una foto de una factura. Extraé todos los datos y cargala al sistema.";
          }
        }
      } catch (e: any) {
        console.error("Error al procesar media entrante:", e.message);
      }
    }

    // Si no hay mensaje, salir
    if (!bodyText || !bodyText.trim()) {
      console.log("Mensaje vacío, ignorando.");
      return new Response(JSON.stringify({ success: true, reason: 'empty' }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // ══════════════════════════════════════════════════
    // ══  ROMBO IA — Procesa incoming con GPT + Tools ══
    // ══════════════════════════════════════════════════
    console.log("=== ROMBO IA: Procesando mensaje ===");

    try {
      // ── Obtener historial de conversación (últimos 20 msgs) ──
      const { data: history } = await supabase
        .from('whatsapp_conversations')
        .select('messages')
        .eq('phone', phone)
        .single();

      let chatMessages: any[] = [];

      if (history?.messages) {
        const parsed = typeof history.messages === 'string' ? JSON.parse(history.messages) : history.messages;
        // Check TTL (30 min)
        if (Array.isArray(parsed) && parsed.length > 0) {
          const lastMsg = parsed[parsed.length - 1];
          const lastTs = lastMsg?.timestamp ? new Date(lastMsg.timestamp).getTime() : 0;
          if (Date.now() - lastTs < 30 * 60 * 1000) {
            chatMessages = parsed;
          }
        }
      }

      // Add current user message
      chatMessages.push({ role: 'user', content: bodyText, timestamp: new Date().toISOString() });

      // Build OpenAI messages (system + history without timestamps)
      const invoiceOcrPrompt = visionImageUrl ? `\n\n## INSTRUCCIÓN ESPECIAL PARA ESTA IMAGEN
El usuario envió una FOTO DE FACTURA. Debés:
1. Analizar la imagen con máximo detalle.
2. Extraer TODOS los datos fiscales: proveedor, CUIT, condición fiscal, tipo factura (A/B/C), punto de venta, número, fecha, neto gravado, IVA 21%, IVA 10.5%, IVA 27%, exento, percepciones IVA, percepciones IIBB, total, CAE.
3. Ejecutar la herramienta create_purchase_invoice con TODOS los campos extraídos.
4. Mostrar un resumen visual bonito de lo que cargaste.
5. Si algún dato no es legible, marcalo como 0 o vacío y avisá al usuario.` : '';

      const openaiMessages: any[] = [
        { role: 'system', content: SYSTEM_PROMPT + invoiceOcrPrompt }
      ];
      for (const m of chatMessages) {
        // If this is the last user message and has an image, send as multimodal
        if (m === chatMessages[chatMessages.length - 1] && m.role === 'user' && visionImageUrl) {
          openaiMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: m.content },
              { type: 'image_url', image_url: { url: visionImageUrl, detail: 'high' } }
            ]
          });
        } else {
          openaiMessages.push({ role: m.role, content: m.content });
        }
      }

      console.log(`Enviando ${openaiMessages.length} mensajes a GPT (incluyendo system)...`);

      // ── Call OpenAI Chat Completions (same pattern as Gallo) ──
      let aiResponse = '';
      let rounds = 0;
      const MAX_ROUNDS = 3;

      // Use gpt-4o for Vision (image) requests, gpt-4o-mini for text-only
      const modelToUse = visionImageUrl ? 'gpt-4o' : 'gpt-4o-mini';
      console.log(`Modelo: ${modelToUse}${visionImageUrl ? ' (Vision OCR activo)' : ''}`);

      while (rounds < MAX_ROUNDS) {
        const gptRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelToUse,
            messages: openaiMessages,
            tools: tools,
            tool_choice: 'auto',
            max_tokens: 1500,
            temperature: 0.3
          })
        });

        if (!gptRes.ok) {
          const errText = await gptRes.text();
          console.error(`OpenAI error ${gptRes.status}:`, errText);
          throw new Error(`OpenAI API error: ${gptRes.status}`);
        }

        const gptData = await gptRes.json();
        const choice = gptData.choices?.[0];

        if (!choice) {
          console.error("No choice in GPT response");
          break;
        }

        const assistantMsg = choice.message;

        // If there are tool calls, execute them
        if (assistantMsg.tool_calls && assistantMsg.tool_calls.length > 0) {
          rounds++;
          console.log(`Tool calls detectados (round ${rounds}):`, assistantMsg.tool_calls.map((tc: any) => tc.function.name));

          // Add assistant message with tool calls to context
          openaiMessages.push(assistantMsg);

          // Execute each tool and add results
          for (const tc of assistantMsg.tool_calls) {
            const fnName = tc.function.name;
            const fnArgs = JSON.parse(tc.function.arguments || '{}');
            console.log(`Ejecutando tool: ${fnName}(${JSON.stringify(fnArgs)})`);

            const result = await executeTool(supabase, fnName, fnArgs);
            openaiMessages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: result
            });
          }
          // Continue loop to get final response
          continue;
        }

        // No tool calls — we have the final text response
        aiResponse = assistantMsg.content || '';
        break;
      }

      if (!aiResponse) {
        aiResponse = 'No pude procesar tu mensaje. Intentá de nuevo.';
      }

      // Convert markdown to WhatsApp-compatible format
      aiResponse = aiResponse.replace(/^#{1,6}\s*/gm, '');    // Remove ### headers
      aiResponse = aiResponse.replace(/\*\*(.+?)\*\*/g, '*$1*'); // **bold** → *bold*
      aiResponse = aiResponse.replace(/_{2}(.+?)_{2}/g, '_$1_'); // __text__ → _text_
      aiResponse = aiResponse.replace(/```[\s\S]*?```/g, '');     // Remove code blocks
      aiResponse = aiResponse.replace(/`([^`]+)`/g, '$1');        // Remove inline code

      console.log(`GPT respondió (${aiResponse.length} chars): ${aiResponse.substring(0, 100)}...`);

      // ── Save conversation history ──
      chatMessages.push({ role: 'assistant', content: aiResponse, timestamp: new Date().toISOString() });

      // Keep only last 20
      const trimmed = chatMessages.slice(-20);

      await supabase.from('whatsapp_conversations').upsert({
        phone,
        messages: JSON.stringify(trimmed),
        last_intent: null,
        pending_data: '{}',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });

      // ── Send reply via BuilderBot API ──
      const bbApiKey = 'bb-3c45fa69-2776-4275-82b6-2d6df9e08ec6';
      const bbProjectId = 'c3fd918b-b736-40dc-a841-cbb73d3b2a8d';
      const bbUrl = `https://app.builderbot.cloud/api/v2/${bbProjectId}/messages`;

      console.log(`Enviando respuesta vía BuilderBot a ${phone}...`);

      const sendRes = await fetch(bbUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-builderbot': bbApiKey
        },
        body: JSON.stringify({
          number: phone,
          messages: { content: aiResponse }
        })
      });

      const sendResult = await sendRes.text();
      console.log(`BuilderBot send status: ${sendRes.status}`, sendResult);

      console.log("=== ROMBO IA: Respuesta enviada y guardada ===");

    } catch (botError: any) {
      console.error("ERROR en Rombo IA:", botError.message);
      // Don't break the webhook on bot errors
    }

    console.log("=== FIN WEBHOOK ===");
    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("!!! ERROR FATAL EN WEBHOOK !!!", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // 200 to avoid BuilderBot retries
    });
  }
});
