export type Tenant = { id: string; name: string };
export type Project = { id: string; tenantId: string; name: string; status: 'Active' | 'Completed'; budgetARS: number; client: string; location: string };
export type WbsElement = { id: string; projectId: string; parentId: string | null; name: string; budgetCostARS: number; budgetRevenueARS: number; committedCostARS: number; accruedCostARS: number; progressPct: number; isHardStop?: boolean };
export type Warehouse = { id: string; type: 'Central' | 'Site' | 'Mobile'; name: string };
export type Item = { id: string; name: string; category: 'Consumable' | 'Asset'; uom: string; priceARS: number };
export type Asset = { id: string; itemId: string; serialNumber: string; status: 'Available' | 'Assigned' | 'InTransit' | 'Maintenance'; currentWarehouseId: string; currentProjectId: string | null; dailyDepreciationARS: number };

// Initial Mock State
export const mockData = {
  tenant: { id: 't-1', name: 'ECAR Constructora' },
  projects: [
    { id: 'p-1', tenantId: 't-1', name: 'Autopista Ruta 40 Sur', status: 'Active', budgetARS: 1540000000, client: 'Vialidad Nacional', location: 'Pocito, San Juan' } as Project,
    { id: 'p-2', tenantId: 't-1', name: 'Hospital Rawson - Ala Este', status: 'Active', budgetARS: 875000000, client: 'Ministerio de Salud Pública SJ', location: 'Capital, San Juan' } as Project,
    { id: 'p-3', tenantId: 't-1', name: 'Dique Tambolar Fase 2', status: 'Active', budgetARS: 3250000000, client: 'EPSE San Juan', location: 'Calingasta, San Juan' } as Project,
    { id: 'p-4', tenantId: 't-1', name: 'Barrio IPV - 100 Casas', status: 'Active', budgetARS: 1200000000, client: 'IPV San Juan', location: 'Chimbas, San Juan' } as Project,
    { id: 'p-5', tenantId: 't-1', name: 'Consorcio Oficinas (Torre 3)', status: 'Active', budgetARS: 450000000, client: 'Inversor Privado', location: 'Rivadavia, San Juan' } as Project,
    { id: 'p-6', tenantId: 't-1', name: 'Galpón Logístico ML', status: 'Active', budgetARS: 180000000, client: 'Mercado Libre', location: 'Pocito, San Juan' } as Project,
  ],
  wbsElements: [
    // P1 WBS
    { id: 'w-1', projectId: 'p-1', parentId: null, name: '1. Movimiento de Suelos', budgetCostARS: 500000000, budgetRevenueARS: 650000000, committedCostARS: 420000000, accruedCostARS: 380000000, progressPct: 85 },
    { id: 'w-1-1', projectId: 'p-1', parentId: 'w-1', name: '1.1. Excavación a cielo abierto', budgetCostARS: 200000000, budgetRevenueARS: 260000000, committedCostARS: 195000000, accruedCostARS: 190000000, progressPct: 95 },
    { id: 'w-1-2', projectId: 'p-1', parentId: 'w-1', name: '1.2. Compactación de base', budgetCostARS: 300000000, budgetRevenueARS: 390000000, committedCostARS: 225000000, accruedCostARS: 190000000, progressPct: 60 },
    { id: 'w-2', projectId: 'p-1', parentId: null, name: '2. Hormigonado y Estructuras', budgetCostARS: 600000000, budgetRevenueARS: 780000000, committedCostARS: 100000000, accruedCostARS: 50000000, progressPct: 10 },
    { id: 'w-3', projectId: 'p-1', parentId: null, name: '3. Asfaltado y Terminaciones', budgetCostARS: 440000000, budgetRevenueARS: 572000000, committedCostARS: 0, accruedCostARS: 0, progressPct: 0 },
    
    // P2 WBS
    { id: 'w-4', projectId: 'p-2', parentId: null, name: '1. Obra Gruesa Hospital', budgetCostARS: 350000000, budgetRevenueARS: 450000000, committedCostARS: 300000000, accruedCostARS: 280000000, progressPct: 70 },
    
    // P4 WBS (100 Casas IPV)
    { id: 'w-5', projectId: 'p-4', parentId: null, name: '1. Fundaciones Loteo', budgetCostARS: 200000000, budgetRevenueARS: 260000000, committedCostARS: 180000000, accruedCostARS: 150000000, progressPct: 80 },
    { id: 'w-5-1', projectId: 'p-4', parentId: null, name: '2. Mampostería y Techos', budgetCostARS: 400000000, budgetRevenueARS: 520000000, committedCostARS: 200000000, accruedCostARS: 80000000, progressPct: 35 },

    // P5 WBS (Consorcio)
    { id: 'w-6', projectId: 'p-5', parentId: null, name: '1. Hormigón Armado Torre', budgetCostARS: 180000000, budgetRevenueARS: 250000000, committedCostARS: 100000000, accruedCostARS: 90000000, progressPct: 55 },

    // P6 WBS (Galpon ML)
    { id: 'w-7', projectId: 'p-6', parentId: null, name: '1. Estructura Metálica Nave Central', budgetCostARS: 80000000, budgetRevenueARS: 120000000, committedCostARS: 75000000, accruedCostARS: 60000000, progressPct: 90 },
  ] as WbsElement[],
  items: [
    { id: 'i-1', name: 'Cemento Loma Negra 50kg', category: 'Consumable', uom: 'Bolsas', priceARS: 8500 },
    { id: 'i-2', name: 'Acero Acindar 12mm', category: 'Consumable', uom: 'Varillas', priceARS: 12000 },
    { id: 'i-3', name: 'Hormigón Elaborado H21 (Premix)', category: 'Consumable', uom: 'm3', priceARS: 95000 },
    { id: 'i-4', name: 'Excavadora Cat 320', category: 'Asset', uom: 'Unidad', priceARS: 250000000 },
    { id: 'i-5', name: 'Motoniveladora John Deere', category: 'Asset', uom: 'Unidad', priceARS: 310000000 },
    { id: 'i-6', name: 'Arena San Juan Gruesa', category: 'Consumable', uom: 'm3', priceARS: 18000 },
    // Fleet Items
    { id: 'i-7', name: 'Grúa Torre Potain MC 175', category: 'Asset', uom: 'Unidad', priceARS: 150000000 },
    { id: 'i-8', name: 'Compactador Dynapac CA250', category: 'Asset', uom: 'Unidad', priceARS: 95000000 },
    { id: 'i-9', name: 'Retroexcavadora JCB 3CX', category: 'Asset', uom: 'Unidad', priceARS: 85000000 },
    { id: 'i-10', name: 'Camión Mixer Volquete 8m3', category: 'Asset', uom: 'Unidad', priceARS: 110000000 },
    { id: 'i-11', name: 'Cargadora Volvo L90', category: 'Asset', uom: 'Unidad', priceARS: 135000000 },
  ] as Item[],
  assets: [
    { id: 'a-1', itemId: 'i-4', serialNumber: 'CAT-320-SJ01', status: 'Assigned', currentWarehouseId: 'wh-3', currentProjectId: 'p-1', dailyDepreciationARS: 55000 },
    { id: 'a-2', itemId: 'i-5', serialNumber: 'JD-MOTO-99', status: 'Available', currentWarehouseId: 'wh-1', currentProjectId: null, dailyDepreciationARS: 68000 },
    { id: 'a-3', itemId: 'i-7', serialNumber: 'POT-175-01', status: 'Assigned', currentWarehouseId: 'wh-4', currentProjectId: 'p-3', dailyDepreciationARS: 42000 },
    { id: 'a-4', itemId: 'i-8', serialNumber: 'DYN-CA-001', status: 'Maintenance', currentWarehouseId: 'wh-1', currentProjectId: null, dailyDepreciationARS: 28000 },
    { id: 'a-5', itemId: 'i-9', serialNumber: 'JCB-3CX-55', status: 'Assigned', currentWarehouseId: 'wh-3', currentProjectId: 'p-4', dailyDepreciationARS: 32000 },
    { id: 'a-6', itemId: 'i-10', serialNumber: 'MIX-MB-002', status: 'InTransit', currentWarehouseId: 'wh-1', currentProjectId: 'p-1', dailyDepreciationARS: 38000 },
    { id: 'a-7', itemId: 'i-11', serialNumber: 'VOL-L90-09', status: 'Available', currentWarehouseId: 'wh-4', currentProjectId: null, dailyDepreciationARS: 48000 },
  ] as Asset[],
  employees: [
    { id: 'e-1', fullName: 'Carlos Rojas', cuil: '20-31456789-1', uocraCategory: 'Oficial Especializado', profileDesc: 'Operador de maquinaria pesada. Manejo exclusivo de Excavadora Cat 320 y Grúas. Apto físico médico al día (Resolución SRT).', currentProjectId: 'p-1' },
    { id: 'e-2', fullName: 'Miguel Ángel Torres', cuil: '20-25890123-4', uocraCategory: 'Oficial', profileDesc: 'Armador de hierro y estructura. Lectura de planos avanzada. Tareas de replanteo y dirección de cuadrilla de hormigonado.', currentProjectId: 'p-3' },
    { id: 'e-3', fullName: 'Juan Domingo Pérez', cuil: '20-41002345-8', uocraCategory: 'Medio Oficial', profileDesc: 'Asistencia en albañilería general. Preparación de mezcla, revoque grueso y fino. Tareas rotativas según necesidad del Oficial.', currentProjectId: 'p-4' },
    { id: 'e-4', fullName: 'Roberto Sánchez', cuil: '20-38999123-5', uocraCategory: 'Ayudante', profileDesc: 'Limpieza de obra, acarreo de materiales, zanjeo manual, carga y descarga de herramientas. Tareas de esfuerzo físico.', currentProjectId: 'p-1' },
    { id: 'e-5', fullName: 'Héctor Gómez', cuil: '20-29111222-6', uocraCategory: 'Oficial Especializado', profileDesc: 'Soldador calificado SMAW/TIG. Estructuras metálicas de alta resistencia (Galpones, naves industriales).', currentProjectId: 'p-6' },
    { id: 'e-6', fullName: 'Diego Luna', cuil: '20-35666777-3', uocraCategory: 'Oficial', profileDesc: 'Electricista de obra e instalador. Armado de tableros trifásicos provisionales y definitivos.', currentProjectId: 'p-5' },
    { id: 'e-7', fullName: 'Marcos Villegas', cuil: '20-40112233-1', uocraCategory: 'Ayudante', profileDesc: 'Logística interna, acomodado de acopios físicos en obrador. Tareas generales.', currentProjectId: 'p-3' },
    { id: 'e-8', fullName: 'Raúl Orellana', cuil: '20-27888999-0', uocraCategory: 'Medio Oficial', profileDesc: 'Carpintero de encofrados para tabiques y losas. Colaboración con armadores.', currentProjectId: 'p-2' },
    { id: 'e-9', fullName: 'Luis Domínguez', cuil: '20-33445566-7', uocraCategory: 'Oficial', profileDesc: 'Albañil de primera. Colocación de cerámicos y terminaciones finas.', currentProjectId: 'p-4' },
    { id: 'e-10', fullName: 'Tomás Aguilar', cuil: '20-42111000-8', uocraCategory: 'Ayudante', profileDesc: 'Zanjeo manual y demoliciones. Soporte directo a electricistas y plomeros.', currentProjectId: null },
    { id: 'e-11', fullName: 'Jorge Reynoso', cuil: '20-26444333-2', uocraCategory: 'Oficial Especializado', profileDesc: 'Conductor de camión mixer volquete y semirremolques. Licencia nacional habilitante (Moyano).', currentProjectId: 'p-1' },
    { id: 'e-12', fullName: 'Ariel Castro', cuil: '20-39555444-9', uocraCategory: 'Medio Oficial', profileDesc: 'Pintura de obra e impermeabilización de terrazas. Uso de soplete y rodillo.', currentProjectId: 'p-5' },
    { id: 'e-13', fullName: 'Cristian Riveros', cuil: '20-37666555-5', uocraCategory: 'Oficial', profileDesc: 'Sanitarista y plomero. Termofusión y pruebas de presión.', currentProjectId: 'p-2' },
    { id: 'e-14', fullName: 'Gabriel Sarmiento', cuil: '20-41777888-2', uocraCategory: 'Ayudante', profileDesc: 'Ayudante de carga y descarga en depósito central.', currentProjectId: null },
    { id: 'e-15', fullName: 'Matías Godoy', cuil: '20-32111999-4', uocraCategory: 'Oficial Especializado', profileDesc: 'Topógrafo / Agrimensor. Uso de estación total y nivel láser.', currentProjectId: 'p-1' },
    { id: 'e-16', fullName: 'Jonathan Pérez', cuil: '20-36222888-1', uocraCategory: 'Oficial', profileDesc: 'Techista y zinguería.', currentProjectId: 'p-4' },
    { id: 'e-17', fullName: 'Ezequiel Paz', cuil: '20-38888777-6', uocraCategory: 'Medio Oficial', profileDesc: 'Durlockero e instalador de tabiques de yeso.', currentProjectId: 'p-5' },
    { id: 'e-18', fullName: 'Agustín Flores', cuil: '20-43555222-7', uocraCategory: 'Ayudante', profileDesc: 'Orden general de obra y banderillero en accesos viales.', currentProjectId: 'p-1' },
    { id: 'e-19', fullName: 'Fernando Quiroga', cuil: '20-25666111-9', uocraCategory: 'Oficial Especializado', profileDesc: 'Operador de Compactador y Motoniveladora.', currentProjectId: 'p-1' },
    { id: 'e-20', fullName: 'Silvio Arce', cuil: '20-30222444-5', uocraCategory: 'Oficial', profileDesc: 'Colocador de pisos industriales y alisado mecánico.', currentProjectId: 'p-6' },
  ],
  warehouses: [
    { id: 'wh-1', type: 'Central', name: 'Depósito Central San Juan (Rawson)' },
    { id: 'wh-2', type: 'Mobile', name: 'Camioneta Flota 1 (Pocito) (Dominio AE-452-XX)' },
    { id: 'wh-3', type: 'Site', name: 'Obrador Ruta 40 Sur' },
    { id: 'wh-4', type: 'Site', name: 'Obrador Dique Tambolar' },
  ] as Warehouse[],
  inventoryLedger: [
    { id: 'il-1', timestamp: new Date(Date.now() - 864000000).toISOString(), itemId: 'i-1', warehouseId: 'wh-1', qty: 10000, type: 'Receipt' },
    { id: 'il-2', timestamp: new Date(Date.now() - 400000000).toISOString(), itemId: 'i-6', warehouseId: 'wh-3', qty: 500, type: 'Receipt' },
  ],
  financialAcopios: [
    { id: 'fa-1', provider: 'Corralón San Juan (Capital)', itemId: 'i-2', prepurchasedQty: 8000, remainingQty: 5000, lockedPriceARS: 9000 }, 
    { id: 'fa-2', provider: 'Hormigonera Cuyana (Chimbas)', itemId: 'i-3', prepurchasedQty: 1000, remainingQty: 1000, lockedPriceARS: 81000 }, 
  ],
  certifications: [
    { id: 'cert-1', projectId: 'p-1', period: 'Marzo 2026', totalRevenueBaseARS: 125000000, redeterminationARS: 18000000, totalInvoicedARS: 143000000, status: 'Approved' }
  ],
  indices: {
    baseMonth: 'Enero 2026',
    currentMonth: 'Abril 2026',
    cacVariation: 14.5,
    indecVariation: 12.8,
  },
  kpis: {
    otif: 87.5,
    vac: -4500000, 
    turnoverRate: 4.2,
    fleetUtilization: 82,
    spi: 0.98 
  }
};
