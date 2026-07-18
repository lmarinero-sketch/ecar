import fs from 'fs';

let romboTsx = fs.readFileSync('src/components/RomboChat.tsx', 'utf8');

const quickActionsAddition = `
  logistics: [
    { icon: ShoppingCart, label: 'Stock bajo', prompt: '¿Qué materiales tienen stock por debajo del mínimo?' },
    { icon: Truck, label: 'Movimientos', prompt: 'Dame un resumen general del estado del depósito.' },
  ],
  fleet: [
    { icon: Truck, label: 'Services vencidos', prompt: '¿Qué vehículos tienen el service vencido o próximo a vencer?' },
    { icon: FileText, label: 'Resumen flota', prompt: 'Mostrame un resumen del estado de mantenimiento de toda la flota.' },
  ],
  payments: [
    { icon: Banknote, label: 'Órdenes de pago', prompt: '¿Cuáles son las órdenes de pago pendientes para esta semana?' },
    { icon: BarChart3, label: 'Resumen egresos', prompt: 'Dame un resumen de los montos totales aprobados y pagados.' },
  ],
  project_budget: [
    { icon: Zap, label: 'Monto total', prompt: '¿Cuál es el monto total presupuestado de mis obras activas?' },
    { icon: BarChart3, label: 'Análisis de costos', prompt: 'Compará los costos unitarios del presupuesto.' },
  ],
  communications: [
    { icon: MessageSquare, label: 'Últimos mensajes', prompt: 'Mostrame las últimas conversaciones de WhatsApp.' },
    { icon: Bell, label: 'Alertas', prompt: '¿Hubo alguna alerta enviada recientemente por WhatsApp?' },
  ],
  weekly_report: [
    { icon: BarChart3, label: 'Resumen semanal', prompt: 'Generá un resumen de la semana: partes diarios, avance, incidentes y gastos.' },
    { icon: FileText, label: 'Incidentes', prompt: '¿Hubo algún incidente de seguridad grave esta semana?' },
  ],
`;

romboTsx = romboTsx.replace(/  guide: \[\s*\{[\s\S]*?\}\s*\],\s*}/, match => match.replace('},', '},\n' + quickActionsAddition + '}'));

const idlePhrasesAddition = `
  payments: ['💸 Autorizando pagos...', '📑 Revisando órdenes de pago...', '💰 Verificando egresos...'],
  project_budget: ['📊 Analizando costos...', '🏗️ Revisando presupuestos de obra...', '📐 Chequeando cantidades...'],
  communications: ['💬 Leyendo mensajes de WhatsApp...', '📨 Monitoreando comunicaciones...', '📞 Todo en orden en los chats...'],
  weekly_report: ['📈 Compilando resumen semanal...', '📊 Consolidando partes diarios y gastos...', '📝 Escribiendo reporte...'],
`;

romboTsx = romboTsx.replace(/  supplier_eval: \[\s*'[^]*?'\s*\],\s*};/, match => match.replace('],', '],\n' + idlePhrasesAddition + '};'));

fs.writeFileSync('src/components/RomboChat.tsx', romboTsx);

let edgeFn = fs.readFileSync('supabase/functions/rombo-chat/index.ts', 'utf8');

const contextsAddition = `
  payments: \`## CONTEXTO ACTUAL: El usuario está en Pagos y Egresos
- Módulo para gestionar Órdenes de Pago semanales y liquidaciones.
- Muestra los ítems a pagar (gastos operativos, adelantos, liquidación de sueldos).
- Ayudalo a: consultar órdenes de pago pendientes, ver montos aprobados.
- Sugerí: "¿Querés que revise las órdenes de pago de esta semana?"\`,

  project_budget: \`## CONTEXTO ACTUAL: El usuario está en Presupuestos de Obra
- Módulo para estructurar presupuestos con Rubros, Subrubros, Ítems y APUs (Análisis de Precios Unitarios).
- Muestra montos por costo material, mano de obra, equipo.
- Ayudalo a: consultar los montos presupuestados, entender qué obras tienen el presupuesto más alto.
- Sugerí: "¿Querés que te resuma el monto total presupuestado?"\`,

  communications: \`## CONTEXTO ACTUAL: El usuario está en Comunicaciones (WhatsApp)
- Módulo que muestra el registro de todos los chats de WhatsApp enviados/recibidos.
- Ayudalo a: encontrar mensajes específicos, ver qué recordatorios automáticos salieron.
- Sugerí: "¿Querés que busque los últimos mensajes enviados hoy?"\`,

  weekly_report: \`## CONTEXTO ACTUAL: El usuario está en Resumen Semanal
- Módulo que agrega datos de toda la semana: partes diarios de todas las obras, progreso, incidentes de seguridad de la semana, entregas y vehículos.
- Ayudalo a: generar un reporte escrito, encontrar anomalías de la semana, saber si la semana fue productiva o riesgosa.
- Sugerí: "¿Querés que genere un informe resumiendo los hitos de esta semana?"\`,
`;

edgeFn = edgeFn.replace(/  guide: \`## CONTEXTO ACTUAL[\s\S]*?\}\s*function buildSystemPrompt/, match => match.replace('},', '},\n' + contextsAddition + '\n}\n\nfunction buildSystemPrompt'));

const toolsAddition = `
  // ─── TOOLS NUEVOS: PAGOS, REPORTES Y PRESUPUESTOS ───
  {
    type: 'function', function: {
      name: 'query_weekly_payments',
      description: 'Consultar órdenes de pago (Weekly Payments). Muestra montos totales, estado de aprobación y detalles de la liquidación.',
      parameters: { type: 'object', properties: { status: { type: 'string', description: 'pending/approved/paid/rejected' }, date_from: { type: 'string' }, date_to: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_budgets',
      description: 'Consultar presupuestos de obra. Muestra monto total, versión, fecha base y obra asignada.',
      parameters: { type: 'object', properties: { project_name: { type: 'string' }, status: { type: 'string', description: 'draft/approved/archived' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_whatsapp_conversations',
      description: 'Consultar registro de chats de WhatsApp. Permite saber qué se comunicó por el bot recientemente.',
      parameters: { type: 'object', properties: { phone_number: { type: 'string' }, limit: { type: 'number', description: 'Número de mensajes a traer (default 10)' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'generate_weekly_report',
      description: 'Generar un resumen analítico de la semana. Obtiene un pantallazo integral de los últimos 7 días: partes de obra, incidentes de seguridad reportados y estado de flota.',
      parameters: { type: 'object', properties: {} }
    }
  },
`;

edgeFn = edgeFn.replace(/  \}\s*\]\s*\/\/ Helper to get Argentina date\/time/, match => match.replace(']', toolsAddition + '\n]'));

const executeToolAddition = `
      // ─── PAGOS, PRESUPUESTOS Y REPORTES ───
      case 'query_weekly_payments': {
        let q = sb.from('weekly_payments').select('id, payment_date, title, status, total_amount_ars')
        if (args.status) q = q.eq('status', args.status)
        if (args.date_from) q = q.gte('payment_date', args.date_from)
        if (args.date_to) q = q.lte('payment_date', args.date_to)
        const { data } = await q.order('payment_date', { ascending: false }).limit(20)
        if (!data?.length) return JSON.stringify({ payments: [], count: 0, total_amount_ars: 0 })
        const total = data.reduce((s, p) => s + (p.total_amount_ars || 0), 0)
        return JSON.stringify({ payments: data, count: data.length, total_amount_ars: total })
      }
      case 'query_budgets': {
        let q = sb.from('budgets').select('id, name, base_date, status, total_amount_ars, projects(name)')
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        if (!data?.length) return JSON.stringify({ budgets: [], count: 0 })
        const mapped = data.map(b => ({ ...b, project_name: b.projects?.name }))
        return JSON.stringify({ budgets: mapped, count: mapped.length })
      }
      case 'query_whatsapp_conversations': {
        let q = sb.from('whatsapp_conversations').select('id, phone_number, contact_name, last_message_at, unread_count, status').order('last_message_at', { ascending: false })
        if (args.phone_number) q = q.ilike('phone_number', \`%\${args.phone_number}%\`)
        const { data } = await q.limit(args.limit || 10)
        return JSON.stringify({ conversations: data || [], count: (data || []).length })
      }
      case 'generate_weekly_report': {
        const d = new Date(today.getTime() - 7 * 86400000).toISOString().split('T')[0]
        const [partes, incidentes, flota] = await Promise.all([
          sb.from('partes_diarios').select('id, obra_name, fecha, trabajo_realizado, horas_trabajadas, estado').gte('fecha', d),
          sb.from('seguridad_incidentes').select('id, tipo, gravedad, estado, fecha_incidente').gte('fecha_incidente', d),
          sb.from('fuel_vehicles').select('code, description, next_maintenance_date').lte('next_maintenance_date', todayStr)
        ])
        const pd = partes.data || []
        const inc = incidentes.data || []
        const fl = flota.data || []
        return JSON.stringify({
          periodo: 'últimos 7 días',
          partes_diarios: { total: pd.length, horas_trabajadas_total: pd.reduce((s, p) => s + (p.horas_trabajadas || 0), 0), obras_activas: [...new Set(pd.map(p => p.obra_name))].length },
          incidentes_seguridad: { total: inc.length, graves_o_fatales: inc.filter(i => i.gravedad === 'grave' || i.gravedad === 'fatal').length },
          flota_alertas: { vehiculos_con_service_vencido: fl.length, vehiculos: fl.map(v => v.code) }
        })
      }
`;

edgeFn = edgeFn.replace(/      default:/, match => executeToolAddition + '\n' + match);

fs.writeFileSync('supabase/functions/rombo-chat/index.ts', edgeFn);
console.log('Patch complete.');
