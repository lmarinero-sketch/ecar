import { create } from 'zustand';
import { mockData } from './mockData';
import type { WbsElement, Warehouse, Item, Asset, Project } from './mockData';
import { v4 as uuidv4 } from 'uuid';

type State = {
  activeModule: 'bi' | 'wbs' | 'logistics' | 'field' | 'fleet' | 'certifications' | 'redetermination';
  projects: Project[];
  wbsElements: WbsElement[];
  financialAcopios: typeof mockData.financialAcopios;
  physicalInventory: typeof mockData.inventoryLedger;
  assets: Asset[];
  employees: typeof mockData.employees;
  items: typeof mockData.items;
  certifications: typeof mockData.certifications;
  indices: typeof mockData.indices;
  kpis: typeof mockData.kpis;
  
  setActiveModule: (module: State['activeModule']) => void;
  createPurchaseOrder: (wbsId: string, amount: number) => { success: boolean; message: string };
  issueRemitoRetiro: (acopioId: string, qty: number, toWarehouseId: string) => void;
  recordDailyLog: (wbsId: string, itemId: string, qty: number, fromWarehouseId: string) => void;
  transferAsset: (assetId: string, toProjectId: string, toWarehouseId: string) => void;
  generateCertification: (projectId: string) => void;
};

export const useStore = create<State>((set) => ({
  activeModule: 'bi',
  projects: mockData.projects,
  wbsElements: mockData.wbsElements,
  financialAcopios: mockData.financialAcopios,
  physicalInventory: mockData.inventoryLedger,
  assets: mockData.assets,
  employees: mockData.employees,
  items: mockData.items,
  certifications: mockData.certifications,
  indices: mockData.indices,
  kpis: mockData.kpis,

  setActiveModule: (module) => set({ activeModule: module }),

  createPurchaseOrder: (wbsId, amount) => {
    let result = { success: true, message: 'Orden de Compra emitida exitosamente.' };
    set((state) => {
      const el = state.wbsElements.find(e => e.id === wbsId);
      if (!el) return state;

      const remainingBudget = el.budgetCostARS - el.committedCostARS;
      if (amount > remainingBudget) {
        result = { success: false, message: `HARD STOP: A$ ${amount.toLocaleString()} excede presupuesto disponible.` };
        return state;
      }
      return { wbsElements: state.wbsElements.map(e => e.id === wbsId ? { ...e, committedCostARS: e.committedCostARS + amount } : e) };
    });
    return result;
  },

  issueRemitoRetiro: (acopioId, qty, toWarehouseId) => set((state) => {
    const acopio = state.financialAcopios.find(a => a.id === acopioId);
    if (!acopio || acopio.remainingQty < qty) return state;
    return { 
      financialAcopios: state.financialAcopios.map(a => a.id === acopioId ? { ...a, remainingQty: a.remainingQty - qty } : a),
      physicalInventory: [...state.physicalInventory, { id: uuidv4(), timestamp: new Date().toISOString(), itemId: acopio.itemId, warehouseId: toWarehouseId, qty, type: 'Receipt' }]
    };
  }),

  recordDailyLog: (wbsId, itemId, qty, fromWarehouseId) => set((state) => {
    const item = mockData.items.find(i => i.id === itemId);
    if (!item) return state;
    const cost = item.priceARS * qty;
    return {
      physicalInventory: [...state.physicalInventory, { id: uuidv4(), timestamp: new Date().toISOString(), itemId: itemId, warehouseId: fromWarehouseId, qty: -qty, type: 'Consumption' }],
      wbsElements: state.wbsElements.map(e => e.id === wbsId ? { ...e, accruedCostARS: e.accruedCostARS + cost } : e)
    };
  }),

  transferAsset: (assetId, toProjectId, toWarehouseId) => set((state) => ({
    assets: state.assets.map(a => a.id === assetId ? { ...a, currentProjectId: toProjectId, currentWarehouseId: toWarehouseId, status: 'Assigned' } : a)
  })),

  generateCertification: (projectId) => set((state) => {
    // Generate a new draft certification based on actual WBS progress of the project
    const projectWbs = state.wbsElements.filter(w => w.projectId === projectId && w.parentId);
    // calc revenue based on progress percent
    const revenue = projectWbs.reduce((acc, w) => acc + (w.budgetRevenueARS * (w.progressPct / 100)), 0);
    // simplistic redetermination calculation based on CAC
    const redet = revenue * (state.indices.cacVariation / 100);
    
    const newCert = {
      id: `cert-${Date.now()}`,
      projectId,
      period: state.indices.currentMonth,
      totalRevenueBaseARS: revenue,
      redeterminationARS: redet,
      totalInvoicedARS: revenue + redet,
      status: 'Draft'
    };
    return { certifications: [newCert, ...state.certifications] };
  })
}));
