import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const BASE_SYSTEM_PROMPT = `Sos "Rombo" 🤖, el copiloto IA inteligente y agente operativo de gestión integral de ECAR Constructora.
Hablás en español argentino (vos, che, dale). Sos ejecutivo, ultra eficiente, proactivo y resolutivo, exactamente como ChatGPT Plus empresarial pero conectado en tiempo real al ERP y base de datos de ECAR.

## PRINCIPIO FUNDAMENTAL — GESTIÓN TOTAL POR TEXTO Y VOZ
El usuario puede interactuar con vos escribiendo o enviándote notas de audio (los audios son transcriptos automáticamente con OpenAI Whisper).
Tu misión es permitir que el usuario GESTIONE TODO EL SISTEMA directamente desde esta conversación:
- NUNCA respondas diciendo "tenés que ir al módulo X para cargar eso", "hacelo desde la pestaña tal" o "no puedo hacer esa acción".
- SIEMPRE que el usuario te pida registrar, cargar, anotar, modificar, cambiar de estado o consultar algo:
  1. EJECUTÁ LA HERRAMIENTA CORRESPONDIENTE DE FORMA INMEDIATA.
  2. Guardá o actualizá la información en la base de datos de producción.
  3. Respondé confirmando con los datos exactos generados (número de carga, número de ODT, remito, importes, saldos, etc.).

## CAPACIDADES DE GESTIÓN OPERATIVA EN TODOS LOS MÓDULOS
Podés operar sobre todos los módulos del ERP:
1. ⛽ COMBUSTIBLE Y FLOTA:
   - Cargar combustible (create_fuel_load): vehículo, litros, estación o batán interno, monto, chofer, odómetro/horómetro. Si es Batán, descuenta stock automáticamente en fuel_batan_movements.
   - Movimientos de Batán (create_fuel_batan_movement): compras, recargas de cisterna, descargas.
   - Consultar consumos, rendimientos y última carga (query_fuel_loads, query_fleet_vehicles).
2. 🛒 COMPRAS Y PAÑOL:
   - Crear pedidos de compra (create_purchase_request): obra, urgencia, lista de materiales solicitados.
   - Movimientos de inventario (register_stock_movement): entradas y salidas de pañol para obras.
   - Consultar stock, Kardex y órdenes de compra (query_inventory, query_inventory_movements, query_purchase_orders).
3. 💰 FINANZAS Y TESORERÍA:
   - Cargar y eliminar cheques (create_cheque, delete_cheque).
   - Actualizar estado de cheques (update_cheque_status): depositado, cobrado, rebotado.
   - Registrar cobros y pagos de caja/banco (register_payment).
   - Registrar gastos operativos mensuales (register_gasto_monto).
   - Consultar liquidez, flujo de caja a 30 días y cuentas bancarias (calculate_cashflow, query_bank_accounts).
4. 👷 RRHH Y PERSONAL:
   - Registrar asistencia diaria (register_attendance): presente, ausente, tardanza, medio día.
   - Registrar ausencias y licencias (register_employee_absence): vacaciones, médico, suspensión, ART.
   - Registrar adelantos de sueldo (register_employee_advance).
   - Consultar plantilla, legajos y EPP (query_employees, query_employee_ppe).
5. 🏗️ GESTIÓN DE OBRAS (5 FASES):
   - Fase 1 (Planificación): WBS, tramos, nodos, cómputos congelados (query_obra_wbs, query_obra_tramos, query_obra_matriz_fisica).
   - Fase 2 (Programación): Emitir ODTs formales con meta y cuadrilla (create_obra_odt, query_obra_odts).
   - Fase 3 (Ejecución): Carga métrica en terreno, personal presente y paradas con causa raíz (register_obra_produccion, query_obra_partes_terreno).
   - Fase 4 (Control): Aprobar hitos binarios 0/100% con número de acta (update_obra_hito, query_obra_hitos, query_obra_certificados).
   - Fase 5 (Retroalimentación): Rendimientos y lecciones aprendidas (query_obra_lecciones).
   - Partes diarios generales de obra (create_parte_diario, query_partes_diarios).
6. 🦺 HIGIENE, SEGURIDAD Y CALIDAD:
   - Registrar incidentes y observaciones de seguridad (register_safety_incident, register_safety_observation).
   - Consultar punch list, RFI, inspecciones y health score de obra.
7. 🌐 ACCIÓN UNIVERSAL:
   - Podés ejecutar acciones directas en cualquier tabla si el usuario lo requiere (execute_db_action, query_database_table).

## FORMATO DE RESPUESTA
- Usá markdown claro, prolijo y estructurado.
- Destacá códigos importantes en negrita (ej: **CARGA-0116**, **ODT-0045**, **$ 350.000**).
- Incluí emojis sutiles para dar jerarquía visual y dinamismo.
- Si registraste una carga de combustible desde Batán, aclarale que el stock del Batán fue descontado automáticamente.
- Sé rápido, directo y con total confianza técnica.`

// Module-specific context instructions for the AI
const MODULE_CONTEXT: Record<string, string> = {
  bi: `## CONTEXTO ACTUAL: El usuario está en el Dashboard BI
- Mostrá resúmenes ejecutivos con KPIs clave: total de cheques, facturas, empleados activos, obligaciones pendientes.
- Ofrecé detectar anomalías, comparar períodos, o alertar sobre items urgentes.
- Sugerí navegación a módulos específicos si el usuario necesita detalle ("Podés ir a Finanzas para ver los cheques en detalle").`,
  
  purchases: `## CONTEXTO ACTUAL: El usuario está en Compras & Libro IVA
- Este módulo permite subir fotos/PDFs de facturas de compra. La IA extrae los datos con OCR automáticamente.
- El usuario puede ver el Libro IVA (compras y ventas), filtrar por fechas, y descargar el libro en Excel. Ahora el libro se descarga de forma separada por empresa (Razón Social: ECAR SAS o CARLOS ADOLFO REGALADO).
- También se calcula automáticamente la Posición IVA mensual (IVA Ventas - IVA Compras) por empresa de forma automática en la pantalla.
- Si el usuario pide consultar o descargar el Libro IVA de un mes (ej: agosto de 2026) o de una empresa (ej: Regalado), usá query_invoices o download_libro_iva. Mostrale el total de facturas, importe total e IVA acumulado, e incluí SIEMPRE en tu texto el tag que devuelve la herramienta (ej: [DOWNLOAD_LIBRO_IVA:YYYY-MM:entityId:Nombre]) para que la interfaz web le muestre el botón de descarga automática en Excel.
- Ayudalo a: revisar facturas pendientes de validación, calcular IVA crédito fiscal del mes, buscar facturas por proveedor.
- Datos clave: proveedor, CUIT, tipo/número factura, neto gravado, IVA 21%, total, estado (Revisar/Validado).
- Sugerí: "¿Querés que revise las facturas sin validar?" o "Puedo calcular tu posición de IVA este mes".`,
  
  finances: `## CONTEXTO ACTUAL: El usuario está en Finanzas & Tesorería
- Muestra la cartera de cheques (a cobrar y a pagar), gastos fijos mensuales y flujo de caja.
- El usuario puede cargar cheques manualmente o escaneando una foto (OCR).
- Tipos: physical (físico) y echeq (electrónico). Direcciones: payable (emitido) y receivable (recibido).
- REGLA CRÍTICA: Si el usuario menciona un "Comprobante de emisión de Echeq", significa que el cheque es "payable" (lo emitimos nosotros) y el beneficiario suele ser la Razón Social mencionada.
- Ayudalo a: ver cheques próximos a vencer, calcular flujo de caja, gestionar gastos fijos, cargar nuevos cheques.
- Sugerí: "¿Querés que te calcule el flujo de caja de los próximos 30 días?" o "Puedo mostrarte los cheques que vencen esta semana".`,
  
  obligations: `## CONTEXTO ACTUAL: El usuario está en Alertas & Obligaciones
- Gestiona vencimientos fiscales/contractuales mensuales (AFIP, ART, seguros, alquileres).
- Incluye el panel de Notificaciones WhatsApp: recordatorios automáticos, contactos, historial de envíos.
- Ayudalo a: crear obligaciones, marcarlas como pagadas, configurar recordatorios WhatsApp automáticos.
- Los recordatorios se ejecutan automáticamente cada 5 minutos desde la nube (pg_cron).
- Sugerí: "¿Querés que configure un recordatorio WhatsApp para cheques próximos a vencer?" o "Puedo marcar esta obligación como pagada".`,
  
  rrhh: `## CONTEXTO ACTUAL: El usuario está en RRHH & Legajos
- Gestiona la nómina de personal con datos completos para alta: nombre, CUIL, DNI, fecha nacimiento, sexo, estado civil, cantidad de hijos con edades, nivel de estudios.
- Talles de Indumentaria: Ahora se pueden registrar los talles de Camisa/Remera, Pantalón y Calzado de los operarios para la entrega de elementos de protección personal (EPP).
- Cada empleado puede tener: convenio/sindicato (default UOCRA), categoría UOCRA, obra asignada, modo liquidación (mensual/quincenal/jornalizado), retribución pactada.
- Registro de horas extras: si hace o no, y al 50% o 100%.
- Casilla de observaciones generales y registro de deuda al empleado (monto + detalle).
- Legajo digital con documentos (DNI, ART, recibos, contratos). Descarga con URLs firmadas.
- Asistencia con QR (clock-in/clock-out) con tracking de dispositivo (browser, OS, plataforma).
- Ausencias y licencias: vacaciones, enfermedad, suspensión, ART, medio día. Se pueden eliminar.
- Adelantos: monto, fecha, motivo. Se pueden eliminar. Se marca si fue descontado o no.
- Novedades al contador: resumen de ausencias, adelantos y horas para liquidación.
- Validación DNI↔CUIL: warning si los 8 dígitos centrales del CUIL no coinciden con el DNI.
- Ayudalo a: consultar empleados activos con sus datos completos, revisar asistencia, solicitar documentos faltantes, detectar anomalías de presentismo, consultar ausencias y adelantos.
- Sugerí: "¿Querés que revise quién faltó hoy?" o "Puedo mostrar los datos de alta de un empleado" o "¿Querés ver los adelantos pendientes de descuento?".`,
  
  inventory: `## CONTEXTO ACTUAL: El usuario está en Pañol & Inventario
- Gestiona materiales, herramientas y consumibles. Control de stock con mínimos y ubicación física.
- Descuento Automático de Stock: Al despachar un pedido desde Logística, se descuenta en tiempo real el stock del pañol.
- Kardex Completo de Movimientos (Auditoría): Registra entradas, salidas por despacho, devoluciones y ajustes con fecha, hora exacta, responsable pañolero (quién actualizó), obra y notas con referencia al Pedido (PED-XXXX).
- Ayudalo a: revisar stock bajo mínimo, consultar el kardex de movimientos con responsables y fecha/hora, ver herramientas asignadas.
- Sugerí: "¿Querés que revise qué materiales tienen stock crítico?" o "Puedo mostrarte el kardex de movimientos recientes con responsables".`,
  
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
  
  wbs: `## CONTEXTO ACTUAL: El usuario está en Gestión de Obra (Estándar de Ingeniería en 5 Fases)
- Este es el núcleo operativo de la obra que reemplazó al antiguo módulo. Opera bajo el estándar de 5 fases estrictas:
  1. 📐 Planificación: Presupuesto contractual, WBS jerárquico (Rubro ➔ Subrubro ➔ Ítem), Tramos espaciales (Nodos) y Matriz Física con cómputos congelados.
  2. 📋 Programación: Filtro inteligente por Nodo, bandeja "Para Programar" con saldo pendiente > 0, asignación de cuadrillas y emisión formal de ODTs. 🔒 Bloqueo: Prohibido crear tareas o ítems en esta vista.
  3. 🚜 Ejecución: Modo terreno/tablet para capataces. Cero porcentajes subjetivos: carga de producción métrica real (ml, un, m³), cuadrilla presente y paradas de obra con causa raíz obligatoria (rotura máquina, falta material en pañol, clima, etc.).
  4. 🚦 Control: Hitos binarios 0% o 100% (inspecciones, OSSE, laboratorio) que bloquean o liberan tramos, Semáforo Base 3/3 y emisión automática del Certificado de Obra contractual inmutable con descuentos de fondo de reparo y anticipo.
  5. 🔄 Retroalimentación: Comparación analítica de rendimientos reales vs cotizados y banco de lecciones aprendidas.
- Ayudalo a:
  * Explicarle paso a paso cómo operar cada fase según su rol (Ingeniero, Supervisor o Capataz).
  * Consultar datos del WBS, saldos para programar, ODTs emitidas, hitos pendientes y certificados con tus herramientas (query_obra_wbs, query_obra_tramos, query_obra_matriz_fisica, query_obra_odts, query_obra_hitos, query_obra_certificados, query_obra_lecciones).
  * Explicar por qué no se pueden crear tareas en programación ("el dato nace en planificación").
- Sugerí: "¿Querés que te explique el flujo de trabajo de las 5 fases paso a paso?" o "¿Querés consultar el saldo pendiente para programar en algún tramo de Roque?" o "¿Revisamos los hitos binarios pendientes de inspección?".`,

  fuel: `## CONTEXTO ACTUAL: El usuario está en Control de Combustible
- Gestiona cargas de combustible (nafta/diesel) para vehículos de la flota.
- Workflow 2 pasos desburocratizado: 1) Operario pide carga -> 2) Gerencia autoriza. Si no autoriza a tiempo, el operario puede cargar igual registrando litros reales y adjuntando foto del ticket en el mismo link, pero queda marcado como "Sin Autorizar" para auditoría.
- Notificaciones: globos rojos en el menú lateral ("Flota") alertan sobre vales pendientes.
- Ayudalo a: auditar cargas sin autorizar, verificar fotos de tickets, analizar gastos por vehículo, revisar litros consumidos.`,

  purchase_requests: `## CONTEXTO ACTUAL: El usuario está en Pedidos de Obra y Requerimientos (Gerencia de Logística)
- Circuito Tripartito de Trazabilidad: 1. Solicitado (Obra) ➔ 2. Enviado (Pañol Central) ➔ 3. Recibido (Obra).
- Descuento Automático e Integración con Pañol: Al declarar el despacho, se descuenta el stock en tiempo real y se genera el movimiento en el Kardex.
- Documentos PDF Oficiales ECAR: Solicitud de Pedido de Obra, Remito de Despacho Pañol y Acta de Recepción y Conformidad Tripartita.
- Tabla Comparativa de Saldos: Muestra en chaque pedido lo solicitado vs enviado vs recibido, con saldos faltantes derivados a Compras.
- Ayudalo a: gestionar la trazabilidad de pedidos, guiar la declaración de despacho con descuento de stock, descargar PDFs oficiales ECAR y analizar faltantes.`,
  
  field: `## CONTEXTO ACTUAL: El usuario está en Fase 3 — Ejecución en Terreno (Gestión de Obra)
- Diseñado para capataces y encargados de obra en el frente de trabajo (modo tablet/celular).
- CERO porcentajes subjetivos: El capataz carga producción métrica real (metros lineales ml, m³, unidades).
- Cuadrilla presente: Se verifica qué operarios trabajaron y qué maquinarias se usaron.
- Tiempos muertos y paradas de obra: Registro obligatorio de minutos parados y CAUSA RAÍZ (rotura de equipo, falta de material en pañol, interferencia de suelo, lluvia).
- Ayudalo a: entender cómo registrar el avance diario real, auditar tiempos muertos y verificar cumplimiento de las ODTs.`,
  
  safety: `## CONTEXTO ACTUAL: El usuario está en Seguridad, Incidentes & Informes Semanales (Entregables)
- Gestión integral de Higiene y Seguridad conforme Decreto 911/96 y Res. SRT 905/2015.
- Submódulo "Informes Semanales (Entregables)":
  * Permite compilar y redactar informes técnicos semanales listos para comitente (Valdivieso Group / OSSE).
  * Auto-completado inteligente: jala tareas y observaciones de la semana automáticamente.
  * Relevamiento técnico normativo: talud/entibado en zanjas >1.50m, retiro de material acopiado a >0.60m del borde, pasarelas peatonales con baranda doble y rodapié, cartelería de advertencia reglamentaria ("ZANJA ABIERTA", "HOMBRES TRABAJANDO", "MAQUINARIA PESADA"), extintor triclase ABC de 10 kg con marbete al día y botiquín de primeros auxilios en frente.
  * Grilla de Evidencia Fotográfica cuádruple: 4 fotos con epígrafe formal normativo para el comitente.
  * Botón directo de compra/pañol: si falta cartelería, extintor o botiquín, genera la solicitud de pedido inmediata en el módulo de Logística.
  * Exportación oficial en PDF con firmas profesionales (Lic. HyS Mat. 1422 y Jefe de Obra).
- KPIs clave: días sin accidente, incidentes abiertos, observaciones alto riesgo, días perdidos, informes semanales entregados.
- Ayudalo a: revisar desvíos en zanjas, verificar cumplimiento de EPP y cartelería, auditar o generar el informe semanal de HyS y solicitar materiales de seguridad a Pañol.`,

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
- TODO pedido requiere "Datos Mínimos" y si es "Urgente", requiere un motivo justificado para no naturalizar las urgencias.
- Las herramientas y materiales están vinculados al inventario de Logística.
- Ayudalo a: ver pedidos pendientes, consultar el estado de una orden de compra, revisar qué pedidos urgentes hay.
- Sugerí: "¿Querés que revise los pedidos que están pendientes de aprobación?"`,

  implementation: `## CONTEXTO ACTUAL: El usuario está en Implementación
- Panel de seguimiento del progreso de implementación del sistema ECAR.
- Muestra cada módulo con su estado: completado, en progreso, pendiente.
- Porcentaje general de avance del sistema.
- Ayudalo a: entender qué módulos ya están activos, cuáles están en desarrollo, y cuáles están pendientes.`,

  project_budget: `## CONTEXTO ACTUAL: El usuario está en Presupuestos de Obra
- Gestión de presupuestos por proyecto: rubros, sub-rubros, costos unitarios y totales.
- Comparación presupuesto original vs costo real.
- Integración con WBS para control de avance + costo.
- Ayudalo a: consultar presupuestos, comparar costos, identificar desvíos.`,

  guide: `## CONTEXTO ACTUAL: El usuario está en la Guía de Uso del Sistema
- Este módulo es una guía interactiva y detallada de cómo usar el ERP de ECAR, incluyendo todas las secciones.
- Destacá especialmente el uso del asistente por WhatsApp (número +54 9 2643 22-9503 o el canal configurado), explicando todo lo que se puede enviar por ahí (fotos de facturas/cheques, audios relatando partes de obra, novedades de empleados, etc.).
- Mencioná que existe un MODO TUTORIAL: al activarlo desde el header, aparece un panel lateral con ayuda contextual de cada módulo.
- Ofrecé explicar al usuario cómo usar cualquiera de las herramientas o módulos.
- Explicá que la IA puede interpretar texto natural en español argentino.
- Sugerí: "Puedo darte ejemplos de mensajes que le podés mandar al bot de WhatsApp" o "Preguntame sobre qué podés hacer en cualquiera de los módulos de ECAR" o "Probá activar el Modo Tutorial desde el header para obtener ayuda paso a paso".`,
  
  user_activity: `## CONTEXTO ACTUAL: El usuario está en Actividad de Usuarios
- Este módulo permite auditar quién se conectó, qué páginas visitó y qué acciones realizó.
- Solo es visible para administradores.
- Sugerí: "¿Querés saber cuáles son los módulos más usados?" o "Puedo ayudarte a revisar la actividad de un usuario en particular."`,

  scope_changes: `## CONTEXTO ACTUAL: El usuario está en Adicionales de Obra
- Gestión de cambios de alcance que impactan el presupuesto o el cronograma.
- Cada adicional tiene justificación, monto, días extra y estado de aprobación.
- Ayudalo a entender el impacto de los adicionales abiertos.
- Sugerí: "¿Querés que veamos los adicionales pendientes de aprobación?"`,

  quality: `## CONTEXTO ACTUAL: El usuario está en Calidad (Checklists)
- Se manejan los protocolos y checklists de calidad (hormigonado, zanjas, etc.).
- Permite verificar el estándar constructivo y reportar desvíos a través de NCs o punch lists.
- Sugerí: "¿Querés revisar los protocolos de calidad que tienen desvíos reportados?"`,

  worker_payments: `## CONTEXTO ACTUAL: El usuario está en Pagos a Trabajadores
- Centraliza los datos bancarios y montos de referencia para pago de quincenas al personal de obra.
- Sugerí: "¿Querés ver las métricas de gasto mensual en pagos a trabajadores?"`,

  payments: `## CONTEXTO ACTUAL: El usuario está en Control de Pagos Semanales
- Planilla para organizar los egresos por transferencias de la semana.
- Permite exportar a PDF e importar gastos operativos pendientes.
- Sugerí: "¿Querés que revise qué pagos quedan pendientes esta semana?"`,

  communications: `## CONTEXTO ACTUAL: El usuario está en Comunicaciones WhatsApp
- Historial de todas las conversaciones de Rombo (vos) con los usuarios por WhatsApp.
- El usuario solo puede leer, no puede responder desde acá.
- Sugerí: "¿Querés revisar si hubo consultas no resueltas hoy?"`,

  weekly_report: `## CONTEXTO ACTUAL: El usuario está en Reporte Semanal a GG
- Un reporte consolidado para Gerencia General con KPIs de toda la empresa.
- Destaca decisiones requeridas, avance de obras y alertas críticas.
- Sugerí: "¿Querés que te resuma las decisiones urgentes para Gerencia?"`,

  user_management: `## CONTEXTO ACTUAL: El usuario está en Gestión de Usuarios
- Administración de perfiles, roles y accesos al sistema.
- Sugerí: "¿Necesitás ayuda asignando permisos a un nuevo colaborador?"`,

  compras_intro: `## CONTEXTO ACTUAL: El usuario está en la Introducción a Compras
- Pantalla informativa sobre el circuito de abastecimiento.
- Sugerí: "Si querés operar, podés ir al submódulo de Órdenes de Compra o Pedidos."`,

  logistics_intro: `## CONTEXTO ACTUAL: El usuario está en la Introducción a Logística
- Pantalla informativa sobre la gestión de stock y flota.
- Sugerí: "Puedo ayudarte revisando el stock actual o el estado de la flota."`,

  obra_intro: `## CONTEXTO ACTUAL: El usuario está en la Introducción a Obra
- Muestra el marco general del nuevo estándar de ingeniería en 5 fases: Planificación, Programación, Ejecución, Control y Retroalimentación.
- Sugerí: "Ingresá a Gestión de Obra para ver las 5 fases o preguntame cómo es el paso a paso."`,

  finanzas_intro: `## CONTEXTO ACTUAL: El usuario está en la Introducción a Finanzas
- Pantalla informativa sobre tesorería, pagos y certificaciones.
- Sugerí: "Puedo calcularte el cashflow a 30 días si querés."`,

  rrhh_intro: `## CONTEXTO ACTUAL: El usuario está en la Introducción a RRHH
- Pantalla informativa sobre gestión de legajos y EPP.
- Sugerí: "¿Querés consultar la asistencia de hoy?"`,

  budget_landing: `## CONTEXTO ACTUAL: El usuario está en Gerencia de Presupuestos
- Muestra el flujo de presupuestación y matriz RACI.
- Sugerí: "Podés revisar el pipeline de oportunidades desde acá."`,
}

function buildSystemPrompt(activeModule?: string): string {
  const moduleContext = activeModule ? MODULE_CONTEXT[activeModule] : ''
  const globalAccessReminder = `\n\n## RECORDATORIO MANDATORIO DE ACCESO TOTAL:
Recordá: Aunque el usuario esté actualmente en la pantalla "${activeModule || 'Dashboard'}", tenés acceso TOTAL, DIRECTO y OMNIPRESENTE a toda la información de la empresa (combustible, flota, compras, cheques, órdenes de compra, personal, obras, etc.). NUNCA digas que no tenés acceso a un dato porque pertenece a otro módulo. Si te preguntan por combustible, partes diarios, compras o cualquier otro tema, usá tus herramientas (query_fuel_loads, query_cheques, query_database_table, etc.) y respondé con los datos reales.`
  
  if (moduleContext) {
    return `${BASE_SYSTEM_PROMPT}\n\n${moduleContext}${globalAccessReminder}`
  }
  return `${BASE_SYSTEM_PROMPT}${globalAccessReminder}`
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
      description: 'Cargar un nuevo cheque (emitido o recibido). RECUERDA: Los "Comprobantes de emisión de Echeq" siempre deben registrarse con direction="payable" y usar la razón social indicada como beneficiary_or_issuer.',
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
      description: 'Consultar facturas de compra y Libro IVA. Puede filtrar por mes (YYYY-MM), razón social / empresa (ECAR o Regalado), proveedor o estado.',
      parameters: { 
        type: 'object', 
        properties: { 
          month: { type: 'string', description: 'Mes en formato YYYY-MM (ej: 2026-08)' }, 
          entity_name: { type: 'string', description: 'Nombre o filtro de la empresa/razón social (ej: Regalado o ECAR)' },
          supplier_name: { type: 'string', description: 'Nombre o filtro del proveedor' }, 
          status: { type: 'string' } 
        } 
      }
    }
  },
  {
    type: 'function', function: {
      name: 'download_libro_iva',
      description: 'Generar la descarga del Libro IVA de compras en Excel para un mes y empresa específica (ej: agosto 2026 de Regalado). Devuelve los datos y la etiqueta de descarga para la interfaz.',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Mes en formato YYYY-MM (ej: 2026-08)' },
          entity_name: { type: 'string', description: 'Nombre de la empresa (ej: Regalado o ECAR)' }
        },
        required: ['month']
      }
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
  // ─── TOOLS NUEVOS: FLOTA & INVENTARIO ───
  {
    type: 'function', function: {
      name: 'query_fleet_vehicles',
      description: 'Consultar vehículos de la flota. Muestra datos técnicos, km actuales, mantenimiento programado, vencimientos de seguro y VTV.',
      parameters: { type: 'object', properties: { search: { type: 'string', description: 'Buscar por código, descripción o patente (opcional)' } } }
    }
  },
  {
    type: 'function', function: {
      name: 'query_inventory',
      description: 'Consultar inventario de materiales y herramientas. Muestra stock actual, unidad, categoría y si es herramienta.',
      parameters: { type: 'object', properties: { search: { type: 'string', description: 'Buscar por nombre (opcional)' }, category: { type: 'string', description: 'Filtrar por categoría (opcional)' }, low_stock: { type: 'boolean', description: 'Si true, solo muestra items con stock bajo mínimo' } } }
    }
  },
  // ─── TOOLS NUEVOS: RRHH AUSENCIAS & ADELANTOS ───
  {
    type: 'function', function: {
      name: 'query_employee_absences',
      description: 'Consultar ausencias/licencias de un empleado. Tipos: vacation, medical, suspension, art_leave, half_day.',
      parameters: { type: 'object', properties: { employee_name: { type: 'string', description: 'Nombre del empleado (parcial)' }, status: { type: 'string', description: 'active/closed' } }, required: ['employee_name'] }
    }
  },
  {
    type: 'function', function: {
      name: 'query_employee_advances',
      description: 'Consultar adelantos de un empleado. Muestra monto, fecha, motivo y si fue descontado.',
      parameters: { type: 'object', properties: { employee_name: { type: 'string', description: 'Nombre del empleado (parcial)' }, pending_only: { type: 'boolean', description: 'Si true, solo muestra adelantos no descontados' } }, required: ['employee_name'] }
    }
  },

  // ─── TOOLS NUEVOS: COMBUSTIBLE, PEDIDOS, PROVEEDORES, CERTIFICACIONES Y UNIVERSAL ───
  {
    type: 'function', function: {
      name: 'query_fuel_loads',
      description: 'Consultar cargas de combustible de vehículos y maquinaria. Permite ver la última carga registrada, litros, precio, importe en ARS, chofer, odómetro, estación/batán y cargas sin autorizar.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por código de vehículo, descripción, patente o chofer (opcional)' },
          vehicle_code: { type: 'string', description: 'Código del vehículo (ej: RP-001, BT-001, etc.)' },
          fuel_type: { type: 'string', description: 'Tipo de combustible (ej: Diesel EVOLUX, Infinia, Nafta Súper)' },
          load_source: { type: 'string', description: 'Origen: station (estación de servicio) o batan (batán interno)' },
          unauthorized_only: { type: 'boolean', description: 'Si es true, solo trae cargas no autorizadas' },
          date_from: { type: 'string', description: 'Fecha inicio YYYY-MM-DD' },
          date_to: { type: 'string', description: 'Fecha fin YYYY-MM-DD' },
          limit: { type: 'number', description: 'Límite de registros (default 15)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_fuel_batan',
      description: 'Consultar movimientos y saldo actual del batán móvil de combustible (cargas desde cisterna y descargas a vehículos en obra).',
      parameters: {
        type: 'object',
        properties: {
          movement_type: { type: 'string', description: 'Tipo de movimiento: load (ingreso de combustible) o discharge (descarga a vehículo)' },
          limit: { type: 'number', description: 'Cantidad de movimientos a traer (default 15)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_purchase_requests',
      description: 'Consultar pedidos de compra y requerimientos de obra (trazabilidad: solicitado en obra, despachado pañol, recibido obra, remitos y saldos faltantes).',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por solicitante, notas o proyecto' },
          status: { type: 'string', description: 'draft / requested / ordered (despachado) / received' },
          urgency: { type: 'string', description: 'normal / urgente' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_purchase_orders',
      description: 'Consultar órdenes de compra (OC). Muestra número de OC, proveedor, montos, estado (borrador, aprobada, etc.), fecha de entrega y detalle de ítems.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por número de OC (ej: OC-0001) o nombre del proveedor' },
          status: { type: 'string', description: 'borrador / pendiente / aprobada / rechazada / cumplida' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_suppliers',
      description: 'Consultar maestro de proveedores de ECAR (110+ proveedores registrados). Muestra razón social, nombre comercial, CUIT, rubro/categoría, datos de contacto y condiciones de pago.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por nombre, razón social o CUIT' },
          category: { type: 'string', description: 'Filtrar por rubro o categoría' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_certificates',
      description: 'Consultar certificados de obra e ICC. Muestra número de certificado, obra, monto bruto, redeterminaciones, retenciones (IIBB, cheque), neto depositado y estado.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra' },
          status: { type: 'string', description: 'pending / approved / deposited' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_bank_accounts',
      description: 'Consultar cuentas bancarias, saldos reales en bancos (Macro, Balanz, Santander, etc.) y efectivo disponible de la empresa.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function', function: {
      name: 'query_inventory_movements',
      description: 'Consultar el Kardex de movimientos de inventario/pañol (entradas, salidas por despacho, devoluciones, responsable pañolero, fecha y hora exacta, obra destino).',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por ítem, notas o persona que recibió' },
          movement_type: { type: 'string', description: 'entry (ingreso) / dispatch (despacho a obra) / return (devolución) / adjustment' },
          limit: { type: 'number', description: 'Límite (default 20)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_employee_ppe',
      description: 'Consultar entregas de elementos de protección personal (EPP) y talles de indumentaria (camisa, pantalón, calzado) de operarios.',
      parameters: {
        type: 'object',
        properties: {
          employee_name: { type: 'string', description: 'Nombre del empleado' },
          item_type: { type: 'string', description: 'Tipo de EPP o prenda' },
          limit: { type: 'number' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_scope_changes',
      description: 'Consultar adicionales de obra y cambios de alcance. Muestra justificación, impacto económico en costo ($), días de prórroga y estado de aprobación.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string' },
          status: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_weekly_payments',
      description: 'Consultar órdenes de pago semanales y liquidaciones. Muestra montos totales, estado de aprobación y detalles.',
      parameters: {
        type: 'object',
        properties: {
          status: { type: 'string', description: 'pending/approved/paid/rejected' },
          date_from: { type: 'string' },
          date_to: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_budgets',
      description: 'Consultar presupuestos de obra. Muestra monto total, versión, fecha base y obra asignada.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string' },
          status: { type: 'string', description: 'draft/approved/archived' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_whatsapp_conversations',
      description: 'Consultar registro de chats de WhatsApp. Permite saber qué se comunicó por el bot recientemente.',
      parameters: {
        type: 'object',
        properties: {
          phone_number: { type: 'string' },
          limit: { type: 'number', description: 'Número de mensajes a traer (default 10)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'generate_weekly_report',
      description: 'Generar un resumen analítico de la semana. Obtiene un pantallazo integral de los últimos 7 días: partes de obra, incidentes de seguridad reportados y estado de flota.',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function', function: {
      name: 'query_database_table',
      description: 'CONSULTA UNIVERSAL A LA BASE DE DATOS: Permite consultar de forma segura y directa cualquier tabla del ERP de ECAR (fuel_loads, fuel_vehicles, fuel_batan_movements, purchase_requests, purchase_orders, suppliers, project_certificates, bank_accounts, inventory_items, inventory_movements, cheques, purchase_invoices, obligations, employees, attendance_records, etc.) con filtros, orden y límite. Usá esta herramienta si ninguna otra herramienta específica responde con exactitud a lo que pide el usuario.',
      parameters: {
        type: 'object',
        properties: {
          table_name: { type: 'string', description: 'Nombre exacto de la tabla en Supabase (ej: fuel_loads, suppliers, etc.)' },
          select_columns: { type: 'string', description: 'Columnas a seleccionar, separadas por coma o * (default *)' },
          filter_column: { type: 'string', description: 'Nombre de la columna para filtrar (opcional)' },
          filter_operator: { type: 'string', description: 'Operador de filtro: eq, ilike, gt, gte, lt, lte, neq (default eq)' },
          filter_value: { type: 'string', description: 'Valor del filtro' },
          order_by: { type: 'string', description: 'Columna para ordenar (opcional)' },
          order_descending: { type: 'boolean', description: 'Ordenar descendente (default true)' },
          limit: { type: 'number', description: 'Cantidad máxima de filas (default 20, max 100)' }
        },
        required: ['table_name']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_roque_catalogo',
      description: 'Consultar el catálogo oficial de las 12 actividades estándar PEAD de Roque (AG-REP a AG-PRU). Devuelve código, descripción, unidad, rendimiento estándar (m/h o un/h), maquinaria requerida y dotación de cuadrilla.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por código (ej: AG-EXC) o descripción (opcional)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_roque_tareas',
      description: 'Consultar tareas planificadas y rendimientos diarios de obra Roque. Filtra por fecha (YYYY-MM-DD), cuadrilla (C-01, C-02, C-03), sector o actividad. Muestra cantidad planificada vs ejecutada, horas trabajadas, rendimiento real, desvíos y paradas registradas.',
      parameters: {
        type: 'object',
        properties: {
          fecha: { type: 'string', description: 'Fecha en formato YYYY-MM-DD (opcional)' },
          cuadrilla_codigo: { type: 'string', description: 'Código de cuadrilla C-01, C-02 o C-03 (opcional)' },
          sector_codigo: { type: 'string', description: 'Código de sector, ej: SEC001 (opcional)' },
          limit: { type: 'number', description: 'Cantidad máxima de tareas (default 20)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_safety_informes',
      description: 'Consultar informes semanales de Higiene y Seguridad entregables (conforme Decreto 911/96 y Res. SRT 905/15). Muestra semana, obra/proyecto, profesional a cargo, situaciones detectadas en zanjas/frentes, medidas correctivas y estado de cumplimiento.',
      parameters: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Cantidad de informes a consultar (default 10)' }
        }
      }
    }
  },
  // ─── NUEVO MÓDULO DE GESTIÓN DE OBRA (5 FASES) ───
  {
    type: 'function', function: {
      name: 'query_obra_wbs',
      description: 'Consultar el WBS contractual y jerárquico de la obra (Rubros, Subrubros e Ítems). Devuelve cantidades contractuales, unidades (ml, m3, un), precios unitarios en ARS, importes totales e incidencias porcentuales matemáticas cerradas.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          search_item: { type: 'string', description: 'Buscar por código o descripción de ítem (opcional)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_tramos',
      description: 'Consultar la red espacial topológica de tramos de la obra (Fase 1 Planificación). Devuelve código de tramo, nodos inicio y fin, longitud en metros, diámetro en mm, tipo de red, calle/pasaje y cantidad de servicios domiciliarios e hidrantes.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          nodo: { type: 'string', description: 'Filtrar por nodo de inicio o fin (ej: N1, N5)' },
          diametro_mm: { type: 'number', description: 'Filtrar por diámetro en mm (ej: 75, 90, 110)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_matriz_fisica',
      description: 'Consultar la matriz física tramo-ítem y la bandeja "Para Programar" (Fase 1 y 2). Devuelve para cada tramo e ítem la cantidad prevista, ejecutada, saldo pendiente para programar (saldo = cantidad_prevista - cantidad_ejecutada), prioridad y estado.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          tramo_codigo: { type: 'string', description: 'Código del tramo (ej: T-01, N1 - N2)' },
          item_codigo: { type: 'string', description: 'Código del ítem (ej: 1.1, 2.1)' },
          para_programar_only: { type: 'boolean', description: 'Si es true, solo trae ítems con saldo pendiente > 0 para programar' },
          limit: { type: 'number', description: 'Cantidad máxima de filas (default 25)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_odts',
      description: 'Consultar las Órdenes de Trabajo (ODT) formales emitidas en la Fase 2 (Programación). Muestra número de ODT, tramo, ítem, meta de producción métrica, cuadrilla asignada, responsable técnico, fechas planificadas y estado.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          numero_odt: { type: 'string', description: 'Número de ODT (ej: ODT-0001)' },
          estado: { type: 'string', description: 'borrador / emitida / en_ejecucion / cumplida / anulada' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_partes_terreno',
      description: 'Consultar los partes diarios de producción métrica cargados en terreno por capataces (Fase 3 Ejecución). Muestra fecha, ODT, metros reales ejecutados, dotación de personal presente, horas trabajadas y paradas de obra con su causa raíz obligatoria.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          fecha: { type: 'string', description: 'Fecha YYYY-MM-DD' },
          solo_con_paradas: { type: 'boolean', description: 'Si es true, solo muestra jornadas con paradas o tiempos muertos' },
          limit: { type: 'number', description: 'Límite de registros (default 20)' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_hitos',
      description: 'Consultar los hitos binarios de control (0% o 100%) y actas de inspección (Fase 4 Control). Muestra código de hito, nombre, ente regulador (ej: OSSE), estado binario (0% pendiente o 100% aprobado), acta de inspección y si bloquea el tramo.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          estado_binario: { type: 'number', description: '0 para pendientes, 100 para aprobados' }
        }
      }
    }
  },
  {
    type: 'function', function: {
      name: 'query_obra_certificados',
      description: 'Consultar los Certificados de Obra contractuales e inmutables (Fase 4 Control). Muestra número de certificado, período, base contractual, acumulado anterior, presente, acumulado total, saldo monetario, retención de fondo de reparo y neto a cobrar en ARS.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          numero_certificado: { type: 'number', description: 'Número de certificado' }
        }
      }
    }
  },
  // ─── TOOLS DE GESTIÓN OPERATIVA Y MUTACIÓN (CHAT-OPS) ───
  {
    type: 'function', function: {
      name: 'create_fuel_load',
      description: 'Registrar una carga de combustible para un vehículo o maquinaria (en estación de servicio o desde el batán interno). Si es batán, descuenta automáticamente el stock del batán. Puede actualizar odómetro u horómetro.',
      parameters: {
        type: 'object',
        properties: {
          vehicle_code: { type: 'string', description: 'Código o patente del vehículo/maquinaria (ej: RP-001, BT-001, C-002, AG839PV, etc.)' },
          liters: { type: 'number', description: 'Cantidad exacta de litros cargados' },
          fuel_type: { type: 'string', description: 'Tipo de combustible (Diesel EVOLUX, Infinia Diesel, Nafta Súper, etc.)' },
          supplier: { type: 'string', description: 'Estación de servicio o proveedor (YPF, Shell, Batán Interno, etc.)' },
          load_source: { type: 'string', enum: ['station', 'batan'], description: 'Origen: "batan" si fue desde el batán interno en obra, "station" si fue en estación de servicio' },
          total_amount: { type: 'number', description: 'Importe total facturado en ARS (si es de batán interno es 0)' },
          price_per_liter: { type: 'number', description: 'Precio unitario por litro en ARS' },
          driver_name: { type: 'string', description: 'Nombre del chofer u operador' },
          project_name: { type: 'string', description: 'Nombre de la obra o centro de costos asignado' },
          odometer_km: { type: 'number', description: 'Kilometraje actual del vehículo' },
          hourmeter: { type: 'number', description: 'Horómetro actual de la máquina' },
          remito_number: { type: 'string', description: 'Número de remito' },
          voucher_number: { type: 'string', description: 'Número de vale' },
          load_date: { type: 'string', description: 'Fecha de la carga YYYY-MM-DD (default hoy)' },
          observations: { type: 'string', description: 'Notas u observaciones adicionales' }
        },
        required: ['vehicle_code', 'liters']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'create_fuel_batan_movement',
      description: 'Registrar un movimiento manual en el batán móvil (ingreso de cisterna, compra, descarga a equipo o ajuste de calibración).',
      parameters: {
        type: 'object',
        properties: {
          movement_type: { type: 'string', enum: ['purchase', 'discharge', 'adjustment'], description: 'purchase = ingreso/llenado, discharge = descarga, adjustment = calibración' },
          liters: { type: 'number', description: 'Litros del movimiento' },
          fuel_type: { type: 'string', description: 'Tipo de combustible (Diesel EVOLUX, etc.)' },
          supplier: { type: 'string', description: 'Proveedor o estación donde se cargó el batán' },
          remito_number: { type: 'string', description: 'Número de remito' },
          total_amount: { type: 'number', description: 'Monto total en ARS si fue compra' },
          movement_date: { type: 'string', description: 'Fecha YYYY-MM-DD' },
          observations: { type: 'string', description: 'Observaciones' }
        },
        required: ['movement_type', 'liters']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_payment',
      description: 'Registrar un movimiento de caja o pago/cobro bancario. Úsalo cuando digan "Pagué X a Y" o "Cobramos X de Y".',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'], description: 'income = ingreso/cobro, expense = egreso/pago' },
          amount: { type: 'number', description: 'Monto en ARS' },
          counterpart: { type: 'string', description: 'A quién se le pagó o de quién se cobró' },
          category: { type: 'string', description: 'Categoría: Sueldos/Honorarios, Seguros, Servicios, Impuestos ARCA, Gremios, Combustibles, Cheques/Echeqs, Pagos a terceros, Servicios contratados, Viandas, Varios, Cobro certificado, Otro ingreso' },
          description: { type: 'string', description: 'Detalle adicional' },
          payment_method: { type: 'string', description: 'transfer, cash, cheque, echeq' }
        },
        required: ['type', 'amount', 'counterpart', 'category']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'update_cheque_status',
      description: 'Cambiar el estado de un cheque (marcarlo como depositado, cobrado, rebotado o pendiente).',
      parameters: {
        type: 'object',
        properties: {
          cheque_number: { type: 'string', description: 'Número del cheque' },
          new_status: { type: 'string', enum: ['pending', 'deposited', 'cashed', 'bounced'], description: 'Nuevo estado' },
          notes: { type: 'string', description: 'Notas opcionales' }
        },
        required: ['cheque_number', 'new_status']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'create_purchase_request',
      description: 'Crear un pedido de compra o solicitud de materiales para una obra.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra' },
          urgency: { type: 'string', enum: ['low', 'normal', 'urgent'], description: 'Urgencia' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' }
              },
              required: ['description', 'quantity']
            }
          },
          requested_by: { type: 'string', description: 'Nombre del solicitante' }
        },
        required: ['project_name', 'items']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_stock_movement',
      description: 'Registrar una entrada o salida de material/herramienta del pañol.',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string', description: 'Nombre del material o herramienta' },
          movement_type: { type: 'string', enum: ['in', 'out'], description: 'in = ingreso, out = salida' },
          quantity: { type: 'number', description: 'Cantidad' },
          project_name: { type: 'string', description: 'Obra de destino (si es salida)' },
          notes: { type: 'string', description: 'Notas' }
        },
        required: ['item_name', 'movement_type', 'quantity']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_gasto_monto',
      description: 'Registrar o actualizar el monto mensual de un gasto operativo (personal, seguros, servicios, impuestos, etc.). Se puede buscar por nombre del concepto o por ID.',
      parameters: {
        type: 'object',
        properties: {
          search_name: { type: 'string', description: 'Nombre del concepto (ej: "sueldos", "liderar", "osse", "gas", etc.)' },
          item_id: { type: 'string', description: 'ID del rubro de gasto (uuid si se conoce)' },
          amount: { type: 'number', description: 'Monto del gasto en pesos ARS' },
          periodo: { type: 'string', description: 'Período YYYY-MM (default mes actual)' },
          pagado: { type: 'boolean', description: 'Si ya está pagado' },
          metodo_pago: { type: 'string', description: 'Forma de pago' },
          notas: { type: 'string', description: 'Comentarios' }
        },
        required: ['amount']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_attendance',
      description: 'Registrar o corregir la asistencia de un empleado (presente, ausente, tardanza, medio día).',
      parameters: {
        type: 'object',
        properties: {
          employee_name: { type: 'string', description: 'Nombre o parte del nombre del empleado' },
          date: { type: 'string', description: 'Fecha YYYY-MM-DD (default hoy)' },
          status: { type: 'string', enum: ['present', 'absent', 'late', 'half_day'], description: 'Estado' },
          worked_hours: { type: 'number', description: 'Horas trabajadas (default 8 si presente, 0 si ausente)' },
          notes: { type: 'string', description: 'Notas u observaciones' }
        },
        required: ['employee_name', 'status']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_employee_absence',
      description: 'Registrar una ausencia, licencia médica, vacaciones, suspensión o ART de un colaborador.',
      parameters: {
        type: 'object',
        properties: {
          employee_name: { type: 'string', description: 'Nombre del empleado' },
          absence_type: { type: 'string', enum: ['vacation', 'medical', 'suspension', 'art_leave', 'half_day', 'unjustified'], description: 'Tipo de ausencia' },
          start_date: { type: 'string', description: 'Fecha de inicio YYYY-MM-DD' },
          end_date: { type: 'string', description: 'Fecha de fin YYYY-MM-DD (opcional)' },
          reason: { type: 'string', description: 'Motivo o detalle del certificado/novedad' }
        },
        required: ['employee_name', 'absence_type', 'start_date']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_employee_advance',
      description: 'Registrar un adelanto de sueldo otorgado a un empleado.',
      parameters: {
        type: 'object',
        properties: {
          employee_name: { type: 'string', description: 'Nombre del empleado' },
          amount_ars: { type: 'number', description: 'Monto del adelanto en pesos ARS' },
          advance_date: { type: 'string', description: 'Fecha YYYY-MM-DD (default hoy)' },
          reason: { type: 'string', description: 'Motivo del adelanto' }
        },
        required: ['employee_name', 'amount_ars']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'create_obra_odt',
      description: 'Emitir una Orden de Trabajo (ODT) en Fase 2 Programación para un tramo o ítem presupuestado.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          tramo_codigo: { type: 'string', description: 'Código o nodos del tramo (ej: N1-N2, T-01)' },
          item_codigo: { type: 'string', description: 'Código o descripción del ítem de obra (ej: AG-EXC, Zanjeo)' },
          cuadrilla_nombre: { type: 'string', description: 'Nombre de la cuadrilla (ej: Cuadrilla Gomez, C-01)' },
          responsable_nombre: { type: 'string', description: 'Responsable técnico o capataz' },
          meta_cantidad: { type: 'number', description: 'Cantidad métrica a ejecutar planificada' },
          fecha: { type: 'string', description: 'Fecha de ejecución YYYY-MM-DD' },
          instrucciones_calidad: { type: 'string', description: 'Instrucciones o recaudos de seguridad' }
        },
        required: ['project_name', 'cuadrilla_nombre', 'meta_cantidad']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_obra_produccion',
      description: 'Registrar avance métrico real en terreno (Fase 3 Ejecución), personal presente y paradas con causa raíz obligatoria.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          odt_numero: { type: 'string', description: 'Número de ODT asociada (ej: ODT-0001) si se conoce' },
          tramo_codigo: { type: 'string', description: 'Tramo ejecutado (ej: N1-N2)' },
          item_codigo: { type: 'string', description: 'Ítem ejecutado (ej: Zanjeo)' },
          cantidad_real: { type: 'number', description: 'Cantidad real ejecutada en metros o unidades' },
          fecha: { type: 'string', description: 'Fecha YYYY-MM-DD (default hoy)' },
          horas_trabajadas: { type: 'number', description: 'Horas trabajadas de la jornada' },
          personal_real_count: { type: 'number', description: 'Cantidad de operarios presentes' },
          personal_nombres: { type: 'string', description: 'Nombres del personal presente' },
          equipo_usado: { type: 'string', description: 'Maquinaria utilizada' },
          minutos_parada: { type: 'number', description: 'Minutos de parada o tiempo muerto (si hubo)' },
          motivo_parada: { type: 'string', description: 'Causa raíz obligatoria de la parada (rotura máquina, lluvia, falta material, interferencia)' },
          novedades_interferencias: { type: 'string', description: 'Novedades de suelo o interferencias' }
        },
        required: ['project_name', 'cantidad_real']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'update_obra_hito',
      description: 'Aprobar o actualizar un hito binario (0% o 100%) y acta de inspección regulatoria (Fase 4 Control).',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          codigo_hito: { type: 'string', description: 'Código o nombre del hito (ej: HI-01, HI-02, Prueba Hidráulica)' },
          estado_binario: { type: 'number', enum: [0, 100], description: '100 = aprobado, 0 = pendiente' },
          acta_numero: { type: 'string', description: 'Número de acta de inspección (ej: ACTA-4589)' },
          inspector_nombre: { type: 'string', description: 'Nombre del inspector u organismo (ej: OSSE)' },
          fecha_inspeccion: { type: 'string', description: 'Fecha de la inspección YYYY-MM-DD' },
          observaciones: { type: 'string', description: 'Observaciones de la inspección' }
        },
        required: ['project_name', 'codigo_hito', 'estado_binario']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_safety_incident',
      description: 'Registrar un incidente, accidente laboral o cuasi-accidente en obra.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra' },
          tipo: { type: 'string', enum: ['accidente', 'incidente', 'cuasi_accidente', 'enfermedad_laboral'], description: 'Tipo' },
          gravedad: { type: 'string', enum: ['leve', 'moderada', 'grave', 'fatal'], description: 'Gravedad' },
          descripcion: { type: 'string', description: 'Descripción de lo sucedido' },
          persona_afectada: { type: 'string', description: 'Nombre del trabajador afectado' },
          causa_raiz: { type: 'string', description: 'Causa raíz determinada' },
          acciones_correctivas: { type: 'string', description: 'Medidas correctivas adoptadas' }
        },
        required: ['project_name', 'tipo', 'descripcion']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'register_safety_observation',
      description: 'Registrar una observación preventiva de seguridad o desvío detectado en frente de obra.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra' },
          observador: { type: 'string', description: 'Quién reporta la observación' },
          categoria: { type: 'string', description: 'epp, excavaciones, senializacion, maquinaria, orden_limpieza, etc.' },
          descripcion: { type: 'string', description: 'Descripción del desvío observado' },
          severidad: { type: 'number', description: 'Nivel de severidad 1 a 5' },
          probabilidad: { type: 'number', description: 'Nivel de probabilidad 1 a 5' },
          accion_sugerida: { type: 'string', description: 'Medida o acción correctiva inmediata' }
        },
        required: ['project_name', 'descripcion']
      }
    }
  },
  {
    type: 'function', function: {
      name: 'execute_db_action',
      description: 'Acción universal de modificación de base de datos para tablas autorizadas cuando el usuario solicite explícitamente insertar, actualizar o eliminar un registro específico.',
      parameters: {
        type: 'object',
        properties: {
          table_name: { type: 'string', description: 'Nombre de la tabla' },
          action_type: { type: 'string', enum: ['insert', 'update', 'delete'], description: 'Tipo de operación' },
          data: { type: 'object', description: 'Datos a insertar o actualizar' },
          filter_column: { type: 'string', description: 'Columna de condición WHERE (para update o delete)' },
          filter_value: { type: 'string', description: 'Valor de condición WHERE (para update o delete)' }
        },
        required: ['table_name', 'action_type']
      }
    }
  }
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
        let q = sb.from('employees').select('full_name, cuil, dni, employment_status, hire_date, birth_date, gender, marital_status, children_info, education_level, union_name, observations, debt_to_employee, debt_notes, does_overtime, overtime_rate, category_id, current_project_id, phone, address, emergency_contact, bank_name, bank_alias_cbu, obra_social, art_provider, modo_liquidacion, retribucion_pactada, trial_start_date').eq('employment_status', 'active')
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
        let q = sb.from('purchase_invoices').select(`
          id, invoice_number, point_of_sale, issue_date, total_ars, net_amount_ars, 
          iva_21_ars, iva_105_ars, iva_27_ars, perceptions_iibb_ars, status, invoice_type,
          legal_entity_id, legal_entity:legal_entities(id, name, cuit),
          supplier:suppliers(name, cuit), ocr_raw_data
        `)
        if (args.month) {
          const m = String(args.month).trim()
          q = q.gte('issue_date', `${m}-01`).lte('issue_date', `${m}-31`)
        }
        if (args.status) q = q.eq('status', args.status)
        const { data, error } = await q.order('issue_date', { ascending: false }).limit(200)
        if (error) {
          console.error('Error query_invoices:', error)
          return JSON.stringify({ error: error.message })
        }
        if (!data?.length) return JSON.stringify({ count: 0, message: `No se encontraron facturas para el período ${args.month || 'indicado'}.` })

        let filtered = data
        if (args.entity_name) {
          const entSearch = args.entity_name.toLowerCase().trim()
          filtered = filtered.filter((i: any) => {
            const entName = (i.legal_entity?.name || '').toLowerCase()
            if (entSearch.includes('regalado') && entName.includes('regalado')) return true
            if (entSearch.includes('ecar') && entName.includes('ecar')) return true
            const words = entSearch.split(/\s+/).filter((w: string) => w.length > 2)
            return words.some((w: string) => entName.includes(w))
          })
        }
        if (args.supplier_name) {
          const supSearch = args.supplier_name.toLowerCase().trim()
          filtered = filtered.filter((i: any) => {
            const supName = (i.supplier?.name || i.ocr_raw_data?.proveedor_cliente || '').toLowerCase()
            return supName.includes(supSearch)
          })
        }

        const total = filtered.reduce((s: number, i: any) => s + (Number(i.total_ars) || 0), 0)
        const totalIva = filtered.reduce((s: number, i: any) => s + (Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)), 0)
        const totalNeto = filtered.reduce((s: number, i: any) => s + (Number(i.net_amount_ars) || 0), 0)

        const matchedEntity = filtered.find((i: any) => i.legal_entity)?.legal_entity || null
        const mStr = args.month || (filtered[0]?.issue_date ? filtered[0].issue_date.slice(0, 7) : '2026-08')
        const tag = `[DOWNLOAD_LIBRO_IVA:${mStr}:${matchedEntity?.id || 'all'}:${matchedEntity?.name || 'General'}]`

        return JSON.stringify({
          periodo: mStr,
          empresa: matchedEntity?.name || args.entity_name || 'Todas',
          total_facturas: filtered.length,
          total_facturado_ars: total,
          total_iva_credito_fiscal_ars: totalIva,
          total_neto_gravado_ars: totalNeto,
          download_tag: tag,
          detalle_primeras_10: filtered.slice(0, 10).map((i: any) => ({
            fecha: i.issue_date,
            comprobante: `${i.invoice_type || 'FC'} ${i.point_of_sale || ''}-${i.invoice_number || ''}`,
            proveedor: i.supplier?.name || i.ocr_raw_data?.proveedor_cliente || 'Proveedor',
            total: i.total_ars,
            empresa: i.legal_entity?.name || 'Sin entidad'
          }))
        })
      }
      case 'download_libro_iva': {
        const m = String(args.month || '2026-08').trim()
        let q = sb.from('purchase_invoices').select(`
          id, invoice_number, point_of_sale, issue_date, total_ars, net_amount_ars, 
          iva_21_ars, iva_105_ars, iva_27_ars, perceptions_iibb_ars, status, invoice_type,
          legal_entity_id, legal_entity:legal_entities(id, name, cuit),
          supplier:suppliers(name, cuit), ocr_raw_data
        `).gte('issue_date', `${m}-01`).lte('issue_date', `${m}-31`)

        const { data, error } = await q.order('issue_date', { ascending: false })
        if (error) return JSON.stringify({ error: error.message })
        if (!data?.length) return JSON.stringify({ error: `No hay facturas registradas en ${m}` })

        let filtered = data
        if (args.entity_name) {
          const entSearch = args.entity_name.toLowerCase().trim()
          filtered = filtered.filter((i: any) => {
            const entName = (i.legal_entity?.name || '').toLowerCase()
            if (entSearch.includes('regalado') && entName.includes('regalado')) return true
            if (entSearch.includes('ecar') && entName.includes('ecar')) return true
            const words = entSearch.split(/\s+/).filter((w: string) => w.length > 2)
            return words.some((w: string) => entName.includes(w))
          })
        }

        const matchedEntity = filtered.find((i: any) => i.legal_entity)?.legal_entity || null
        const total = filtered.reduce((s: number, i: any) => s + (Number(i.total_ars) || 0), 0)
        const totalIva = filtered.reduce((s: number, i: any) => s + (Number(i.iva_21_ars || 0) + Number(i.iva_105_ars || 0) + Number(i.iva_27_ars || 0)), 0)

        const tag = `[DOWNLOAD_LIBRO_IVA:${m}:${matchedEntity?.id || 'all'}:${matchedEntity?.name || 'General'}]`

        return JSON.stringify({
          success: true,
          periodo: m,
          empresa: matchedEntity?.name || args.entity_name || 'General',
          total_facturas: filtered.length,
          total_facturado_ars: total,
          total_iva_ars: totalIva,
          download_tag: tag,
          instruccion: `Informale al usuario que encontraste ${filtered.length} facturas por un total de $${total.toLocaleString('es-AR')} con IVA de $${totalIva.toLocaleString('es-AR')}, y poné obligatoriamente al final de tu respuesta la etiqueta ${tag} para que aparezca el botón de descarga.`
        })
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
      // ─── FLOTA ───
      case 'query_fleet_vehicles': {
        let q = sb.from('fuel_vehicles').select('code, description, type, license_plate, brand, model, year, fuel_type, tank_capacity, area, driver, current_km, next_maintenance_date, next_maintenance_km, maintenance_notes, last_maintenance_date, insurance_expiry, vtv_expiry')
        if (args.search) {
          q = q.or(`code.ilike.%${args.search}%,description.ilike.%${args.search}%,license_plate.ilike.%${args.search}%`)
        }
        const { data } = await q.order('code')
        if (!data?.length) return JSON.stringify({ vehicles: [], count: 0, message: 'No se encontraron vehículos' })
        
        const todayDate = new Date(todayStr)
        const weekAhead = new Date(todayDate.getTime() + 7 * 86400000)
        const overdue = data.filter(v => v.next_maintenance_date && new Date(v.next_maintenance_date) <= todayDate)
        const upcoming = data.filter(v => v.next_maintenance_date && new Date(v.next_maintenance_date) > todayDate && new Date(v.next_maintenance_date) <= weekAhead)
        
        return JSON.stringify({
          vehicles: data,
          count: data.length,
          mantenimiento: {
            vencidos: overdue.length,
            proximos_7_dias: upcoming.length,
            vehiculos_vencidos: overdue.map(v => ({ code: v.code, description: v.description, fecha_service: v.next_maintenance_date })),
            vehiculos_proximos: upcoming.map(v => ({ code: v.code, description: v.description, fecha_service: v.next_maintenance_date })),
          }
        })
      }
      // ─── INVENTARIO ───
      case 'query_inventory': {
        let q = sb.from('inventory_items').select('name, category, unit, quantity, min_stock, is_tool, location')
        if (args.search) q = q.ilike('name', `%${args.search}%`)
        if (args.category) q = q.eq('category', args.category)
        const { data } = await q.order('name')
        if (!data?.length) return JSON.stringify({ items: [], count: 0 })
        
        let items = data
        if (args.low_stock) {
          items = data.filter(i => i.quantity !== null && i.min_stock !== null && i.quantity <= i.min_stock)
        }
        
        return JSON.stringify({
          items,
          count: items.length,
          herramientas: items.filter(i => i.is_tool).length,
          materiales: items.filter(i => !i.is_tool).length,
          bajo_stock: data.filter(i => i.quantity !== null && i.min_stock !== null && i.quantity <= i.min_stock).length,
        })
      }
      // ─── RRHH: AUSENCIAS & ADELANTOS ───
      case 'query_employee_absences': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró empleado "${args.employee_name}"` })
        let q = sb.from('employee_absences').select('type, start_date, end_date, days, reason, status, art_case_number').eq('employee_id', emp.id)
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('start_date', { ascending: false }).limit(30)
        const typeLabels: Record<string, string> = { vacation: 'Vacaciones', medical: 'Enfermedad', suspension: 'Suspensión', art_leave: 'ART', half_day: 'Medio Día' }
        const mapped = (data || []).map(a => ({ ...a, tipo_label: typeLabels[a.type] || a.type }))
        const totalDias = mapped.reduce((s, a) => s + (a.days || 0), 0)
        return JSON.stringify({ empleado: emp.full_name, ausencias: mapped, total: mapped.length, total_dias: totalDias })
      }
      case 'query_employee_advances': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró empleado "${args.employee_name}"` })
        let q = sb.from('employee_advances').select('amount_ars, advance_date, reason, deducted').eq('employee_id', emp.id)
        if (args.pending_only) q = q.eq('deducted', false)
        const { data } = await q.order('advance_date', { ascending: false }).limit(30)
        const totalPendiente = (data || []).filter(a => !a.deducted).reduce((s, a) => s + (a.amount_ars || 0), 0)
        return JSON.stringify({ empleado: emp.full_name, adelantos: data || [], total: (data || []).length, total_pendiente_ars: totalPendiente })
      }

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
        if (args.phone_number) q = q.ilike('phone_number', `%${args.phone_number}%`)
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

      // ─── COMBUSTIBLE ───
      case 'query_fuel_loads': {
        let q = sb.from('fuel_loads').select(`
          id, load_number, load_date, month, year, day_of_week,
          vehicle_code, vehicle_description, plate, vehicle_type,
          driver_name, project_name, supplier, station_name, fuel_type,
          liters, price_per_liter, total_amount, odometer_km,
          load_source, validation_status, workflow_status, unauthorized_load,
          observations, ticket_photo_url, created_at
        `)
        if (args.search) {
          q = q.or(`vehicle_code.ilike.%${args.search}%,vehicle_description.ilike.%${args.search}%,driver_name.ilike.%${args.search}%,plate.ilike.%${args.search}%`)
        }
        if (args.vehicle_code) q = q.ilike('vehicle_code', `%${args.vehicle_code}%`)
        if (args.fuel_type) q = q.ilike('fuel_type', `%${args.fuel_type}%`)
        if (args.load_source) q = q.eq('load_source', args.load_source)
        if (args.unauthorized_only) q = q.eq('unauthorized_load', true)
        if (args.date_from) q = q.gte('load_date', args.date_from)
        if (args.date_to) q = q.lte('load_date', args.date_to)
        
        const { data, error } = await q.order('load_date', { ascending: false }).order('created_at', { ascending: false }).limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        if (!data?.length) return JSON.stringify({ loads: [], count: 0, message: 'No se encontraron cargas de combustible con esos criterios' })
        
        const totalLiters = data.reduce((s: number, l: any) => s + (Number(l.liters) || 0), 0)
        const totalAmount = data.reduce((s: number, l: any) => s + (Number(l.total_amount) || 0), 0)
        const ultimaCarga = data[0]

        return JSON.stringify({
          ultima_carga: {
            numero: ultimaCarga.load_number,
            fecha: ultimaCarga.load_date,
            dia: ultimaCarga.day_of_week,
            vehiculo: `${ultimaCarga.vehicle_code || ''} - ${ultimaCarga.vehicle_description || ''}`.trim(),
            patente: ultimaCarga.plate || 'Sin patente',
            chofer: ultimaCarga.driver_name || 'No especificado',
            tipo_combustible: ultimaCarga.fuel_type || 'Diesel',
            litros: ultimaCarga.liters,
            precio_por_litro: ultimaCarga.price_per_liter,
            total_ars: ultimaCarga.total_amount,
            origen_estacion: ultimaCarga.station_name || ultimaCarga.supplier || (ultimaCarga.load_source === 'batan' ? 'Batán Interno' : 'Estación'),
            odometro_km: ultimaCarga.odometer_km,
            proyecto: ultimaCarga.project_name || 'General',
            sin_autorizar: ultimaCarga.unauthorized_load,
            estado: ultimaCarga.workflow_status || ultimaCarga.validation_status,
            tiene_ticket: !!ultimaCarga.ticket_photo_url,
          },
          total_cargas_mostradas: data.length,
          total_litros_cargados: totalLiters,
          total_monto_ars: totalAmount,
          cargas_recientes: data.slice(0, 10).map((l: any) => ({
            numero: l.load_number,
            fecha: l.load_date,
            vehiculo: `${l.vehicle_code || ''} ${l.vehicle_description || ''}`.trim(),
            chofer: l.driver_name,
            litros: l.liters,
            total_ars: l.total_amount,
            estacion: l.station_name || l.supplier || l.load_source,
            sin_autorizar: l.unauthorized_load
          }))
        })
      }
      case 'query_fuel_batan': {
        let q = sb.from('fuel_batan_movements').select('*')
        if (args.movement_type) q = q.eq('movement_type', args.movement_type)
        const { data, error } = await q.order('movement_date', { ascending: false }).limit(args.limit || 15)
        if (error) return JSON.stringify({ error: error.message })
        const ultimo = data?.[0]
        return JSON.stringify({
          ultimo_movimiento: ultimo,
          saldo_actual_litros: ultimo?.balance_after || null,
          movimientos: data || []
        })
      }

      // ─── LOGÍSTICA & PEDIDOS ───
      case 'query_purchase_requests': {
        let q = sb.from('purchase_requests').select('id, project_id, requested_by, urgency, status, notes, created_at, dispatched_at, received_at, dispatched_by, received_by, projects(name), items:purchase_request_items(*)')
        if (args.status) q = q.eq('status', args.status)
        if (args.urgency) q = q.eq('urgency', args.urgency)
        if (args.search) q = q.or(`requested_by.ilike.%${args.search}%,notes.ilike.%${args.search}%`)
        const { data, error } = await q.order('created_at', { ascending: false }).limit(args.limit || 15)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ requests: data || [], count: (data || []).length })
      }
      case 'query_purchase_orders': {
        let q = sb.from('purchase_orders').select('id, po_number, supplier_name, order_type, items, total_amount, payment_condition, delivery_date, delivery_location, status, approval_status, notes, urgency, urgency_reason, created_at, projects(name)')
        if (args.status) q = q.eq('status', args.status)
        if (args.search) q = q.or(`po_number.ilike.%${args.search}%,supplier_name.ilike.%${args.search}%`)
        const { data, error } = await q.order('created_at', { ascending: false }).limit(args.limit || 15)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ purchase_orders: data || [], count: (data || []).length })
      }
      case 'query_suppliers': {
        let q = sb.from('suppliers').select('id, name, commercial_name, cuit, tax_condition, category, phone, email, bank_name, bank_cbu, default_payment_condition, has_checking_account')
        if (args.search) {
          q = q.or(`name.ilike.%${args.search}%,commercial_name.ilike.%${args.search}%,cuit.ilike.%${args.search}%`)
        }
        if (args.category) q = q.eq('category', args.category)
        const { data, error } = await q.order('name').limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ suppliers: data || [], count: (data || []).length })
      }
      case 'query_certificates': {
        let q = sb.from('project_certificates').select('id, certificate_number, period_description, gross_amount, redetermination, total_certified, retention_iibb, retention_imp_cheque, other_retentions, net_deposit, deposit_date, status, created_at, projects(name)')
        if (args.status) q = q.eq('status', args.status)
        const { data, error } = await q.order('certificate_number', { ascending: false }).limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        const totalNeto = (data || []).reduce((s: number, c: any) => s + (Number(c.net_deposit) || 0), 0)
        return JSON.stringify({ certificates: data || [], count: (data || []).length, total_net_deposit_ars: totalNeto })
      }
      case 'query_bank_accounts': {
        const { data, error } = await sb.from('bank_accounts').select('*').order('bank_name')
        if (error) return JSON.stringify({ error: error.message })
        const total = (data || []).reduce((s: number, b: any) => s + (Number(b.current_balance) || 0), 0)
        return JSON.stringify({ accounts: data || [], total_disponibilidad_ars: total })
      }
      case 'query_inventory_movements': {
        let q = sb.from('inventory_movements').select('id, movement_type, quantity, unit_cost, notes, created_by, created_at, delivered_to_text, inventory_items(name, unit, category), projects(name)')
        if (args.movement_type) q = q.eq('movement_type', args.movement_type)
        if (args.search) q = q.or(`notes.ilike.%${args.search}%,delivered_to_text.ilike.%${args.search}%`)
        const { data, error } = await q.order('created_at', { ascending: false }).limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ movements: data || [], count: (data || []).length })
      }
      case 'query_employee_ppe': {
        let q = sb.from('employee_ppe_deliveries').select('id, item_type, size, quantity, delivery_date, notes, employees(full_name)')
        if (args.item_type) q = q.ilike('item_type', `%${args.item_type}%`)
        const { data, error } = await q.order('delivery_date', { ascending: false }).limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ deliveries: data || [], count: (data || []).length })
      }
      case 'query_scope_changes': {
        const { data, error } = await sb.from('scope_changes').select('*, projects(name)').order('created_at', { ascending: false }).limit(15)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ scope_changes: data || [], count: (data || []).length })
      }

      // ─── CONSULTA UNIVERSAL A LA BASE DE DATOS ───
      case 'query_database_table': {
        const table = String(args.table_name || '').trim()
        if (!table) return JSON.stringify({ error: 'table_name requerido' })
        if (!/^[a-zA-Z0-9_]+$/.test(table)) {
          return JSON.stringify({ error: 'Nombre de tabla inválido' })
        }
        let q = sb.from(table).select(args.select_columns || '*')
        if (args.filter_column && args.filter_value !== undefined) {
          const op = args.filter_operator || 'eq'
          if (op === 'ilike') q = q.ilike(args.filter_column, `%${args.filter_value}%`)
          else if (op === 'gt') q = q.gt(args.filter_column, args.filter_value)
          else if (op === 'gte') q = q.gte(args.filter_column, args.filter_value)
          else if (op === 'lt') q = q.lt(args.filter_column, args.filter_value)
          else if (op === 'lte') q = q.lte(args.filter_column, args.filter_value)
          else if (op === 'neq') q = q.neq(args.filter_column, args.filter_value)
          else q = q.eq(args.filter_column, args.filter_value)
        }
        if (args.order_by) {
          q = q.order(args.order_by, { ascending: args.order_descending === false })
        }
        const limit = Math.min(Math.max(Number(args.limit) || 20, 1), 100)
        q = q.limit(limit)
        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ table, count: (data || []).length, rows: data || [] })
      }

      // ─── CONTROL DE RENDIMIENTOS ROQUE & SEGURIDAD ENTREGABLES ───
      case 'query_roque_catalogo': {
        let q = sb.from('obra_actividades_catalogo').select('*').order('codigo')
        if (args.search) {
          q = q.or(`codigo.ilike.%${args.search}%,descripcion.ilike.%${args.search}%`)
        }
        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ actividades: data || [], total: (data || []).length })
      }

      case 'query_roque_tareas': {
        let q = sb.from('obra_tareas_planificadas').select(`
          id, fecha, cuadrilla_codigo, sector_codigo, actividad_codigo,
          descripcion, unidad, cantidad_planificada, cantidad_ejecutada,
          rendimiento_estandar_h, horas_asignadas, horas_reales,
          rendimiento_real_h, estado, minutos_parada, motivo_parada, observaciones
        `)
        if (args.fecha) q = q.eq('fecha', args.fecha)
        if (args.cuadrilla_codigo) q = q.eq('cuadrilla_codigo', args.cuadrilla_codigo)
        if (args.sector_codigo) q = q.ilike('sector_codigo', `%${args.sector_codigo}%`)
        const { data, error } = await q.order('fecha', { ascending: false }).limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ tareas: data || [], total: (data || []).length })
      }

      case 'query_safety_informes': {
        const { data, error } = await sb.from('seguridad_informes_semanales')
          .select('id, semana_numero, anio, fecha_desde, fecha_hasta, estado, profesional_nombre, profesional_matricula, situaciones_detectadas, medidas_correctivas, pendientes_seguimiento, fotos_evidencia, cumplimiento_porcentaje, created_at')
          .order('fecha_desde', { ascending: false })
          .limit(args.limit || 10)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ informes_semanales: data || [], total: (data || []).length })
      }

      // ─── NUEVO MÓDULO DE GESTIÓN DE OBRA (5 FASES) ───
      case 'query_obra_wbs': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id, name').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        if (!projId) {
          const { data: anyProj } = await sb.from('projects').select('id, name').limit(1).single()
          projId = anyProj?.id
        }

        let q = sb.from('obra_rubros').select(`
          id, codigo, nombre, incidencia_pct, monto_total_ars,
          subrubros:obra_subrubros(
            id, codigo, nombre, incidencia_rubro_pct, incidencia_obra_pct, monto_total_ars,
            items:obra_items(
              id, codigo_item, descripcion, unidad, cantidad_contractual,
              precio_unitario_ars, importe_contractual_ars, incidencia_obra_pct
            )
          )
        `).eq('project_id', projId).order('orden')

        const { data: rubros, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        
        let allItems: any[] = []
        let totalContractual = 0
        ;(rubros || []).forEach((r: any) => {
          totalContractual += Number(r.monto_total_ars) || 0
          ;(r.subrubros || []).forEach((sr: any) => {
            ;(sr.items || []).forEach((it: any) => {
              allItems.push({
                rubro: `${r.codigo} - ${r.nombre}`,
                subrubro: `${sr.codigo} - ${sr.nombre}`,
                codigo: it.codigo_item,
                descripcion: it.descripcion,
                unidad: it.unidad,
                cantidad: it.cantidad_contractual,
                precio_unitario_ars: it.precio_unitario_ars,
                importe_ars: it.importe_contractual_ars,
                incidencia_obra_pct: it.incidencia_obra_pct
              })
            })
          })
        })

        if (args.search_item) {
          const s = args.search_item.toLowerCase()
          allItems = allItems.filter((i: any) => i.codigo.toLowerCase().includes(s) || i.descripcion.toLowerCase().includes(s))
        }

        return JSON.stringify({
          obra_id: projId,
          total_contractual_ars: totalContractual,
          rubros_count: (rubros || []).length,
          items_count: allItems.length,
          rubros_resumen: (rubros || []).map((r: any) => ({
            codigo: r.codigo,
            nombre: r.nombre,
            incidencia_pct: r.incidencia_pct,
            monto_ars: r.monto_total_ars,
            subrubros_count: (r.subrubros || []).length
          })),
          items_muestra: allItems.slice(0, 15)
        })
      }

      case 'query_obra_tramos': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_tramos').select('id, codigo, nodo_inicio, nodo_fin, longitud_m, diametro_mm, tipo_red, calle_pasaje, servicios_count, hidrantes_count, ancho_zanja_m, profundidad_media_m').eq('project_id', projId).order('orden')
        if (args.nodo) {
          q = q.or(`nodo_inicio.ilike.%${args.nodo}%,nodo_fin.ilike.%${args.nodo}%`)
        }
        if (args.diametro_mm) {
          q = q.eq('diametro_mm', args.diametro_mm)
        }

        const { data: tramos, error } = await q
        if (error) return JSON.stringify({ error: error.message })

        const totalMetros = (tramos || []).reduce((acc: number, t: any) => acc + (Number(t.longitud_m) || 0), 0)
        const totalServicios = (tramos || []).reduce((acc: number, t: any) => acc + (Number(t.servicios_count) || 0), 0)

        return JSON.stringify({
          tramos_totales: (tramos || []).length,
          longitud_total_m: Math.round(totalMetros * 100) / 100,
          total_servicios_domiciliarios: totalServicios,
          tramos: (tramos || []).slice(0, 20).map((t: any) => ({
            codigo: t.codigo,
            tramo: `${t.nodo_inicio} - ${t.nodo_fin}`,
            longitud_m: t.longitud_m,
            diametro_mm: t.diametro_mm,
            calle: t.calle_pasaje || 'Sin asignar',
            servicios: t.servicios_count,
            hidrantes: t.hidrantes_count
          }))
        })
      }

      case 'query_obra_matriz_fisica': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_tramo_items').select(`
          id, cantidad_prevista, cantidad_ejecutada, saldo, progreso_pct, estado, prioridad,
          tramo:obra_tramos!inner(id, codigo, nodo_inicio, nodo_fin, longitud_m, diametro_mm),
          item:obra_items!inner(id, codigo_item, descripcion, unidad, precio_unitario_ars)
        `).eq('project_id', projId)

        if (args.tramo_codigo) {
          q = q.ilike('tramo.codigo', `%${args.tramo_codigo}%`)
        }
        if (args.item_codigo) {
          q = q.ilike('item.codigo_item', `%${args.item_codigo}%`)
        }
        if (args.para_programar_only) {
          q = q.gt('saldo', 0)
        }

        const { data, error } = await q.limit(args.limit || 25)
        if (error) return JSON.stringify({ error: error.message })

        return JSON.stringify({
          total_items_consultados: (data || []).length,
          items: (data || []).map((d: any) => ({
            id: d.id,
            tramo: `${d.tramo?.nodo_inicio} - ${d.tramo?.nodo_fin} (${d.tramo?.codigo})`,
            item_codigo: d.item?.codigo_item,
            descripcion: d.item?.descripcion,
            unidad: d.item?.unidad,
            cantidad_prevista: d.cantidad_prevista,
            cantidad_ejecutada: d.cantidad_ejecutada,
            saldo_para_programar: d.saldo,
            progreso_pct: d.progreso_pct,
            estado: d.estado,
            prioridad: d.prioridad
          }))
        })
      }

      case 'query_obra_odts': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_ordenes_trabajo').select(`
          id, numero_odt, fecha, meta_cantidad, unidad, cuadrilla_nombre, responsable_nombre,
          inicio_plan, fin_plan, estado, instrucciones_calidad,
          tramo:obra_tramos(codigo, nodo_inicio, nodo_fin),
          item:obra_items(codigo_item, descripcion)
        `).eq('project_id', projId).order('created_at', { ascending: false })

        if (args.numero_odt) q = q.ilike('numero_odt', `%${args.numero_odt}%`)
        if (args.estado) q = q.eq('estado', args.estado)

        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ odts_totales: (data || []).length, ordenes_trabajo: data || [] })
      }

      case 'query_obra_partes_terreno': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_parte_diario_items').select(`
          id, fecha, cantidad_real, unidad, cumplimiento_pct, horas_trabajadas,
          personal_real_count, personal_nombres, equipo_usado, minutos_parada, motivo_parada, novedades_interferencias, estado,
          odt:obra_ordenes_trabajo(numero_odt),
          tramo_item:obra_tramo_items(tramo:obra_tramos(codigo, nodo_inicio, nodo_fin), item:obra_items(codigo_item, descripcion))
        `).eq('project_id', projId).order('fecha', { ascending: false })

        if (args.fecha) q = q.eq('fecha', args.fecha)
        if (args.solo_con_paradas) q = q.gt('minutos_parada', 0)

        const { data, error } = await q.limit(args.limit || 20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ partes_terreno_count: (data || []).length, partes: data || [] })
      }

      case 'query_obra_hitos': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_hitos').select(`
          id, codigo_hito, nombre, descripcion, tipo, ente_regulador, estado_binario,
          fecha_inspeccion, acta_numero, inspector_nombre, observaciones,
          tramo:obra_tramos(codigo, nodo_inicio, nodo_fin),
          bloquea_item:obra_items(codigo_item, descripcion)
        `).eq('project_id', projId).order('codigo_hito')

        if (args.estado_binario !== undefined) q = q.eq('estado_binario', args.estado_binario)

        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })

        const aprobados = (data || []).filter((h: any) => h.estado_binario === 100)
        const pendientes = (data || []).filter((h: any) => h.estado_binario === 0)

        return JSON.stringify({
          total_hitos: (data || []).length,
          aprobados_100_pct: aprobados.length,
          pendientes_0_pct: pendientes.length,
          hitos: data || []
        })
      }

      case 'query_obra_certificados': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_certificados').select(`
          id, numero_certificado, periodo_desde, periodo_hasta, fecha_emision,
          base_contractual_ars, anterior_sin_iva, presente_sin_iva, acumulado_sin_iva, saldo_sin_iva,
          avance_acumulado_pct, iva_presente, total_con_iva, fondo_reparo_retencion,
          amortizacion_anticipo, neto_a_cobrar, estado, observaciones,
          lineas:obra_certificado_lineas(codigo_item, descripcion, unidad, cantidad_contractual, precio_unitario_ars, importe_contractual_ars, cantidad_acumulada, importe_acumulado, avance_acumulado_pct)
        `).eq('project_id', projId).order('numero_certificado', { ascending: false })

        if (args.numero_certificado) q = q.eq('numero_certificado', args.numero_certificado)

        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ certificados_totales: (data || []).length, certificados: data || [] })
      }

      case 'query_obra_lecciones': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let q = sb.from('obra_lecciones_aprendidas').select(`
          id, categoria, titulo, descripcion_problema, causa_raiz, accion_adoptada,
          rendimiento_cotizado, rendimiento_real_obtenido, impacto_costo_ars, recomendacion_futura, autor, created_at,
          item:obra_items(codigo_item, descripcion)
        `).eq('project_id', projId).order('created_at', { ascending: false })

        if (args.categoria) q = q.eq('categoria', args.categoria)

        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ lecciones_count: (data || []).length, lecciones: data || [] })
      }

      // ─── HANDLERS DE GESTIÓN OPERATIVA Y MUTACIÓN (CHAT-OPS) ───
      case 'create_fuel_load': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        
        let vehicle: any = null
        if (args.vehicle_code) {
          const { data: vList } = await sb.from('fuel_vehicles').select('*')
            .or(`code.ilike.%${args.vehicle_code}%,plate.ilike.%${args.vehicle_code}%,description.ilike.%${args.vehicle_code}%`)
            .limit(1)
          if (vList && vList.length > 0) vehicle = vList[0]
        }

        const { count } = await sb.from('fuel_loads').select('*', { count: 'exact', head: true })
        const nextNum = (count || 0) + 1
        const loadNumber = `CARGA-${String(nextNum).padStart(4, '0')}`

        const isBatan = args.load_source === 'batan' || 
          String(args.supplier || '').toLowerCase().includes('batán') || 
          String(args.supplier || '').toLowerCase().includes('batan')

        const loadDate = args.load_date || todayStr
        const [y, m, d] = loadDate.split('-').map(Number)
        const dateObj = new Date(y, m - 1, d)
        const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

        const liters = Number(args.liters) || 0
        const totalAmount = isBatan ? 0 : (Number(args.total_amount) || (args.price_per_liter ? Number(args.price_per_liter) * liters : 0))
        const pricePerLiter = isBatan ? 0 : (Number(args.price_per_liter) || (liters ? totalAmount / liters : 0))
        const supplierName = isBatan ? 'Batán Interno' : (args.supplier || 'YPF')

        const newLoad = {
          tenant_id: tenant?.id,
          load_number: loadNumber,
          load_date: loadDate,
          month: monthNames[dateObj.getMonth()],
          year: dateObj.getFullYear(),
          day_of_week: dayNames[dateObj.getDay()],
          vehicle_id: vehicle?.id || null,
          vehicle_code: vehicle?.code || args.vehicle_code,
          vehicle_description: vehicle?.description || 'Vehículo/Maquinaria',
          plate: vehicle?.plate || '',
          vehicle_type: vehicle?.vehicle_type || 'Maquinaria',
          driver_name: args.driver_name || vehicle?.default_driver || 'Operador',
          project_name: args.project_name || 'Movimientos Internos',
          supplier: supplierName,
          station_name: supplierName,
          fuel_type: args.fuel_type || vehicle?.preferred_fuel || 'Diesel Premium / V-Power',
          liters: liters,
          price_per_liter: pricePerLiter,
          total_amount: totalAmount,
          odometer_km: args.odometer_km ? Number(args.odometer_km) : null,
          hourmeter: args.hourmeter ? Number(args.hourmeter) : null,
          voucher_number: args.voucher_number || null,
          remito_number: args.remito_number || null,
          observations: args.observations || `Carga registrada por Rombo IA (${isBatan ? 'Batán Interno' : 'Estación'})`,
          validation_status: 'ok',
          load_source: isBatan ? 'batan' : 'station',
          created_by: 'rombo-ia'
        }

        const { data: insertedLoad, error: loadErr } = await sb.from('fuel_loads').insert(newLoad).select().single()
        if (loadErr) return JSON.stringify({ error: loadErr.message })

        let batanMovement = null
        if (isBatan) {
          const { data: bMov, error: bErr } = await sb.from('fuel_batan_movements').insert({
            tenant_id: tenant?.id,
            movement_number: `DESCARGA-${String(Date.now()).slice(-6)}`,
            movement_date: loadDate,
            movement_type: 'discharge',
            fuel_type: newLoad.fuel_type,
            liters_discharged: liters,
            movement_status: 'completed',
            reference_load: loadNumber,
            observations: `Consumo asociado a la carga: ${loadNumber} (${newLoad.vehicle_code}) registrado por Rombo IA`
          }).select().single()
          batanMovement = bMov
        }

        if (vehicle?.id && (newLoad.odometer_km || newLoad.hourmeter)) {
          const vUpdates: any = {}
          if (newLoad.odometer_km) vUpdates.current_km = newLoad.odometer_km
          if (newLoad.hourmeter) vUpdates.current_hours = newLoad.hourmeter
          await sb.from('fuel_vehicles').update(vUpdates).eq('id', vehicle.id)
        }

        return JSON.stringify({
          success: true,
          mensaje: `Carga ${loadNumber} registrada exitosamente.`,
          load_number: loadNumber,
          vehiculo: `${newLoad.vehicle_code} (${newLoad.vehicle_description})`,
          litros: `${liters} L`,
          combustible: newLoad.fuel_type,
          origen: isBatan ? 'Batán Interno (stock descontado automáticamente)' : supplierName,
          monto_total_ars: totalAmount,
          chofer: newLoad.driver_name,
          fecha: loadDate,
          movimiento_batan: batanMovement?.movement_number || null
        })
      }

      case 'create_fuel_batan_movement': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        const movDate = args.movement_date || todayStr
        const prefix = args.movement_type === 'purchase' ? 'AUTO' : 'DESCARGA'
        const movNumber = `${prefix}-${String(Date.now()).slice(-6)}`
        const liters = Number(args.liters) || 0

        const newMov = {
          tenant_id: tenant?.id,
          movement_number: movNumber,
          movement_date: movDate,
          movement_type: args.movement_type,
          fuel_type: args.fuel_type || 'Diesel Premium / V-Power',
          liters_loaded: args.movement_type === 'purchase' ? liters : null,
          liters_discharged: args.movement_type === 'discharge' ? liters : null,
          total_amount: args.total_amount ? Number(args.total_amount) : null,
          remito_number: args.remito_number || null,
          supplier: args.supplier || 'YPF',
          movement_status: 'completed',
          observations: args.observations || `Registrado por Rombo IA`
        }

        const { data, error } = await sb.from('fuel_batan_movements').insert(newMov).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Movimiento de Batán ${movNumber} registrado exitosamente.`,
          movimiento: data
        })
      }

      case 'register_payment': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        const { data, error } = await sb.from('cash_movements').insert({
          tenant_id: tenant?.id,
          movement_date: todayStr,
          type: args.type,
          category: args.category,
          amount: Number(args.amount),
          counterpart: args.counterpart,
          description: args.description || `Pago/Cobro a ${args.counterpart} vía Rombo IA`,
          payment_method: args.payment_method || 'transfer',
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Movimiento de caja registrado: ${args.type === 'income' ? 'Ingreso' : 'Egreso'} de $${Number(args.amount).toLocaleString('es-AR')} a ${args.counterpart}`,
          id: data.id
        })
      }

      case 'update_cheque_status': {
        const { data: chq, error: findErr } = await sb.from('cheques').select('*').eq('cheque_number', args.cheque_number).limit(1).single()
        if (findErr || !chq) return JSON.stringify({ error: `No se encontró el cheque ${args.cheque_number}` })
        const { error } = await sb.from('cheques').update({ status: args.new_status }).eq('id', chq.id)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Cheque N° ${chq.cheque_number} (${chq.bank_name} - $${Number(chq.amount_ars).toLocaleString('es-AR')}) actualizado a "${args.new_status}"`
        })
      }

      case 'create_purchase_request': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        let projectId = null
        if (args.project_name) {
          const { data: proj } = await sb.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
          projectId = proj?.id
        }
        const { data: req, error: reqErr } = await sb.from('purchase_requests').insert({
          tenant_id: tenant?.id,
          project_id: projectId,
          requested_by: args.requested_by || 'Rombo IA',
          urgency: args.urgency || 'normal',
          status: 'pending'
        }).select().single()
        if (reqErr) return JSON.stringify({ error: reqErr.message })

        if (args.items?.length) {
          await sb.from('purchase_request_items').insert(
            args.items.map((i: any) => ({
              request_id: req.id,
              description: i.description,
              quantity: i.quantity || 1,
              unit: i.unit || 'unidad'
            }))
          )
        }
        return JSON.stringify({
          success: true,
          mensaje: `Pedido de compra creado para ${args.project_name || 'Obra'} (${args.items?.length || 0} ítems).`,
          request_id: req.id
        })
      }

      case 'register_stock_movement': {
        const { data: item } = await sb.from('inventory_items').select('id, name, current_stock, unit').ilike('name', `%${args.item_name}%`).limit(1).single()
        if (!item) return JSON.stringify({ error: `No se encontró "${args.item_name}" en pañol` })
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        let projectId = null
        if (args.project_name) {
          const { data: proj } = await sb.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
          projectId = proj?.id
        }
        const qty = Number(args.quantity) || 1
        await sb.from('inventory_movements').insert({
          tenant_id: tenant?.id,
          item_id: item.id,
          movement_type: args.movement_type,
          quantity: qty,
          project_id: projectId,
          notes: args.notes || 'Registrado por Rombo IA',
          created_by: 'rombo-ia'
        })
        const newStock = args.movement_type === 'in' ? item.current_stock + qty : item.current_stock - qty
        await sb.from('inventory_items').update({ current_stock: newStock }).eq('id', item.id)
        return JSON.stringify({
          success: true,
          mensaje: `${args.movement_type === 'in' ? 'Ingreso' : 'Despacho/Salida'} de ${qty} ${item.unit} de ${item.name}. Stock anterior: ${item.current_stock}, Nuevo stock: ${newStock}`,
          nuevo_stock: newStock
        })
      }

      case 'register_gasto_monto': {
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        let itemId = args.item_id
        if (!itemId && args.search_name) {
          const { data: found } = await sb.from('gastos_items').select('id, descripcion').ilike('descripcion', `%${args.search_name}%`).limit(1).single()
          itemId = found?.id
        }
        if (!itemId) {
          return JSON.stringify({ error: `No se encontró el rubro de gasto "${args.search_name || ''}". Podés consultar los rubros con query_gasto_items.` })
        }
        const now = new Date()
        const defaultPeriod = args.periodo || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const { data: itemData } = await sb.from('gastos_items').select('descripcion, categoria').eq('id', itemId).single()
        
        const record = {
          tenant_id: tenant?.id,
          item_id: itemId,
          periodo: defaultPeriod,
          monto_real: Number(args.amount) || 0,
          pagado: args.pagado ?? true,
          metodo_pago: args.metodo_pago || 'transferencia',
          notas: args.notas || 'Registrado vía Rombo IA'
        }
        const { data, error } = await sb.from('gastos_mensuales').upsert(record, { onConflict: 'tenant_id,item_id,periodo' }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Gasto de "${itemData?.descripcion || 'Rubro'}" por $${Number(args.amount).toLocaleString('es-AR')} para ${defaultPeriod} registrado correctamente.`
        })
      }

      case 'register_attendance': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const attDate = args.date || todayStr
        const hours = args.worked_hours !== undefined ? Number(args.worked_hours) : (args.status === 'present' ? 8 : 0)
        const { data, error } = await sb.from('attendance_records').upsert({
          employee_id: emp.id,
          date: attDate,
          status: args.status,
          worked_hours: hours,
          notes: args.notes || 'Registrado por Rombo IA'
        }, { onConflict: 'employee_id,date' }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Asistencia de ${emp.full_name} para el ${attDate} registrada como "${args.status}" (${hours} hs).`
        })
      }

      case 'register_employee_absence': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const { data, error } = await sb.from('employee_absences').insert({
          employee_id: emp.id,
          absence_type: args.absence_type,
          start_date: args.start_date,
          end_date: args.end_date || args.start_date,
          reason: args.reason || 'Informado por Rombo IA',
          status: 'active'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Ausencia/Licencia (${args.absence_type}) de ${emp.full_name} registrada desde el ${args.start_date}.`
        })
      }

      case 'register_employee_advance': {
        const { data: emp } = await sb.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const { data, error } = await sb.from('employee_advances').insert({
          employee_id: emp.id,
          amount_ars: Number(args.amount_ars),
          advance_date: args.advance_date || todayStr,
          reason: args.reason || 'Adelanto otorgado vía Rombo IA',
          deducted: false
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Adelanto de $${Number(args.amount_ars).toLocaleString('es-AR')} registrado para ${emp.full_name}.`
        })
      }

      case 'create_obra_odt': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let tramoId = null
        if (args.tramo_codigo) {
          const { data: tr } = await sb.from('obra_tramos').select('id').eq('project_id', projId)
            .or(`codigo.ilike.%${args.tramo_codigo}%,nodo_inicio.ilike.%${args.tramo_codigo}%,nodo_fin.ilike.%${args.tramo_codigo}%`).limit(1).single()
          tramoId = tr?.id
        }
        let itemId = null
        if (args.item_codigo) {
          const { data: it } = await sb.from('obra_items').select('id').eq('project_id', projId)
            .or(`codigo_item.ilike.%${args.item_codigo}%,descripcion.ilike.%${args.item_codigo}%`).limit(1).single()
          itemId = it?.id
        }

        const { count } = await sb.from('obra_ordenes_trabajo').select('*', { count: 'exact', head: true }).eq('project_id', projId)
        const nextNum = (count || 0) + 1
        const numeroOdt = `ODT-${String(nextNum).padStart(4, '0')}`

        const { data, error } = await sb.from('obra_ordenes_trabajo').insert({
          project_id: projId,
          numero_odt: numeroOdt,
          fecha: args.fecha || todayStr,
          tramo_id: tramoId,
          item_id: itemId,
          cuadrilla_nombre: args.cuadrilla_nombre,
          responsable_nombre: args.responsable_nombre || 'Capataz de Cuadrilla',
          meta_cantidad: Number(args.meta_cantidad),
          unidad: 'ml',
          estado: 'emitida',
          instrucciones_calidad: args.instrucciones_calidad || 'Control topográfico y de tapada reglamentaria.'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Orden de Trabajo ${numeroOdt} emitida exitosamente para cuadrilla ${args.cuadrilla_nombre} (Meta: ${args.meta_cantidad}).`,
          odt: data
        })
      }

      case 'register_obra_produccion': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let odtId = null
        if (args.odt_numero) {
          const { data: odt } = await sb.from('obra_ordenes_trabajo').select('id').eq('project_id', projId).ilike('numero_odt', `%${args.odt_numero}%`).limit(1).single()
          odtId = odt?.id
        }

        const { data, error } = await sb.from('obra_parte_diario_items').insert({
          project_id: projId,
          odt_id: odtId,
          fecha: args.fecha || todayStr,
          cantidad_real: Number(args.cantidad_real),
          unidad: 'ml',
          horas_trabajadas: Number(args.horas_trabajadas) || 8,
          personal_real_count: Number(args.personal_real_count) || 4,
          personal_nombres: args.personal_nombres || null,
          equipo_usado: args.equipo_usado || null,
          minutos_parada: Number(args.minutos_parada) || 0,
          motivo_parada: args.motivo_parada || null,
          novedades_interferencias: args.novedades_interferencias || null,
          estado: 'registrado'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Parte de terreno registrado: ${args.cantidad_real} ml ejecutados el ${args.fecha || todayStr}.${args.minutos_parada ? ` Parada: ${args.minutos_parada} min (${args.motivo_parada})` : ''}`,
          parte_id: data.id
        })
      }

      case 'update_obra_hito': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await sb.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        const { data: hito, error: hErr } = await sb.from('obra_hitos').select('*').eq('project_id', projId)
          .or(`codigo_hito.ilike.%${args.codigo_hito}%,nombre.ilike.%${args.codigo_hito}%`).limit(1).single()
        if (hErr || !hito) return JSON.stringify({ error: `No se encontró el hito "${args.codigo_hito}"` })
        
        const updates: any = {
          estado_binario: Number(args.estado_binario),
          fecha_inspeccion: args.fecha_inspeccion || todayStr,
          acta_numero: args.acta_numero || hito.acta_numero,
          inspector_nombre: args.inspector_nombre || hito.inspector_nombre,
          observaciones: args.observaciones || hito.observaciones
        }
        const { error } = await sb.from('obra_hitos').update(updates).eq('id', hito.id)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Hito ${hito.codigo_hito} (${hito.nombre}) actualizado a ${args.estado_binario === 100 ? '100% (Aprobado)' : '0% (Pendiente)'}.${args.acta_numero ? ` Acta N°: ${args.acta_numero}` : ''}`
        })
      }

      case 'register_safety_incident': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        const { data, error } = await sb.from('seguridad_incidentes').insert({
          obra_id: projId,
          fecha: todayStr,
          tipo: args.tipo,
          gravedad: args.gravedad || 'leve',
          descripcion: args.descripcion,
          persona_afectada: args.persona_afectada || null,
          causa_raiz: args.causa_raiz || null,
          acciones_correctivas: args.acciones_correctivas || null,
          estado: 'abierto'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, mensaje: `Incidente de seguridad registrado correctamente.`, id: data.id })
      }

      case 'register_safety_observation': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await sb.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        const sev = Number(args.severidad) || 2
        const prob = Number(args.probabilidad) || 2
        const { data, error } = await sb.from('seguridad_observaciones').insert({
          obra_id: projId,
          fecha: todayStr,
          observador: args.observador || 'Rombo IA',
          categoria: args.categoria || 'general',
          descripcion: args.descripcion,
          severidad: sev,
          probabilidad: prob,
          riesgo_score: sev * prob,
          accion_sugerida: args.accion_sugerida || null,
          estado: 'pendiente'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ success: true, mensaje: `Observación de seguridad registrada (Riesgo: ${sev * prob}/25).`, id: data.id })
      }

      case 'execute_db_action': {
        const table = String(args.table_name || '').trim()
        if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return JSON.stringify({ error: 'Tabla inválida' })
        const { data: tenant } = await sb.from('tenants').select('id').limit(1).single()
        const payload = { ...args.data }
        if (table !== 'tenants' && !payload.tenant_id && tenant?.id) {
          payload.tenant_id = tenant.id
        }
        if (args.action_type === 'insert') {
          const { data, error } = await sb.from(table).insert(payload).select().single()
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'insert', table, record: data })
        } else if (args.action_type === 'update') {
          if (!args.filter_column || args.filter_value === undefined) return JSON.stringify({ error: 'filter_column y filter_value requeridos para update' })
          const { data, error } = await sb.from(table).update(args.data).eq(args.filter_column, args.filter_value).select()
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'update', table, updated_count: data?.length })
        } else if (args.action_type === 'delete') {
          if (!args.filter_column || args.filter_value === undefined) return JSON.stringify({ error: 'filter_column y filter_value requeridos para delete' })
          const { error } = await sb.from(table).delete().eq(args.filter_column, args.filter_value)
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'delete', table })
        }
        return JSON.stringify({ error: 'action_type no soportado' })
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
      body: JSON.stringify({ model: 'gpt-4o-mini', instructions: systemPrompt, input, tools: responsesTools, temperature: 0.7 }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: `OpenAI ${response.status}`, detail: err }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let data = await response.json()
    
    let totalPromptTokens = data.usage?.prompt_tokens || 0
    let totalCompletionTokens = data.usage?.completion_tokens || 0

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
        body: JSON.stringify({ model: 'gpt-4o-mini', instructions: systemPrompt, input: followUp, tools: responsesTools, temperature: 0.7 }),
      })

      if (!response.ok) break
      data = await response.json()
      
      totalPromptTokens += data.usage?.prompt_tokens || 0
      totalCompletionTokens += data.usage?.completion_tokens || 0
    }
    
    // Log token usage asynchronously to Supabase
    const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    sb.from('tenants').select('id').limit(1).single().then(({ data: tenant }) => {
      if (tenant) {
        sb.from('ai_token_usage').insert({
          tenant_id: tenant.id,
          module: activeModule || 'unknown',
          prompt_tokens: totalPromptTokens,
          completion_tokens: totalCompletionTokens,
          total_tokens: totalPromptTokens + totalCompletionTokens
        }).then(() => {}) // fire and forget
      }
    })

    // Extract text reply
    const reply = data.output_text || data.output?.find((o: any) => o.type === 'message')?.content?.[0]?.text || 'No pude generar una respuesta.'
    return new Response(JSON.stringify({ reply }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})

