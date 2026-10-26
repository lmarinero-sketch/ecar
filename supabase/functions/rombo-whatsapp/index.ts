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
      name: 'query_fuel_loads',
      description: 'Consultar cargas de combustible de vehículos y maquinaria de ECAR. Permite ver la última carga registrada, litros, precio, total en ARS, chofer, vehículo y estación o batán.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por vehículo, patente o chofer' },
          unauthorized_only: { type: 'boolean', description: 'Solo cargas sin autorizar' },
          limit: { type: 'number', description: 'Cantidad de cargas (default 10)' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_fleet_vehicles',
      description: 'Consultar la flota de vehículos y maquinaria de ECAR. Muestra odómetro/km actual, estado de mantenimiento, services vencidos o próximos, seguro y VTV.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Buscar por código, patente o descripción' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_database_table',
      description: 'CONSULTA UNIVERSAL A LA BASE DE DATOS DE ECAR: Permite consultar directamente cualquier tabla del ERP (fuel_loads, fuel_vehicles, purchase_requests, purchase_orders, suppliers, project_certificates, bank_accounts, inventory_items, inventory_movements, cheques, obligations, employees, etc.). Usá esta herramienta si necesitás corroborar cualquier información de la empresa.',
      parameters: {
        type: 'object',
        properties: {
          table_name: { type: 'string', description: 'Nombre de la tabla' },
          select_columns: { type: 'string', description: 'Columnas a traer (default *)' },
          filter_column: { type: 'string', description: 'Columna de filtro' },
          filter_operator: { type: 'string', description: 'eq, ilike, gt, gte, lt, lte, neq' },
          filter_value: { type: 'string', description: 'Valor de filtro' },
          order_by: { type: 'string', description: 'Columna para ordenar' },
          order_descending: { type: 'boolean', description: 'Ordenar descendente' },
          limit: { type: 'number', description: 'Límite de filas' }
        },
        required: ['table_name']
      }
    }
  },

  {
    type: 'function' as const,
    function: {
      name: 'query_employees',
      description: 'Buscar empleados activos. Devuelve datos completos: nombre, CUIL, DNI, sexo, estado civil, hijos, estudios, convenio, horas extras, deuda, observaciones.',
      parameters: { type: 'object', properties: { search: { type: 'string' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_cheques',
      description: 'Consultar cheques. Filtrar por estado, dirección y rango de fechas de vencimiento. IMPORTANTE: Cuando el usuario pregunte por cheques de "esta semana", "próximos 7 días" o similar, SIEMPRE usá due_date_from y due_date_to para filtrar por el rango correcto.',
      parameters: { type: 'object', properties: { status: { type: 'string', description: 'Estado: pending, deposited, cashed, bounced' }, direction: { type: 'string', description: 'Dirección: payable (emitidos/a pagar), receivable (recibidos/a cobrar)' }, due_date_from: { type: 'string', description: 'Fecha inicio rango vencimiento YYYY-MM-DD (inclusive). Para "esta semana" usá el lunes de la semana actual.' }, due_date_to: { type: 'string', description: 'Fecha fin rango vencimiento YYYY-MM-DD (inclusive). Para "esta semana" usá el domingo de la semana actual.' }, limit: { type: 'number' } } }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_cheque',
      description: 'Cargar un nuevo cheque en la base de datos.',
      parameters: {
        type: 'object',
        properties: {
          cheque_number: { type: 'string', description: 'Número del cheque.' },
          bank_name: { type: 'string', description: 'Nombre del banco emisor.' },
          amount_ars: { type: 'number', description: 'Monto en pesos del cheque.' },
          direction: { type: 'string', enum: ['payable', 'receivable'], description: 'Dirección del cheque. Si es un cheque de cobro/recibido/a cobrar usa "receivable". Si es un cheque emitido/de pago/a pagar usa "payable".' },
          type: { type: 'string', enum: ['physical', 'echeq'], description: 'Tipo de cheque: "physical" (físico) o "echeq" (electrónico).' },
          issue_date: { type: 'string', description: 'Fecha de emisión en formato YYYY-MM-DD.' },
          due_date: { type: 'string', description: 'Fecha de pago/vencimiento en formato YYYY-MM-DD.' },
          beneficiary_or_issuer: { type: 'string', description: 'Beneficiario o emisor del cheque.' },
          scan_url: { type: 'string', description: 'URL pública de la foto del cheque (si aplica).' }
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
          cae_number: { type: 'string', description: 'Número de CAE' },
          gasto_item_id: { type: 'string', description: 'ID de rubro de gasto mensual asociado (opcional, uuid)' },
          scan_url: { type: 'string', description: 'URL pública de la foto de la factura (si aplica).' }
        },
        required: ['supplier_name', 'invoice_type', 'invoice_number', 'issue_date', 'total_ars']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'register_payment',
      description: 'Registrar un pago o cobro. Úsalo cuando el usuario diga cosas como "Pagué X a Y" o "Cobré X de Y". Crea un movimiento de caja.',
      parameters: {
        type: 'object',
        properties: {
          type: { type: 'string', enum: ['income', 'expense'], description: 'Tipo de movimiento. Si es un cobro/ingreso/entrada usa "income". Si es un pago/egreso/gasto usa "expense".' },
          amount: { type: 'number', description: 'Monto del pago/cobro' },
          counterpart: { type: 'string', description: 'A quién se le pagó o de quién se cobró' },
          category: { type: 'string', description: 'Categoría: Sueldos/Honorarios, Seguros, Servicios, Impuestos ARCA, Gremios, Combustibles, Cheques/Echeqs, Pagos a terceros, Servicios contratados, Viandas, Varios, Cobro certificado, Otro ingreso' },
          description: { type: 'string', description: 'Detalle adicional del movimiento' },
          payment_method: { type: 'string', description: 'Forma de pago: transfer, cash, cheque, echeq' },
        },
        required: ['type', 'amount', 'counterpart', 'category']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_liquidity',
      description: 'Consultar la posición de liquidez actual: efectivo, bancos, inversiones y disponibilidad total. Úsalo cuando pregunten "¿cuánta plata tengo?" o "¿cómo está la caja?".',
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'register_certificate',
      description: 'Registrar un certificado de obra aprobado. Úsalo cuando digan "se aprobó el certificado N de la obra X por Y monto".',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra/proyecto' },
          certificate_number: { type: 'number', description: 'Número del certificado' },
          gross_amount: { type: 'number', description: 'Monto bruto' },
          redetermination: { type: 'number', description: 'Monto por redeterminación (ajuste inflación)' },
          net_deposit: { type: 'number', description: 'Monto neto depositado (después de retenciones)' },
        },
        required: ['project_name', 'certificate_number', 'gross_amount']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'check_stock',
      description: 'Consultar el stock de un material o herramienta del pañol. Úsalo cuando pregunten "¿cuántas bolsas de cemento hay?" o "¿qué herramientas tenemos?".',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Nombre o parte del nombre del material/herramienta a buscar' },
          category: { type: 'string', enum: ['material', 'herramienta', 'consumible'], description: 'Filtrar por categoría (opcional)' },
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'register_stock_movement',
      description: 'Registrar una entrada o salida de material del pañol. Úsalo cuando digan "sacamos 10 bolsas de cemento para la obra X" o "llegaron 50 barras de hierro".',
      parameters: {
        type: 'object',
        properties: {
          item_name: { type: 'string', description: 'Nombre del material/herramienta' },
          movement_type: { type: 'string', enum: ['in', 'out'], description: 'in = ingreso al pañol, out = salida del pañol' },
          quantity: { type: 'number', description: 'Cantidad' },
          project_name: { type: 'string', description: 'Nombre de la obra destino (para salidas)' },
          notes: { type: 'string', description: 'Notas adicionales' },
        },
        required: ['item_name', 'movement_type', 'quantity']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'create_purchase_request',
      description: 'Crear un pedido de compra desde la obra. Úsalo cuando digan "necesitamos 4 placas de yeso y 10 bolsas de cemento para San Martín".',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra que necesita los materiales' },
          urgency: { type: 'string', enum: ['low', 'normal', 'urgent'], description: 'Urgencia del pedido' },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
              }
            },
            description: 'Lista de materiales solicitados'
          },
          requested_by: { type: 'string', description: 'Quién hace el pedido' },
        },
        required: ['project_name', 'items']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_monthly_summary',
      description: 'Obtener el resumen financiero del mes actual o de un mes específico. Úsalo cuando pregunten "¿Cómo vamos en mayo?" o "Resumen de abril".',
      parameters: {
        type: 'object',
        properties: {
          month: { type: 'string', description: 'Mes en formato YYYY-MM (ej: 2026-04). Si no se especifica, usa el mes actual.' },
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'process_cheque_photo',
      description: 'Procesar la foto de un cheque físico o echeq para extraer datos (banco, número, monto, fecha, beneficiario). Se activa cuando el usuario envía una foto de un cheque.',
      parameters: {
        type: 'object',
        properties: {
          image_analysis: { type: 'string', description: 'Descripción/datos extraídos de la imagen del cheque' },
          bank: { type: 'string', description: 'Banco emisor' },
          cheque_number: { type: 'string', description: 'Número del cheque' },
          amount: { type: 'number', description: 'Monto del cheque' },
          date: { type: 'string', description: 'Fecha del cheque (YYYY-MM-DD)' },
          beneficiary: { type: 'string', description: 'Beneficiario' },
          payment_date: { type: 'string', description: 'Fecha de pago/vencimiento (YYYY-MM-DD)' },
          direction: { type: 'string', enum: ['payable', 'receivable'], description: 'Dirección (payable para pagos nuestros como comprobantes de emisión de Echeq, receivable para cheques a cobrar)' },
        },
        required: ['amount']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'delete_cheque',
      description: 'Eliminar un cheque de la base de datos. Puede buscar por número de cheque o eliminar el último cargado. Úsalo cuando el usuario diga "eliminá el cheque" o "borrá el último cheque" o "eliminá el cheque 4585".',
      parameters: {
        type: 'object',
        properties: {
          cheque_number: { type: 'string', description: 'Número del cheque a eliminar (opcional si se quiere el último)' },
          delete_last: { type: 'boolean', description: 'Si es true, elimina el último cheque cargado' },
        },
        required: []
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_gasto_items',
      description: 'Consultar rubros o conceptos de gastos operativos configurados en la planilla mensual (ej: personal, seguros, servicios, impuestos, gremios, viandas, etc.). Úsalo para obtener el ID de un rubro antes de registrar un gasto.',
      parameters: {
        type: 'object',
        properties: {
          search: { type: 'string', description: 'Nombre o parte de la descripción del rubro a buscar (ej: "sueldos", "osse", "liderar", "gas")' },
          category: { type: 'string', description: 'Filtrar por categoría (personal, seguros, servicios, impuestos, gremios, combustibles, terceros, servicios_contratados, viandas, varios)' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'register_gasto_monto',
      description: 'Registrar o actualizar el monto mensual de un gasto operativo (planilla mensual). Es mandatorio obtener el item_id de query_gasto_items.',
      parameters: {
        type: 'object',
        properties: {
          item_id: { type: 'string', description: 'ID del rubro de gasto (uuid obtenido de query_gasto_items).' },
          periodo: { type: 'string', description: 'Mes del gasto en formato YYYY-MM (ej: "2026-05"). Si no se especifica, se asume el mes actual.' },
          amount: { type: 'number', description: 'Monto del gasto en pesos (ARS).' },
          pagado: { type: 'boolean', description: 'Indica si el gasto ya está pagado.' },
          metodo_pago: { type: 'string', description: 'Forma de pago (efectivo, transferencia, cheque, echeq, tarjeta) - opcional.' },
          notas: { type: 'string', description: 'Comentarios adicionales - opcional.' }
        },
        required: ['item_id', 'amount']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_employee_absences',
      description: 'Consultar ausencias/licencias de un empleado (vacaciones, enfermedad, suspensión, ART, medio día).',
      parameters: { type: 'object', properties: { employee_name: { type: 'string' }, status: { type: 'string' } }, required: ['employee_name'] }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_employee_advances',
      description: 'Consultar adelantos de un empleado. Muestra monto, fecha, motivo y si fue descontado.',
      parameters: { type: 'object', properties: { employee_name: { type: 'string' }, pending_only: { type: 'boolean' } }, required: ['employee_name'] }
    }
  },
  // ─── NUEVO MÓDULO DE GESTIÓN DE OBRA (5 FASES) ───
  {
    type: 'function' as const,
    function: {
      name: 'query_obra_wbs',
      description: 'Consultar el WBS contractual y jerárquico de una obra (Rubros, Subrubros, Ítems, P.U. e incidencias).',
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
    type: 'function' as const,
    function: {
      name: 'query_obra_tramos',
      description: 'Consultar la red topológica de tramos y nodos de la obra (Fase 1 Planificación). Muestra nodos, longitud en m, diámetros y servicios.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          nodo: { type: 'string', description: 'Filtrar por nodo de inicio o fin (ej: N1, N5)' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_obra_matriz_fisica',
      description: 'Consultar la bandeja Para Programar y saldos pendientes de tramo-ítems (Fase 1 y 2). Devuelve cantidad prevista, ejecutada y saldo para programar.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          para_programar_only: { type: 'boolean', description: 'Si es true, solo trae ítems con saldo pendiente > 0' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_obra_odts',
      description: 'Consultar las Órdenes de Trabajo (ODT) formales emitidas en la Fase 2 (Programación). Muestra número de ODT, tramo, ítem, cuadrilla y estado.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          estado: { type: 'string' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'query_obra_hitos',
      description: 'Consultar los hitos binarios (0% o 100%) y actas de inspección regulatoria (Fase 4 Control). Muestra si están pendientes o aprobados y si bloquean tramos.',
      parameters: {
        type: 'object',
        properties: {
          project_name: { type: 'string', description: 'Nombre de la obra (ej: Roque)' },
          estado_binario: { type: 'number', description: '0 para pendientes, 100 para aprobados' }
        }
      }
    }
  },
  // ─── TOOLS DE GESTIÓN OPERATIVA Y MUTACIÓN (CHAT-OPS) ───
  {
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
    type: 'function' as const,
    function: {
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
];

// Helper to get Argentina date/time
function getArgentinaDate(): Date {
  // Create a date string in Argentina timezone
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
  const day = d.getDay() // 0=domingo, 1=lunes...
  const diffToMonday = day === 0 ? -6 : 1 - day
  const monday = new Date(d)
  monday.setDate(d.getDate() + diffToMonday)
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
  return { monday: fmt(monday), sunday: fmt(sunday) }
}

function buildSystemPrompt(): string {
  const argDate = getArgentinaDate()
  const todayStr = getArgentinaDateStr()
  const dayNames = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']
  const monthNames = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']
  const dayName = dayNames[argDate.getDay()]
  const monthName = monthNames[argDate.getMonth()]
  const { monday, sunday } = getArgentinaWeekRange()

  return `Sos *Rombo* 🤖, el asistente IA de ECAR Constructora. Respondés por WhatsApp.
Hablás en español argentino (vos/vosotros). Sos profesional, cercano y eficiente.

## FECHA Y HORA ACTUAL
📅 Hoy es *${dayName} ${argDate.getDate()} de ${monthName} de ${argDate.getFullYear()}* (${todayStr})
📆 Esta semana va del *lunes ${monday}* al *domingo ${sunday}*
⏰ Hora Argentina: ${String(argDate.getHours()).padStart(2, '0')}:${String(argDate.getMinutes()).padStart(2, '0')}

Cuando el usuario pregunte por "esta semana", "esta semana que viene", etc., usá SIEMPRE los rangos de fecha correctos basándote en la fecha actual. Un cheque que vence el ${monday} a ${sunday} está "esta semana". Un cheque que vence después del ${sunday} NO es de esta semana.

## TU ROL — COPILOTO DE GESTIÓN OPERATIVA TOTAL (CHAT-OPS)
Sos el copiloto financiero, logístico y operativo de ECAR. Tu objetivo es que el usuario pueda GESTIONAR TODO EL SISTEMA directamente enviándote un mensaje o un audio por WhatsApp.
Cuando el usuario te dé una instrucción u orden, EJECUTÁ LA HERRAMIENTA CORRESPONDIENTE INMEDIATAMENTE:
- ⛽ *Cargar combustible* (\`create_fuel_load\`): "Cargá 100 L de diesel a la Hidromek en el batán interno con chofer Juan Carlos". (Si es batán, descuenta stock automáticamente).
- ⛽ *Movimientos de Batán* (\`create_fuel_batan_movement\`): registrar compras de combustible o recargas del batán.
- 🏦 *Gestionar cheques* (\`create_cheque\`, \`delete_cheque\`, \`update_cheque_status\`): cargar, borrar, marcar como depositado o cobrado.
- 💰 *Registrar pagos y cobros* (\`register_payment\`): "Pagué 960 mil a Elio".
- 📂 *Registrar gastos operativos* (\`register_gasto_monto\`): anotar montos mensuales de servicios, seguros, sueldos, etc.
- 🛒 *Crear pedidos de compra* (\`create_purchase_request\`): "Necesitamos 4 placas de yeso para la obra".
- 📦 *Movimientos de pañol* (\`register_stock_movement\`): entradas y salidas de materiales o herramientas.
- 👷 *Registrar asistencia* (\`register_attendance\`): marcar presentes, ausentes o tardanzas.
- 👷 *Registrar ausencias y licencias* (\`register_employee_absence\`): vacaciones, médico, suspensión, ART.
- 💵 *Registrar adelantos de sueldo* (\`register_employee_advance\`): adelantos otorgados.
- 🏗️ *Emitir Órdenes de Trabajo ODT* (\`create_obra_odt\`): emitir ODT con cuadrilla y meta en Fase 2.
- 🏗️ *Registrar producción métrica real* (\`register_obra_produccion\`): metros reales, personal presente y paradas con causa raíz en Fase 3.
- 🏗️ *Aprobar hitos de control* (\`update_obra_hito\`): aprobar hitos 100% con acta en Fase 4.
- 🦺 *Registrar seguridad* (\`register_safety_incident\`, \`register_safety_observation\`): incidentes y desvíos preventivos.
- 📊 *Consultar liquidez y resúmenes* (\`get_liquidity\`, \`get_daily_summary\`, \`calculate_cashflow\`, etc.).
- 🌐 *Acción universal* (\`execute_db_action\`, \`query_database_table\`): podés consultar o modificar cualquier tabla. NUNCA digas que no podés gestionar algo.

## NUEVO NÚCLEO DE GESTIÓN DE OBRA (5 FASES) — GUÍA PASO A PASO
Si cualquier usuario te pregunta por WhatsApp cómo usar el módulo de obra o cuál es el procedimiento:
1. *Fase 1: Planificación* → El proyecto nace del Presupuesto Aprobado y la topología espacial. Se audita el WBS (Rubros ➔ Subrubros ➔ Ítems con P.U. e incidencias) y los Tramos (Nodos, metros, diámetros). En la Matriz Física se asignan los cómputos que quedan congelados.
2. *Fase 2: Programación* → La oficina técnica o jefe de obra filtra por Nodo y revisa la bandeja *Para Programar* (solo ítems con saldo > 0). Asigna cuadrilla, responsable y emite la ODT formal. 🔒 *Regla de oro*: Prohibido crear tareas o ítems acá; el dato nace en planificación.
3. *Fase 3: Ejecución* → Capataz en frente de obra en modo tablet/celular. Cero porcentajes: carga producción métrica real (ml, m³, un), dotación de personal y paradas de obra indicando la causa raíz obligatoria.
4. *Fase 4: Control* → Hitos binarios *0% o 100%*. Si una inspección o prueba hidráulica no está aprobada al 100%, el tramo queda bloqueado. Al liquidar, se emite el Certificado de Obra contractual automático e inmutable con retenciones.
5. *Fase 5: Retroalimentación* → Comparación de rendimientos reales vs teóricos y registro de lecciones aprendidas.
*Obra Insignia Lote Roque*: 50 tramos topológicos, 7 rubros, 12 subrubros, 18 ítems ($114.6M contractuales) y 4 hitos regulatorios.

## FORMATO DE RESPUESTA (MUY IMPORTANTE)
- Usá formato *WhatsApp nativo*: asteriscos simples para *negrita* (ej: *Cheque cargado*).
- NUNCA uses markdown de Slack/Discord (no ### ni ** doble ni __nada__).
- Usá emojis para dar estructura visual y hacer las respuestas legibles en el celular.
- Dejá líneas en blanco entre secciones para que "respire" el texto.
- Sé conciso: mensajes de máximo 3-4 párrafos cortos.

## EJEMPLOS DE FORMATO CORRECTO

Cuando registres un pago:
✅ *Pago registrado*

👤 A: Elio
💰 Monto: $960.000
📂 Categoría: Sueldos/Honorarios
📅 Fecha: 08/05/2026

Cuando muestres liquidez:
💰 *Posición de Liquidez ECAR*

💵 Efectivo: $975.000
🏦 Bancos: $3.504.828
📈 Inversiones: $103.045.454

💎 *Disponibilidad Total: $107.525.282*

⚠️ Cheques a pagar (7 días): $2.500.000
✅ Cheques a cobrar (7 días): $5.400.000

Cuando confirmes un cheque:
✅ *Cheque cargado exitosamente*

🏦 Banco: Macro
💰 Monto: $1.500.000
📅 Vencimiento: 15/06/2026
📋 Número: 00123456

Cuando falte información:
⚠️ Me falta info para cargar el pago:

1️⃣ *¿A quién le pagaste?*
2️⃣ *¿Cuánto?*
3️⃣ *¿Es sueldo, servicio, proveedor?*

📝 Mandame esos datos y lo cargo.

## REGLAS CRÍTICAS
1. Cuando el usuario diga "pagué X a Y" → usá *register_payment* con type='expense'.
2. Cuando diga "cobré X de Y" → usá *register_payment* con type='income'.
3. Cuando pregunte por plata/caja/liquidez → usá *get_liquidity*.
4. Si falta información obligatoria, PREGUNTÁ específicamente qué falta.
5. Cuando tengas todos los datos, ejecutá la herramienta y confirmá con ✅.
6. NUNCA inventes datos. Si no sabés algo, preguntá.
7. Valores monetarios siempre con $ y separador de miles con punto: $1.500.000
8. Si "960 mil" → $960.000. Si "5 palos" → $5.000.000. Interpretá jerga argentina.
9. Si el usuario manda un audio, ya fue transcrito. Tratá el texto como si lo hubiera escrito.
10. Cuando el usuario salude, respondé brevemente y preguntá en qué podés ayudar.
11. Si te piden un resumen, usá el formato con emojis y negritas para que sea escaneable.
12. SIEMPRE terminá tu mensaje con un CTA (call to action) contextual. Ejemplos:
   - Después de registrar pago: "¿Querés registrar otro pago o ver la liquidez? 💰"
   - Después de liquidez: "¿Querés ver los cheques pendientes o registrar un movimiento? 📊"
   - Después de un certificado: "¿Querés cargar otro certificado o ver el estado de la obra? 🏗️"
   - Nunca repitas el mismo CTA dos veces seguidas, variá las opciones.
13. SIEMPRE llamá a la herramienta correspondiente (create_cheque, register_payment, delete_cheque, etc.) cuando el usuario solicite registrar, cargar o eliminar información. NUNCA respondas diciendo que algo fue cargado, registrado o eliminado con éxito si no ejecutaste la herramienta correspondiente primero y esta te devolvió éxito.
14. ELIMINAR CHEQUES: Si el usuario pide eliminar o borrar un cheque, usá la herramienta delete_cheque. Si dice "el último" o "el que acabo de cargar", usá delete_last=true. Si dice un número específico, usá cheque_number. NUNCA digas que no podés eliminar cheques — SÍ podés.
15. FILTRO DE FECHAS EN CHEQUES: Cuando pregunten por cheques de "esta semana", SIEMPRE usá query_cheques con due_date_from=${monday} y due_date_to=${sunday}. Si no hay cheques en ese rango, respondé "No hay cheques a pagar esta semana" y mencioná cuándo es el próximo. NUNCA muestres cheques fuera del rango como si fueran de esta semana.
16. GASTOS OPERATIVOS (PLANILLA MENSUAL): Cuando el usuario quiera registrar o cargar un gasto operativo (de la planilla mensual, como "luz", "gas", "uocra", "seguros", "teléfonos", "sueldos obreros", etc.):
    a. Primero usá query_gasto_items para ver si existe el rubro (buscá por término o categoría).
    b. Si encontrás coincidencias, mostrale las opciones válidas numeradas al usuario y pedile que confirme cuál quiere actualizar (ej: "Encontré estos rubros: 1. NATURGY CORDOBA, 2. GAS ORO. ¿Cuál querés actualizar?"). ¡Esto es fundamental para que el usuario no se confunda!
    c. Si falta el período (mes en formato YYYY-MM, ej: 2026-05) o el monto, solicitalos interactivamente de a uno o guialo de forma amigable.
    d. Una vez confirmado el rubro (con su item_id), período y monto, ejecutá register_gasto_monto.
    e. Confirmá el registro detallando el nombre del rubro, el período (mes y año en español) y el monto cargado.
    f. Es muy importante que guíes y acompañes al usuario paso a paso de forma que no tenga dudas de qué concepto está registrando.
    g. Después de un registro exitoso de gasto mediante register_gasto_monto, SIEMPRE tenés que preguntarle textualmente: "¿Tenés factura de esto? Si tenés, subila." para guiarlo a enviar la foto de la factura.`
}

// ==================== TOOL EXECUTION ====================
async function executeTool(supabase: any, name: string, args: Record<string, any>, phone?: string): Promise<string> {
  const todayStr = getArgentinaDateStr()
  const today = getArgentinaDate()

  try {
    switch (name) {
      case 'query_employees': {
        let q = supabase.from('employees').select('full_name, cuil, dni, employment_status, hire_date, birth_date, gender, marital_status, children_info, education_level, union_name, observations, debt_to_employee, debt_notes, does_overtime, overtime_rate, phone, address, modo_liquidacion, retribucion_pactada').eq('employment_status', 'active')
        if (args.search) q = q.ilike('full_name', `%${args.search}%`)
        const { data } = await q.order('full_name').limit(20)
        return JSON.stringify(data || [])
      }
      case 'query_cheques': {
        let q = supabase.from('cheques').select('cheque_number, bank_name, beneficiary_or_issuer, amount_ars, due_date, status, direction')
        if (args.status) q = q.eq('status', args.status)
        if (args.direction) q = q.eq('direction', args.direction)
        if (args.due_date_from) q = q.gte('due_date', args.due_date_from)
        if (args.due_date_to) q = q.lte('due_date', args.due_date_to)
        const { data } = await q.order('due_date').limit(args.limit || 15)
        if (!data?.length) {
          // If filtering by date range and no results, find the next upcoming cheque for context
          if (args.due_date_from || args.due_date_to) {
            let nextQ = supabase.from('cheques').select('cheque_number, bank_name, beneficiary_or_issuer, amount_ars, due_date, status, direction').eq('status', 'pending')
            if (args.direction) nextQ = nextQ.eq('direction', args.direction)
            nextQ = nextQ.gte('due_date', args.due_date_to || args.due_date_from).order('due_date').limit(3)
            const { data: nextCheques } = await nextQ
            if (nextCheques?.length) {
              return JSON.stringify({ cheques: [], total_ars: 0, count: 0, message: 'No hay cheques en el rango solicitado', proximos_cheques: nextCheques })
            }
          }
          return JSON.stringify({ cheques: [], total_ars: 0, count: 0, message: 'No hay cheques que coincidan con los filtros' })
        }
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
          scan_url: args.scan_url || null,
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
        let q = supabase.from('purchase_invoices').select('id, invoice_number, point_of_sale, issue_date, total_ars, net_amount_ars, iva_21_ars, iva_105_ars, iva_27_ars, status, invoice_type, legal_entity:legal_entities(id, name), supplier:suppliers(name), ocr_raw_data')
        if (args.month) { q = q.gte('issue_date', `${args.month}-01`).lte('issue_date', `${args.month}-31`) }
        const { data } = await q.order('issue_date', { ascending: false }).limit(200)
        let filtered = data || []
        if (args.supplier_name) {
          const s = args.supplier_name.toLowerCase().trim()
          filtered = filtered.filter((i: any) => (i.supplier?.name || i.ocr_raw_data?.proveedor_cliente || '').toLowerCase().includes(s))
        }
        return JSON.stringify(filtered.slice(0, 30))
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

        // Check if gasto_item_id is in args, otherwise try to retrieve from pending_data
        let gastoItemId = args.gasto_item_id || null;
        if (!gastoItemId && phone) {
          const { data: conv } = await supabase.from('whatsapp_conversations').select('pending_data').eq('phone', phone).single();
          if (conv?.pending_data) {
            const currentPending = typeof conv.pending_data === 'string' ? JSON.parse(conv.pending_data) : conv.pending_data;
            if (currentPending?.last_gasto_item_id) {
              gastoItemId = currentPending.last_gasto_item_id;
              console.log('Factura vinculada automáticamente al último gasto de WhatsApp:', gastoItemId);
              
              // Clear it so we don't reuse it for another invoice by mistake
              delete currentPending.last_gasto_item_id;
              await supabase.from('whatsapp_conversations').upsert({
                phone,
                pending_data: currentPending,
                updated_at: new Date().toISOString()
              }, { onConflict: 'phone' });
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
          original_file_url: args.scan_url || null,
          ocr_validated: false,
          ocr_raw_data: args,
          gasto_item_id: gastoItemId,
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
      case 'register_payment': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const movData: Record<string, any> = {
          tenant_id: tenant?.id,
          movement_date: todayStr,
          type: args.type || 'expense',
          category: args.category || 'Varios',
          description: args.description || null,
          amount: args.amount,
          counterpart: args.counterpart || null,
          payment_method: args.payment_method || 'transfer',
          is_pending: false,
          created_by: 'rombo-whatsapp',
        }
        const { data: mov, error: movErr } = await supabase.from('cash_movements').insert(movData).select().single()
        if (movErr) return JSON.stringify({ error: movErr.message })

        // Update bank balance if possible
        if (args.type === 'expense') {
          const { data: mainBank } = await supabase.from('bank_accounts').select('id, current_balance').eq('type', 'bank').limit(1).single()
          if (mainBank) {
            await supabase.from('bank_accounts').update({ current_balance: mainBank.current_balance - args.amount, last_updated: new Date().toISOString() }).eq('id', mainBank.id)
          }
        }

        return JSON.stringify({
          success: true,
          message: `${args.type === 'income' ? 'Cobro' : 'Pago'} de $${args.amount.toLocaleString()} ${args.type === 'expense' ? 'a' : 'de'} ${args.counterpart} registrado`,
          id: mov?.id,
          category: args.category,
          amount: args.amount,
          counterpart: args.counterpart,
        })
      }
      case 'get_liquidity': {
        const { data: accounts } = await supabase.from('bank_accounts').select('name, type, current_balance, bank_name')
        if (!accounts?.length) return JSON.stringify({ message: 'No hay cuentas bancarias configuradas' })

        const cash = accounts.filter((a: any) => a.type === 'cash').reduce((s: number, a: any) => s + a.current_balance, 0)
        const banks = accounts.filter((a: any) => a.type === 'bank').reduce((s: number, a: any) => s + a.current_balance, 0)
        const investments = accounts.filter((a: any) => a.type === 'investment').reduce((s: number, a: any) => s + a.current_balance, 0)
        const total = cash + banks + investments

        // Get upcoming 7-day cheques
        const weekAhead = new Date(today.getTime() + 7 * 86400000).toISOString().split('T')[0]
        const { data: chqPay } = await supabase.from('cheques').select('amount_ars').eq('status', 'pending').eq('direction', 'payable').gte('due_date', todayStr).lte('due_date', weekAhead)
        const { data: chqRec } = await supabase.from('cheques').select('amount_ars').eq('status', 'pending').eq('direction', 'receivable').gte('due_date', todayStr).lte('due_date', weekAhead)
        const toPay = (chqPay || []).reduce((s: number, c: any) => s + c.amount_ars, 0)
        const toReceive = (chqRec || []).reduce((s: number, c: any) => s + c.amount_ars, 0)

        return JSON.stringify({
          efectivo: cash,
          bancos: banks,
          inversiones: investments,
          disponibilidad_total: total,
          cuentas: accounts,
          cheques_a_pagar_7dias: toPay,
          cheques_a_cobrar_7dias: toReceive,
          neto_7dias: toReceive - toPay,
        })
      }
      case 'register_certificate': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        // Find project by name
        const { data: project } = await supabase.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
        if (!project) return JSON.stringify({ error: `No encontré el proyecto "${args.project_name}"` })

        const totalCertified = (args.gross_amount || 0) + (args.redetermination || 0)
        const retentions = totalCertified * 0.05 // ~5% retenciones estimadas
        const netDeposit = args.net_deposit || (totalCertified - retentions)

        const { data: cert, error: certErr } = await supabase.from('project_certificates').insert({
          tenant_id: tenant?.id,
          project_id: project.id,
          certificate_number: args.certificate_number,
          gross_amount: args.gross_amount,
          redetermination: args.redetermination || 0,
          total_certified: totalCertified,
          retention_iibb: retentions * 0.6,
          retention_imp_cheque: retentions * 0.4,
          net_deposit: netDeposit,
          status: 'approved',
        }).select().single()

        if (certErr) return JSON.stringify({ error: certErr.message })
        return JSON.stringify({
          success: true,
          message: `Certificado N° ${args.certificate_number} de ${project.name} registrado`,
          id: cert?.id,
          project: project.name,
          gross: args.gross_amount,
          redetermination: args.redetermination || 0,
          total: totalCertified,
          net_deposit: netDeposit,
        })
      }
      case 'check_stock': {
        let q = supabase.from('inventory_items').select('name, category, current_stock, min_stock, unit, unit_cost')
        if (args.search) q = q.ilike('name', `%${args.search}%`)
        if (args.category) q = q.eq('category', args.category)
        const { data: items } = await q.order('name').limit(20)
        if (!items?.length) return JSON.stringify({ message: args.search ? `No encontré "${args.search}" en el pañol` : 'El pañol está vacío' })
        const lowStock = items.filter((i: any) => i.current_stock <= i.min_stock && i.min_stock > 0)
        return JSON.stringify({
          items: items.map((i: any) => ({
            nombre: i.name, categoria: i.category,
            stock: `${i.current_stock} ${i.unit}`,
            minimo: i.min_stock, stock_bajo: i.current_stock <= i.min_stock && i.min_stock > 0
          })),
          total_items: items.length,
          items_stock_bajo: lowStock.length,
        })
      }
      case 'register_stock_movement': {
        const { data: item } = await supabase.from('inventory_items').select('id, name, current_stock, unit').ilike('name', `%${args.item_name}%`).limit(1).single()
        if (!item) return JSON.stringify({ error: `No encontré "${args.item_name}" en el inventario` })
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        let projectId = null
        if (args.project_name) {
          const { data: proj } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projectId = proj?.id
        }
        await supabase.from('inventory_movements').insert({
          tenant_id: tenant?.id, item_id: item.id,
          movement_type: args.movement_type, quantity: args.quantity,
          project_id: projectId, notes: args.notes || null, created_by: 'rombo-whatsapp',
        })
        const newStock = args.movement_type === 'in' ? item.current_stock + args.quantity : item.current_stock - args.quantity
        await supabase.from('inventory_items').update({ current_stock: newStock }).eq('id', item.id)
        return JSON.stringify({
          success: true,
          message: `${args.movement_type === 'in' ? 'Ingreso' : 'Egreso'} de ${args.quantity} ${item.unit} de ${item.name}`,
          item: item.name, stock_anterior: item.current_stock, stock_nuevo: newStock,
        })
      }
      case 'create_purchase_request': {
        // === VALIDACIÓN DE NÚMERO AUTORIZADO ===
        if (phone) {
          const { data: setting } = await supabase.from('system_settings').select('value').eq('key', 'whatsapp_purchase_phone').limit(1).single()
          const authorizedPhone = setting?.value?.replace(/\D/g, '')
          const callerPhone = phone.replace(/\D/g, '')
          if (authorizedPhone && authorizedPhone !== callerPhone) {
            return JSON.stringify({ error: '🚫 Tu número no está autorizado para crear pedidos de compra. Pedile al administrador que te habilite desde el sistema ECAR → Pedidos de Compra → Configurar WhatsApp.' })
          }
          if (!authorizedPhone) {
            return JSON.stringify({ error: '⚠️ Los pedidos por WhatsApp no están habilitados. El administrador debe configurar un número autorizado desde ECAR → Pedidos de Compra.' })
          }
        }
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const { data: project } = await supabase.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
        if (!project) return JSON.stringify({ error: `No encontré el proyecto "${args.project_name}"` })
        const { data: req, error: reqErr } = await supabase.from('purchase_requests').insert({
          tenant_id: tenant?.id, project_id: project.id,
          requested_by: args.requested_by || 'WhatsApp',
          urgency: args.urgency || 'normal', status: 'pending',
        }).select().single()
        if (reqErr) return JSON.stringify({ error: reqErr.message })
        if (args.items?.length) {
          await supabase.from('purchase_request_items').insert(
            args.items.map((i: any) => ({ request_id: req.id, description: i.description, quantity: i.quantity || 1, unit: i.unit || 'unidad' }))
          )
        }
        return JSON.stringify({
          success: true,
          message: `Pedido de compra creado para ${project.name}`,
          id: req.id, project: project.name,
          urgency: args.urgency || 'normal',
          items_count: args.items?.length || 0,
          items: args.items,
        })
      }
      case 'get_monthly_summary': {
        const now = new Date()
        const monthStr = args.month || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
        const monthStart = `${monthStr}-01`
        // Get snapshot
        const { data: snap } = await supabase.from('monthly_snapshots').select('*').eq('month', monthStart).limit(1).single()
        // Get movements for the month
        const { data: movements } = await supabase.from('cash_movements')
          .select('type, category, amount, description')
          .gte('movement_date', monthStart)
          .lte('movement_date', `${monthStr}-31`)
          .order('movement_date')
        const totalExpenses = movements?.filter((m: any) => m.type === 'expense').reduce((s: number, m: any) => s + m.amount, 0) || 0
        const totalIncome = movements?.filter((m: any) => m.type === 'income').reduce((s: number, m: any) => s + m.amount, 0) || 0
        const byCategory: Record<string, number> = {}
        movements?.filter((m: any) => m.type === 'expense').forEach((m: any) => {
          byCategory[m.category] = (byCategory[m.category] || 0) + m.amount
        })
        return JSON.stringify({
          mes: monthStr,
          snapshot: snap ? {
            caja_inicio: snap.opening_balance,
            ingresos: snap.total_income,
            gastos: snap.total_expenses,
            caja_proyectada: snap.projected_closing,
            caja_real: snap.real_closing,
            desvio: (snap.real_closing || 0) - (snap.projected_closing || 0),
          } : null,
          movimientos_del_mes: {
            total_gastos: totalExpenses,
            total_ingresos: totalIncome,
            cant_movimientos: movements?.length || 0,
            gastos_por_categoria: byCategory,
          }
        })
      }
      case 'process_cheque_photo': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const chequeData: any = {
          tenant_id: tenant?.id,
          type: 'physical',
          bank_name: args.bank || 'Sin especificar',
          cheque_number: args.cheque_number || 'OCR-' + Date.now(),
          amount_ars: args.amount,
          direction: args.direction || 'receivable',
          issue_date: args.date || new Date().toISOString().split('T')[0],
          due_date: args.payment_date || args.date || new Date().toISOString().split('T')[0],
          beneficiary_or_issuer: args.beneficiary || null,
          status: 'pending',
        }
        const { data: cheque, error: chequeErr } = await supabase.from('cheques').insert(chequeData).select().single()
        if (chequeErr) return JSON.stringify({ error: chequeErr.message })
        return JSON.stringify({
          success: true,
          message: `Cheque registrado desde foto`,
          id: cheque?.id,
          banco: chequeData.bank_name,
          numero: chequeData.cheque_number,
          monto: chequeData.amount_ars,
          fecha: chequeData.issue_date,
          vencimiento: chequeData.due_date,
          beneficiario: chequeData.beneficiary_or_issuer,
        })
      }
      case 'delete_cheque': {
        let cheque = null
        if (args.cheque_number) {
          // Search by cheque number
          const { data } = await supabase.from('cheques').select('id, cheque_number, bank_name, amount_ars, due_date').eq('cheque_number', args.cheque_number).limit(1).single()
          cheque = data
        } else if (args.delete_last) {
          // Get most recently created cheque
          const { data } = await supabase.from('cheques').select('id, cheque_number, bank_name, amount_ars, due_date').order('created_at', { ascending: false }).limit(1).single()
          cheque = data
        }
        if (!cheque) return JSON.stringify({ error: 'No encontré el cheque para eliminar' })
        const { error: delErr } = await supabase.from('cheques').delete().eq('id', cheque.id)
        if (delErr) return JSON.stringify({ error: delErr.message })
        return JSON.stringify({
          success: true,
          message: `Cheque ${cheque.cheque_number} eliminado`,
          deleted: { numero: cheque.cheque_number, banco: cheque.bank_name, monto: cheque.amount_ars, vencimiento: cheque.due_date }
        })
      }
      case 'query_gasto_items': {
        let q = supabase.from('gastos_items').select('id, categoria, descripcion, orden, activo').eq('activo', true)
        if (args.category) {
          q = q.eq('categoria', args.category)
        }
        if (args.search) {
          q = q.ilike('descripcion', `%${args.search}%`)
        }
        const { data, error } = await q.order('orden').order('descripcion')
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify(data || [])
      }
      case 'register_gasto_monto': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const now = new Date()
        const defaultPeriod = args.periodo || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`

        // Find the item details first to return a friendly confirmation name
        const { data: itemData, error: itemErr } = await supabase.from('gastos_items').select('descripcion, categoria').eq('id', args.item_id).single()
        if (itemErr || !itemData) {
          return JSON.stringify({ error: `No encontré el rubro de gasto con ID: ${args.item_id}` })
        }

        const record = {
          tenant_id: tenant?.id,
          item_id: args.item_id,
          periodo: defaultPeriod,
          monto: args.amount,
          pagado: args.pagado ?? false,
          fecha_pago: args.pagado ? (args.fecha_pago || new Date().toISOString().split('T')[0]) : null,
          metodo_pago: args.metodo_pago || null,
          notas: args.notes || null,
          updated_at: new Date().toISOString()
        }

        const { data, error } = await supabase
          .from('gastos_registros')
          .upsert(record, { onConflict: 'item_id,periodo' })
          .select()
          .single()

        if (error) return JSON.stringify({ error: error.message })

        // Save this item_id as the last registered gasto in the conversation's pending_data
        if (phone) {
          try {
            const { data: conv } = await supabase.from('whatsapp_conversations').select('pending_data').eq('phone', phone).single();
            let currentPending: Record<string, any> = {};
            if (conv?.pending_data) {
              currentPending = typeof conv.pending_data === 'string' ? JSON.parse(conv.pending_data) : conv.pending_data;
            }
            currentPending.last_gasto_item_id = args.item_id;
            await supabase.from('whatsapp_conversations').upsert({
              phone,
              pending_data: currentPending,
              updated_at: new Date().toISOString()
            }, { onConflict: 'phone' });
            console.log('Saved last_gasto_item_id to pending_data:', args.item_id);
          } catch (e: any) {
            console.error('Error saving last_gasto_item_id to pending_data:', e.message);
          }
        }

        return JSON.stringify({
          success: true,
          message: `Gasto de "${itemData.descripcion}" registrado para el período ${defaultPeriod}`,
          id: data.id,
          item_id: args.item_id,
          descripcion: itemData.descripcion,
          categoria: itemData.categoria,
          periodo: defaultPeriod,
          monto: args.amount,
          pagado: data.pagado
        })
      }
      // ─── RRHH: AUSENCIAS & ADELANTOS ───
      case 'query_employee_absences': {
        const { data: emp } = await supabase.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró empleado "${args.employee_name}"` })
        let q = supabase.from('employee_absences').select('type, start_date, end_date, days, reason, status, art_case_number').eq('employee_id', emp.id)
        if (args.status) q = q.eq('status', args.status)
        const { data } = await q.order('start_date', { ascending: false }).limit(30)
        const typeLabels: Record<string, string> = { vacation: 'Vacaciones', medical: 'Enfermedad', suspension: 'Suspensión', art_leave: 'ART', half_day: 'Medio Día' }
        const mapped = (data || []).map((a: any) => ({ ...a, tipo_label: typeLabels[a.type] || a.type }))
        return JSON.stringify({ empleado: emp.full_name, ausencias: mapped, total: mapped.length })
      }
      case 'query_employee_advances': {
        const { data: emp } = await supabase.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró empleado "${args.employee_name}"` })
        let q = supabase.from('employee_advances').select('amount_ars, advance_date, reason, deducted').eq('employee_id', emp.id)
        if (args.pending_only) q = q.eq('deducted', false)
        const { data } = await q.order('advance_date', { ascending: false }).limit(30)
        const totalPendiente = (data || []).filter((a: any) => !a.deducted).reduce((s: number, a: any) => s + (a.amount_ars || 0), 0)
        return JSON.stringify({ empleado: emp.full_name, adelantos: data || [], total_pendiente_ars: totalPendiente })
      }

      case 'query_fuel_loads': {
        let q = supabase.from('fuel_loads').select(`
          id, load_number, load_date, day_of_week,
          vehicle_code, vehicle_description, plate,
          driver_name, project_name, supplier, station_name, fuel_type,
          liters, price_per_liter, total_amount, odometer_km,
          load_source, validation_status, workflow_status, unauthorized_load
        `)
        if (args.search) {
          q = q.or(`vehicle_code.ilike.%${args.search}%,vehicle_description.ilike.%${args.search}%,driver_name.ilike.%${args.search}%,plate.ilike.%${args.search}%`)
        }
        if (args.unauthorized_only) q = q.eq('unauthorized_load', true)
        const { data, error } = await q.order('load_date', { ascending: false }).order('created_at', { ascending: false }).limit(args.limit || 10)
        if (error) return JSON.stringify({ error: error.message })
        if (!data?.length) return JSON.stringify({ loads: [], message: 'No hay cargas de combustible registradas con esos filtros.' })
        
        const ultima = data[0]
        return JSON.stringify({
          ultima_carga: {
            numero: ultima.load_number,
            fecha: ultima.load_date,
            dia: ultima.day_of_week,
            vehiculo: `${ultima.vehicle_code || ''} ${ultima.vehicle_description || ''}`.trim(),
            chofer: ultima.driver_name,
            litros: ultima.liters,
            total_ars: ultima.total_amount,
            combustible: ultima.fuel_type,
            estacion_o_origen: ultima.station_name || ultima.supplier || ultima.load_source,
            sin_autorizar: ultima.unauthorized_load
          },
          total_cargas: data.length,
          cargas_recientes: data
        })
      }
      case 'query_fleet_vehicles': {
        let q = supabase.from('fuel_vehicles').select('code, description, vehicle_type, plate, brand, model, year, preferred_fuel, tank_capacity_liters, default_driver, status')
        if (args.search) {
          q = q.or(`code.ilike.%${args.search}%,description.ilike.%${args.search}%,plate.ilike.%${args.search}%`)
        }
        const { data, error } = await q.order('code')
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ vehicles: data || [], count: (data || []).length })
      }
      case 'query_database_table': {
        const table = String(args.table_name || '').trim()
        if (!table || !/^[a-zA-Z0-9_]+$/.test(table)) return JSON.stringify({ error: 'Tabla inválida' })
        let q = supabase.from(table).select(args.select_columns || '*')
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
        q = q.limit(Math.min(Math.max(Number(args.limit) || 15, 1), 50))
        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ table, count: (data || []).length, rows: data || [] })
      }

      // ─── NUEVO MÓDULO DE GESTIÓN DE OBRA (5 FASES) ───
      case 'query_obra_wbs': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id, name').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id, name').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        const { data: rubros, error } = await supabase.from('obra_rubros').select(`
          codigo, nombre, monto_total_ars, incidencia_pct,
          subrubros:obra_subrubros(
            codigo, nombre,
            items:obra_items(codigo_item, descripcion, unidad, cantidad_contractual, precio_unitario_ars, importe_contractual_ars, incidencia_obra_pct)
          )
        `).eq('project_id', projId).order('orden')
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ rubros_count: (rubros || []).length, rubros: rubros || [] })
      }

      case 'query_obra_tramos': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        let q = supabase.from('obra_tramos').select('codigo, nodo_inicio, nodo_fin, longitud_m, diametro_mm, servicios_count, calle_pasaje').eq('project_id', projId).order('orden')
        if (args.nodo) q = q.or(`nodo_inicio.ilike.%${args.nodo}%,nodo_fin.ilike.%${args.nodo}%`)
        const { data, error } = await q.limit(20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ total_tramos: (data || []).length, tramos: data || [] })
      }

      case 'query_obra_matriz_fisica': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        let q = supabase.from('obra_tramo_items').select(`
          id, cantidad_prevista, cantidad_ejecutada, saldo, progreso_pct, estado,
          tramo:obra_tramos!inner(codigo, nodo_inicio, nodo_fin),
          item:obra_items!inner(codigo_item, descripcion, unidad)
        `).eq('project_id', projId)
        if (args.para_programar_only) q = q.gt('saldo', 0)
        const { data, error } = await q.limit(20)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ items_count: (data || []).length, items: data || [] })
      }

      case 'query_obra_odts': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        let q = supabase.from('obra_ordenes_trabajo').select('numero_odt, fecha, meta_cantidad, unidad, cuadrilla_nombre, responsable_nombre, estado').eq('project_id', projId).order('created_at', { ascending: false })
        if (args.estado) q = q.eq('estado', args.estado)
        const { data, error } = await q.limit(10)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ odts_count: (data || []).length, odts: data || [] })
      }

      case 'query_obra_hitos': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        let q = supabase.from('obra_hitos').select('codigo_hito, nombre, tipo, ente_regulador, estado_binario, fecha_inspeccion, acta_numero, inspector_nombre').eq('project_id', projId)
        if (args.estado_binario !== undefined) q = q.eq('estado_binario', args.estado_binario)
        const { data, error } = await q
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ hitos_count: (data || []).length, hitos: data || [] })
      }

      case 'query_obra_certificados': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        const { data, error } = await supabase.from('obra_certificados').select('numero_certificado, periodo_desde, periodo_hasta, base_contractual_ars, acumulado_sin_iva, saldo_sin_iva, neto_a_cobrar, estado').eq('project_id', projId).order('numero_certificado', { ascending: false })
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({ certificados: data || [] })
      }

      // ─── HANDLERS DE GESTIÓN OPERATIVA Y MUTACIÓN (CHAT-OPS) ───
      case 'create_fuel_load': {
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        
        let vehicle: any = null
        if (args.vehicle_code) {
          const { data: vList } = await supabase.from('fuel_vehicles').select('*')
            .or(`code.ilike.%${args.vehicle_code}%,plate.ilike.%${args.vehicle_code}%,description.ilike.%${args.vehicle_code}%`)
            .limit(1)
          if (vList && vList.length > 0) vehicle = vList[0]
        }

        const { count } = await supabase.from('fuel_loads').select('*', { count: 'exact', head: true })
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
          observations: args.observations || `Carga registrada por Rombo WhatsApp (${isBatan ? 'Batán Interno' : 'Estación'})`,
          validation_status: 'ok',
          load_source: isBatan ? 'batan' : 'station',
          created_by: 'rombo-whatsapp'
        }

        const { data: insertedLoad, error: loadErr } = await supabase.from('fuel_loads').insert(newLoad).select().single()
        if (loadErr) return JSON.stringify({ error: loadErr.message })

        let batanMovement = null
        if (isBatan) {
          const { data: bMov, error: bErr } = await supabase.from('fuel_batan_movements').insert({
            tenant_id: tenant?.id,
            movement_number: `DESCARGA-${String(Date.now()).slice(-6)}`,
            movement_date: loadDate,
            movement_type: 'discharge',
            fuel_type: newLoad.fuel_type,
            liters_discharged: liters,
            movement_status: 'completed',
            reference_load: loadNumber,
            observations: `Consumo asociado a la carga: ${loadNumber} (${newLoad.vehicle_code}) registrado por Rombo WhatsApp`
          }).select().single()
          batanMovement = bMov
        }

        if (vehicle?.id && (newLoad.odometer_km || newLoad.hourmeter)) {
          const vUpdates: any = {}
          if (newLoad.odometer_km) vUpdates.current_km = newLoad.odometer_km
          if (newLoad.hourmeter) vUpdates.current_hours = newLoad.hourmeter
          await supabase.from('fuel_vehicles').update(vUpdates).eq('id', vehicle.id)
        }

        return JSON.stringify({
          success: true,
          mensaje: `Carga *${loadNumber}* registrada exitosamente.`,
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
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
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
          observations: args.observations || `Registrado por Rombo WhatsApp`
        }

        const { data, error } = await supabase.from('fuel_batan_movements').insert(newMov).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Movimiento de Batán *${movNumber}* registrado exitosamente.`,
          movimiento: data
        })
      }

      case 'update_cheque_status': {
        const { data: chq, error: findErr } = await supabase.from('cheques').select('*').eq('cheque_number', args.cheque_number).limit(1).single()
        if (findErr || !chq) return JSON.stringify({ error: `No se encontró el cheque ${args.cheque_number}` })
        const { error } = await supabase.from('cheques').update({ status: args.new_status }).eq('id', chq.id)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Cheque N° ${chq.cheque_number} (${chq.bank_name} - $${Number(chq.amount_ars).toLocaleString('es-AR')}) actualizado a "${args.new_status}"`
        })
      }

      case 'register_attendance': {
        const { data: emp } = await supabase.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const attDate = args.date || todayStr
        const hours = args.worked_hours !== undefined ? Number(args.worked_hours) : (args.status === 'present' ? 8 : 0)
        const { data, error } = await supabase.from('attendance_records').upsert({
          employee_id: emp.id,
          date: attDate,
          status: args.status,
          worked_hours: hours,
          notes: args.notes || 'Registrado por Rombo WhatsApp'
        }, { onConflict: 'employee_id,date' }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Asistencia de ${emp.full_name} para el ${attDate} registrada como "${args.status}" (${hours} hs).`
        })
      }

      case 'register_employee_absence': {
        const { data: emp } = await supabase.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const { data, error } = await supabase.from('employee_absences').insert({
          employee_id: emp.id,
          absence_type: args.absence_type,
          start_date: args.start_date,
          end_date: args.end_date || args.start_date,
          reason: args.reason || 'Informado por Rombo WhatsApp',
          status: 'active'
        }).select().single()
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Ausencia/Licencia (${args.absence_type}) de ${emp.full_name} registrada desde el ${args.start_date}.`
        })
      }

      case 'register_employee_advance': {
        const { data: emp } = await supabase.from('employees').select('id, full_name').ilike('full_name', `%${args.employee_name}%`).limit(1).single()
        if (!emp) return JSON.stringify({ error: `No se encontró el empleado "${args.employee_name}"` })
        const { data, error } = await supabase.from('employee_advances').insert({
          employee_id: emp.id,
          amount_ars: Number(args.amount_ars),
          advance_date: args.advance_date || todayStr,
          reason: args.reason || 'Adelanto otorgado vía Rombo WhatsApp',
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
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let tramoId = null
        if (args.tramo_codigo) {
          const { data: tr } = await supabase.from('obra_tramos').select('id').eq('project_id', projId)
            .or(`codigo.ilike.%${args.tramo_codigo}%,nodo_inicio.ilike.%${args.tramo_codigo}%,nodo_fin.ilike.%${args.tramo_codigo}%`).limit(1).single()
          tramoId = tr?.id
        }
        let itemId = null
        if (args.item_codigo) {
          const { data: it } = await supabase.from('obra_items').select('id').eq('project_id', projId)
            .or(`codigo_item.ilike.%${args.item_codigo}%,descripcion.ilike.%${args.item_codigo}%`).limit(1).single()
          itemId = it?.id
        }

        const { count } = await supabase.from('obra_ordenes_trabajo').select('*', { count: 'exact', head: true }).eq('project_id', projId)
        const nextNum = (count || 0) + 1
        const numeroOdt = `ODT-${String(nextNum).padStart(4, '0')}`

        const { data, error } = await supabase.from('obra_ordenes_trabajo').insert({
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
          mensaje: `Orden de Trabajo *${numeroOdt}* emitida para cuadrilla ${args.cuadrilla_nombre} (Meta: ${args.meta_cantidad} ml).`,
          odt: data
        })
      }

      case 'register_obra_produccion': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }

        let odtId = null
        if (args.odt_numero) {
          const { data: odt } = await supabase.from('obra_ordenes_trabajo').select('id').eq('project_id', projId).ilike('numero_odt', `%${args.odt_numero}%`).limit(1).single()
          odtId = odt?.id
        }

        const { data, error } = await supabase.from('obra_parte_diario_items').insert({
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
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        if (!projId) {
          const { data: roque } = await supabase.from('projects').select('id').ilike('name', '%Roque%').limit(1).single()
          projId = roque?.id
        }
        const { data: hito, error: hErr } = await supabase.from('obra_hitos').select('*').eq('project_id', projId)
          .or(`codigo_hito.ilike.%${args.codigo_hito}%,nombre.ilike.%${args.codigo_hito}%`).limit(1).single()
        if (hErr || !hito) return JSON.stringify({ error: `No se encontró el hito "${args.codigo_hito}"` })
        
        const updates: any = {
          estado_binario: Number(args.estado_binario),
          fecha_inspeccion: args.fecha_inspeccion || todayStr,
          acta_numero: args.acta_numero || hito.acta_numero,
          inspector_nombre: args.inspector_nombre || hito.inspector_nombre,
          observaciones: args.observaciones || hito.observaciones
        }
        const { error } = await supabase.from('obra_hitos').update(updates).eq('id', hito.id)
        if (error) return JSON.stringify({ error: error.message })
        return JSON.stringify({
          success: true,
          mensaje: `Hito *${hito.codigo_hito}* (${hito.nombre}) actualizado a ${args.estado_binario === 100 ? '100% (Aprobado)' : '0% (Pendiente)'}.${args.acta_numero ? ` Acta N°: ${args.acta_numero}` : ''}`
        })
      }

      case 'register_safety_incident': {
        let projId = null
        if (args.project_name) {
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        const { data, error } = await supabase.from('seguridad_incidentes').insert({
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
          const { data: p } = await supabase.from('projects').select('id').ilike('name', `%${args.project_name}%`).limit(1).single()
          projId = p?.id
        }
        const sev = Number(args.severidad) || 2
        const prob = Number(args.probabilidad) || 2
        const { data, error } = await supabase.from('seguridad_observaciones').insert({
          obra_id: projId,
          fecha: todayStr,
          observador: args.observador || 'Rombo WhatsApp',
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
        const { data: tenant } = await supabase.from('tenants').select('id').limit(1).single()
        const payload = { ...args.data }
        if (table !== 'tenants' && !payload.tenant_id && tenant?.id) {
          payload.tenant_id = tenant.id
        }
        if (args.action_type === 'insert') {
          const { data, error } = await supabase.from(table).insert(payload).select().single()
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'insert', table, record: data })
        } else if (args.action_type === 'update') {
          if (!args.filter_column || args.filter_value === undefined) return JSON.stringify({ error: 'filter_column y filter_value requeridos para update' })
          const { data, error } = await supabase.from(table).update(args.data).eq(args.filter_column, args.filter_value).select()
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'update', table, updated_count: data?.length })
        } else if (args.action_type === 'delete') {
          if (!args.filter_column || args.filter_value === undefined) return JSON.stringify({ error: 'filter_column y filter_value requeridos para delete' })
          const { error } = await supabase.from(table).delete().eq(args.filter_column, args.filter_value)
          if (error) return JSON.stringify({ error: error.message })
          return JSON.stringify({ success: true, action: 'delete', table })
        }
        return JSON.stringify({ error: 'action_type no soportado' })
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

    // ── Verificar si el bot está silenciado / desconectado ──
    const { data: botStatusSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'rombo_bot_status')
      .maybeSingle();

    if (botStatusSetting?.value === 'silenced') {
      console.log(`[ROMBO SILENCIADO] Mensaje recibido de ${phone}: "${body}". No se genera respuesta.`);

      // Guardar mensaje entrante del usuario en la base para no perder la conversación
      try {
        const { data: currentConv } = await supabase
          .from('whatsapp_conversations')
          .select('messages')
          .eq('phone', phone)
          .maybeSingle();

        let msgs: any[] = [];
        if (currentConv?.messages) {
          try {
            msgs = typeof currentConv.messages === 'string' ? JSON.parse(currentConv.messages) : currentConv.messages;
          } catch (_) {}
        }
        msgs.push({ role: 'user', content: body || '[Archivo adjunto]', timestamp: new Date().toISOString() });
        const trimmed = msgs.slice(-20);

        await supabase.from('whatsapp_conversations').upsert({
          phone,
          messages: JSON.stringify(trimmed),
          updated_at: new Date().toISOString(),
        }, { onConflict: 'phone' });
      } catch (saveErr: any) {
        console.warn('Error archivando mensaje en modo silencio:', saveErr.message);
      }

      return new Response(JSON.stringify({ 
        success: true, 
        status: 'silenced', 
        message: 'Bot silenciado temporalmente.' 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    let bodyText = body;
    let visionMediaObject: any = null;
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
        } else if (contentType.includes("image") || contentType.includes("pdf")) {
          const isPdf = contentType.includes("pdf");
          console.log(`${isPdf ? 'PDF' : 'Imagen'} detectado. Procesando con Vision OCR...`);
          
          const mediaBlob = await mediaRes.blob();
          const buffer = await mediaBlob.arrayBuffer();
          const bytes = new Uint8Array(buffer);
          let binary = "";
          for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
          const base64Data = btoa(binary);

          // Subir a Storage
          const fileExt = isPdf ? 'pdf' : (contentType.split('/')[1] || 'jpg');
          const fileName = `${phone}_${Date.now()}.${fileExt}`;
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('whatsapp_media')
            .upload(fileName, mediaBlob, {
              contentType,
              upsert: false
            });
          
          let publicUrl = '';
          if (uploadErr) {
            console.error('Error subiendo archivo a Storage:', uploadErr);
          } else {
            const { data: publicUrlData } = supabase.storage.from('whatsapp_media').getPublicUrl(fileName);
            publicUrl = publicUrlData.publicUrl;
            console.log(`Archivo subido: ${publicUrl}`);
          }

          if (isPdf) {
            visionMediaObject = {
              type: "file",
              file: {
                filename: "documento.pdf",
                file_data: `data:application/pdf;base64,${base64Data}`,
              },
            };
          } else {
            visionMediaObject = {
              type: "image_url",
              image_url: {
                url: `data:${contentType};base64,${base64Data}`,
                detail: "high",
              },
            };
          }

          if (!bodyText || !bodyText.trim()) {
            bodyText = `Te envié un documento o foto. Analizá si es un cheque o una factura. NO LO CARGUES INMEDIATAMENTE. Preguntame qué quiero hacer con este archivo. Recordá esta URL pública para cuando decida cargarlo: ${publicUrl}`;
          } else {
            // Si el usuario escribió algo junto con la foto, agregar contexto de detección
            const lowerBody = bodyText.toLowerCase();
            if (lowerBody.includes('cheque') || lowerBody.includes('chq')) {
              bodyText += ` [DOCUMENTO ADJUNTO: Es un cheque. NO lo cargues sin preguntarme antes. Recordá esta URL: ${publicUrl}]`;
            } else {
              bodyText += ` [DOCUMENTO ADJUNTO: Analizalo e interpretá mi mensaje para decidir la acción, pero PREGUNTAME antes de registrar en la base de datos. Recordá esta URL: ${publicUrl}]`;
            }
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
      // ── Obtener historial de conversación (últimos 20 msgs) y datos pendientes ──
      const { data: history } = await supabase
        .from('whatsapp_conversations')
        .select('messages, pending_data')
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
      let imageOcrPrompt = '';
      if (visionMediaObject) {
        const lowerBody = bodyText.toLowerCase();
        const isChequeContext = lowerBody.includes('cheque') || lowerBody.includes('chq');
        
        if (isChequeContext) {
          imageOcrPrompt = `\n\n## INSTRUCCIÓN ESPECIAL PARA ESTE DOCUMENTO — CHEQUE
El usuario envió un DOCUMENTO O FOTO DE CHEQUE. Debés:
1. Analizar la imagen con máximo detalle.
2. Extraer los datos del cheque: banco emisor, número de cheque, monto, fecha de emisión, fecha de pago/vencimiento, beneficiario.
3. NO LO CARGUES INMEDIATAMENTE. Preguntale al usuario si desea registrar este cheque, y decile qué datos identificaste.
4. Si el usuario confirma, recién ahí ejecutá la herramienta create_cheque pasándole los campos y la URL pública (scan_url).
5. Si algún dato no es legible, preguntáselo al usuario.`;
        } else {
          imageOcrPrompt = `\n\n## INSTRUCCIÓN ESPECIAL PARA ESTE DOCUMENTO
El usuario envió un DOCUMENTO O FOTO. Debés:
1. Analizar la imagen para determinar si es factura o cheque.
2. NO LO CARGUES INMEDIATAMENTE. Extraé los datos e interpretá lo que el usuario escribió en el mensaje.
3. Preguntale al usuario si desea registrar este documento (ej: "¿Querés que cargue esta factura de X por $Y?").
4. Si el usuario confirma, recién ahí ejecutá la herramienta correspondiente (create_purchase_invoice o create_cheque) incluyendo la URL pública (scan_url) que te llegó en el mensaje.`;
        }
      }

      const systemPrompt = buildSystemPrompt()
      const openaiMessages: any[] = [
        { role: 'system', content: systemPrompt + imageOcrPrompt }
      ];
      for (const m of chatMessages) {
        // If this is the last user message and has an image/pdf, send as multimodal
        if (m === chatMessages[chatMessages.length - 1] && m.role === 'user' && visionMediaObject) {
          openaiMessages.push({
            role: 'user',
            content: [
              { type: 'text', text: m.content },
              visionMediaObject
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

      // Use gpt-4o for Vision/PDF requests, gpt-4o-mini for text-only
      const modelToUse = visionMediaObject ? 'gpt-4o' : 'gpt-4o-mini';
      console.log(`Modelo: ${modelToUse}${visionMediaObject ? ' (Vision OCR activo)' : ''}`);

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

            const result = await executeTool(supabase, fnName, fnArgs, phone);
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

      // Get current pending_data before saving to avoid overwriting what was set in tools
      const { data: latestConv } = await supabase.from('whatsapp_conversations').select('pending_data').eq('phone', phone).single();
      const finalPending = latestConv?.pending_data || {};

      await supabase.from('whatsapp_conversations').upsert({
        phone,
        messages: JSON.stringify(trimmed),
        last_intent: null,
        pending_data: finalPending,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'phone' });

      const bbApiKey = Deno.env.get("BUILDERBOT_API_KEY") || 'bb-3c45fa69-2776-4275-82b6-2d6df9e08ec6';
      const bbProjectId = Deno.env.get("BUILDERBOT_PROJECT_ID") || 'c3fd918b-b736-40dc-a841-cbb73d3b2a8d';
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
