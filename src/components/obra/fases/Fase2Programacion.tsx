import React, { useState, useMemo } from 'react';
import {
  Calendar, Send, CheckCircle2, Clock, Filter, FileText,
  Truck, Wrench, Users, Package, Plus, Search,
  FolderTree, Eye, Trash2, BellRing, Lock, Unlock, Edit3, Check, GitBranch
} from 'lucide-react';
import {
  useObraRubros,
  useObraItems,
  useObraOrdenesTrabajo,
  useCreateObraOrdenTrabajo,
  useUpdateObraOrdenTrabajo,
  useDeleteObraOrdenTrabajo,
  useObraParteDiarioItems,
  useDeleteObraParteDiarioItem
} from '../../../hooks/useNuevoModuloObra';
import { useEmployees, useFuelVehicles, useInventoryItems } from '../../../hooks/useData';
import type { ObraItem, ObraOrdenTrabajo } from '../../../lib/types';
import { ModalPortal } from '../../common/ModalPortal';
import { useModalStore } from '../../../store/useModalStore';

interface Fase2ProgramacionProps {
  projectId: string;
  projectName?: string;
}

export interface SecuenciaRule {
  permiteIniciarOtra: 'no' | 'si';
  allowedItemIds: string[];
  cleanInstrucciones: string;
  hasExplicitRule: boolean;
}

const SECUENCIA_REGEX = /\s*\[SECUENCIA:(NO|SI(?::[^\]]*)?)\]/i;

export function parseSecuenciaFromInstrucciones(raw?: string | null): SecuenciaRule {
  const text = raw || '';
  const match = text.match(SECUENCIA_REGEX);
  const cleanInstrucciones = text.replace(SECUENCIA_REGEX, '').trim();

  if (!match) {
    return {
      permiteIniciarOtra: 'no',
      allowedItemIds: [],
      cleanInstrucciones,
      hasExplicitRule: false
    };
  }

  const token = match[1];
  if (token.toUpperCase() === 'NO') {
    return {
      permiteIniciarOtra: 'no',
      allowedItemIds: [],
      cleanInstrucciones,
      hasExplicitRule: true
    };
  }

  const parts = token.split(':');
  const idsRaw = parts.slice(1).join(':').trim();
  const allowedItemIds = idsRaw ? idsRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
  return {
    permiteIniciarOtra: 'si',
    allowedItemIds,
    cleanInstrucciones,
    hasExplicitRule: true
  };
}

export function buildInstruccionesWithSecuencia(
  cleanText: string,
  permiteIniciarOtra: 'no' | 'si',
  allowedItemIds: string[]
): string {
  const base = (cleanText || '').replace(SECUENCIA_REGEX, '').trim();
  const tag =
    permiteIniciarOtra === 'no'
      ? '[SECUENCIA:NO]'
      : `[SECUENCIA:SI:${allowedItemIds.join(',')}]`;
  return base ? `${base} ${tag}` : tag;
}

export const Fase2Programacion: React.FC<Fase2ProgramacionProps> = ({
  projectId
}) => {
  const { data: rubros = [] } = useObraRubros(projectId);
  const { data: items = [], isLoading: loadingItems } = useObraItems(projectId);
  const { data: odts = [] } = useObraOrdenesTrabajo(projectId);
  const { data: partes = [] } = useObraParteDiarioItems(projectId);
  const { data: employees = [] } = useEmployees();
  const { data: fuelVehicles = [] } = useFuelVehicles();
  const { data: inventoryItems = [] } = useInventoryItems();

  const createOdt = useCreateObraOrdenTrabajo();
  const updateOdt = useUpdateObraOrdenTrabajo();
  const deleteOdt = useDeleteObraOrdenTrabajo();
  const deleteParte = useDeleteObraParteDiarioItem();

  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [hideEmittedOrCompleted, setHideEmittedOrCompleted] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<'para_programar' | 'odts'>('para_programar');
  const [selectedWbsItem, setSelectedWbsItem] = useState<(ObraItem & {
    saldo: number;
    contractual: number;
    programadoOdt: number;
    ejecutadoReal: number;
    pctEjecutado: number;
    rubroNombre: string;
  }) | null>(null);
  const [viewingOdt, setViewingOdt] = useState<ObraOrdenTrabajo | null>(null);

  // Estados de edición rápida en el modal de Informe de ODT (Meta y Secuencia)
  const [editingMetaValue, setEditingMetaValue] = useState<string>('');
  const [isEditingMeta, setIsEditingMeta] = useState<boolean>(false);
  const [editSecuenciaMode, setEditSecuenciaMode] = useState<'no' | 'si'>('no');
  const [editAllowedItemIds, setEditAllowedItemIds] = useState<string[]>([]);
  const [editSuccessorSearch, setEditSuccessorSearch] = useState<string>('');

  // Estados de Regla de Secuencia al emitir una nueva ODT
  const [permiteIniciarOtra, setPermiteIniciarOtra] = useState<'no' | 'si'>('no');
  const [allowedSuccessorIds, setAllowedSuccessorIds] = useState<string[]>([]);
  const [successorSearch, setSuccessorSearch] = useState<string>('');

  // Estados de Checklist de Recursos Operativos
  const [resourceTab, setResourceTab] = useState<'maquinaria' | 'personal' | 'herramientas' | 'materiales'>('maquinaria');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolInput, setCustomToolInput] = useState('');

  // Estados para Checklist de Materiales + Observaciones / Aviso a Logística
  const [selectedMaterials, setSelectedMaterials] = useState<string[]>([]);
  const [customMaterialInput, setCustomMaterialInput] = useState('');
  const [materialSearch, setMaterialSearch] = useState('');
  const [faltanteMaterialObs, setFaltanteMaterialObs] = useState('');
  const [notifyLogisticsMissing, setNotifyLogisticsMissing] = useState(false);

  // Catálogo base de herramientas y equipos de obra
  const HERRAMIENTAS_CATALOGO = useMemo(() => [
    'Vibroapisonador (Sapito)',
    'Placa compactadora vibratoria',
    'Termofusora PEAD / Espejo',
    'Cortadora de asfalto / hormigón',
    'Nivel óptico / Láser topográfico',
    'Grupo electrógeno portátil',
    'Bomba sumergible / achique de zanja',
    'Martillo demoledor neumático',
    'Conos y vallas de seguridad vial',
    'Cinta métrica 50m y jalones',
    'Carro marcador',
    'Kit de balizas luminosas nocturnas',
    'Herramientas manuales (palas, picos, carretillas)'
  ], []);

  // Catálogo combinado de Materiales de Obra + Pañol/Inventario
  const MATERIALES_CATALOGO = useMemo(() => {
    const baseMaterials = [
      'Cal hidratada (bolsa 25kg)',
      'Cemento Portland (bolsa 50kg)',
      'Arena fina / gruesa para asiento (m³)',
      'Piedra partida / estabilizado granular (m³)',
      'Estacas de madera / hierro p/ replanteo',
      'Pintura demarcatoria en aerosol',
      'Cinta de peligro / Malla de advertencia',
      'Cañería PVC Cloacal Ø160mm / Ø110mm',
      'Cañería PEAD Agua Ø75mm / Ø63mm',
      'Abrazadera de derivación agua 2 bulones',
      'Lubricante para junta elástica',
      'Aros de goma / Sellador hidráulico'
    ];
    const fromInv = inventoryItems
      .filter(i => i.name && i.name.trim().length > 0)
      .slice(0, 40)
      .map(i => `${i.name}${i.current_stock !== undefined ? ` (Stock: ${i.current_stock} ${i.unit || 'u'})` : ''}`);
    return Array.from(new Set([...baseMaterials, ...fromInv]));
  }, [inventoryItems]);

  // Lista combinada de maquinarias y vehículos disponibles
  const availableVehicles = useMemo(() => {
    const defaultList = [
      'Retropala HMK 102B (HMK-01)',
      'Camión Volcador Mercedes Benz 1720',
      'Camioneta Toyota Hilux 4x4 (Logística)',
      'Minicargadora Bobcat S175',
      'Termofusora PEAD Automatizada',
      'Camión Cisterna de Agua 10.000L'
    ];
    if (fuelVehicles.length === 0) return defaultList;
    const fromDb = fuelVehicles.map(v => `${v.description || v.model || v.vehicle_type} (${v.plate || v.code})`);
    return Array.from(new Set([...defaultList, ...fromDb]));
  }, [fuelVehicles]);

  // Formulario ODT
  const [odtForm, setOdtForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    meta_cantidad: 0,
    cuadrilla_nombre: 'Cuadrilla 1 - B. Guevara',
    responsable_id: '',
    equipo_asignado: 'Retropala HMK',
    materiales_requeridos: '',
    inicio_plan: '07:30',
    fin_plan: '16:00',
    instrucciones_calidad: 'Verificar alineación, cotas de nivel y normas de seguridad laboral.'
  });

  // Mapa de avance real por ODT
  const odtProgressMap = useMemo(() => {
    const map: Record<string, { ejecutado: number; pct: number; partesOdt: typeof partes }> = {};
    odts.forEach(o => {
      const partesOdt = partes.filter(p => p.odt_id === o.id);
      const ejecutado = partesOdt.reduce((acc, p) => acc + Number(p.cantidad_real || 0), 0);
      const meta = Number(o.meta_cantidad || 0);
      const pct = meta > 0 ? Math.min(100, Math.round((ejecutado / meta) * 100)) : 0;
      map[o.id] = { ejecutado, pct, partesOdt };
    });
    return map;
  }, [odts, partes]);

  // ODTs actualmente abiertas (< 100%) y su regla de secuencia activa
  const activeSequenceStatus = useMemo(() => {
    const openOdts = odts.filter(o => {
      if (o.estado === 'anulada') return false;
      const prog = odtProgressMap[o.id];
      const isComplete = prog ? prog.pct >= 100 : o.estado === 'cumplida';
      return !isComplete;
    });

    // Buscar ODTs abiertas que tengan una regla de secuencia activa
    const blockingOdts: { odt: ObraOrdenTrabajo; rule: SecuenciaRule }[] = [];
    const authorizingOdts: { odt: ObraOrdenTrabajo; rule: SecuenciaRule }[] = [];

    openOdts.forEach(o => {
      const rule = parseSecuenciaFromInstrucciones(o.instrucciones_calidad);
      if (rule.permiteIniciarOtra === 'no') {
        blockingOdts.push({ odt: o, rule });
      } else if (rule.permiteIniciarOtra === 'si') {
        authorizingOdts.push({ odt: o, rule });
      }
    });

    return {
      openOdts,
      blockingOdts,
      authorizingOdts
    };
  }, [odts, odtProgressMap]);

  // Determinar si un ítem WBS está bloqueado o habilitado por las ODTs en curso
  const getItemSequenceLock = (itemId: string) => {
    const { openOdts, blockingOdts, authorizingOdts } = activeSequenceStatus;
    if (openOdts.length === 0) {
      return { locked: false, authorizedBy: null as ObraOrdenTrabajo | null, blockedBy: null as ObraOrdenTrabajo | null };
    }

    // Si este ítem ya fue explícitamente autorizado por alguna ODT abierta con "SÍ", está habilitado
    const authMatch = authorizingOdts.find(a => a.rule.allowedItemIds.includes(itemId));
    if (authMatch) {
      return { locked: false, authorizedBy: authMatch.odt, blockedBy: null };
    }

    // Si hay alguna ODT abierta con regla "NO" (no permite iniciar otra), bloquea las demás
    const blockMatch = blockingOdts.find(b => b.odt.item_id !== itemId);
    if (blockMatch) {
      return { locked: true, authorizedBy: null, blockedBy: blockMatch.odt };
    }

    // Si hay alguna ODT abierta con regla "SÍ" pero este ítem NO está en su lista de sucesoras autorizadas, queda bloqueado
    const nonAuthMatch = authorizingOdts.find(a => a.odt.item_id !== itemId && !a.rule.allowedItemIds.includes(itemId));
    if (nonAuthMatch) {
      return { locked: true, authorizedBy: null, blockedBy: nonAuthMatch.odt };
    }

    return { locked: false, authorizedBy: null, blockedBy: null };
  };

  // Mapa de ítems procesados desde WBS
  const paraProgramarItems = useMemo(() => {
    const subrubroToRubro = new Map<string, string>();
    rubros.forEach(r => {
      r.subrubros?.forEach((sr: any) => {
        subrubroToRubro.set(sr.id, r.nombre);
      });
    });

    return items
      .map(item => {
        const contractual = Number(item.cantidad_contractual) || 0;
        const itemOdts = odts.filter(o => o.item_id === item.id && o.estado !== 'anulada');
        const programadoOdt = itemOdts.reduce((acc, o) => acc + Number(o.meta_cantidad || 0), 0);
        const ejecutadoReal = partes
          .filter(p => p.item_id === item.id || p.odt?.item_id === item.id || p.tramo_item?.item_id === item.id)
          .reduce((acc, p) => acc + Number(p.cantidad_real || 0), 0);

        // ODT abierta: aquella que aún no llegó al 100% de su meta_cantidad
        const odtAbierta = itemOdts.find(o => {
          const prog = odtProgressMap[o.id];
          const isComplete = prog ? prog.pct >= 100 : o.estado === 'cumplida';
          return !isComplete && (o.estado === 'emitida' || o.estado === 'en_ejecucion');
        });

        const pctEjecutado = contractual > 0
          ? Math.min(100, Number(((ejecutadoReal / contractual) * 100).toFixed(1)))
          : 0;

        // El saldo disponible descuenta lo ya programado en ODTs activas/cumplidas
        const saldo = Math.max(0, contractual - programadoOdt);
        const rubroNombre = subrubroToRubro.get(item.subrubro_id) || 'Rubro General';

        return {
          ...item,
          contractual,
          programadoOdt,
          ejecutadoReal,
          pctEjecutado,
          saldo,
          rubroNombre,
          itemOdts,
          odtAbierta
        };
      })
      .filter(item => {
        if (selectedRubroId) {
          const rubro = rubros.find(r => r.id === selectedRubroId);
          const subIds = rubro?.subrubros?.map((s: any) => s.id) || [];
          if (!subIds.includes(item.subrubro_id)) return false;
        }
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchCode = item.codigo_item?.toLowerCase().includes(q);
          const matchDesc = item.descripcion?.toLowerCase().includes(q);
          if (!matchCode && !matchDesc) return false;
        }
        if (hideEmittedOrCompleted) {
          if (item.odtAbierta || item.pctEjecutado >= 100 || item.saldo <= 0) return false;
        }
        return true;
      });
  }, [items, rubros, odts, partes, odtProgressMap, selectedRubroId, searchQuery, hideEmittedOrCompleted]);

  // Sugerir automáticamente la actividad sucesora del mismo tramo (ej. 1-N1-N2 -> 2-N1-N2)
  const getSuggestedSuccessorIds = (currentItem: ObraItem): string[] => {
    const code = currentItem.codigo_item || '';
    const match = code.match(/^(\d+)-(.+)$/);
    if (!match) return [];
    const nextStepNum = parseInt(match[1], 10) + 1;
    const tramoSuffix = match[2];
    const nextCode = `${nextStepNum}-${tramoSuffix}`;
    const found = items.find(i => i.codigo_item?.toUpperCase() === nextCode.toUpperCase());
    return found ? [found.id] : [];
  };

  const handleOpenViewOdt = (odt: ObraOrdenTrabajo) => {
    setViewingOdt(odt);
    setEditingMetaValue(String(odt.meta_cantidad || 0));
    setIsEditingMeta(false);
    const rule = parseSecuenciaFromInstrucciones(odt.instrucciones_calidad);
    setEditSecuenciaMode(rule.permiteIniciarOtra);
    setEditAllowedItemIds(rule.allowedItemIds);
    setEditSuccessorSearch('');
  };

  const handleOpenProgramar = (item: any) => {
    if (item.odtAbierta) {
      useModalStore.getState().showAlert(
        'ODT Ya Emitida / En Curso',
        `Esta actividad ya tiene una Orden de Trabajo abierta (${item.odtAbierta.numero_odt}).\n\nUna ODT solo se cierra cuando su ejecución alcanza el 100%. Completá o anulá primero la ODT en curso antes de generar una nueva.`
      );
      return;
    }

    const seqLock = getItemSequenceLock(item.id);
    if (seqLock.locked && seqLock.blockedBy) {
      handleOpenViewOdt(seqLock.blockedBy);
      return;
    }

    setSelectedWbsItem(item);
    const rend = Number(item.rendimiento_base_dia) || 70;
    // Video 1: Por defecto tomamos el 100% del saldo/cómputo del tramo (ej. 165 ml) en lugar de truncarlo a 70 ml
    const metaSugerida = item.saldo > 0 ? item.saldo : (item.contractual > 0 ? item.contractual : rend);

    // Inicializar regla de secuencia (Video 2)
    setPermiteIniciarOtra('no');
    setAllowedSuccessorIds(getSuggestedSuccessorIds(item));
    setSuccessorSearch('');

    // Inicializar checklist
    setSelectedVehicles(['Retropala HMK 102B (HMK-01)']);
    setSelectedPersonnel(employees.slice(0, 3).map(e => e.full_name));
    setSelectedTools(['Conos y vallas de seguridad vial', 'Nivel óptico / Láser topográfico']);
    setSelectedMaterials(['Cal hidratada (bolsa 25kg)', 'Estacas de madera / hierro p/ replanteo']);
    setCustomToolInput('');
    setCustomMaterialInput('');
    setMaterialSearch('');
    setFaltanteMaterialObs('');
    setNotifyLogisticsMissing(false);
    setResourceTab('maquinaria');

    setOdtForm({
      fecha: new Date().toISOString().split('T')[0],
      meta_cantidad: metaSugerida,
      cuadrilla_nombre: 'Cuadrilla 1 - B. Guevara',
      responsable_id: employees[0]?.id || '',
      equipo_asignado: 'Retropala HMK',
      materiales_requeridos: '',
      inicio_plan: '07:30',
      fin_plan: '16:00',
      instrucciones_calidad: 'Cumplir cotas de proyecto, alineación y normas de seguridad en obra.'
    });
  };

  const toggleVehicle = (v: string) => {
    setSelectedVehicles(prev =>
      prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
    );
  };

  const togglePersonnel = (name: string) => {
    setSelectedPersonnel(prev =>
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  const toggleTool = (tool: string) => {
    setSelectedTools(prev =>
      prev.includes(tool) ? prev.filter(x => x !== tool) : [...prev, tool]
    );
  };

  const toggleMaterial = (mat: string) => {
    setSelectedMaterials(prev =>
      prev.includes(mat) ? prev.filter(x => x !== mat) : [...prev, mat]
    );
  };

  const toggleAllowedSuccessor = (itemId: string) => {
    setAllowedSuccessorIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const toggleEditAllowedSuccessor = (itemId: string) => {
    setEditAllowedItemIds(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleAddCustomTool = () => {
    if (!customToolInput.trim()) return;
    if (!selectedTools.includes(customToolInput.trim())) {
      setSelectedTools(prev => [...prev, customToolInput.trim()]);
    }
    setCustomToolInput('');
  };

  const handleAddCustomMaterial = () => {
    if (!customMaterialInput.trim()) return;
    if (!selectedMaterials.includes(customMaterialInput.trim())) {
      setSelectedMaterials(prev => [...prev, customMaterialInput.trim()]);
    }
    setCustomMaterialInput('');
  };

  const handleEmitirOdt = async () => {
    if (!selectedWbsItem) return;
    if (Number(odtForm.meta_cantidad) <= 0) {
      useModalStore.getState().showAlert('Meta Inválida', 'Ingresá una Meta Física mayor a 0 para emitir la ODT.');
      return;
    }

    if (permiteIniciarOtra === 'si' && allowedSuccessorIds.length === 0) {
      useModalStore.getState().showAlert(
        'Seleccioná la Actividad Sucesora',
        'Indicaste que SÍ se puede iniciar otra ODT antes de terminar esta. Por favor seleccioná cuál(es) actividad(es) le sigue(n) y queda(n) habilitada(s).'
      );
      return;
    }

    // Generar número correlativo sin colisiones
    const maxNum = odts.reduce((max, o) => {
      const m = o.numero_odt?.match(/(\d+)/);
      return m ? Math.max(max, parseInt(m[1], 10)) : max;
    }, 0);
    const nextNum = `ODT-${String(maxNum + 1).padStart(3, '0')}`;
    const respEmp = employees.find(e => e.id === odtForm.responsable_id);

    // Consolidar resumen de equipos y herramientas seleccionadas
    const maquinasStr = selectedVehicles.length > 0 ? selectedVehicles.join(', ') : 'Ninguna';
    const herramStr = selectedTools.length > 0 ? selectedTools.join(', ') : '';
    const equiposConsolidados = herramStr ? `${maquinasStr} | Herramientas: ${herramStr}` : maquinasStr;

    // Consolidar cuadrilla con personal asignado
    const cuadrillaConsolidada = selectedPersonnel.length > 0
      ? `${odtForm.cuadrilla_nombre} (${selectedPersonnel.length} operarios: ${selectedPersonnel.join(', ')})`
      : odtForm.cuadrilla_nombre;

    // Consolidar materiales marcados + observaciones de faltante + aviso a logística
    const matParts: string[] = [];
    if (selectedMaterials.length > 0) {
      matParts.push(`Materiales: ${selectedMaterials.join(', ')}`);
    }
    if (faltanteMaterialObs.trim()) {
      matParts.push(`Obs/Faltantes: ${faltanteMaterialObs.trim()}`);
    }
    if (notifyLogisticsMissing) {
      matParts.push('[🔔 ALERTA A LOGÍSTICA: FALTA MATERIAL EN OBRA]');
    }
    const materialesConsolidados = matParts.join(' | ') || null;

    // Incorporar regla de secuencia en instrucciones_calidad
    const instruccionesConSecuencia = buildInstruccionesWithSecuencia(
      odtForm.instrucciones_calidad,
      permiteIniciarOtra,
      allowedSuccessorIds
    );

    await createOdt.mutateAsync({
      project_id: projectId,
      numero_odt: nextNum,
      fecha: odtForm.fecha,
      item_id: selectedWbsItem.id,
      meta_cantidad: Number(odtForm.meta_cantidad),
      unidad: selectedWbsItem.unidad || 'ml',
      cuadrilla_nombre: cuadrillaConsolidada,
      responsable_id: odtForm.responsable_id || null,
      responsable_nombre: respEmp?.full_name || 'B. Guevara',
      equipo_asignado: equiposConsolidados,
      materiales_requeridos: materialesConsolidados,
      inicio_plan: odtForm.inicio_plan,
      fin_plan: odtForm.fin_plan,
      instrucciones_calidad: instruccionesConSecuencia,
      estado: 'emitida'
    });

    if (notifyLogisticsMissing) {
      useModalStore.getState().showAlert(
        'ODT Emitida + Aviso a Logística',
        `Se emitió la ${nextNum} correctamente y quedó registrado el aviso a Logística / Pañol por faltante de material en obra.`
      );
    }

    setSelectedWbsItem(null);
    setActiveSubTab('odts');
  };

  const handleSaveMetaOdt = async () => {
    if (!viewingOdt) return;
    const nuevaMeta = Number(editingMetaValue);
    if (!nuevaMeta || nuevaMeta <= 0) {
      useModalStore.getState().showAlert('Meta Inválida', 'La meta física debe ser mayor a 0.');
      return;
    }

    try {
      const updated = await updateOdt.mutateAsync({
        id: viewingOdt.id,
        meta_cantidad: nuevaMeta
      });
      setViewingOdt({
        ...viewingOdt,
        meta_cantidad: nuevaMeta,
        estado: updated?.estado || viewingOdt.estado
      });
      setIsEditingMeta(false);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar la meta de la ODT.');
    }
  };

  const handleSaveSecuenciaOdt = async (modeOverride?: 'no' | 'si', idsOverride?: string[]) => {
    if (!viewingOdt) return;
    const targetMode = modeOverride ?? editSecuenciaMode;
    const targetIds = idsOverride ?? editAllowedItemIds;

    if (targetMode === 'si' && targetIds.length === 0) {
      useModalStore.getState().showAlert(
        'Seleccioná la Actividad que le sigue',
        'Marcá al menos una actividad sucesora para habilitar su inicio.'
      );
      return;
    }

    const parsed = parseSecuenciaFromInstrucciones(viewingOdt.instrucciones_calidad);
    const nuevasInstrucciones = buildInstruccionesWithSecuencia(
      parsed.cleanInstrucciones,
      targetMode,
      targetIds
    );

    try {
      await updateOdt.mutateAsync({
        id: viewingOdt.id,
        instrucciones_calidad: nuevasInstrucciones
      });
      setViewingOdt({
        ...viewingOdt,
        instrucciones_calidad: nuevasInstrucciones
      });
      useModalStore.getState().showAlert(
        'Secuencia Actualizada',
        targetMode === 'no'
          ? `La ${viewingOdt.numero_odt} quedó configurada en NO: no se permite iniciar otra ODT hasta completar esta al 100%.`
          : `La ${viewingOdt.numero_odt} ahora autoriza iniciar ${targetIds.length} actividad(es) siguiente(s).`
      );
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo guardar la regla de secuencia.');
    }
  };

  const handleDeleteOdt = async (odt: ObraOrdenTrabajo) => {
    const prog = odtProgressMap[odt.id];
    const tienePartes = prog && prog.partesOdt.length > 0;
    const msg = tienePartes
      ? `¿Estás seguro de eliminar/anular la ${odt.numero_odt} (${odt.item?.codigo_item || ''})?\n\nEsta ODT tiene ${prog.partesOdt.length} parte(s) diario(s) cargado(s) (${prog.ejecutado} ${odt.unidad}). Al eliminarla, también se eliminarán sus partes y el saldo volverá a estar disponible en la Bandeja "Para Programar".`
      : `¿Estás seguro de eliminar la Orden de Trabajo ${odt.numero_odt} (${odt.item?.codigo_item || ''} — ${odt.item?.descripcion || ''}) emitida por error?\n\nEl saldo de ${odt.meta_cantidad} ${odt.unidad} volverá a estar disponible para programar.`;

    if (await useModalStore.getState().showConfirm('Eliminar / Anular ODT', msg)) {
      try {
        await deleteOdt.mutateAsync({ id: odt.id, projectId });
        if (viewingOdt?.id === odt.id) setViewingOdt(null);
        useModalStore.getState().showAlert('ODT Eliminada', `La orden ${odt.numero_odt} fue eliminada y su saldo fue restituido a la WBS.`);
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la ODT.');
      }
    }
  };

  const handleDeleteParteFromReport = async (parteId: string) => {
    if (await useModalStore.getState().showConfirm('Eliminar Parte Diario', '¿Deseas eliminar este registro de producción? El avance y estado de la ODT se recalcularán automáticamente.')) {
      try {
        await deleteParte.mutateAsync({ id: parteId, projectId });
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el parte diario.');
      }
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Banner de Fase 2 */}
      <div className="bg-gradient-to-r from-amber-700 to-orange-800 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <Calendar size={160} />
        </div>
        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-semibold uppercase tracking-wider mb-2">
            <Clock size={12} /> Fase 2: Asignación Temporal & Despacho
          </div>
          <h2 className="text-2xl font-bold">Programación Operativa — Órdenes de Trabajo (ODT)</h2>
          <p className="text-amber-100 text-sm mt-1 max-w-3xl">
            Toma las actividades contractuales de la <strong>Estructura WBS</strong> y programa las Órdenes de Trabajo por el <strong>100% del tramo</strong> (o la meta indicada), definiendo si permite o bloquea el inicio de la actividad siguiente mientras esté en curso.
          </p>
        </div>
      </div>

      {/* Aviso de Regla de Secuencia Activa si hay ODTs abiertas */}
      {activeSequenceStatus.openOdts.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-start gap-2.5">
            <GitBranch size={18} className="text-amber-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-amber-900 block">
                Control de Secuencia de ODTs en Curso ({activeSequenceStatus.openOdts.length} abierta{activeSequenceStatus.openOdts.length > 1 ? 's' : ''})
              </span>
              <p className="text-amber-800 mt-0.5">
                {activeSequenceStatus.blockingOdts.length > 0 ? (
                  <>
                    La ODT <strong>{activeSequenceStatus.blockingOdts[0].odt.numero_odt}</strong> ({activeSequenceStatus.blockingOdts[0].odt.item?.codigo_item} — {activeSequenceStatus.blockingOdts[0].odt.item?.descripcion}) tiene indicado <strong>"NO iniciar otra ODT hasta terminar"</strong>.
                  </>
                ) : activeSequenceStatus.authorizingOdts.length > 0 ? (
                  <>
                    La ODT <strong>{activeSequenceStatus.authorizingOdts[0].odt.numero_odt}</strong> ({activeSequenceStatus.authorizingOdts[0].odt.item?.codigo_item}) autoriza iniciar únicamente las actividades sucesoras seleccionadas.
                  </>
                ) : null}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => handleOpenViewOdt(activeSequenceStatus.openOdts[0])}
            className="px-3 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs shrink-0 inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
          >
            <Unlock size={13} /> Configurar Secuencia / Habilitar Siguiente
          </button>
        </div>
      )}

      {/* Barra de Filtros y Búsqueda WBS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderTree size={20} className="text-amber-600 shrink-0" />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Filtrar Actividades WBS</label>
            <span className="text-xs text-slate-400">Seleccioná un rubro o buscá por código/actividad para programar</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 flex-1 justify-end">
          <label className="flex items-center gap-2 px-3 py-2 bg-amber-50/70 border border-amber-200 rounded-xl text-xs font-semibold text-amber-900 cursor-pointer">
            <input
              type="checkbox"
              checked={hideEmittedOrCompleted}
              onChange={e => setHideEmittedOrCompleted(e.target.checked)}
              className="rounded text-amber-600 focus:ring-amber-500"
            />
            Ocultar ya emitidas o al 100%
          </label>

          <select
            value={selectedRubroId}
            onChange={e => setSelectedRubroId(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">-- Todos los Rubros ({rubros.length}) --</option>
            {rubros.map(r => (
              <option key={r.id} value={r.id}>
                {r.codigo} — {r.nombre}
              </option>
            ))}
          </select>

          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Buscar por código o descripción..."
              className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      {/* Navegación interna de Fase 2 */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('para_programar')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'para_programar'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Filter size={16} />
          Bandeja "Para Programar" ({paraProgramarItems.length})
        </button>

        <button
          onClick={() => setActiveSubTab('odts')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeSubTab === 'odts'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} />
          Órdenes de Trabajo Emitidas ({odts.length})
        </button>
      </div>

      {/* SUBTAB 1: BANDEJA PARA PROGRAMAR DESDE WBS */}
      {activeSubTab === 'para_programar' && (
        <div className="space-y-4">
          {loadingItems ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-slate-200">
              <div className="w-8 h-8 border-3 border-amber-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-500">Cargando actividades de la estructura WBS...</p>
            </div>
          ) : paraProgramarItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
              <h4 className="font-bold text-slate-700">No se encontraron actividades</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {items.length === 0
                  ? 'Primero debes cargar o importar Rubros e Ítems en la Fase 1 (Planificación).'
                  : 'No hay actividades que coincidan con los filtros seleccionados.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>Actividades contractuales de la WBS — Las actividades respetan el cómputo total del tramo y la secuencia definida en las ODTs activas</span>
                <span className="font-bold text-slate-700">{paraProgramarItems.length} actividades listadas</span>
              </div>

              <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Código WBS</th>
                      <th className="py-2.5 px-3">Rubro</th>
                      <th className="py-2.5 px-3">Actividad Contractual</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-right">Cómputo Total</th>
                      <th className="py-2.5 px-3 text-right">Programado en ODTs</th>
                      <th className="py-2.5 px-3 text-right">Ejecutado Real</th>
                      <th className="py-2.5 px-3 text-right">Saldo por Programar</th>
                      <th className="py-2.5 px-3 text-right">Rend. Base/Día</th>
                      <th className="py-2.5 px-3 text-center">Estado / Secuencia</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paraProgramarItems.map(item => {
                      const rend = Number(item.rendimiento_base_dia) || 70;
                      const odtAbierta = item.odtAbierta;
                      const progAbierta = odtAbierta ? odtProgressMap[odtAbierta.id] : null;
                      const isCompleted = item.pctEjecutado >= 100 || (item.contractual > 0 && item.ejecutadoReal >= item.contractual);
                      const lastOdt = item.itemOdts[0];
                      const seqLock = !isCompleted && !odtAbierta ? getItemSequenceLock(item.id) : { locked: false, authorizedBy: null, blockedBy: null };

                      return (
                        <tr
                          key={item.id}
                          className={`transition-colors ${
                            isCompleted
                              ? 'bg-emerald-50/30 hover:bg-emerald-50/60'
                              : odtAbierta
                              ? 'bg-amber-50/30 hover:bg-amber-50/60'
                              : seqLock.authorizedBy
                              ? 'bg-emerald-50/20 hover:bg-emerald-50/40'
                              : seqLock.locked
                              ? 'bg-slate-50/80 text-slate-400'
                              : 'hover:bg-amber-50/40'
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700 whitespace-nowrap">{item.codigo_item || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px]">{item.rubroNombre}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{item.descripcion || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono uppercase text-slate-500">{item.unidad || 'ml'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-semibold">{item.contractual.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-600 font-semibold">{item.programadoOdt.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {item.ejecutadoReal.toLocaleString('es-AR')} ({item.pctEjecutado}%)
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            {item.saldo.toLocaleString('es-AR')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">{rend}</td>
                          <td className="py-2.5 px-3 text-center">
                            {isCompleted ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                🟢 CUMPLIDA 100%
                              </span>
                            ) : odtAbierta ? (
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border ${
                                (progAbierta?.ejecutado || 0) > 0
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : 'bg-amber-100 text-amber-800 border-amber-300'
                              }`}>
                                {(progAbierta?.ejecutado || 0) > 0
                                  ? `🔵 EN EJECUCIÓN (${odtAbierta.numero_odt} · ${progAbierta?.pct || 0}%)`
                                  : `🟠 EMITIDA (${odtAbierta.numero_odt})`}
                              </span>
                            ) : seqLock.authorizedBy ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                ✅ Habilitada por {seqLock.authorizedBy.numero_odt}
                              </span>
                            ) : seqLock.locked && seqLock.blockedBy ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700 border border-slate-300">
                                🔒 Espera fin de {seqLock.blockedBy.numero_odt}
                              </span>
                            ) : item.itemOdts.length > 0 ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                Parcial ({item.pctEjecutado}%)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
                                Pendiente
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            {isCompleted ? (
                              <button
                                type="button"
                                onClick={() => lastOdt && handleOpenViewOdt(lastOdt)}
                                className="px-3 py-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 border border-emerald-300 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye size={12} />
                                100% · Ver Informe
                              </button>
                            ) : odtAbierta ? (
                              <button
                                type="button"
                                onClick={() => handleOpenViewOdt(odtAbierta)}
                                className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                                title="Ya tiene una ODT emitida/abierta. Hacé clic para ver su informe, editar su meta o configurar su secuencia."
                              >
                                <Lock size={12} />
                                ODT Emitida ({odtAbierta.numero_odt})
                              </button>
                            ) : item.saldo <= 0 ? (
                              <button
                                type="button"
                                onClick={() => lastOdt && handleOpenViewOdt(lastOdt)}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Eye size={12} />
                                Saldo 0 · Ver ODT
                              </button>
                            ) : seqLock.locked && seqLock.blockedBy ? (
                              <button
                                type="button"
                                onClick={() => handleOpenViewOdt(seqLock.blockedBy!)}
                                className="px-3 py-1.5 bg-slate-200 hover:bg-amber-100 text-slate-700 hover:text-amber-900 border border-slate-300 rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all cursor-pointer"
                                title={`Bloqueada hasta terminar ${seqLock.blockedBy.numero_odt}. Hacé clic para autorizar su inicio desde ${seqLock.blockedBy.numero_odt}.`}
                              >
                                <Lock size={12} />
                                Bloqueada ({seqLock.blockedBy.numero_odt})
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleOpenProgramar(item)}
                                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 transition-all shadow-sm cursor-pointer"
                              >
                                <Send size={12} />
                                Programar ODT
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: LISTA DE ODTs EMITIDAS */}
      {activeSubTab === 'odts' && (
        <div className="space-y-4">
          {odts.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <FileText size={40} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">No hay órdenes de trabajo emitidas aún</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Selecciona una actividad de la bandeja "Para Programar" para emitir la primera ODT diaria de la obra.
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="overflow-x-auto max-h-[620px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">N° ODT</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Código WBS</th>
                      <th className="py-2.5 px-3">Actividad Contractual</th>
                      <th className="py-2.5 px-3 text-right">Meta Asignada</th>
                      <th className="py-2.5 px-3 text-right min-w-[140px]">Ejecutado / Avance</th>
                      <th className="py-2.5 px-3">Regla Secuencia</th>
                      <th className="py-2.5 px-3">Cuadrilla Asignada</th>
                      <th className="py-2.5 px-3">Equipos / Herramientas / Materiales</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {odts.map(odt => {
                      const prog = odtProgressMap[odt.id] || { ejecutado: 0, pct: 0, partesOdt: [] };
                      const is100 = prog.pct >= 100 || (odt.estado === 'cumplida' && prog.ejecutado >= Number(odt.meta_cantidad || 0));
                      const isEnEjecucion = !is100 && (prog.ejecutado > 0 || odt.estado === 'en_ejecucion');
                      const seqRule = parseSecuenciaFromInstrucciones(odt.instrucciones_calidad);

                      return (
                        <tr key={odt.id} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-mono font-bold text-amber-700 whitespace-nowrap">{odt.numero_odt}</td>
                          <td className="py-2.5 px-3 font-mono whitespace-nowrap">{odt.fecha}</td>
                          <td className="py-2.5 px-3 font-mono font-semibold text-slate-700 whitespace-nowrap">{odt.item?.codigo_item || '-'}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{odt.item?.descripcion || '-'}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800 whitespace-nowrap">
                            {Number(odt.meta_cantidad || 0).toLocaleString('es-AR')} {odt.unidad}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex flex-col items-end gap-1">
                              <span className="font-mono font-bold text-slate-800">
                                {prog.ejecutado.toLocaleString('es-AR')} / {Number(odt.meta_cantidad || 0).toLocaleString('es-AR')} {odt.unidad} ({prog.pct}%)
                              </span>
                              <div className="w-28 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${is100 ? 'bg-emerald-500' : prog.pct > 0 ? 'bg-blue-600' : 'bg-slate-300'}`}
                                  style={{ width: `${prog.pct}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-2.5 px-3">
                            {seqRule.permiteIniciarOtra === 'no' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                🔒 No iniciar otra hasta 100%
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold text-[11px]">
                                ✅ Habilita {seqRule.allowedItemIds.length} act.
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">{odt.cuadrilla_nombre || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-600">
                            <div>{odt.equipo_asignado || '-'}</div>
                            {odt.materiales_requeridos && (
                              <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                                📦 {odt.materiales_requeridos}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              is100 ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                              isEnEjecucion ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                              'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}>
                              {is100 ? 'CUMPLIDA (100%)' : isEnEjecucion ? `EN EJECUCIÓN (${prog.pct}%)` : 'EMITIDA'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenViewOdt(odt)}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer transition-colors"
                                title="Ver Informe Completo, Editar Meta o Configurar Secuencia"
                              >
                                <Eye size={12} /> Informe / Editar
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteOdt(odt)}
                                disabled={deleteOdt.isPending}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer transition-colors"
                                title="Eliminar / Anular ODT si hubo un error"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Programar y Emitir ODT con Checklist de Recursos + Regla de Secuencia */}
      <ModalPortal
        isOpen={Boolean(selectedWbsItem)}
        onClose={() => setSelectedWbsItem(null)}
        maxWidth="max-w-4xl"
        closeOnBackdrop={false}
      >
        {selectedWbsItem && (() => {
          const saldoItem = selectedWbsItem.saldo;
          const totalTramo = selectedWbsItem.contractual || saldoItem;
          const rendSugerido = Number(selectedWbsItem.rendimiento_base_dia) || 70;
          const filteredMaterials = MATERIALES_CATALOGO.filter(m =>
            !materialSearch.trim() || m.toLowerCase().includes(materialSearch.toLowerCase())
          );

          const candidateSuccessors = items.filter(it => {
            if (it.id === selectedWbsItem.id) return false;
            if (!successorSearch.trim()) return true;
            const q = successorSearch.toLowerCase();
            return (
              it.codigo_item?.toLowerCase().includes(q) ||
              it.descripcion?.toLowerCase().includes(q)
            );
          });

          return (
            <div className="p-6 space-y-4 overflow-y-auto max-h-[90vh]">
              {/* Encabezado */}
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-4">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                    Emisión & Despacho de Orden de Trabajo
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                    {selectedWbsItem.codigo_item} — {selectedWbsItem.descripcion}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rubro: <strong className="text-slate-700">{selectedWbsItem.rubroNombre}</strong> | Cómputo Total del Tramo: <span className="font-mono font-bold text-slate-800">{selectedWbsItem.contractual} {selectedWbsItem.unidad}</span>
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo del Tramo por Programar</span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-bold">
                    {saldoItem.toLocaleString('es-AR')} {selectedWbsItem.unidad}
                  </span>
                </div>
              </div>

              {/* Parámetros Operativos Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Fecha Programada de Inicio</label>
                  <input
                    type="date"
                    value={odtForm.fecha}
                    onChange={e => setOdtForm({ ...odtForm, fecha: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-600">
                      Meta Física de la ODT ({selectedWbsItem.unidad})
                    </label>
                    <span className="text-[10px] text-amber-700 font-mono font-bold">
                      Total Tramo: {totalTramo} {selectedWbsItem.unidad}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    value={odtForm.meta_cantidad === 0 ? '' : odtForm.meta_cantidad}
                    onChange={e => {
                      const raw = e.target.value;
                      setOdtForm({ ...odtForm, meta_cantidad: raw === '' ? 0 : Math.max(0, Number(raw)) });
                    }}
                    placeholder={`Ej: ${saldoItem || totalTramo}`}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold text-amber-700 bg-white"
                  />
                  {/* Botones de selección rápida */}
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {saldoItem > 0 && (
                      <button
                        type="button"
                        onClick={() => setOdtForm({ ...odtForm, meta_cantidad: saldoItem })}
                        className="px-2.5 py-0.5 rounded text-[10px] font-bold bg-amber-600 text-white hover:bg-amber-700 transition-colors cursor-pointer"
                      >
                        100% Saldo Tramo ({saldoItem} {selectedWbsItem.unidad})
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setOdtForm({ ...odtForm, meta_cantidad: saldoItem > 0 ? Math.min(saldoItem, rendSugerido) : rendSugerido })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-700 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Rendimiento Diario ({saldoItem > 0 ? Math.min(saldoItem, rendSugerido) : rendSugerido} {selectedWbsItem.unidad})
                    </button>
                  </div>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Responsable Técnico de Ejecución</label>
                  <select
                    value={odtForm.responsable_id}
                    onChange={e => setOdtForm({ ...odtForm, responsable_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="">-- Seleccionar Responsable --</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Horario Planificado</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={odtForm.inicio_plan}
                      onChange={e => setOdtForm({ ...odtForm, inicio_plan: e.target.value })}
                      className="w-1/2 px-2.5 py-2 border rounded-xl text-xs bg-white text-center"
                    />
                    <span className="text-slate-400">a</span>
                    <input
                      type="time"
                      value={odtForm.fin_plan}
                      onChange={e => setOdtForm({ ...odtForm, fin_plan: e.target.value })}
                      className="w-1/2 px-2.5 py-2 border rounded-xl text-xs bg-white text-center"
                    />
                  </div>
                </div>
              </div>

              {/* VIDEO 2: REGLA DE SECUENCIA / PRECEDENCIA ENTRE ODTs */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-amber-900 flex items-center gap-1.5 text-sm">
                      <GitBranch size={15} className="text-amber-700" />
                      De esta ODT, una vez iniciada, ¿se puede iniciar otra actividad antes de terminarla al 100%?
                    </span>
                    <p className="text-[11px] text-amber-800 mt-0.5">
                      Si elegís <strong>NO</strong>, no se podrá programar otra ODT hasta completar esta. Si elegís <strong>SÍ</strong>, indicá cuál es la actividad que le sigue para dejarla habilitada.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPermiteIniciarOtra('no')}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        permiteIniciarOtra === 'no'
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Lock size={13} />
                      NO (Bloquear hasta terminar)
                    </button>
                    <button
                      type="button"
                      onClick={() => setPermiteIniciarOtra('si')}
                      className={`px-3.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 border transition-all cursor-pointer ${
                        permiteIniciarOtra === 'si'
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Unlock size={13} />
                      SÍ (Autorizar la que le sigue)
                    </button>
                  </div>
                </div>

                {permiteIniciarOtra === 'si' && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="font-bold text-emerald-900">
                        ¿Cuál es la actividad que le sigue y queda autorizada para iniciar? ({allowedSuccessorIds.length} seleccionada{allowedSuccessorIds.length === 1 ? '' : 's'})
                      </label>
                      <input
                        type="text"
                        value={successorSearch}
                        onChange={e => setSuccessorSearch(e.target.value)}
                        placeholder="Buscar por código (ej: 2-N1-N2) o actividad..."
                        className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs w-full sm:w-64"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-40 overflow-y-auto pt-1">
                      {candidateSuccessors.map(it => {
                        const isChecked = allowedSuccessorIds.includes(it.id);
                        return (
                          <label
                            key={it.id}
                            onClick={() => toggleAllowedSuccessor(it.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                : 'bg-slate-50/70 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-emerald-600 focus:ring-emerald-500"
                            />
                            <span className="font-mono font-bold text-slate-800 shrink-0">{it.codigo_item}</span>
                            <span className="truncate">{it.descripcion}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECCIÓN DE CHECKLIST DE RECURSOS OPERATIVOS */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-xs">
                {/* Pestañas de Recursos */}
                <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setResourceTab('maquinaria')}
                    className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      resourceTab === 'maquinaria'
                        ? 'border-amber-600 text-amber-700 bg-white shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Truck size={14} />
                    <span>Maquinaria & Flota ({selectedVehicles.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceTab('personal')}
                    className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      resourceTab === 'personal'
                        ? 'border-amber-600 text-amber-700 bg-white shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Users size={14} />
                    <span>Personal ({selectedPersonnel.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceTab('herramientas')}
                    className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      resourceTab === 'herramientas'
                        ? 'border-amber-600 text-amber-700 bg-white shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Wrench size={14} />
                    <span>Herramientas ({selectedTools.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setResourceTab('materiales')}
                    className={`flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5 border-b-2 transition-all cursor-pointer ${
                      resourceTab === 'materiales'
                        ? 'border-amber-600 text-amber-700 bg-white shadow-xs'
                        : 'border-transparent text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <Package size={14} />
                    <span>Materiales ({selectedMaterials.length})</span>
                  </button>
                </div>

                {/* Contenido de la pestaña activa de recursos */}
                <div className="p-3.5">
                  {/* Pestaña 1: Maquinaria */}
                  {resourceTab === 'maquinaria' && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-500 block">
                        Selecciona los vehículos, camiones o máquinas pesadas asignadas a esta orden:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto">
                        {availableVehicles.map(v => {
                          const isSel = selectedVehicles.includes(v);
                          return (
                            <label
                              key={v}
                              onClick={() => toggleVehicle(v)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {}}
                                className="rounded text-amber-600 focus:ring-amber-500"
                              />
                              <span className="truncate">{v}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pestaña 2: Personal */}
                  {resourceTab === 'personal' && (
                    <div className="space-y-2">
                      <div className="flex justify-between items-center text-[11px] text-slate-500">
                        <span>Marca los operarios de la cuadrilla asignados a la tarea de hoy:</span>
                        <span className="font-bold text-amber-700">{selectedPersonnel.length} asignados</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-52 overflow-y-auto">
                        {employees.map(emp => {
                          const isSel = selectedPersonnel.includes(emp.full_name);
                          return (
                            <label
                              key={emp.id}
                              onClick={() => togglePersonnel(emp.full_name)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-blue-50 border-blue-300 text-blue-900 font-semibold'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {}}
                                className="rounded text-blue-600 focus:ring-blue-500"
                              />
                              <div className="truncate">
                                <p className="font-medium truncate">{emp.full_name}</p>
                                <p className="text-[10px] text-slate-400 font-normal">{emp.legajo ? `Legajo: ${emp.legajo}` : 'Operario de Cuadrilla'}</p>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pestaña 3: Herramientas */}
                  {resourceTab === 'herramientas' && (
                    <div className="space-y-3">
                      <span className="text-[11px] text-slate-500 block">
                        Equipos menores y herramientas específicas para despachar:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-44 overflow-y-auto">
                        {[...HERRAMIENTAS_CATALOGO, ...selectedTools.filter(t => !HERRAMIENTAS_CATALOGO.includes(t))].map(tool => {
                          const isSel = selectedTools.includes(tool);
                          return (
                            <label
                              key={tool}
                              onClick={() => toggleTool(tool)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {}}
                                className="rounded text-emerald-600 focus:ring-emerald-500"
                              />
                              <span className="truncate">{tool}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Agregar herramienta personalizada */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          value={customToolInput}
                          onChange={e => setCustomToolInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTool(); } }}
                          placeholder="Otra herramienta específica..."
                          className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomTool}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Agregar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Pestaña 4: Materiales e Insumos con Checklist Marcable + Comentario de Faltantes */}
                  {resourceTab === 'materiales' && (
                    <div className="space-y-3 text-xs">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-500">
                          Marcá los materiales e insumos necesarios para despachar a esta jornada:
                        </span>
                        <input
                          type="text"
                          value={materialSearch}
                          onChange={e => setMaterialSearch(e.target.value)}
                          placeholder="Filtrar material..."
                          className="px-2.5 py-1 border border-slate-200 rounded-lg text-xs bg-slate-50 w-full sm:w-52"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-40 overflow-y-auto">
                        {[
                          ...selectedMaterials.filter(m => !filteredMaterials.includes(m)),
                          ...filteredMaterials
                        ].map(mat => {
                          const isSel = selectedMaterials.includes(mat);
                          return (
                            <label
                              key={mat}
                              onClick={() => toggleMaterial(mat)}
                              className={`p-2 rounded-xl border text-xs flex items-center gap-2 cursor-pointer transition-all ${
                                isSel
                                  ? 'bg-purple-50 border-purple-300 text-purple-900 font-semibold'
                                  : 'bg-slate-50/60 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSel}
                                onChange={() => {}}
                                className="rounded text-purple-600 focus:ring-purple-500"
                              />
                              <span className="truncate">{mat}</span>
                            </label>
                          );
                        })}
                      </div>

                      {/* Agregar material personalizado */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                          type="text"
                          value={customMaterialInput}
                          onChange={e => setCustomMaterialInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomMaterial(); } }}
                          placeholder="Agregar otro material (ej: Cal, Arena, Bulones)..."
                          className="flex-1 px-3 py-1.5 border rounded-xl text-xs bg-slate-50"
                        />
                        <button
                          type="button"
                          onClick={handleAddCustomMaterial}
                          className="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 text-purple-800 rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Plus size={12} /> Marcar Material
                        </button>
                      </div>

                      {/* Observación de faltantes y aviso opcional a Logística */}
                      <div className="pt-2 border-t border-slate-100 space-y-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label className="font-semibold text-slate-600">
                            Comentario de Faltantes / Observaciones de Material en Obra
                          </label>
                          <label className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={notifyLogisticsMissing}
                              onChange={e => setNotifyLogisticsMissing(e.target.checked)}
                              className="rounded text-amber-600 focus:ring-amber-500"
                            />
                            <BellRing size={12} />
                            Avisar a Logística que falta material en obra
                          </label>
                        </div>
                        <textarea
                          value={faltanteMaterialObs}
                          onChange={e => setFaltanteMaterialObs(e.target.value)}
                          rows={2}
                          placeholder="Si falta algún material en obra o querés dejar una nota para Logística / Pañol, escribilo acá..."
                          className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Instrucciones de Calidad / Seguridad */}
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">
                  Instrucciones Operativas de Calidad / Seguridad
                </label>
                <textarea
                  value={odtForm.instrucciones_calidad}
                  onChange={e => setOdtForm({ ...odtForm, instrucciones_calidad: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                />
              </div>

              {/* Resumen & Botones de Acción */}
              <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-3 border-t border-slate-100">
                <div className="flex flex-wrap gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-semibold border border-amber-200/60">
                    🚜 {selectedVehicles.length} Maquinarias
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-semibold border border-blue-200/60">
                    👷 {selectedPersonnel.length} Operarios
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200/60">
                    🛠️ {selectedTools.length} Herramientas
                  </span>
                  <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-800 font-semibold border border-purple-200/60">
                    📦 {selectedMaterials.length} Materiales
                  </span>
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedWbsItem(null)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleEmitirOdt}
                    className="px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md hover:shadow-lg transition-all cursor-pointer"
                  >
                    <Send size={14} />
                    Confirmar y Emitir ODT
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
      </ModalPortal>

      {/* Modal Informe Detallado de ODT + Edición de Meta (Video 1) y Secuencia (Video 2) */}
      <ModalPortal
        isOpen={Boolean(viewingOdt)}
        onClose={() => setViewingOdt(null)}
        maxWidth="max-w-4xl"
      >
        {viewingOdt && (() => {
          const prog = odtProgressMap[viewingOdt.id] || { ejecutado: 0, pct: 0, partesOdt: [] };
          const saldoOdt = Math.max(0, Number(viewingOdt.meta_cantidad || 0) - prog.ejecutado);
          const contractualWbs = Number(viewingOdt.item?.cantidad_contractual || 0);
          const parsedRule = parseSecuenciaFromInstrucciones(viewingOdt.instrucciones_calidad);

          const editCandidates = items.filter(it => {
            if (it.id === viewingOdt.item_id) return false;
            if (!editSuccessorSearch.trim()) return true;
            const q = editSuccessorSearch.toLowerCase();
            return (
              it.codigo_item?.toLowerCase().includes(q) ||
              it.descripcion?.toLowerCase().includes(q)
            );
          });

          return (
            <div className="p-6 space-y-5 overflow-y-auto max-h-[90vh]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-mono font-black text-xs">
                      {viewingOdt.numero_odt}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-mono font-bold text-xs">
                      WBS {viewingOdt.item?.codigo_item || '-'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      prog.pct >= 100
                        ? 'bg-emerald-100 text-emerald-800'
                        : prog.ejecutado > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prog.pct >= 100 ? '🟢 CUMPLIDA 100%' : prog.ejecutado > 0 ? `🔵 EN EJECUCIÓN (${prog.pct}%)` : '🟠 EMITIDA'}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mt-2">
                    {viewingOdt.item?.descripcion || 'Actividad de Obra'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha de emisión: <strong className="font-mono">{viewingOdt.fecha}</strong> | Horario Planificado: <strong className="font-mono">{viewingOdt.inicio_plan} a {viewingOdt.fin_plan}</strong> | Responsable: <strong>{viewingOdt.responsable_nombre || '-'}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleDeleteOdt(viewingOdt)}
                    className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 size={13} /> Eliminar / Anular ODT
                  </button>
                </div>
              </div>

              {/* Resumen de Meta vs Ejecución (con Edición Directa de Meta - Video 1) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] text-slate-500 font-semibold">Meta Asignada en ODT</span>
                    {!isEditingMeta && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingMetaValue(String(viewingOdt.meta_cantidad || 0));
                          setIsEditingMeta(true);
                        }}
                        className="text-[11px] font-bold text-amber-700 hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <Edit3 size={11} /> Editar Meta
                      </button>
                    )}
                  </div>

                  {isEditingMeta ? (
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          value={editingMetaValue}
                          onChange={e => setEditingMetaValue(e.target.value)}
                          className="w-28 px-2.5 py-1 border border-amber-400 rounded-lg font-mono font-bold text-sm bg-white"
                        />
                        <button
                          type="button"
                          onClick={handleSaveMetaOdt}
                          disabled={updateOdt.isPending}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Check size={12} /> Guardar
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditingMeta(false)}
                          className="px-2 py-1 bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                        >
                          Cancelar
                        </button>
                      </div>
                      {contractualWbs > 0 && Number(editingMetaValue) !== contractualWbs && (
                        <button
                          type="button"
                          onClick={() => setEditingMetaValue(String(contractualWbs))}
                          className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded cursor-pointer"
                        >
                          Usar 100% Cómputo Tramo ({contractualWbs} {viewingOdt.unidad})
                        </button>
                      )}
                    </div>
                  ) : (
                    <div>
                      <span className="text-lg font-black text-slate-900 font-mono block">
                        {Number(viewingOdt.meta_cantidad || 0).toLocaleString('es-AR')} {viewingOdt.unidad}
                      </span>
                      {contractualWbs > 0 && contractualWbs !== Number(viewingOdt.meta_cantidad || 0) && (
                        <button
                          type="button"
                          onClick={() => {
                            setEditingMetaValue(String(contractualWbs));
                            setIsEditingMeta(true);
                          }}
                          className="text-[10px] font-bold text-amber-700 hover:underline mt-0.5 block cursor-pointer"
                        >
                          Cómputo Total Tramo: {contractualWbs} {viewingOdt.unidad} (Ajustar al 100%)
                        </button>
                      )}
                    </div>
                  )}
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Producción Acumulada Cargada</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    {prog.ejecutado.toLocaleString('es-AR')} {viewingOdt.unidad} ({prog.pct}%)
                  </span>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-semibold block">Saldo Pendiente para Cerrar ODT</span>
                  <span className="text-lg font-black text-amber-900 font-mono">
                    {saldoOdt.toLocaleString('es-AR')} {viewingOdt.unidad}
                  </span>
                </div>
              </div>

              {/* Panel de Regla de Secuencia de esta ODT (Video 2) */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-3 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-amber-900 flex items-center gap-1.5">
                      <GitBranch size={15} className="text-amber-700" />
                      De esta ODT, una vez iniciada, ¿se puede iniciar otra actividad antes de terminarla?
                    </span>
                    <span className="text-[11px] text-amber-800 block mt-0.5">
                      Podés cambiar esta condición en cualquier momento para bloquear o autorizar la actividad que le sigue.
                    </span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        setEditSecuenciaMode('no');
                        handleSaveSecuenciaOdt('no', []);
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 border cursor-pointer ${
                        editSecuenciaMode === 'no'
                          ? 'bg-slate-900 text-white border-slate-900'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Lock size={12} /> NO
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditSecuenciaMode('si');
                        if (editAllowedItemIds.length === 0 && viewingOdt.item) {
                          setEditAllowedItemIds(getSuggestedSuccessorIds(viewingOdt.item));
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 border cursor-pointer ${
                        editSecuenciaMode === 'si'
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Unlock size={12} /> SÍ (Elegir cuál le sigue)
                    </button>
                  </div>
                </div>

                {editSecuenciaMode === 'si' && (
                  <div className="bg-white p-3 rounded-xl border border-emerald-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="font-bold text-emerald-900">
                        ¿Cuál es la actividad que le sigue? ({editAllowedItemIds.length} seleccionada{editAllowedItemIds.length === 1 ? '' : 's'})
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editSuccessorSearch}
                          onChange={e => setEditSuccessorSearch(e.target.value)}
                          placeholder="Buscar actividad..."
                          className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveSecuenciaOdt('si', editAllowedItemIds)}
                          disabled={updateOdt.isPending}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs inline-flex items-center gap-1 cursor-pointer shrink-0"
                        >
                          <Check size={12} /> Guardar Autorización
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto">
                      {editCandidates.map(it => {
                        const isChecked = editAllowedItemIds.includes(it.id);
                        return (
                          <label
                            key={it.id}
                            onClick={() => toggleEditAllowedSuccessor(it.id)}
                            className={`p-2 rounded-lg border text-xs flex items-center gap-2 cursor-pointer ${
                              isChecked
                                ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold'
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}}
                              className="rounded text-emerald-600"
                            />
                            <span className="font-mono font-bold">{it.codigo_item}</span>
                            <span className="truncate">{it.descripcion}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Ficha de Recursos Asignados */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cuadrilla y Personal Asignado</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdt.cuadrilla_nombre || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Maquinaria y Herramientas</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdt.equipo_asignado || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Materiales Requeridos / Observaciones</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdt.materiales_requeridos || 'Sin materiales específicos registrados'}</p>
                </div>
                {parsedRule.cleanInstrucciones && (
                  <div className="md:col-span-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Instrucciones de Calidad y Seguridad</span>
                    <p className="text-slate-700 mt-0.5">{parsedRule.cleanInstrucciones}</p>
                  </div>
                )}
              </div>

              {/* Historial de Partes Diarios Cargados para esta ODT */}
              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-800">
                  Partes Diarios de Terreno Cargados en esta ODT ({prog.partesOdt.length})
                </h4>
                {prog.partesOdt.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Todavía no se registraron partes diarios de producción para esta ODT en Fase 3 (Ejecución).
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3 text-right">Cant. Real</th>
                          <th className="py-2 px-3 text-center">Horario Real</th>
                          <th className="py-2 px-3 text-center">Horas Trabajadas</th>
                          <th className="py-2 px-3 text-center">Personal</th>
                          <th className="py-2 px-3">Paradas / Novedades</th>
                          <th className="py-2 px-3">Responsable</th>
                          <th className="py-2 px-3 text-center">Acción</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {prog.partesOdt.map(p => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono">{p.fecha}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {Number(p.cantidad_real).toLocaleString('es-AR')} {p.unidad}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-600">
                              {p.hora_inicio_real || '-'} a {p.hora_fin_real || '-'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                              {p.horas_trabajadas} hs
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {p.personal_real_count} op.
                            </td>
                            <td className="py-2 px-3 text-slate-600">
                              {p.minutos_parada > 0 ? `⚠️ ${p.minutos_parada}m (${p.motivo_parada || 'Parada'})` : 'Sin paradas'}
                              {p.novedades_interferencias ? ` | ${p.novedades_interferencias}` : ''}
                            </td>
                            <td className="py-2 px-3 text-slate-700">{p.responsable_carga || '-'}</td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteParteFromReport(p.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 cursor-pointer"
                                title="Eliminar este parte diario"
                              >
                                <Trash2 size={12} />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setViewingOdt(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar Informe
                </button>
              </div>
            </div>
          );
        })()}
      </ModalPortal>
    </div>
  );
};
