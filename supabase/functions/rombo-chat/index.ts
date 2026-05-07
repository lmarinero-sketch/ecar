import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const SYSTEM_PROMPT = `Sos "Rombo", el asistente IA de ECAR Constructora. Hablás en español argentino. Sos experto en el ERP de ECAR.

## MÓDULOS: Dashboard BI, Compras & Libro IVA (proveedores, facturas con OCR, IVA), Finanzas & Tesorería (cheques físicos/eCheq, gastos fijos), Alertas & Obligaciones (vencimientos, notificaciones WhatsApp), Facturación ARCA (facturas electrónicas AFIP), RRHH & Legajos (nómina, legajo digital, asistencia QR, novedades al contador), Planificación WBS, Acopios & Logística, Flota y Maquinaria, Certificaciones/ICC, Parte Diario, Documentos & Correo.

## REGLAS
1. Usá las herramientas disponibles para consultar datos reales antes de responder
2. Solo respondés sobre ECAR y sus datos
3. Sé conciso, preciso y útil
4. Cuando ejecutes acciones, confirmá qué hiciste
5. Sugerí funcionalidades que el usuario podría no conocer
6. Valores monetarios en formato ARS: $ 1.234,56`

// Tool definitions for OpenAI function calling
const tools = [
  {
    type: 'function', function: {
      name: 'query_employees',
      description: 'Buscar empleados activos. Puede filtrar por nombre.',
      parameters: { type: 'object', properties: { search: { type: 'string', description: 'Nombre parcial para buscar (opcional)' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_cheques',
      description: 'Consultar cheques. Puede filtrar por estado (pending/deposited/cashed/bounced) y dirección (payable=emitidos, receivable=recibidos).',
      parameters: { type: 'object', properties: { status: { type: 'string' }, direction: { type: 'string' }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'create_cheque',
      description: 'Cargar un nuevo cheque (emitido o recibido).',
      parameters: { 
        type: 'object', 
        properties: { 
          cheque_number: { type: 'string' }, 
          bank_name: { type: 'string' }, 
          amount_ars: { type: 'number' }, 
          direction: { type: 'string', description: 'payable (emitido por la empresa) o receivable (recibido de un cliente)' }, 
          type: { type: 'string', description: 'physical o echeq' }, 
          issue_date: { type: 'string', description: 'YYYY-MM-DD' }, 
          due_date: { type: 'string', description: 'YYYY-MM-DD' }, 
          beneficiary_or_issuer: { type: 'string', description: 'Beneficiario (si es payable) o Emisor (si es receivable)' } 
        },
        required: ['cheque_number', 'bank_name', 'amount_ars', 'direction', 'due_date']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obligations',
      description: 'Consultar obligaciones fiscales/contractuales.',
      parameters: { type: 'object', properties: { status: { type: 'string', description: 'pending/paid/overdue/notified' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_attendance',
      description: 'Consultar registros de asistencia. Puede filtrar por fecha y empleado.',
      parameters: { type: 'object', properties: { date: { type: 'string', description: 'Fecha YYYY-MM-DD' }, employee_name: { type: 'string' }, month: { type: 'string', description: 'Mes YYYY-MM para resumen mensual' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_invoices',
      description: 'Consultar facturas de compra. Puede filtrar por mes o proveedor.',
      parameters: { type: 'object', properties: { month: { type: 'string', description: 'YYYY-MM' }, supplier_name: { type: 'string' }, status: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_projects',
      description: 'Consultar proyectos/obras.',
      parameters: { type: 'object', properties: { status: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_expenses',
      description: 'Consultar gastos fijos mensuales.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function', function: {
      name: 'calculate_cashflow',
      description: 'Calcular flujo de caja: cheques por cobrar vs por pagar + obligaciones pendientes en los próximos N días.',
      parameters: { type: 'object', properties: { days_ahead: { type: 'number', description: 'Días hacia adelante (default 30)' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'update_obligation_status',
      description: 'Marcar una obligación como pagada u otro estado.',
      parameters: { type: 'object', properties: { obligation_name: { type: 'string', description: 'Nombre de la obligación' }, new_status: { type: 'string', description: 'paid/pending/overdue' } }, required: ['obligation_name', 'new_status'] }
    }
  },
  {
    type: 'function', function: {
      name: 'create_reminder',
      description: 'Crear un recordatorio de notificación WhatsApp.',
      parameters: { type: 'object', properties: { title: { type: 'string' }, description: { type: 'string' }, message: { type: 'string' }, contact_names: { type: 'array', items: { type: 'string' }, description: 'Nombres de contactos destinatarios' } }, required: ['title', 'message'] }
    }
  },
  {
    type: 'function', function: {
      name: 'send_whatsapp_now',
      description: 'Enviar un mensaje WhatsApp inmediato a un contacto configurado.',
      parameters: { type: 'object', properties: { contact_name: { type: 'string', description: 'Nombre del contacto' }, message: { type: 'string' } }, required: ['contact_name', 'message'] }
    }
  },
  {
    type: 'function', function: {
      name: 'create_document_request',
      description: 'Crear solicitud de documento para un empleado.',
      parameters: { type: 'object', properties: { employee_name: { type: 'string' }, document_type: { type: 'string', description: 'DNI, ART, Recibo, Contrato, etc.' }, notes: { type: 'string' } }, required: ['employee_name', 'document_type'] }
    }
  },
  {
    type: 'function', function: {
      name: 'get_daily_summary',
      description: 'Obtener resumen ejecutivo del día: alertas urgentes, cheques por vencer, asistencia, obligaciones.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function', function: {
      name: 'detect_anomalies',
      description: 'Detectar anomalías: ausencias inusuales, gastos atípicos, patrones irregulares.',
      parameters: { type: 'object', properties: { area: { type: 'string', description: 'attendance/expenses/cheques (opcional, analiza todo si no se especifica)' } } }
    }
  },
]

// Execute tool calls against Supabase
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const today = new Date()

  try {
    switch (name) {
      case 'query_employees': {
        let q = sb.from('employees').select('full_name, cuil, employment_status, hire_date, category, project_id').eq('employment_status', 'active')
        if (args.search) q = q.ilike('full_name', `%${args.search}%`)
        const { data } = await q.order('full_name').limit(30)
        return JSON.stringify(data || [])
      }
      case 'query_cheques': {
        let q = sb.from('cheques').select('cheque_number, bank_name, beneficiary_or_issuer, amount_ars, due_date, status, direction, issue_date')
        if (args.status) q = q.eq('status', args.status)
        if (args.direction) q = q.eq('direction', args.direction)
        const { data } = await q.order('due_date').limit(args.limit || 25)
        if (!data?.length) return '[]'
        const total = data.reduce((s, c) => s + (c.amount_ars || 0), 0)
        return JSON.stringify({ cheques: data, total_ars: total, count: data.length })
      }
      case 'create_cheque': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        const { data, error } = await sb.from('cheques').insert({
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
        return JSON.stringify({ success: true, message: `Cheque ${args.cheque_number} cargado correctamente.`, id: data.id })
      }
      case 'query_obligations': {
        let q = sb.from('obligations').select('name, description, due_day_of_month, amount_ars, status, recurrence')
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('due_day_of_month')
        return JSON.stringify(data || [])
      }
      case 'query_attendance': {
        let q = sb.from('attendance_records').select('employee_id, clock_in, clock_out, status, worked_hours, date, employees(full_name)')
        if (args.date) q = q.eq('date', args.date)
        if (args.month) { q = q.gte('date', `${args.month}-01`).lte('date', `${args.month}-31`) }
        const { data } = await q.order('date', { ascending: false }).limit(100)
        if (!data?.length) return '[]'
        const summary = { total_records: data.length, present: data.filter(r => r.status === 'present').length, absent: data.filter(r => r.status === 'absent').length, late: data.filter(r => r.status === 'late').length, records: data.slice(0, 30) }
        return JSON.stringify(summary)
      }
      case 'query_invoices': {
        let q = sb.from('purchase_invoices').select('supplier_name, invoice_number, invoice_date, total_ars, iva_total_ars, status, invoice_type')
        if (args.month) { q = q.gte('invoice_date', `${args.month}-01`).lte('invoice_date', `${args.month}-31`) }
        if (args.supplier_name) q = q.ilike('supplier_name', `%${args.supplier_name}%`)
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('invoice_date', { ascending: false }).limit(30)
        if (!data?.length) return '[]'
        const total = data.reduce((s, i) => s + (i.total_ars || 0), 0)
        return JSON.stringify({ invoices: data, total_ars: total, count: data.length })
      }
      case 'query_projects': {
        let q = sb.from('projects').select('name, status, location, start_date, end_date')
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.limit(20)
        return JSON.stringify(data || [])
      }
      case 'query_expenses': {
        const { data } = await sb.from('fixed_expenses').select('concept, amount_ars, category, supplier_name, is_active').eq('is_active', true).order('amount_ars', { ascending: false })
        if (!data?.length) return '[]'
        const total = data.reduce((s, e) => s + (e.amount_ars || 0), 0)
        return JSON.stringify({ expenses: data, total_monthly_ars: total })
      }
      case 'calculate_cashflow': {
        const days = args.days_ahead || 30
        const futureDate = new Date(today.getTime() + days * 86400000).toISOString().split('T')[0]
        const todayStr = today.toISOString().split('T')[0]
        const [receivable, payable, obls] = await Promise.all([
          sb.from('cheques').select('amount_ars, due_date').eq('status', 'pending').eq('direction', 'receivable').gte('due_date', todayStr).lte('due_date', futureDate),
          sb.from('cheques').select('amount_ars, due_date').eq('status', 'pending').eq('direction', 'payable').gte('due_date', todayStr).lte('due_date', futureDate),
          sb.from('obligations').select('name, amount_ars').eq('status', 'pending'),
        ])
        const inflow = (receivable.data || []).reduce((s, c) => s + (c.amount_ars || 0), 0)
        const outflow_cheques = (payable.data || []).reduce((s, c) => s + (c.amount_ars || 0), 0)
        const outflow_obls = (obls.data || []).reduce((s, o) => s + (o.amount_ars || 0), 0)
        return JSON.stringify({ periodo: `próximos ${days} días`, ingresos_cheques: inflow, egresos_cheques: outflow_cheques, egresos_obligaciones: outflow_obls, flujo_neto: inflow - outflow_cheques - outflow_obls })
      }
      case 'update_obligation_status': {
        const { data: obl } = await sb.from('obligations').select('id, name').ilike('name', `%${args.obligation_name}%`).limit(1).single()
        if (!obl) return JSON.stringify({ error: `No se encontró obligación "${args.obligation_name}"` })
        await sb.from('obligations').update({ status: args.new_status }).eq('id', obl.id)
        return JSON.stringify({ success: true, message: `${obl.name} actualizada a "${args.new_status}"` })
      }
      case 'create_reminder': {
        let contactIds: string[] = []
        if (args.contact_names?.length) {
          for (const name of args.contact_names) {
            const { data } = await sb.from('notification_contacts').select('id').ilike('name', `%${name}%`).limit(1).single()
            if (data) contactIds.push(data.id)
          }
        }
        const { data, error } = await sb.from('notification_reminders').insert({
          tenant_id: (await sb.from('tenants').select('id').limit(1).single()).data?.id,
          title: args.title, description: args.description || null,
          trigger_type: 'manual', message_template: args.message,
          contact_ids: contactIds, is_active: true, recurrence: 'once',
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, message: `Recordatorio "${args.title}" creado`, destinatarios: contactIds.length })
      }
      case 'send_whatsapp_now': {
        const { data: contact } = await sb.from('notification_contacts').select('id, name, phone').ilike('name', `%${args.contact_name}%`).limit(1).single()
        if (!contact) return JSON.stringify({ error: `No se encontró contacto "${args.contact_name}"` })
        // Call the send-whatsapp edge function
        const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
          method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}` },
          body: JSON.stringify({ number: contact.phone, content: args.message }),
        })
        const result = await resp.json()
        return JSON.stringify({ success: result.success, contact: contact.name, phone: contact.phone, error: result.error })
      }
      case 'create_document_request': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró empleado "${args.employee_name}"` })
        const { error } = await sb.from('document_requests').insert({
          tenant_id: (await sb.from('tenants').select('id').limit(1).single()).data?.id,
          employee_id: emp.id, document_type: args.document_type,
          status: 'pending', notes: args.notes || null,
        })
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, message: `Solicitud de ${args.document_type} creada para ${emp.full_name}` })
      }
      case 'get_daily_summary': {
        const todayStr = today.toISOString().split('T')[0]
        const weekAhead = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
        const [chequesDue, oblsPending, attendanceToday, empCount] = await Promise.all([
          sb.from('cheques').select('cheque_number, amount_ars, due_date, direction').eq('status', 'pending').gte('due_date', todayStr).lte('due_date', weekAhead),
          sb.from('obligations').select('name, amount_ars, due_day_of_month').eq('status', 'pending'),
          sb.from('attendance_records').select('status').eq('date', todayStr),
          sb.from('employees').select('id', { count: 'exact' }).eq('employment_status', 'active'),
        ])
        const dayOfMonth = today.getDate()
        const urgentObls = (oblsPending.data || []).filter(o => Math.abs(o.due_day_of_month - dayOfMonth) <= 5)
        return JSON.stringify({
          fecha: todayStr,
          empleados_activos: empCount.count || 0,
          asistencia_hoy: { presentes: (attendanceToday.data || []).filter(a => a.status === 'present').length, ausentes: (attendanceToday.data || []).filter(a => a.status === 'absent').length, tardanzas: (attendanceToday.data || []).filter(a => a.status === 'late').length },
          cheques_proximos_7dias: { cantidad: chequesDue.data?.length || 0, total: (chequesDue.data || []).reduce((s, c) => s + (c.amount_ars || 0), 0), detalle: chequesDue.data?.slice(0, 5) },
          obligaciones_urgentes: urgentObls,
        })
      }
      case 'detect_anomalies': {
        const results: any = {}
        const area = args.area || 'all'
        if (area === 'all' || area === 'attendance') {
          const thirtyDaysAgo = new Date(today.getTime() - 30 * 86400000).toISOString().split('T')[0]
          const { data } = await sb.from('attendance_records').select('employee_id, status, employees(full_name)').gte('date', thirtyDaysAgo)
          if (data?.length) {
            const byEmployee: Record<string, { name: string, absent: number, late: number, total: number }> = {}
            data.forEach(r => {
              const name = (r as any).employees?.full_name || r.employee_id
              if (!byEmployee[name]) byEmployee[name] = { name, absent: 0, late: 0, total: 0 }
              byEmployee[name].total++
              if (r.status === 'absent') byEmployee[name].absent++
              if (r.status === 'late') byEmployee[name].late++
            })
            const avgAbsent = Object.values(byEmployee).reduce((s, e) => s + e.absent, 0) / Math.max(Object.keys(byEmployee).length, 1)
            results.asistencia = {
              empleados_con_muchas_ausencias: Object.values(byEmployee).filter(e => e.absent > avgAbsent * 1.5).map(e => ({ nombre: e.name, ausencias: e.absent, tardanzas: e.late })),
              promedio_ausencias: Math.round(avgAbsent * 10) / 10,
            }
          }
        }
        if (area === 'all' || area === 'cheques') {
          const { data } = await sb.from('cheques').select('amount_ars').eq('status', 'pending')
          if (data?.length) {
            const avg = data.reduce((s, c) => s + c.amount_ars, 0) / data.length
            const highValue = data.filter(c => c.amount_ars > avg * 3)
            results.cheques = { cheques_pendientes: data.length, monto_promedio: Math.round(avg), cheques_alto_valor: highValue.length }
          }
        }
        return JSON.stringify(results)
      }
      default:
        return JSON.stringify({ error: `Herramienta desconocida: ${name}` })
    }
  } catch (err) {
    return JSON.stringify({ error: err.message })
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const { messages } = await req.json()
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Build input for Responses API (no system role - use instructions param)
    const input: any[] = messages.slice(-12)

    // Adapt tools for Responses API format
    const responsesTools = tools.map(t => ({
      type: 'function' as const,
      name: t.function.name,
      description: t.function.description,
      parameters: t.function.parameters,
    }))

    // First call
    let response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'gpt-5.4-mini', instructions: SYSTEM_PROMPT, input, tools: responsesTools, temperature: 0.7 }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: `OpenAI ${response.status}`, detail: err }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let data = await response.json()

    // Handle tool calls (up to 3 rounds)
    let rounds = 0
    while (rounds < 3) {
      const functionCalls = (data.output || []).filter((o: any) => o.type === 'function_call')
      if (!functionCalls.length) break
      rounds++

      // Build follow-up input with tool results
      const followUp: any[] = [...input]
      // Add the response output items
      for (const item of data.output) {
        followUp.push(item)
      }
      // Execute each function call and add results
      for (const fc of functionCalls) {
        const args = typeof fc.arguments === 'string' ? JSON.parse(fc.arguments || '{}') : (fc.arguments || {})
        const result = await executeTool(fc.name, args)
        followUp.push({ type: 'function_call_output', call_id: fc.call_id, output: result })
      }

      response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'gpt-5.4-mini', instructions: SYSTEM_PROMPT, input: followUp, tools: responsesTools, temperature: 0.7 }),
      })

      if (!response.ok) break
      data = await response.json()
    }

    // Extract text reply
    const reply = data.output_text || data.output?.find((o: any) => o.type === 'message')?.content?.[0]?.text || 'No pude generar una respuesta.'
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

