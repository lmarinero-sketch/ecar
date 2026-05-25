import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_SYSTEM_PROMPT = `Sos "Rombo", el asistente IA de ECAR Constructora. Hablás en español argentino. Sos experto en el ERP de ECAR.

## MÓDULOS: Dashboard BI, Compras & Libro IVA (proveedores, facturas con OCR, IVA), Finanzas & Tesorería (cheques físicos/eCheq, gastos fijos), Alertas & Obligaciones (vencimientos, notificaciones WhatsApp), Facturación ARCA (facturas electrónicas AFIP), RRHH & Legajos (nómina, legajo digital, asistencia QR, novedades al contador), Planificación WBS, Acopios & Logística, Flota y Maquinaria, Certificaciones/ICC, Parte Diario de Obra (registro diario, clima, avance), Seguridad & Incidentes (accidentes, observaciones, matriz riesgo 5×5), Inspecciones & Calidad (checklists, punch list, no conformidades), Consultas de Obra RFI (consultas técnicas formales con impacto costo/cronograma), Documentos & Correo.

## REGLAS CRÍTICAS
1. **SIEMPRE consultá datos reales ANTES de responder.** NUNCA respondas con información genérica o inventada. Si el usuario pregunta algo, PRIMERO usá las herramientas para obtener los datos actuales de la base de datos y después respondé con números y hechos concretos.
2. **Sos un asistente con acceso COMPLETO a la base de datos.** Podés leer y escribir: cheques, empleados, obligaciones, facturas, asistencia, proyectos, gastos, inventario, partes de obra, incidentes de seguridad, inspecciones, RFIs, certificados, y movimientos de caja. Usá ese poder.
3. Solo respondés sobre ECAR y sus datos.
4. Sé conciso, preciso y útil. Mostrá datos reales con números concretos.
5. Cuando ejecutes acciones (crear cheque, marcar pagado, etc.), confirmá qué hiciste mostrando los datos.
6. Sugerí funcionalidades que el usuario podría no conocer.
7. Valores monetarios en formato ARS: $ 1.234,56
8. IMPORTANTE: Si el usuario pregunta "¿qué puedo hacer acá?", "¿para qué sirve esto?", "¿cómo funciona?" o variantes, explicale en detalle qué funcionalidades tiene el módulo donde está, qué herramientas podés usar vos, y sugerile acciones concretas. Sé proactivo: si ves que es una consulta genérica, orientalo sobre el módulo actual.
9. Siempre tené en cuenta el CONTEXTO ACTUAL (módulo donde está el usuario). Si preguntan algo de otro módulo, respondé igual pero sugerí navegar al módulo correcto.
10. **PROACTIVIDAD:** Cuando el usuario hace una consulta, no te limites a responder lo mínimo. Ofrecé análisis adicional, detectá patrones, y sugerí acciones. Ejemplo: si preguntan por cheques, también mencioná si hay alguno vencido o de alto monto.
11. **ACCIONES DE ESCRITURA:** Podés crear cheques, marcar obligaciones como pagadas, crear recordatorios WhatsApp, crear solicitudes de documentos, crear partes diarios, y más. Si el usuario te pide hacer algo, hacelo directamente sin pedir confirmación innecesaria.`

// Module-specific context instructions for the AI
const MODULE_CONTEXT: Record<string, string> = {
  bi: `## CONTEXTO ACTUAL: El usuario está en el Dashboard BI
- Mostrá resúmenes ejecutivos con KPIs clave: total de cheques, facturas, empleados activos, obligaciones pendientes.
- Ofrecé detectar anomalías, comparar períodos, o alertar sobre items urgentes.
- Sugerí navegación a módulos específicos si el usuario necesita detalle ("Podés ir a Finanzas para ver los cheques en detalle").`,
  
  purchases: `## CONTEXTO ACTUAL: El usuario está en Compras & Libro IVA
- Este módulo permite subir fotos/PDFs de facturas de compra. La IA extrae los datos con OCR automáticamente.
- El usuario puede ver el Libro IVA (compras y ventas), filtrar por fechas, y descargar el libro en Excel.
- Ayudalo a: revisar facturas pendientes de validación, calcular IVA crédito fiscal del mes, buscar facturas por proveedor.
- Datos clave: proveedor, CUIT, tipo/número factura, neto gravado, IVA 21%, total, estado (Revisar/Validado).
- Sugerí: "¿Querés que revise las facturas sin validar?" o "Puedo calcular tu posición de IVA este mes".`,
  
  finances: `## CONTEXTO ACTUAL: El usuario está en Finanzas & Tesorería
- Muestra la cartera de cheques (a cobrar y a pagar), gastos fijos mensuales y flujo de caja.
- El usuario puede cargar cheques manualmente o escaneando una foto (OCR).
- Tipos: physical (físico) y echeq (electrónico). Direcciones: payable (emitido) y receivable (recibido).
- Ayudalo a: ver cheques próximos a vencer, calcular flujo de caja, gestionar gastos fijos, cargar nuevos cheques.
- Sugerí: "¿Querés que te calcule el flujo de caja de los próximos 30 días?" o "Puedo mostrarte los cheques que vencen esta semana".`,
  
  obligations: `## CONTEXTO ACTUAL: El usuario está en Alertas & Obligaciones
- Gestiona vencimientos fiscales/contractuales mensuales (AFIP, ART, seguros, alquileres).
- Incluye el panel de Notificaciones WhatsApp: recordatorios automáticos, contactos, historial de envíos.
- Ayudalo a: crear obligaciones, marcarlas como pagadas, configurar recordatorios WhatsApp automáticos.
- Los recordatorios se ejecutan automáticamente cada 5 minutos desde la nube (pg_cron).
- Sugerí: "¿Querés que configure un recordatorio WhatsApp para cheques próximos a vencer?" o "Puedo marcar esta obligación como pagada".`,
  
  rrhh: `## CONTEXTO ACTUAL: El usuario está en RRHH & Legajos
- Gestiona la nómina de personal: datos personales, CUIL, categoría, proyecto asignado.
- Legajo digital con documentos (DNI, ART, recibos, contratos).
- Asistencia con QR (clock-in/clock-out), novedades al contador.
- Ayudalo a: consultar empleados activos, revisar asistencia, solicitar documentos faltantes, detectar anomalías de presentismo.
- Sugerí: "¿Querés que revise quién faltó hoy?" o "Puedo solicitar el DNI actualizado a un empleado".`,
  
  inventory: `## CONTEXTO ACTUAL: El usuario está en Pañol & Inventario
- Gestiona materiales, herramientas y consumibles. Control de stock con mínimos.
- Movimientos: entrada, salida, devolución, ajuste. Asignación de herramientas a empleados.
- Ayudalo a: revisar stock bajo mínimo, ver herramientas asignadas, consultar movimientos recientes.
- Sugerí: "¿Querés que revise qué materiales están por debajo del stock mínimo?"`,
  
  liquidity: `## CONTEXTO ACTUAL: El usuario está en el Tablero de Liquidez
- Muestra la posición de caja, saldos bancarios y proyecciones de flujo.
- Integra datos de cheques, certificaciones, gastos fijos y obligaciones para proyectar liquidez.
- Ayudalo a: entender su posición de caja actual, proyectar flujo futuro, identificar riesgos de iliquidez.
- Sugerí: "¿Querés que proyecte tu flujo de caja con los cheques pendientes y obligaciones?"`,
  
  certifications: `## CONTEXTO ACTUAL: El usuario está en Certificaciones / ICC
- Gestiona certificados de obra: montos brutos, redeterminaciones, retenciones (IIBB, imp. cheque), neto depositado.
- Vincula certificados a proyectos y cuentas bancarias.
- Ayudalo a: ver certificados pendientes de cobro, calcular retenciones, registrar depósitos.`,
  
  invoicing: `## CONTEXTO ACTUAL: El usuario está en Facturación ARCA
- Emisión de facturas electrónicas vía AFIP. Tipos: A, B, C. CAE y vencimiento.
- Datos: receptor, CUIT, montos netos, IVA, retenciones.
- Ayudalo a: consultar facturas emitidas, estados de CAE, totales facturados.`,
  
  wbs: `## CONTEXTO ACTUAL: El usuario está en Planificación WBS
- Estructura de desglose de trabajo (Work Breakdown Structure) por proyecto.
- Muestra: presupuesto, costo comprometido, devengado, avance %, hitos.
- Ayudalo a: consultar avance de obra, comparar presupuesto vs real, identificar desvíos.`,
  
  purchase_requests: `## CONTEXTO ACTUAL: El usuario está en Pedidos de Compra
- Solicitudes internas de compra de materiales. Estados: pendiente, aprobado, consolidado, recibido.
- Cada pedido tiene items con descripción, cantidad, unidad y costo estimado.
- Ayudalo a: ver pedidos pendientes, aprobar solicitudes, consultar montos consolidados.`,
  
  field: `## CONTEXTO ACTUAL: El usuario está en Parte Diario de Obra
- Registro diario de actividades en obra: tareas realizadas, personal, clima (con ícono), temperatura, hs trabajadas, entregas, incidentes.
- Workflow: borrador → enviado → aprobado/rechazado.
- Ayudalo a: crear un parte, consultar partes anteriores, aprobar partes pendientes, ver resumen semanal de avance.
- Sugerí: "¿Querés que cree el parte de hoy?" o "Puedo mostrarte el resumen semanal de avance".
- Si pide crear uno, necesitás: obra_name, trabajo_realizado, clima. El resto es opcional.`,
  
  safety: `## CONTEXTO ACTUAL: El usuario está en Seguridad e Incidentes
- Este módulo registra: accidentes, incidentes, cuasi-accidentes, enfermedades laborales.
- Cada incidente tiene: tipo, gravedad (leve/moderado/grave/fatal), persona afectada, tratamiento, causa raíz, acciones correctivas.
- También tiene Observaciones de seguridad con matriz de riesgo 5×5 (severidad × probabilidad = score).
- KPIs clave: días sin accidente, incidentes abiertos, observaciones alto riesgo, días perdidos.
- Cumplimiento: Res. SRT 905/2015 (registro obligatorio de accidentes/incidentes).
- Sugerí: "¿Querés que revise los incidentes abiertos?" o "Puedo calcular el índice de frecuencia de accidentes".`,

  inspections: `## CONTEXTO ACTUAL: El usuario está en Inspecciones & Calidad
- Gestiona inspecciones de obra: estructura, eléctrica, sanitaria, gas, contra incendio, terminaciones, general.
- Workflow: pendiente → aprobada / aprobada con observaciones / rechazada.
- Punch List: items de no conformidad con prioridad (baja/media/alta/crítica) y ciclo: abierto → en corrección → corregido → verificado → cerrado.
- Ayudalo a: crear inspecciones, agregar items al punch list, verificar correcciones, generar reportes de calidad.
- Sugerí: "¿Querés que revise los items del punch list sin resolver?" o "Puedo generar un resumen de inspecciones por obra".`,

  rfi: `## CONTEXTO ACTUAL: El usuario está en Consultas de Obra (RFI)
- RFI = Request For Information. Formaliza consultas técnicas entre obra y oficina/proyectistas.
- Cada RFI tiene: asunto, pregunta, consultado por, asignado a, respuesta oficial.
- Tracking de impacto: puede afectar costo (monto $) y/o cronograma (días de atraso).
- Workflow: borrador → abierta → respondida → cerrada.
- Ayudalo a: crear RFIs, responder consultas, identificar RFIs con impacto económico, analizar tiempos de respuesta.
- Sugerí: "¿Querés que revise las consultas abiertas?" o "Puedo analizar el impacto acumulado de las RFI".`,

  documents: `## CONTEXTO ACTUAL: El usuario está en Documentos & Correo
- Solicitudes de documentos a empleados y gestión de correspondencia.
- Ayudalo a: crear solicitudes de documentos, ver el estado de las pendientes.`,
  
  expenses: `## CONTEXTO ACTUAL: El usuario está en Gastos Operativos
- Estructura de gastos mensuales de la empresa, replicando la planilla Excel "Resumen Gastos Mesuales ECAR".
- Categorías: Personal/Honorarios, Seguros, Servicios (luz/gas/expensas/teléfono/internet), Impuestos ARCA/Provincia (F931/Autónomos/IVA/IIBB), Gremios (IERIC/UOCRA), Combustibles, Pagos a Terceros, Servicios HyS Contratados, Viandas, Varios.
- Cada item tiene montos por mes (período YYYY-MM), se puede marcar como pagado y registrar método de pago.
- La vista es tipo planilla: filas = items agrupados por categoría, columnas = meses seleccionados.
- KPIs: total visible, mes actual, variación vs mes anterior, cantidad de rubros.
- Ayudalo a: cargar gastos, comparar períodos, identificar categorías con mayor variación, verificar qué queda sin pagar.
- Sugerí: "¿Querés que analice los gastos del mes?" o "Puedo comparar los gastos de este mes vs el anterior".`,

  monthly_report: `## CONTEXTO ACTUAL: El usuario está en Resumen Mensual
- Informe financiero mensual: ingresos, egresos, desglose por categoría, desviaciones.
- Ayudalo a: generar resúmenes, comparar meses, identificar tendencias de gasto.`,

  guide: `## CONTEXTO ACTUAL: El usuario está en la Guía de Uso del Sistema
- Este módulo es una guía interactiva y detallada de cómo usar el ERP de ECAR, incluyendo todas las secciones.
- Destacá especialmente el uso del asistente por WhatsApp (número +54 9 2643 22-9503 o el canal configurado), explicando todo lo que se puede enviar por ahí (fotos de facturas/cheques, audios relatando partes de obra, novedades de empleados, etc.).
- Ofrecé explicar al usuario cómo usar cualquiera de las herramientas o módulos.
- Explicá que la IA puede interpretar texto natural en español argentino.
- Sugerí: "Puedo darte ejemplos de mensajes que le podés mandar al bot de WhatsApp" o "Preguntame sobre qué podés hacer en cualquiera de los módulos de ECAR".`,
}

function buildSystemPrompt(activeModule?: string): string {
  const moduleContext = activeModule ? MODULE_CONTEXT[activeModule] : ''
  if (moduleContext) {
    return `${BASE_SYSTEM_PROMPT}\n\n${moduleContext}`
  }
  return BASE_SYSTEM_PROMPT
}

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
      description: 'Consultar cheques. Puede filtrar por estado (pending/deposited/cashed/bounced), dirección (payable=emitidos, receivable=recibidos) y rango de fechas. IMPORTANTE: Si preguntan por cheques de "esta semana" o similar, SIEMPRE usá due_date_from y due_date_to.',
      parameters: { type: 'object', properties: { status: { type: 'string' }, direction: { type: 'string' }, due_date_from: { type: 'string', description: 'Fecha inicio rango vencimiento YYYY-MM-DD (inclusive)' }, due_date_to: { type: 'string', description: 'Fecha fin rango vencimiento YYYY-MM-DD (inclusive)' }, limit: { type: 'number' } } }
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
      name: 'delete_cheque',
      description: 'Eliminar un cheque de la base de datos. Puede buscar por número de cheque o eliminar el último cargado.',
      parameters: { type: 'object', properties: { cheque_number: { type: 'string', description: 'Número del cheque a eliminar' }, delete_last: { type: 'boolean', description: 'Si es true, elimina el último cheque cargado' } } }
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
      description: 'Analizar flujo de caja y liquidez: saldo en bancos, cheques (cobrar/pagar), obligaciones, gastos fijos y certificaciones pendientes. Útil para sugerir qué día emitir o depositar un cheque.',
      parameters: { type: 'object', properties: { days_ahead: { type: 'number', description: 'Días hacia adelante para la proyección (default 30)' } } }
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
  // ─── TOOLS NUEVOS: MÓDULOS DE OBRA ───
  {
    type: 'function', function: {
      name: 'query_partes_diarios',
      description: 'Consultar partes diarios de obra. Puede filtrar por obra o fecha.',
      parameters: { type: 'object', properties: { obra_name: { type: 'string' }, fecha: { type: 'string', description: 'YYYY-MM-DD' }, estado: { type: 'string', description: 'borrador/enviado/aprobado/rechazado' }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'create_parte_diario',
      description: 'Crear un parte diario de obra con información del día.',
      parameters: { type: 'object', properties: { obra_name: { type: 'string', description: 'Nombre de la obra' }, fecha: { type: 'string', description: 'YYYY-MM-DD' }, trabajo_realizado: { type: 'string' }, clima: { type: 'string', description: 'despejado/nublado/lluvia/tormenta/nieve/ventoso' }, horas_trabajadas: { type: 'number' }, entregas: { type: 'string' }, incidentes: { type: 'string' }, firmado_por: { type: 'string' } }, required: ['obra_name', 'trabajo_realizado'] }
    }
  },
  {
    type: 'function', function: {
      name: 'query_safety_incidents',
      description: 'Consultar incidentes de seguridad. Puede filtrar por estado, tipo o gravedad.',
      parameters: { type: 'object', properties: { estado: { type: 'string', description: 'abierto/en_investigacion/cerrado' }, tipo: { type: 'string', description: 'accidente/incidente/cuasi_accidente/enfermedad_laboral' }, gravedad: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_safety_observations',
      description: 'Consultar observaciones de seguridad. Puede filtrar por riesgo alto.',
      parameters: { type: 'object', properties: { min_riesgo: { type: 'number', description: 'Filtrar observaciones con riesgo >= este valor' }, estado: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_inspections',
      description: 'Consultar inspecciones de calidad.',
      parameters: { type: 'object', properties: { resultado: { type: 'string', description: 'pendiente/aprobada/aprobada_con_observaciones/rechazada' }, tipo: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_punch_list',
      description: 'Consultar items del punch list (no conformidades).',
      parameters: { type: 'object', properties: { estado: { type: 'string', description: 'abierto/en_correccion/corregido/verificado/cerrado' }, prioridad: { type: 'string' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_rfi',
      description: 'Consultar consultas de obra (RFI). Puede filtrar por estado.',
      parameters: { type: 'object', properties: { estado: { type: 'string', description: 'borrador/abierta/respondida/cerrada' }, con_impacto_costo: { type: 'boolean' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'get_obra_health_score',
      description: 'Calcular el "health score" integral de una obra: combina partes diarios, seguridad, inspecciones, RFI, y certificaciones para dar un diagnóstico general.',
      parameters: { type: 'object', properties: { obra_name: { type: 'string', description: 'Nombre de la obra (parcial)' } } }
    }
  },
]

// Helper to get Argentina date/time
function getArgentinaDate(): Date {
  const now = new Date()
  const argStr = now.toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' })
  return new Date(argStr)
}

function getArgentinaDateStr(): string {
  const d = getArgentinaDate()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function getArgentinaWeekRange(): { monday: string, sunday: string } {
  const d = getArgentinaDate()
  const day = d.getDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { monday: fmt(monday), sunday: fmt(sunday) }
}

// Execute tool calls against Supabase
async function executeTool(name: string, args: Record<string, any>): Promise<string> {
  const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const todayStr = getArgentinaDateStr()
  const today = getArgentinaDate()

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
        if (args.due_date_from) q = q.gte('due_date', args.due_date_from)
        if (args.due_date_to) q = q.lte('due_date', args.due_date_to)
        const { data } = await q.order('due_date').limit(args.limit || 25)
        if (!data?.length) {
          if (args.due_date_from || args.due_date_to) {
            let nextQ = sb.from('cheques').select('cheque_number, bank_name, beneficiary_or_issuer, amount_ars, due_date, status, direction').eq('status', 'pending')
            if (args.direction) nextQ = nextQ.eq('direction', args.direction)
            nextQ = nextQ.gte('due_date', args.due_date_to || args.due_date_from).order('due_date').limit(3)
            const { data: nextCheques } = await nextQ
            if (nextCheques?.length) {
              return JSON.stringify({ cheques: [], total_ars: 0, count: 0, message: 'No hay cheques en el rango solicitado', proximos_cheques: nextCheques })
            }
          }
          return JSON.stringify({ cheques: [], total_ars: 0, count: 0, message: 'No hay cheques que coincidan' })
        }
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
      case 'delete_cheque': {
        let cheque = null
        if (args.cheque_number) {
          const { data } = await sb.from('cheques').select('id, cheque_number, bank_name, amount_ars, due_date').eq('cheque_number', args.cheque_number).limit(1).single()
          cheque = data
        } else if (args.delete_last) {
          const { data } = await sb.from('cheques').select('id, cheque_number, bank_name, amount_ars, due_date').order('created_at', { ascending: false }).limit(1).single()
          cheque = data
        }
        if (!cheque) return JSON.stringify({ error: 'No se encontró el cheque para eliminar' })
        const { error: delErr } = await sb.from('cheques').delete().eq('id', cheque.id)
        if (delErr) return JSON.stringify({ error: delErr.message })
        return JSON.stringify({ success: true, message: `Cheque ${cheque.cheque_number} eliminado correctamente.`, deleted: { numero: cheque.cheque_number, banco: cheque.bank_name, monto: cheque.amount_ars, vencimiento: cheque.due_date } })
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
        const { data } = await sb.from('fixed_expenses').select('service_type, description, estimated_amount_ars, status').eq('status', 'active').order('estimated_amount_ars', { ascending: false })
        if (!data?.length) return '[]'
        const total = data.reduce((s, e) => s + (e.estimated_amount_ars || 0), 0)
        return JSON.stringify({ expenses: data, total_monthly_ars: total })
      }
      case 'calculate_cashflow': {
        const days = args.days_ahead || 30
        const futureDate = new Date(today.getTime() + days * 86400000).toISOString().split('T')[0]
        const todayStr = today.toISOString().split('T')[0]
        const [receivable, payable, obls, banks, certs, fixed] = await Promise.all([
          sb.from('cheques').select('amount_ars, due_date').eq('status', 'pending').eq('direction', 'receivable').gte('due_date', todayStr).lte('due_date', futureDate),
          sb.from('cheques').select('amount_ars, due_date').eq('status', 'pending').eq('direction', 'payable').gte('due_date', todayStr).lte('due_date', futureDate),
          sb.from('obligations').select('name, amount_ars').eq('status', 'pending'),
          sb.from('bank_accounts').select('current_balance'),
          sb.from('project_certificates').select('net_deposit, deposit_date').eq('status', 'pending'),
          sb.from('fixed_expenses').select('estimated_amount_ars').eq('status', 'active')
        ])
        
        const currentBalance = (banks.data || []).reduce((s, b) => s + (b.current_balance || 0), 0)
        const inflowCheques = (receivable.data || []).reduce((s, c) => s + (c.amount_ars || 0), 0)
        const outflowCheques = (payable.data || []).reduce((s, c) => s + (c.amount_ars || 0), 0)
        const outflowObls = (obls.data || []).reduce((s, o) => s + (o.amount_ars || 0), 0)
        const inflowCerts = (certs.data || []).reduce((s, c) => s + (c.net_deposit || 0), 0)
        const monthlyFixed = (fixed.data || []).reduce((s, f) => s + (f.estimated_amount_ars || 0), 0)
        
        // Group by day for the AI to reason about best dates
        const dailyEvents: Record<string, { in: number, out: number }> = {}
        for (let i = 0; i <= days; i++) {
          const d = new Date(today.getTime() + i * 86400000).toISOString().split('T')[0]
          dailyEvents[d] = { in: 0, out: 0 }
        }
        
        receivable.data?.forEach(c => { if (c.due_date && dailyEvents[c.due_date]) dailyEvents[c.due_date].in += (c.amount_ars || 0) })
        payable.data?.forEach(c => { if (c.due_date && dailyEvents[c.due_date]) dailyEvents[c.due_date].out += (c.amount_ars || 0) })
        certs.data?.forEach(c => { if (c.deposit_date && dailyEvents[c.deposit_date]) dailyEvents[c.deposit_date].in += (c.net_deposit || 0) })
        
        return JSON.stringify({ 
          periodo: `próximos ${days} días`,
          saldo_bancos_actual: currentBalance,
          ingresos_esperados: { cheques: inflowCheques, certificaciones: inflowCerts },
          egresos_esperados: { cheques: outflowCheques, obligaciones: outflowObls, gastos_fijos_mensuales: monthlyFixed },
          flujo_neto_estimado: currentBalance + inflowCheques + inflowCerts - outflowCheques - outflowObls - monthlyFixed,
          eventos_diarios: dailyEvents,
          recomendacion: "Analiza el saldo_bancos_actual sumado a los eventos_diarios (in/out) para sugerir qué día habrá liquidez suficiente para emitir o depositar un cheque de cierto monto."
        })
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
      // ─── PARTE DIARIO ───
      case 'query_partes_diarios': {
        let q = sb.from('parte_diario').select('fecha, trabajo_realizado, clima, horas_trabajadas, estado, firmado_por, entregas, incidentes, obra_id, projects(name)')
        if (args.obra_name) {
          const { data: obra } = await sb.from('projects').select('id').ilike('name', `%${args.obra_name}%`).limit(1).single()
          if (obra) q = q.eq('obra_id', obra.id)
        }
        if (args.fecha) q = q.eq('fecha', args.fecha)
        if (args.estado) q = q.eq('estado', args.estado)
        const { data } = await q.order('fecha', { ascending: false }).limit(args.limit || 15)
        return JSON.stringify(data || [])
      }
      case 'create_parte_diario': {
        const { data: obra } = await sb.from('projects').select('id').ilike('name', `%${args.obra_name}%`).limit(1).single()
        if (!obra) return JSON.stringify({ error: `No se encontró obra "${args.obra_name}"` })
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        const { data, error } = await sb.from('parte_diario').insert({
          tenant_id: tenant?.id, obra_id: obra.id,
          fecha: args.fecha || today.toISOString().split('T')[0],
          trabajo_realizado: args.trabajo_realizado,
          clima: args.clima || 'despejado',
          horas_trabajadas: args.horas_trabajadas || 8,
          entregas: args.entregas || null,
          incidentes: args.incidentes || null,
          firmado_por: args.firmado_por || null,
          estado: 'borrador',
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, message: `Parte diario creado para ${args.obra_name} (${args.fecha || 'hoy'})`, id: data.id })
      }
      // ─── SEGURIDAD ───
      case 'query_safety_incidents': {
        let q = sb.from('seguridad_incidentes').select('fecha, tipo, gravedad, descripcion, persona_afectada, estado, dias_perdidos, causa_raiz, acciones_correctivas, projects(name)')
        if (args.estado) q = q.eq('estado', args.estado)
        if (args.tipo) q = q.eq('tipo', args.tipo)
        if (args.gravedad) q = q.eq('gravedad', args.gravedad)
        const { data } = await q.order('fecha', { ascending: false }).limit(20)
        if (!data?.length) return '[]'
        const summary = { total: data.length, abiertos: data.filter((i: any) => i.estado === 'abierto').length, dias_perdidos_total: data.reduce((s: number, i: any) => s + (i.dias_perdidos || 0), 0), incidentes: data }
        return JSON.stringify(summary)
      }
      case 'query_safety_observations': {
        let q = sb.from('seguridad_observaciones').select('fecha, observador, categoria, descripcion, severidad, probabilidad, riesgo_score, estado, accion_sugerida, projects(name)')
        if (args.min_riesgo) q = q.gte('riesgo_score', args.min_riesgo)
        if (args.estado) q = q.eq('estado', args.estado)
        const { data } = await q.order('riesgo_score', { ascending: false }).limit(20)
        return JSON.stringify(data || [])
      }
      // ─── INSPECCIONES ───
      case 'query_inspections': {
        let q = sb.from('inspecciones').select('fecha, tipo, inspector, ubicacion, resultado, observaciones, projects(name)')
        if (args.resultado) q = q.eq('resultado', args.resultado)
        if (args.tipo) q = q.eq('tipo', args.tipo)
        const { data } = await q.order('fecha', { ascending: false }).limit(20)
        if (!data?.length) return '[]'
        const summary = { total: data.length, aprobadas: data.filter((i: any) => i.resultado === 'aprobada').length, rechazadas: data.filter((i: any) => i.resultado === 'rechazada').length, inspecciones: data }
        return JSON.stringify(summary)
      }
      case 'query_punch_list': {
        let q = sb.from('punch_list').select('numero, titulo, descripcion, ubicacion, prioridad, asignado_a, estado, fecha_limite, projects(name)')
        if (args.estado) q = q.eq('estado', args.estado)
        if (args.prioridad) q = q.eq('prioridad', args.prioridad)
        const { data } = await q.order('created_at', { ascending: false }).limit(30)
        if (!data?.length) return '[]'
        const summary = { total: data.length, abiertos: data.filter((p: any) => p.estado === 'abierto' || p.estado === 'en_correccion').length, items: data }
        return JSON.stringify(summary)
      }
      // ─── RFI ───
      case 'query_rfi': {
        let q = sb.from('consultas_obra').select('numero, asunto, pregunta, consultado_por, asignado_a, estado, respuesta_oficial, impacto_costo, impacto_costo_monto, impacto_cronograma, impacto_cronograma_dias, projects(name)')
        if (args.estado) q = q.eq('estado', args.estado)
        if (args.con_impacto_costo) q = q.eq('impacto_costo', true)
        const { data } = await q.order('created_at', { ascending: false }).limit(20)
        if (!data?.length) return '[]'
        const costoTotal = data.filter((r: any) => r.impacto_costo).reduce((s: number, r: any) => s + (r.impacto_costo_monto || 0), 0)
        const diasTotal = data.filter((r: any) => r.impacto_cronograma).reduce((s: number, r: any) => s + (r.impacto_cronograma_dias || 0), 0)
        return JSON.stringify({ total: data.length, abiertas: data.filter((r: any) => r.estado === 'abierta').length, impacto_costo_acumulado: costoTotal, impacto_cronograma_acumulado_dias: diasTotal, consultas: data })
      }
      // ─── HEALTH SCORE ───
      case 'get_obra_health_score': {
        const { data: obra } = await sb.from('projects').select('id, name').ilike('name', `%${args.obra_name || ''}%`).limit(1).single()
        if (!obra) return JSON.stringify({ error: `No se encontró obra "${args.obra_name}"` })
        const [partes, incidentes, observaciones, inspecciones, punch, rfis] = await Promise.all([
          sb.from('parte_diario').select('id, estado').eq('obra_id', obra.id),
          sb.from('seguridad_incidentes').select('id, estado, gravedad').eq('obra_id', obra.id),
          sb.from('seguridad_observaciones').select('id, riesgo_score, estado').eq('obra_id', obra.id),
          sb.from('inspecciones').select('id, resultado').eq('obra_id', obra.id),
          sb.from('punch_list').select('id, estado, prioridad').eq('obra_id', obra.id),
          sb.from('consultas_obra').select('id, estado, impacto_costo_monto').eq('obra_id', obra.id),
        ])
        const pData = partes.data || []; const iData = incidentes.data || []; const oData = observaciones.data || []
        const inspData = inspecciones.data || []; const puData = punch.data || []; const rData = rfis.data || []
        let score = 100
        const incGraves = iData.filter((i: any) => (i.gravedad === 'grave' || i.gravedad === 'fatal') && i.estado === 'abierto')
        score -= incGraves.length * 15
        const obsAltas = oData.filter((o: any) => o.riesgo_score >= 10 && o.estado !== 'resuelta')
        score -= obsAltas.length * 5
        const inspRechazadas = inspData.filter((i: any) => i.resultado === 'rechazada')
        score -= inspRechazadas.length * 10
        const punchCriticos = puData.filter((p: any) => p.prioridad === 'critica' && (p.estado === 'abierto' || p.estado === 'en_correccion'))
        score -= punchCriticos.length * 8
        const rfiAbiertas = rData.filter((r: any) => r.estado === 'abierta')
        score -= rfiAbiertas.length * 3
        const partesAprobados = pData.filter((p: any) => p.estado === 'aprobado')
        if (pData.length > 0) score += Math.min(10, Math.round((partesAprobados.length / pData.length) * 10))
        score = Math.max(0, Math.min(100, score))
        const nivel = score >= 80 ? '🟢 Saludable' : score >= 50 ? '🟡 Con observaciones' : '🔴 Crítico'
        return JSON.stringify({
          obra: obra.name, health_score: score, nivel,
          resumen: { partes_diarios: pData.length, partes_aprobados: partesAprobados.length, incidentes_total: iData.length, incidentes_abiertos: iData.filter((i: any) => i.estado === 'abierto').length, incidentes_graves_abiertos: incGraves.length, observaciones_alto_riesgo: obsAltas.length, inspecciones_total: inspData.length, inspecciones_rechazadas: inspRechazadas.length, punch_items_total: puData.length, punch_criticos_abiertos: punchCriticos.length, rfi_total: rData.length, rfi_abiertas: rfiAbiertas.length },
          alertas: [
            ...(incGraves.length ? [`⚠️ ${incGraves.length} incidentes graves abiertos`] : []),
            ...(obsAltas.length ? [`⚠️ ${obsAltas.length} observaciones de alto riesgo sin resolver`] : []),
            ...(inspRechazadas.length ? [`❌ ${inspRechazadas.length} inspecciones rechazadas`] : []),
            ...(punchCriticos.length ? [`🔴 ${punchCriticos.length} items críticos en punch list`] : []),
            ...(rfiAbiertas.length > 3 ? [`📋 ${rfiAbiertas.length} RFIs abiertas pendientes de respuesta`] : []),
          ],
        })
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
    const { messages, activeModule } = await req.json()
    if (!messages?.length) {
      return new Response(JSON.stringify({ error: 'messages requerido' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // Build context-aware system prompt based on the user's current screen
    // Inject current Argentina date context
    const argDate = getArgentinaDate()
    const argTodayStr = getArgentinaDateStr()
    const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
    const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
    const { monday, sunday } = getArgentinaWeekRange()
    const dateContext = `\n\n## FECHA Y HORA ACTUAL\n📅 Hoy es ${dayNames[argDate.getDay()]} ${argDate.getDate()} de ${monthNames[argDate.getMonth()]} de ${argDate.getFullYear()} (${argTodayStr})\n📆 Esta semana: ${monday} a ${sunday}\nCuando pregunten por "esta semana", usá due_date_from=${monday} y due_date_to=${sunday}. Si no hay resultados en ese rango, respondé que no hay y mencioná el próximo.`
    const systemPrompt = buildSystemPrompt(activeModule) + dateContext

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
      body: JSON.stringify({ model: 'gpt-5.4-mini', instructions: systemPrompt, input, tools: responsesTools, temperature: 0.7 }),
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
        body: JSON.stringify({ model: 'gpt-5.4-mini', instructions: systemPrompt, input: followUp, tools: responsesTools, temperature: 0.7 }),
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

