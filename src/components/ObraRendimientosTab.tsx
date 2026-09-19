import React, { useState, useMemo } from 'react';
import {
  Zap, Clock, Plus, CheckCircle2, AlertTriangle, FileText,
  HardHat, Calendar, Printer, Check, X, ShoppingCart,
  MapPin, Gauge, FileSpreadsheet, UploadCloud, Users, BarChart3,
  Layers, RefreshCw, Edit3, Trash2
} from 'lucide-react';
import {
  useObraControlTareas, useCreateObraControlTarea, useUpdateObraControlTarea,
  useDeleteObraControlTarea, useCerrarObraControlTarea,
  useConsolidarTareaEnParteDiario, useObraSectores, useCreateObraSector,
  useEmployees, usePartesDiarios, useBudgets, useBudgetItems,
  useFuelVehicles, useCreatePurchaseRequest,
  useObraActividadesCatalogo, useObraCuadrillas
} from '../hooks/useData';
import type { ObraControlTarea } from '../lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ObraRendimientosTabProps {
  projectId: string;
  projectName?: string;
}

export const ROQUE_43_SECTORES = [
  { nombre: "SEC001-N25-N30", manzana: "MzaA", pasaje: "Pasaje 3", nodos_tramo: "N25-N30", longitud_ml: 76.0, diametro: "Ø75" },
  { nombre: "SEC002-N30-N29", manzana: "MzaA", pasaje: "Pasaje 8", nodos_tramo: "N30-N29", longitud_ml: 106.0, diametro: "Ø75" },
  { nombre: "SEC003-N29-N22", manzana: "MzaA", pasaje: "Pasaje 4", nodos_tramo: "N29-N22", longitud_ml: 92.0, diametro: "Ø75" },
  { nombre: "SEC004-N22-N24", manzana: "MzaA", pasaje: "Pasaje 2", nodos_tramo: "N22-N24", longitud_ml: 96.0, diametro: "Ø110" },
  { nombre: "SEC005-N24-N25", manzana: "MzaA", pasaje: "Pasaje 2", nodos_tramo: "N24-N25", longitud_ml: 15.0, diametro: "Ø110" },
  { nombre: "SEC006-N29-N28", manzana: "MzaB", pasaje: "Pasaje 8", nodos_tramo: "N29-N28", longitud_ml: 100.0, diametro: "Ø75" },
  { nombre: "SEC007-N28-N21", manzana: "MzaB", pasaje: "Pasaje 5", nodos_tramo: "N28-N21", longitud_ml: 102.0, diametro: "Ø75" },
  { nombre: "SEC008-N20-N21", manzana: "MzaB", pasaje: "Pasaje 2", nodos_tramo: "N20-N21", longitud_ml: 97.0, diametro: "Ø110" },
  { nombre: "SEC009-N21-N22", manzana: "MzaB", pasaje: "Pasaje 2", nodos_tramo: "N21-N22", longitud_ml: 2.0, diametro: "Ø110" },
  { nombre: "SEC010-N28-N27", manzana: "MzaC", pasaje: "Pasaje 8", nodos_tramo: "N28-N27", longitud_ml: 82.0, diametro: "Ø75" },
  { nombre: "SEC011-N27-N19", manzana: "MzaC", pasaje: "Pasaje 6", nodos_tramo: "N27-N19", longitud_ml: 117.0, diametro: "Ø110" },
  { nombre: "SEC012-N19-N20", manzana: "MzaC", pasaje: "Pasaje 2", nodos_tramo: "N19-N20", longitud_ml: 77.0, diametro: "Ø110" },
  { nombre: "SEC013-N27-N26", manzana: "MzaD", pasaje: "Pasaje 8", nodos_tramo: "N27-N26", longitud_ml: 81.0, diametro: "Ø75" },
  { nombre: "SEC014-N26-N18", manzana: "MzaD", pasaje: "Pasaje 7", nodos_tramo: "N26-N18", longitud_ml: 113.0, diametro: "Ø75" },
  { nombre: "SEC015-N18-N19", manzana: "MzaD", pasaje: "Pasaje 2", nodos_tramo: "N18-N19", longitud_ml: 88.0, diametro: "Ø110" },
  { nombre: "SEC016-N13-N23", manzana: "Mza E", pasaje: "Pasaje 3", nodos_tramo: "N13-N23", longitud_ml: 78.0, diametro: "Ø75" },
  { nombre: "SEC017-N23-N24", manzana: "Mza E", pasaje: "Pasaje 3", nodos_tramo: "N23-N24", longitud_ml: 8.0, diametro: "Ø110" },
  { nombre: "SEC018-N20-N12", manzana: "Mza E", pasaje: "Pasaje 5", nodos_tramo: "N20-N12", longitud_ml: 98.0, diametro: "Ø75" },
  { nombre: "SEC019-N12-N13", manzana: "Mza E", pasaje: "Pasaje 9", nodos_tramo: "N12-N13", longitud_ml: 200.0, diametro: "Ø75" },
  { nombre: "SEC020-N18-N17", manzana: "F", pasaje: "Pasaje 14", nodos_tramo: "N18-N17", longitud_ml: 24.0, diametro: "Ø110" },
  { nombre: "SEC021-N17-N11", manzana: "F", pasaje: "Pasaje 9", nodos_tramo: "N17-N11", longitud_ml: 92.0, diametro: "Ø75" },
  { nombre: "SEC022-N11-N12", manzana: "F", pasaje: "Pasaje 9", nodos_tramo: "N11-N12", longitud_ml: 182.0, diametro: "Ø75" },
  { nombre: "SEC023-N17-N15", manzana: "G", pasaje: "Pasaje 2", nodos_tramo: "N17-N15", longitud_ml: 245.0, diametro: "Ø110" },
  { nombre: "SEC024-N16-N15", manzana: "G", pasaje: "Pasaje 2", nodos_tramo: "N16-N15", longitud_ml: 7.0, diametro: "Ø75" },
  { nombre: "SEC025-N15-N10", manzana: "G", pasaje: "Pasaje 2", nodos_tramo: "N15-N10", longitud_ml: 81.0, diametro: "Ø110" },
  { nombre: "SEC026-N10-N9", manzana: "G", pasaje: "Pasaje 2", nodos_tramo: "N10-N9", longitud_ml: 10.0, diametro: "Ø110" },
  { nombre: "SEC027-N9-N11", manzana: "G", pasaje: "Pasaje 2", nodos_tramo: "N9-N11", longitud_ml: 210.0, diametro: "Ø75" },
  { nombre: "SEC028-N16-N14", manzana: "H", pasaje: "", nodos_tramo: "N16-N14", longitud_ml: 136.0, diametro: "Ø75" },
  { nombre: "SEC029-N14-N8", manzana: "H", pasaje: "", nodos_tramo: "N14-N8", longitud_ml: 110.0, diametro: "Ø75" },
  { nombre: "SEC030-N8-N10", manzana: "H", pasaje: "", nodos_tramo: "N8-N10", longitud_ml: 140.0, diametro: "Ø75" },
  { nombre: "SEC031-N7-N11", manzana: "I", pasaje: "", nodos_tramo: "N7-N11", longitud_ml: 80.0, diametro: "Ø75" },
  { nombre: "SEC032-N9-N6", manzana: "I", pasaje: "", nodos_tramo: "N9-N6", longitud_ml: 91.0, diametro: "Ø110" },
  { nombre: "SEC033-N6-N5", manzana: "I", pasaje: "", nodos_tramo: "N6-N5", longitud_ml: 10.0, diametro: "Ø110" },
  { nombre: "SEC034-N5-N7", manzana: "I", pasaje: "", nodos_tramo: "N5-N7", longitud_ml: 188.0, diametro: "Ø75" },
  { nombre: "SEC035-N8-N4", manzana: "J", pasaje: "", nodos_tramo: "N8-N4", longitud_ml: 118.0, diametro: "Ø75" },
  { nombre: "SEC036-N4-N6", manzana: "J", pasaje: "", nodos_tramo: "N4-N6", longitud_ml: 167.0, diametro: "Ø75" },
  { nombre: "SEC037-N3-N7", manzana: "K", pasaje: "", nodos_tramo: "N3-N7", longitud_ml: 64.0, diametro: "Ø75" },
  { nombre: "SEC038-N5-N2", manzana: "K", pasaje: "", nodos_tramo: "N5-N2", longitud_ml: 55.0, diametro: "Ø110" },
  { nombre: "SEC039-N2-N3", manzana: "K", pasaje: "", nodos_tramo: "N2-N3", longitud_ml: 190.0, diametro: "Ø75" },
  { nombre: "SEC040-N4-N1", manzana: "L", pasaje: "", nodos_tramo: "N4-N1", longitud_ml: 82.0, diametro: "Ø75" },
  { nombre: "SEC041-N1-N2", manzana: "L", pasaje: "", nodos_tramo: "N1-N2", longitud_ml: 165.0, diametro: "Ø75" },
  { nombre: "SEC042-N2-N32", manzana: "Garita SL", pasaje: "", nodos_tramo: "N2-N32", longitud_ml: 40.0, diametro: "Ø110" },
  { nombre: "SEC043-N23-N31", manzana: "Garita Interna", pasaje: "", nodos_tramo: "N23-N31", longitud_ml: 84.0, diametro: "Ø110" }
];

const CAUSAS_PARADA = [
  { id: 'falta_material', label: 'Falta de Material / Insumo', color: 'bg-amber-100 text-amber-800 border-amber-300' },
  { id: 'rotura_equipo', label: 'Rotura o Falla de Equipo', color: 'bg-red-100 text-red-800 border-red-300' },
  { id: 'falta_personal', label: 'Ausencia de Personal / Cuadrilla', color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { id: 'interferencia', label: 'Interferencia (Caño, Red o Roca)', color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { id: 'espera_inspeccion', label: 'Espera Inspección / Aprobación', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { id: 'replanteo', label: 'Error / Ajuste de Replanteo', color: 'bg-slate-100 text-slate-800 border-slate-300' },
  { id: 'clima', label: 'Condiciones Climáticas Adversas', color: 'bg-cyan-100 text-cyan-800 border-cyan-300' },
  { id: 'otro', label: 'Otra Causa Operativa', color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

export const ObraRendimientosTab: React.FC<ObraRendimientosTabProps> = ({ projectId, projectName }) => {
  const [subTab, setSubTab] = useState<'tareas' | 'control_horas' | 'importar'>('tareas');
  const [filterFecha, setFilterFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [filterEstado, setFilterEstado] = useState<'todos' | 'abierta' | 'cerrada'>('todos');

  // Queries
  const { data: tareas = [], isLoading: loadingTareas } = useObraControlTareas(projectId);
  const { data: sectores = [] } = useObraSectores(projectId);
  const { data: catalogoActividades = [] } = useObraActividadesCatalogo();
  const { data: cuadrillas = [] } = useObraCuadrillas(projectId);
  const { data: employees = [] } = useEmployees();
  const { data: vehicles = [] } = useFuelVehicles();
  const { data: partes = [] } = usePartesDiarios(projectId);
  const { data: budgets = [] } = useBudgets();
  const activeBudget = budgets.find(b => b.project_id === projectId);
  const { data: budgetItems = [] } = useBudgetItems(activeBudget?.id);

  // Mutations
  const createTarea = useCreateObraControlTarea();
  const updateTarea = useUpdateObraControlTarea();
  const deleteTarea = useDeleteObraControlTarea();
  const cerrarTarea = useCerrarObraControlTarea();
  const consolidarEnParte = useConsolidarTareaEnParteDiario();
  const createSector = useCreateObraSector();
  const createPurchaseRequest = useCreatePurchaseRequest();

  // Modales
  const [showNewModal, setShowNewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<ObraControlTarea | null>(null);
  const [showCloseModal, setShowCloseModal] = useState<ObraControlTarea | null>(null);
  const [showSectorModal, setShowSectorModal] = useState(false);
  const [showPedirMaterialModal, setShowPedirMaterialModal] = useState<ObraControlTarea | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Form Editar Tarea
  const [formEdit, setFormEdit] = useState<any>({
    id: '',
    sector_id: '',
    sector_nombre: '',
    manzana: '',
    nodos_tramo: '',
    diametro_mm: '',
    actividad: '',
    unidad_medida: 'm',
    cantidad_plan: '',
    rendimiento_objetivo_h: '',
    hora_inicio_plan: '07:30',
    hora_fin_plan: '15:30',
    cuadrilla_nombre: '',
    responsable_id: '',
    personal_plan_count: '2',
    equipo_asignado: '',
    materiales_requeridos: '',
    epp_requerido: '',
    wbs_element_id: '',
    budget_item_id: '',
    cantidad_real: '',
    personal_real_count: '',
    minutos_parada: '',
    motivo_desvio: '',
    observaciones: '',
    accion_correctiva: '',
    responsable_accion: '',
  });

  // Form Nueva Tarea
  const [formTarea, setFormTarea] = useState({
    sector_id: '',
    sector_nombre: '',
    manzana: '',
    nodos_tramo: '',
    diametro_mm: '',
    actividad: '',
    unidad_medida: 'm',
    cantidad_plan: '',
    rendimiento_objetivo_h: '',
    hora_inicio_plan: '07:30',
    hora_fin_plan: '15:30',
    cuadrilla_nombre: '',
    responsable_id: '',
    personal_plan_count: '2',
    equipo_asignado: '',
    materiales_requeridos: '',
    epp_requerido: '',
    wbs_element_id: '',
    budget_item_id: '',
  });

  // Form Nuevo Sector
  const [nuevoSector, setNuevoSector] = useState({ nombre: '', manzana: '', nodos_tramo: '' });

  // Form Cierre Rápido
  const [formCierre, setFormCierre] = useState({
    hora_inicio_real: '07:30',
    hora_fin_real: '15:30',
    cantidad_real: '',
    personal_real_count: '2',
    minutos_parada: '0',
    motivo_desvio: '',
    observaciones: '',
    accion_correctiva: '',
    responsable_accion: '',
  });

  // Form Pedir Material desde Causa de Parada
  const [pedidoMaterial, setPedidoMaterial] = useState({
    descripcion: '',
    cantidad: '1',
    unidad: 'un',
    urgencia: 'urgent' as const,
    notas: '',
  });

  // Filtrado de Tareas
  const filteredTareas = useMemo(() => {
    return tareas.filter(t => {
      const matchEstado = filterEstado === 'todos' || t.estado === filterEstado;
      const matchFecha = !filterFecha || t.fecha_plan === filterFecha;
      return matchEstado && matchFecha;
    });
  }, [tareas, filterEstado, filterFecha]);

  // KPIs Resumen
  const kpis = useMemo(() => {
    const total = filteredTareas.length;
    const abiertas = filteredTareas.filter(t => t.estado === 'abierta').length;
    const cerradas = filteredTareas.filter(t => t.estado === 'cerrada');
    
    const cumplimientoPromedio = cerradas.length > 0
      ? Math.round(cerradas.reduce((s, t) => s + (t.cumplimiento_pct || 0), 0) / cerradas.length)
      : 0;
    
    const totalMinutosPerdidos = cerradas.reduce((s, t) => s + (t.minutos_parada || 0), 0);
    const totalHHReales = cerradas.reduce((s, t) => s + (t.hh_real || 0), 0);

    return { total, abiertas, completadas: cerradas.length, cumplimientoPromedio, totalMinutosPerdidos, totalHHReales };
  }, [filteredTareas]);

  // Control de Horas Agrupado por Día (Hoja 'Control Horas' del Excel)
  const controlHorasDiario = useMemo(() => {
    const byDate: Record<string, {
      fecha: string;
      planificadas: number;
      terminadas: number;
      hsPlan: number;
      hsReal: number;
      hhPlan: number;
      hhReal: number;
      minutosParada: number;
    }> = {};

    tareas.forEach(t => {
      const f = t.fecha_plan || 'Sin fecha';
      if (!byDate[f]) {
        byDate[f] = { fecha: f, planificadas: 0, terminadas: 0, hsPlan: 0, hsReal: 0, hhPlan: 0, hhReal: 0, minutosParada: 0 };
      }
      byDate[f].planificadas += 1;
      if (t.estado === 'cerrada') byDate[f].terminadas += 1;
      
      const hsP = 8;
      byDate[f].hsPlan += hsP;
      byDate[f].hsReal += (t.horas_reales || 0);
      byDate[f].hhPlan += (t.hh_plan || 0);
      byDate[f].hhReal += (t.hh_real || 0);
      byDate[f].minutosParada += (t.minutos_parada || 0);
    });

    return Object.values(byDate).sort((a, b) => b.fecha.localeCompare(a.fecha));
  }, [tareas]);

  // Selección rápida de Actividad del Catálogo Estándar Roque
  const handleSelectCatalogoActividad = (codigo: string) => {
    const act = catalogoActividades.find(a => a.codigo === codigo);
    if (!act) return;
    setFormTarea(prev => ({
      ...prev,
      actividad: act.actividad,
      unidad_medida: act.unidad,
      rendimiento_objetivo_h: String(Number((act.rendimiento_base_dia / 8).toFixed(2))),
      equipo_asignado: act.equipo_sugerido || prev.equipo_asignado,
    }));
  };

  // Selección rápida de Cuadrilla Estándar
  const handleSelectCuadrilla = (codigo: string) => {
    const cuad = cuadrillas.find(c => c.codigo === codigo);
    if (!cuad) return;
    setFormTarea(prev => ({
      ...prev,
      cuadrilla_nombre: `${cuad.codigo} - ${cuad.nombre}`,
      personal_plan_count: String(cuad.integrantes_nombres?.length || 2),
      responsable_id: cuad.responsable_id || prev.responsable_id,
      equipo_asignado: cuad.equipo_principal || prev.equipo_asignado,
    }));
  };

  // Importar los 43 Sectores Oficiales de Roque con 1 clic
  const handleCargarSectoresRoqueDefault = async () => {
    if (!confirm('¿Cargar los 43 sectores oficiales de Loteo Roque a este proyecto?')) return;
    setIsImporting(true);
    try {
      let cargados = 0;
      for (const s of ROQUE_43_SECTORES) {
        const existe = sectores.some(sec => sec.nombre === s.nombre);
        if (!existe) {
          await createSector.mutateAsync({
            project_id: projectId,
            nombre: s.nombre,
            manzana: s.manzana,
            nodos_tramo: s.nodos_tramo,
            descripcion: `Longitud: ${s.longitud_ml} ml | Diámetro: ${s.diametro}${s.pasaje ? ` | ${s.pasaje}` : ''}`,
          });
          cargados++;
        }
      }
      alert(`¡Sectores procesados! Se incorporaron ${cargados} nuevos sectores.`);
    } catch (e: any) {
      alert(`Error al importar sectores: ${e.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Parsear archivo Excel (.xlsx) subido por el usuario
  const handleImportExcelFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const buffer = await file.arrayBuffer();
      const wb = XLSX.read(buffer, { type: 'array' });
      
      let sectoresCreados = 0;
      if (wb.SheetNames.includes('Base Sectores')) {
        const ws = wb.Sheets['Base Sectores'];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });
        for (let r = 4; r < data.length; r++) {
          const row = data[r];
          if (row && row[0] && String(row[0]).startsWith('SEC')) {
            const secNombre = String(row[0]);
            if (!sectores.some(s => s.nombre === secNombre)) {
              await createSector.mutateAsync({
                project_id: projectId,
                nombre: secNombre,
                manzana: String(row[2] || ''),
                nodos_tramo: String(row[6] || `${row[4] || ''}-${row[5] || ''}`),
                descripcion: `Longitud: ${row[7] || 0} ml | Diámetro: ${row[8] || 'Ø75'} | Pasaje: ${row[3] || ''}`,
              });
              sectoresCreados++;
            }
          }
        }
      }

      alert(`Importación completada con éxito. Se importaron ${sectoresCreados} sectores desde el archivo.`);
    } catch (err: any) {
      alert(`Error procesando el archivo Excel: ${err.message}`);
    } finally {
      setIsImporting(false);
    }
  };

  // Manejar selección de Ítem del Presupuesto (Autocompletar Actividad y Rendimiento)
  const handleSelectBudgetItem = (itemId: string) => {
    const item = budgetItems.find(i => i.id === itemId);
    if (item) {
      setFormTarea(prev => ({
        ...prev,
        budget_item_id: itemId,
        actividad: item.description,
        unidad_medida: item.unit || 'm',
      }));
    } else {
      setFormTarea(prev => ({ ...prev, budget_item_id: itemId }));
    }
  };

  // Guardar Nueva Tarea
  const handleSaveTarea = async () => {
    if (!formTarea.actividad || !formTarea.cantidad_plan) {
      alert('Por favor ingrese la actividad y la cantidad planificada.');
      return;
    }

    const sec = sectores.find(s => s.id === formTarea.sector_id);
    const emp = employees.find(e => e.id === formTarea.responsable_id);

    await createTarea.mutateAsync({
      project_id: projectId,
      sector_id: formTarea.sector_id || null,
      sector_nombre: sec ? sec.nombre : (formTarea.sector_nombre || 'Sector General'),
      manzana: formTarea.manzana || sec?.manzana || null,
      nodos_tramo: formTarea.nodos_tramo || sec?.nodos_tramo || null,
      diametro_mm: formTarea.diametro_mm || null,
      actividad: formTarea.actividad,
      unidad_medida: formTarea.unidad_medida || 'm',
      cantidad_plan: parseFloat(formTarea.cantidad_plan) || 0,
      rendimiento_objetivo_h: parseFloat(formTarea.rendimiento_objetivo_h) || 0,
      hora_inicio_plan: formTarea.hora_inicio_plan,
      hora_fin_plan: formTarea.hora_fin_plan,
      cuadrilla_nombre: formTarea.cuadrilla_nombre || (emp ? `Cuadrilla ${emp.full_name}` : 'Cuadrilla Principal'),
      responsable_id: formTarea.responsable_id || null,
      responsable_nombre: emp?.full_name || null,
      personal_plan_count: parseInt(formTarea.personal_plan_count) || 2,
      equipo_asignado: formTarea.equipo_asignado || null,
      materiales_requeridos: formTarea.materiales_requeridos || null,
      epp_requerido: formTarea.epp_requerido || null,
      wbs_element_id: formTarea.wbs_element_id || null,
      budget_item_id: formTarea.budget_item_id || null,
      fecha_plan: filterFecha || new Date().toISOString().split('T')[0],
    });

    setShowNewModal(false);
    setFormTarea({
      sector_id: '', sector_nombre: '', manzana: '', nodos_tramo: '', diametro_mm: '',
      actividad: '', unidad_medida: 'm', cantidad_plan: '', rendimiento_objetivo_h: '',
      hora_inicio_plan: '07:30', hora_fin_plan: '15:30', cuadrilla_nombre: '',
      responsable_id: '', personal_plan_count: '2', equipo_asignado: '',
      materiales_requeridos: '', epp_requerido: '', wbs_element_id: '', budget_item_id: '',
    });
  };

  // Abrir Modal de Cierre
  const handleOpenCloseModal = (tarea: ObraControlTarea) => {
    setShowCloseModal(tarea);
    setFormCierre({
      hora_inicio_real: tarea.hora_inicio_plan || '07:30',
      hora_fin_real: tarea.hora_fin_plan || '15:30',
      cantidad_real: String(tarea.cantidad_plan || ''),
      personal_real_count: String(tarea.personal_plan_count || '2'),
      minutos_parada: '0',
      motivo_desvio: '',
      observaciones: '',
      accion_correctiva: '',
      responsable_accion: tarea.responsable_nombre || '',
    });
  };

  // Confirmar Cierre de Tarea
  const handleConfirmClose = async () => {
    if (!showCloseModal) return;

    await cerrarTarea.mutateAsync({
      id: showCloseModal.id,
      hora_inicio_real: formCierre.hora_inicio_real,
      hora_fin_real: formCierre.hora_fin_real,
      cantidad_real: parseFloat(formCierre.cantidad_real) || 0,
      personal_real_count: parseInt(formCierre.personal_real_count) || 2,
      minutos_parada: parseInt(formCierre.minutos_parada) || 0,
      motivo_desvio: formCierre.motivo_desvio,
      observaciones: formCierre.observaciones,
      accion_correctiva: formCierre.accion_correctiva,
      responsable_accion: formCierre.responsable_accion,
      paradas: parseInt(formCierre.minutos_parada) > 0 ? [{
        motivo: formCierre.motivo_desvio || 'Parada operativa',
        minutos: parseInt(formCierre.minutos_parada) || 0,
        detalle: formCierre.observaciones,
      }] : [],
    });

    setShowCloseModal(null);
  };

  // Toggle selección de equipos en Nueva Tarea
  const toggleEquipoForm = (codeWithDesc: string) => {
    setFormTarea(prev => {
      const list = prev.equipo_asignado ? prev.equipo_asignado.split(', ').map(s => s.trim()).filter(Boolean) : [];
      const next = list.includes(codeWithDesc) ? list.filter(x => x !== codeWithDesc) : [...list, codeWithDesc];
      return { ...prev, equipo_asignado: next.join(', ') };
    });
  };

  // Toggle selección de equipos en Edición de Tarea
  const toggleEquipoEdit = (codeWithDesc: string) => {
    setFormEdit((prev: any) => {
      const list = prev.equipo_asignado ? prev.equipo_asignado.split(', ').map((s: string) => s.trim()).filter(Boolean) : [];
      const next = list.includes(codeWithDesc) ? list.filter((x: string) => x !== codeWithDesc) : [...list, codeWithDesc];
      return { ...prev, equipo_asignado: next.join(', ') };
    });
  };

  // Abrir Modal de Edición de Tarea
  const handleOpenEditModal = (t: ObraControlTarea) => {
    setShowEditModal(t);
    setFormEdit({
      id: t.id,
      sector_id: t.sector_id || '',
      sector_nombre: t.sector_nombre || '',
      manzana: t.manzana || '',
      nodos_tramo: t.nodos_tramo || '',
      diametro_mm: t.diametro_mm || '',
      actividad: t.actividad || '',
      unidad_medida: t.unidad_medida || 'm',
      cantidad_plan: String(t.cantidad_plan || ''),
      rendimiento_objetivo_h: String(t.rendimiento_objetivo_h || ''),
      hora_inicio_plan: t.hora_inicio_plan || '07:30',
      hora_fin_plan: t.hora_fin_plan || '15:30',
      cuadrilla_nombre: t.cuadrilla_nombre || '',
      responsable_id: t.responsable_id || '',
      personal_plan_count: String(t.personal_plan_count || '2'),
      equipo_asignado: t.equipo_asignado || '',
      materiales_requeridos: t.materiales_requeridos || '',
      epp_requerido: t.epp_requerido || '',
      wbs_element_id: t.wbs_element_id || '',
      budget_item_id: t.budget_item_id || '',
      cantidad_real: String(t.cantidad_real ?? ''),
      personal_real_count: String(t.personal_real_count ?? t.personal_plan_count ?? '2'),
      minutos_parada: String(t.minutos_parada ?? '0'),
      motivo_desvio: t.motivo_desvio || '',
      observaciones: t.observaciones || '',
      accion_correctiva: t.accion_correctiva || '',
      responsable_accion: t.responsable_accion || '',
    });
  };

  // Guardar Cambios de Edición
  const handleSaveEdit = async () => {
    if (!showEditModal || !formEdit.actividad) return;
    const sec = sectores.find(s => s.id === formEdit.sector_id);
    const emp = employees.find(e => e.id === formEdit.responsable_id);

    const payload: Partial<ObraControlTarea> = {
      sector_id: formEdit.sector_id || null,
      sector_nombre: sec ? sec.nombre : (formEdit.sector_nombre || showEditModal.sector_nombre),
      manzana: formEdit.manzana || sec?.manzana || null,
      nodos_tramo: formEdit.nodos_tramo || sec?.nodos_tramo || null,
      diametro_mm: formEdit.diametro_mm || null,
      actividad: formEdit.actividad,
      unidad_medida: formEdit.unidad_medida || 'm',
      cantidad_plan: parseFloat(formEdit.cantidad_plan) || showEditModal.cantidad_plan,
      rendimiento_objetivo_h: parseFloat(formEdit.rendimiento_objetivo_h) || 0,
      hora_inicio_plan: formEdit.hora_inicio_plan,
      hora_fin_plan: formEdit.hora_fin_plan,
      cuadrilla_nombre: formEdit.cuadrilla_nombre || (emp ? `Cuadrilla ${emp.full_name}` : showEditModal.cuadrilla_nombre),
      responsable_id: formEdit.responsable_id || null,
      responsable_nombre: emp?.full_name || showEditModal.responsable_nombre,
      personal_plan_count: parseInt(formEdit.personal_plan_count) || showEditModal.personal_plan_count,
      equipo_asignado: formEdit.equipo_asignado || null,
      materiales_requeridos: formEdit.materiales_requeridos || null,
      epp_requerido: formEdit.epp_requerido || null,
      wbs_element_id: formEdit.wbs_element_id || null,
      budget_item_id: formEdit.budget_item_id || null,
    };

    if (showEditModal.estado === 'cerrada') {
      payload.cantidad_real = parseFloat(formEdit.cantidad_real) || 0;
      payload.personal_real_count = parseInt(formEdit.personal_real_count) || payload.personal_plan_count;
      payload.minutos_parada = parseInt(formEdit.minutos_parada) || 0;
      payload.motivo_desvio = formEdit.motivo_desvio || null;
      payload.observaciones = formEdit.observaciones || null;
      payload.accion_correctiva = formEdit.accion_correctiva || null;
      payload.responsable_accion = formEdit.responsable_accion || null;
    }

    await updateTarea.mutateAsync({ id: showEditModal.id, updates: payload });
    setShowEditModal(null);
  };

  // Eliminar Tarea
  const handleDeleteTarea = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tarea? Esta acción recalculará las métricas de la jornada.')) return;
    await deleteTarea.mutateAsync(id);
  };

  // Generar PDF de Orden de Tarea Diaria (estilo Sheet 11_Orden_Tarea)
  const handlePrintOrden = (t: ObraControlTarea) => {
    const doc = new jsPDF();

    // Encabezado
    doc.setFillColor(15, 58, 103);
    doc.rect(0, 0, 210, 24, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ECAR CONSTRUCTORA — ORDEN DIARIA DE CUADRILLA', 14, 15);

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(`Doc PR-GO-01 §14.2 — OTI Interna | Código: ${t.codigo_tarea}`, 14, 21);

    // Datos Principales
    doc.setTextColor(30, 41, 59);
    doc.setFontSize(10);
    autoTable(doc, {
      startY: 30,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 58, 103], fontStyle: 'bold' },
      body: [
        ['Obra:', projectName || 'Obra ECAR', 'Fecha Programada:', t.fecha_plan],
        ['Sector / Tramo:', `${t.sector_nombre || 'General'}${t.manzana ? ` (Mza ${t.manzana})` : ''}`, 'Horario Previsto:', `${t.hora_inicio_plan} a ${t.hora_fin_plan} hs`],
        ['Cuadrilla / Resp.:', `${t.cuadrilla_nombre || '-'} (${t.responsable_nombre || 'A designar'})`, 'Personal Planificado:', `${t.personal_plan_count} operarios`],
        ['Equipo / Maquinaria:', t.equipo_asignado || 'Sin equipo asignado', 'Diámetro / Detalle:', t.diametro_mm ? `${t.diametro_mm} mm` : 'N/A'],
      ]
    });

    // Actividad y Meta
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      theme: 'grid',
      headStyles: { fillColor: [15, 58, 103], textColor: [255, 255, 255], fontStyle: 'bold' },
      head: [['Actividad a Ejecutar', 'Cantidad Objetivo', 'Unidad', 'Rendimiento Meta']],
      body: [
        [t.actividad, String(t.cantidad_plan), t.unidad_medida, `${t.rendimiento_objetivo_h || '-'} ${t.unidad_medida}/h`],
      ]
    });

    // Materiales y Seguridad
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 6,
      theme: 'grid',
      headStyles: { fillColor: [248, 250, 252], textColor: [51, 65, 85], fontStyle: 'bold' },
      body: [
        ['Materiales Requeridos:', t.materiales_requeridos || 'Según plano y especificaciones'],
        ['EPP y Seguridad Obligatoria:', t.epp_requerido || 'Casco, botines de seguridad, chaleco reflectivo, guantes'],
      ]
    });

    // Casilla de Cierre en Campo (para firma física o chequeo a las 14:30)
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 8,
      theme: 'grid',
      headStyles: { fillColor: [226, 232, 240], textColor: [15, 23, 42], fontStyle: 'bold' },
      head: [['CONTROL DE CIERRE EN CAMPO (Completar a las 14:30 hs)', 'VALOR REAL', 'OBSERVACIONES / DESVÍOS']],
      body: [
        ['Cantidad Real Medida:', '', ''],
        ['Horario Real Efectivo (Inicio - Fin):', '', ''],
        ['Minutos de Parada / Espera (Tiempos muertos):', '', 'Causa:'],
        ['Personal Real que trabajó:', '', ''],
      ]
    });

    // Firmas
    const finalY = (doc as any).lastAutoTable.finalY + 25;
    doc.setFontSize(8);
    doc.line(20, finalY, 80, finalY);
    doc.text('Firma Responsable de Cuadrilla', 25, finalY + 5);

    doc.line(130, finalY, 190, finalY);
    doc.text('Firma Jefe de Obra / Supervisor', 135, finalY + 5);

    doc.save(`Orden_Tarea_${t.codigo_tarea}_${t.fecha_plan}.pdf`);
  };

  // Crear Pedido de Compra Urgente si la causa de parada fue falta de material
  const handleCrearPedidoDesdeParada = async () => {
    if (!showPedirMaterialModal || !pedidoMaterial.descripcion) return;

    await createPurchaseRequest.mutateAsync({
      project_id: projectId,
      requested_by: 'Módulo Obra (Control Tareas)',
      urgency: pedidoMaterial.urgencia,
      notes: `Generado por parada en tarea ${showPedirMaterialModal.codigo_tarea}: ${pedidoMaterial.notas || showPedirMaterialModal.motivo_desvio}`,
      request_type: 'purchase',
      items: [{
        description: pedidoMaterial.descripcion,
        quantity: parseFloat(pedidoMaterial.cantidad) || 1,
        unit: pedidoMaterial.unidad,
        estimated_unit_cost: 0,
      }],
    });

    alert('Pedido de compra registrado exitosamente y enviado a la Gerencia de Compras.');
    setShowPedirMaterialModal(null);
    setPedidoMaterial({ descripcion: '', cantidad: '1', unidad: 'un', urgencia: 'urgent', notas: '' });
  };

  return (
    <div className="space-y-6">
      {/* Banner Superior */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blueDark rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><Gauge size={140} /></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Zap size={14} /> Control de Tareas & Rendimientos Diarios (PR-GO-01)
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Rendimiento Operativo por Cuadrilla
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl">
              Planificación en 30s a las 14:50 hs, emisión de orden de trabajo interna (OTI) y cierre con cálculo instantáneo de HH/unidad y registro de paradas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowSectorModal(true)}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 flex items-center gap-1.5 transition-all"
            >
              <MapPin size={14} /> Sectores ({sectores.length})
            </button>
            <button
              onClick={() => setShowNewModal(true)}
              className="btn-primary text-xs font-bold py-2.5 px-4 shadow-md flex items-center gap-1.5"
            >
              <Plus size={16} /> Asignar Tarea a Cuadrilla
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Vistas Sub-Tabs */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-gray-200 shadow-sm">
        <button
          onClick={() => setSubTab('tareas')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'tareas' ? 'bg-ecar-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <Zap size={15} /> Tareas & Planificación Diaria
        </button>
        <button
          onClick={() => setSubTab('control_horas')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'control_horas' ? 'bg-ecar-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <BarChart3 size={15} /> Control Horas & Efectividad (Roque)
        </button>
        <button
          onClick={() => setSubTab('importar')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            subTab === 'importar' ? 'bg-ecar-blue text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <FileSpreadsheet size={15} /> Importador Excel (.xlsx)
        </button>
      </div>

      {/* ─── PESTAÑA: TAREAS & PLANIFICACIÓN DIARIA ─── */}
      {subTab === 'tareas' && (
        <>
          {/* Banner Explicativo Pedagógico */}
          <div className="bg-amber-50/90 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
            <div className="space-y-0.5">
              <span className="font-extrabold flex items-center gap-1.5 text-xs text-amber-900">
                <Zap size={15} className="text-amber-600" />
                Control Operativo Diario de Cuadrillas en Terreno (PR-GO-01)
              </span>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                A diferencia de la <strong>Planificación WBS (macro)</strong>, acá se programa el trabajo de <strong>hoy o mañana</strong> (a las 14:50), se emite la OTI matutina en PDF (07:00) y se miden metros/hora y paradas al cierre (14:30).
              </p>
            </div>
            <div className="text-[11px] bg-white border border-amber-200 rounded-xl px-3 py-2 text-gray-600 shrink-0">
              📌 Las tareas medidas acá se autocompletan en el <strong>Parte Diario</strong> con 1 solo clic.
            </div>
          </div>
          {/* Barra de Filtros y KPIs Rápidos */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-ecar-blue" />
            <input
              type="date"
              value={filterFecha}
              onChange={e => setFilterFecha(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-ecar-blue"
            />
            {filterFecha && (
              <button onClick={() => setFilterFecha('')} className="text-xs text-gray-400 hover:text-gray-600">
                Ver todo el histórico
              </button>
            )}
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['todos', 'abierta', 'cerrada'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                  filterEstado === st ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {st === 'todos' ? 'Todas' : st === 'abierta' ? 'En Curso / Abiertas' : 'Cerradas'}
              </button>
            ))}
          </div>
        </div>

        {/* Mini KPIs */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200">
            <CheckCircle2 size={14} />
            <span>Cumplimiento: <strong>{kpis.cumplimientoPromedio}%</strong></span>
          </div>
          <div className="flex items-center gap-1.5 bg-amber-50 text-amber-700 px-3 py-1.5 rounded-xl border border-amber-200">
            <Clock size={14} />
            <span>Paradas: <strong>{kpis.totalMinutosPerdidos} min</strong></span>
          </div>
        </div>
      </div>

      {/* Listado de Tareas */}
      {loadingTareas ? (
        <div className="text-center py-12 text-gray-400">Cargando control de tareas...</div>
      ) : filteredTareas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <HardHat size={48} className="mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-800 text-base">No hay tareas registradas para esta fecha</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Planificá la primera tarea de la cuadrilla para emitir su orden interna y medir su rendimiento real.
          </p>
          <button
            onClick={() => setShowNewModal(true)}
            className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5"
          >
            <Plus size={15} /> Planificar Tarea de Hoy
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredTareas.map(t => {
            const isAbierta = t.estado === 'abierta';
            const rendimientoColor = t.cumplimiento_pct >= 100 ? 'text-emerald-600 bg-emerald-50' : t.cumplimiento_pct >= 80 ? 'text-blue-600 bg-blue-50' : 'text-amber-600 bg-amber-50';

            return (
              <div
                key={t.id}
                className={`bg-white rounded-2xl border transition-all p-5 shadow-sm hover:shadow-md ${
                  isAbierta ? 'border-l-4 border-l-amber-500 border-gray-200' : 'border-l-4 border-l-emerald-500 border-gray-200'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Info Tarea */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-900 text-white">
                        {t.codigo_tarea}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isAbierta ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}`}>
                        {isAbierta ? '⏳ En Ejecución (Abierta)' : '✅ Finalizada & Medida'}
                      </span>
                      <span className="text-xs text-gray-500 flex items-center gap-1">
                        <Calendar size={13} /> {t.fecha_plan} ({t.hora_inicio_plan} - {t.hora_fin_plan} hs)
                      </span>
                      {t.sector_nombre && (
                        <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md font-medium flex items-center gap-1">
                          <MapPin size={12} /> {t.sector_nombre} {t.manzana ? `(Mza ${t.manzana})` : ''} {t.nodos_tramo ? `[${t.nodos_tramo}]` : ''}
                        </span>
                      )}
                    </div>

                    <h4 className="text-base font-extrabold text-gray-900 flex items-center gap-2">
                      {t.actividad}
                    </h4>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                      <span>👷 Cuadrilla: <strong className="text-gray-800">{t.cuadrilla_nombre || t.responsable_nombre || 'General'}</strong> ({t.personal_plan_count} pers.)</span>
                      {t.equipo_asignado && <span>🚜 Equipo: <strong className="text-gray-800">{t.equipo_asignado}</strong></span>}
                      {t.diametro_mm && <span>📏 Diámetro: <strong className="text-gray-800">{t.diametro_mm} mm</strong></span>}
                    </div>
                  </div>

                  {/* Métricas y Cierre */}
                  <div className="flex flex-wrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100 shrink-0">
                    <div className="text-center px-2">
                      <span className="text-[10px] text-gray-400 block font-bold uppercase">Objetivo</span>
                      <span className="text-sm font-bold text-gray-700 font-mono">
                        {t.cantidad_plan} {t.unidad_medida}
                      </span>
                    </div>

                    <div className="text-center px-2 border-l border-slate-200">
                      <span className="text-[10px] text-gray-400 block font-bold uppercase">Real</span>
                      <span className="text-sm font-bold text-gray-900 font-mono">
                        {isAbierta ? '—' : `${t.cantidad_real} ${t.unidad_medida}`}
                      </span>
                    </div>

                    {!isAbierta && (
                      <>
                        <div className="text-center px-2 border-l border-slate-200">
                          <span className="text-[10px] text-gray-400 block font-bold uppercase">Cumplimiento</span>
                          <span className={`text-sm font-extrabold font-mono px-2 py-0.5 rounded-md ${rendimientoColor}`}>
                            {t.cumplimiento_pct}%
                          </span>
                        </div>

                        <div className="text-center px-2 border-l border-slate-200">
                          <span className="text-[10px] text-gray-400 block font-bold uppercase">HH / {t.unidad_medida}</span>
                          <span className="text-xs font-bold text-slate-800 font-mono">
                            {t.hh_por_unidad}
                          </span>
                        </div>
                      </>
                    )}

                    {t.minutos_parada > 0 && (
                      <div className="text-center px-2 border-l border-slate-200">
                        <span className="text-[10px] text-red-500 block font-bold uppercase">Parada</span>
                        <span className="text-xs font-bold text-red-600 font-mono">
                          {t.minutos_parada}m
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handlePrintOrden(t)}
                      className="p-2 text-slate-600 hover:text-ecar-blue hover:bg-slate-100 rounded-xl transition-colors border border-slate-200"
                      title="Imprimir / Descargar Orden de Cuadrilla (PDF)"
                    >
                      <Printer size={16} />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(t)}
                      className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors border border-slate-200"
                      title="Editar Tarea / Planificación"
                    >
                      <Edit3 size={16} />
                    </button>

                    <button
                      onClick={() => handleDeleteTarea(t.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-slate-200"
                      title="Eliminar Tarea"
                    >
                      <Trash2 size={16} />
                    </button>

                    {isAbierta ? (
                      <button
                        onClick={() => handleOpenCloseModal(t)}
                        className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
                      >
                        <Check size={15} /> Cerrar & Medir
                      </button>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        {partes.length > 0 && !t.parte_diario_id && (
                          <button
                            onClick={() => consolidarEnParte.mutate({ tareaId: t.id, parteId: partes[0].id })}
                            disabled={consolidarEnParte.isPending}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl border border-blue-200 flex items-center gap-1 transition-all"
                            title="Consolidar en el Parte Diario de Hoy"
                          >
                            <FileText size={14} /> Consolidar en Parte
                          </button>
                        )}
                        {t.motivo_desvio?.includes('material') && (
                          <button
                            onClick={() => {
                              setShowPedirMaterialModal(t);
                              setPedidoMaterial(p => ({ ...p, descripcion: `Material para ${t.actividad}`, notas: t.observaciones || '' }));
                            }}
                            className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs rounded-xl border border-amber-200 flex items-center gap-1"
                            title="Solicitar Material Faltante a Compras"
                          >
                            <ShoppingCart size={13} /> Pedir a Compras
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Si hubo parada o desvío, mostrar tarjeta de causa raíz */}
                {t.motivo_desvio && (
                  <div className="mt-3 pt-3 border-t border-gray-100 text-xs flex flex-wrap items-center gap-4 text-gray-600 bg-amber-50/50 p-2.5 rounded-xl">
                    <span className="font-bold text-amber-800 flex items-center gap-1">
                      <AlertTriangle size={13} /> Motivo Parada: {t.motivo_desvio}
                    </span>
                    {t.observaciones && <span>Detalle: <em>{t.observaciones}</em></span>}
                    {t.accion_correctiva && (
                      <span className="text-emerald-700 font-medium">
                        Acción Correctiva: {t.accion_correctiva} {t.responsable_accion ? `(${t.responsable_accion})` : ''}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* ─── PESTAÑA: CONTROL HORAS & EFECTIVIDAD (HOJA CONTROL HORAS DEL EXCEL) ─── */}
      {subTab === 'control_horas' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="font-extrabold text-gray-900 text-base flex items-center gap-2">
                  <BarChart3 size={18} className="text-ecar-blue" />
                  Control Diario de Horas, Efectividad y Desvíos (Roque)
                </h3>
                <p className="text-xs text-gray-400">
                  Consolidación diaria de HH planificadas vs reales, cumplimiento de tareas y paradas operativas (PR-GO-01).
                </p>
              </div>
              <div className="text-xs font-mono font-bold bg-blue-50 text-ecar-blue px-3 py-1.5 rounded-xl border border-blue-100">
                Total Días Registrados: {controlHorasDiario.length}
              </div>
            </div>

            {controlHorasDiario.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Clock size={40} className="mx-auto mb-2 text-gray-300" />
                <p className="font-medium text-sm">No hay registros de horas en las tareas</p>
                <p className="text-xs text-gray-400">Las jornadas aparecerán automáticamente al planificar y cerrar tareas.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-gray-600 font-bold uppercase tracking-wider border-b border-gray-200">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3 text-center">Tareas Plan</th>
                      <th className="py-2.5 px-3 text-center">Tareas Term.</th>
                      <th className="py-2.5 px-3 text-center">Hs Plan</th>
                      <th className="py-2.5 px-3 text-center">Hs Real</th>
                      <th className="py-2.5 px-3 text-center">HH Plan</th>
                      <th className="py-2.5 px-3 text-center">HH Real</th>
                      <th className="py-2.5 px-3 text-center">Desvío HH</th>
                      <th className="py-2.5 px-3 text-center">Cumplimiento</th>
                      <th className="py-2.5 px-3 text-center">Paradas (min)</th>
                      <th className="py-2.5 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {controlHorasDiario.map(d => {
                      const desvioHH = Number((d.hhReal - d.hhPlan).toFixed(2));
                      const pctCumplimiento = d.planificadas > 0 ? Math.round((d.terminadas / d.planificadas) * 100) : 0;
                      return (
                        <tr key={d.fecha} className="hover:bg-slate-50/80 transition-all font-mono">
                          <td className="py-2.5 px-3 font-bold text-gray-800">{d.fecha}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-gray-700">{d.planificadas}</td>
                          <td className="py-2.5 px-3 text-center font-bold text-emerald-600">{d.terminadas}</td>
                          <td className="py-2.5 px-3 text-center">{d.hsPlan}</td>
                          <td className="py-2.5 px-3 text-center">{d.hsReal.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-center">{d.hhPlan.toFixed(1)}</td>
                          <td className="py-2.5 px-3 text-center font-bold">{d.hhReal.toFixed(1)}</td>
                          <td className={`py-2.5 px-3 text-center font-bold ${desvioHH <= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {desvioHH > 0 ? `+${desvioHH}` : desvioHH}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              pctCumplimiento >= 100 ? 'bg-emerald-100 text-emerald-800' : pctCumplimiento >= 50 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {pctCumplimiento}%
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center text-amber-700">{d.minutosParada} min</td>
                          <td className="py-2.5 px-3 text-right">
                            <button
                              onClick={() => {
                                setFilterFecha(d.fecha);
                                setSubTab('tareas');
                              }}
                              className="text-[11px] font-sans font-bold text-ecar-blue hover:underline"
                            >
                              Ver tareas →
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── PESTAÑA: IMPORTADOR EXCEL ROQUE (.XLSX) ─── */}
      {subTab === 'importar' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: 43 Sectores Oficiales */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-ecar-blue flex-shrink-0">
                <Layers size={22} />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm">Sectores Oficiales de Roque (43 Sectores)</h4>
                <p className="text-xs text-gray-400">Pre-cargados desde el archivo de ingeniería y planificación.</p>
              </div>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1 text-gray-600">
              <p>• Incluye tramos desde <strong>SEC001-N25-N30</strong> hasta <strong>SEC043-N23-N31</strong>.</p>
              <p>• Manzanas A a L, Garita SL y Garita Interna con diámetros Ø75 y Ø110 mm.</p>
              <p className="font-bold text-ecar-blue pt-1">
                Estado en este proyecto: {sectores.length} sectores actualmente registrados.
              </p>
            </div>

            <button
              onClick={handleCargarSectoresRoqueDefault}
              disabled={isImporting}
              className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2"
            >
              {isImporting ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
              Cargar los 43 Sectores Oficiales a la Base de Datos
            </button>
          </div>

          {/* Card 2: Subir archivo Excel */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <FileSpreadsheet size={22} />
              </div>
              <div>
                <h4 className="font-extrabold text-gray-900 text-sm">Subir Libro Excel (.xlsx)</h4>
                <p className="text-xs text-gray-400">Importá directamente ECAR_Control_Obra_Rendimientos_Roque.xlsx</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center space-y-2 hover:border-ecar-blue transition-all">
              <UploadCloud size={32} className="mx-auto text-gray-400" />
              <p className="text-xs font-bold text-gray-700">Seleccioná o arrastrá tu planilla Excel</p>
              <p className="text-[10px] text-gray-400">Lee las hojas "Base Sectores", "Cuadrillas" y "Programacion".</p>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcelFile}
                disabled={isImporting}
                className="block mx-auto text-xs text-gray-500 file:mr-2 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-ecar-blue hover:file:bg-blue-100 cursor-pointer pt-2"
              />
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: NUEVA TAREA (PLANIFICACIÓN EN 30 SEGUNDOS) ─── */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-lg text-gray-800 flex items-center gap-2">
                <Zap size={18} className="text-ecar-blue" /> Planificar Tarea Diaria de Cuadrilla
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Conexión con Presupuesto de Obra */}
            {budgetItems.length > 0 && (
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 space-y-1">
                <label className="text-xs font-bold text-ecar-blue block">
                  Vincular con Ítem del Presupuesto Comercial (Opcional):
                </label>
                <select
                  value={formTarea.budget_item_id}
                  onChange={e => handleSelectBudgetItem(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-blue-200 rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="">-- Seleccionar rubro/ítem de presupuesto --</option>
                  {budgetItems.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.description} ({b.quantity} {b.unit})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Sector / Manzana *</label>
                <div className="flex gap-1.5">
                  <select
                    value={formTarea.sector_id}
                    onChange={e => setFormTarea({ ...formTarea, sector_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none"
                  >
                    <option value="">Seleccionar sector...</option>
                    {sectores.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.nombre} {s.manzana ? `(Mza ${s.manzana})` : ''}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setShowSectorModal(true)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                    title="Nuevo Sector"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Nodos / Tramo / Manzana</label>
                <input
                  type="text"
                  value={formTarea.nodos_tramo}
                  onChange={e => setFormTarea({ ...formTarea, nodos_tramo: e.target.value })}
                  placeholder="Ej: Nodo 14 a 18, Mza B"
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>
            </div>

            {/* Catálogo Estándar Roque */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Zap size={14} className="text-amber-500" /> Catálogo Estándar de Actividades (12 Ítems Roque):
                </label>
                <span className="text-[10px] text-gray-400">Autocompleta rendimiento y equipo</span>
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {catalogoActividades.map(act => (
                  <button
                    key={act.codigo}
                    type="button"
                    onClick={() => handleSelectCatalogoActividad(act.codigo)}
                    className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                      formTarea.actividad === act.actividad
                        ? 'bg-ecar-blue text-white border-ecar-blue shadow-sm'
                        : 'bg-white text-gray-700 border-gray-200 hover:bg-blue-50'
                    }`}
                  >
                    <strong>{act.codigo}</strong>: {act.actividad} ({act.rendimiento_base_dia} {act.unidad}/d)
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Actividad / Tarea a Ejecutar *</label>
              <input
                type="text"
                value={formTarea.actividad}
                onChange={e => setFormTarea({ ...formTarea, actividad: e.target.value })}
                placeholder="Ej: Zanjeo e instalación cañería PVC cloacal 110mm"
                className="w-full px-3 py-2 border rounded-xl text-sm font-semibold focus:outline-none focus:border-ecar-blue"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad Objetivo *</label>
                <input
                  type="number"
                  step="any"
                  value={formTarea.cantidad_plan}
                  onChange={e => setFormTarea({ ...formTarea, cantidad_plan: e.target.value })}
                  placeholder="Ej: 45"
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold text-ecar-blue focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Unidad</label>
                <select
                  value={formTarea.unidad_medida}
                  onChange={e => setFormTarea({ ...formTarea, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none"
                >
                  <option value="m">Metros (m)</option>
                  <option value="un">Unidades (un)</option>
                  <option value="m3">m³</option>
                  <option value="m2">m²</option>
                  <option value="kg">kg</option>
                  <option value="gl">Global</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Rendimiento Estimado (un/h)</label>
                <input
                  type="number"
                  step="any"
                  value={formTarea.rendimiento_objetivo_h}
                  onChange={e => setFormTarea({ ...formTarea, rendimiento_objetivo_h: e.target.value })}
                  placeholder="Ej: 5.5"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono focus:outline-none"
                />
              </div>
            </div>

            {/* Plantillas de Cuadrilla Roque */}
            {cuadrillas.length > 0 && (
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                    <Users size={14} className="text-ecar-blue" /> Cuadrillas de Obra (Armado de Equipos):
                  </span>
                  <span className="text-[10px] text-gray-400">Capataz y personal habitual</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {cuadrillas.map(c => (
                    <button
                      key={c.codigo}
                      type="button"
                      onClick={() => handleSelectCuadrilla(c.codigo)}
                      className={`px-2.5 py-1 text-[11px] font-bold rounded-lg border transition-all ${
                        formTarea.cuadrilla_nombre?.startsWith(c.codigo)
                          ? 'bg-ecar-blue text-white border-ecar-blue shadow-sm'
                          : 'bg-white text-gray-700 border-gray-200 hover:bg-slate-100'
                      }`}
                    >
                      <strong>{c.codigo}</strong>: {c.nombre} ({c.responsable_nombre || 'Resp'})
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Responsable / Capataz</label>
                <select
                  value={formTarea.responsable_id}
                  onChange={e => setFormTarea({ ...formTarea, responsable_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none"
                >
                  <option value="">Seleccionar operario / capataz...</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name} {emp.legajo ? `(Leg. ${emp.legajo})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad de Operarios en Cuadrilla</label>
                <input
                  type="number"
                  value={formTarea.personal_plan_count}
                  onChange={e => setFormTarea({ ...formTarea, personal_plan_count: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Equipos / Maquinarias Asignadas (Multi-selección)</label>
                <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 bg-slate-50 border rounded-xl mb-1.5 items-center">
                  {formTarea.equipo_asignado ? (
                    formTarea.equipo_asignado.split(', ').filter(Boolean).map((eq, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ecar-blue text-white text-[11px] font-medium shadow-xs">
                        🚜 {eq}
                        <button
                          type="button"
                          onClick={() => toggleEquipoForm(eq)}
                          className="hover:text-red-200 text-white font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Sin equipos asignados (trabajo manual)</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border rounded-lg bg-white">
                  {vehicles.map(v => {
                    const val = `${v.code} - ${v.description}`;
                    const isSelected = formTarea.equipo_asignado?.includes(val);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleEquipoForm(val)}
                        className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                          isSelected ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold' : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {v.code} ({v.description})
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Horario Programado</label>
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={formTarea.hora_inicio_plan}
                    onChange={e => setFormTarea({ ...formTarea, hora_inicio_plan: e.target.value })}
                    className="px-2 py-1.5 border rounded-xl text-xs font-mono"
                  />
                  <span className="text-xs text-gray-400">a</span>
                  <input
                    type="time"
                    value={formTarea.hora_fin_plan}
                    onChange={e => setFormTarea({ ...formTarea, hora_fin_plan: e.target.value })}
                    className="px-2 py-1.5 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={handleSaveTarea}
                disabled={createTarea.isPending}
                className="btn-primary w-full py-2.5 text-xs font-bold flex items-center justify-center gap-2 shadow-md"
              >
                {createTarea.isPending ? 'Guardando...' : 'Crear Tarea y Generar Orden (OTI)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: CIERRE RÁPIDO Y MEDICIÓN (14:30 HS) ─── */}
      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider block">
                  Rutina de Cierre de Campo (14:30 hs)
                </span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  Cierre de Tarea: {showCloseModal.codigo_tarea}
                </h3>
              </div>
              <button onClick={() => setShowCloseModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1">
              <p className="font-bold text-gray-800">{showCloseModal.actividad}</p>
              <p className="text-gray-500">
                Meta Prevista: <strong>{showCloseModal.cantidad_plan} {showCloseModal.unidad_medida}</strong> | Cuadrilla: <strong>{showCloseModal.cuadrilla_nombre || '-'}</strong> ({showCloseModal.personal_plan_count} operarios)
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Cantidad Real Lograda *</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="any"
                    value={formCierre.cantidad_real}
                    onChange={e => setFormCierre({ ...formCierre, cantidad_real: e.target.value })}
                    className="w-full px-3 py-2 border border-emerald-300 rounded-xl text-base font-mono font-bold text-emerald-700 focus:outline-none"
                    autoFocus
                  />
                  <span className="text-xs font-bold text-gray-500">{showCloseModal.unidad_medida}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Operarios Efectivos</label>
                <input
                  type="number"
                  value={formCierre.personal_real_count}
                  onChange={e => setFormCierre({ ...formCierre, personal_real_count: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                />
              </div>
            </div>

            {/* Paradas y Tiempos Muertos */}
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <label className="text-xs font-bold text-gray-800 flex items-center justify-between">
                <span>¿Hubo Paradas / Tiempos Muertos?</span>
                <span className="text-amber-600 font-mono">{formCierre.minutos_parada} min perdidos</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">Minutos de parada:</label>
                  <input
                    type="number"
                    value={formCierre.minutos_parada}
                    onChange={e => setFormCierre({ ...formCierre, minutos_parada: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-mono font-bold text-amber-700"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-gray-500 block mb-0.5">Causa principal:</label>
                  <select
                    value={formCierre.motivo_desvio}
                    onChange={e => setFormCierre({ ...formCierre, motivo_desvio: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-medium"
                  >
                    <option value="">Sin paradas</option>
                    {CAUSAS_PARADA.map(c => (
                      <option key={c.id} value={c.label}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {parseInt(formCierre.minutos_parada) > 0 && (
                <div className="space-y-2 bg-amber-50/60 p-3 rounded-xl border border-amber-200">
                  <input
                    type="text"
                    value={formCierre.observaciones}
                    onChange={e => setFormCierre({ ...formCierre, observaciones: e.target.value })}
                    placeholder="Detalle de la parada (Ej: rotura de caño cloacal existente no previsto)..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    value={formCierre.accion_correctiva}
                    onChange={e => setFormCierre({ ...formCierre, accion_correctiva: e.target.value })}
                    placeholder="Acción correctiva tomada para no repetir mañana..."
                    className="w-full px-3 py-1.5 bg-white border border-amber-300 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            <div className="pt-2">
              <button
                onClick={handleConfirmClose}
                disabled={cerrarTarea.isPending}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all"
              >
                {cerrarTarea.isPending ? 'Calculando rendimientos...' : 'Confirmar Cierre y Calcular Rendimiento'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: GESTIONAR SECTORES / TRAMOS ─── */}
      {showSectorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-2">
                <MapPin size={16} className="text-ecar-blue" /> Sectores y Tramos de la Obra
              </h3>
              <button onClick={() => setShowSectorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-2">
              <input
                type="text"
                value={nuevoSector.nombre}
                onChange={e => setNuevoSector({ ...nuevoSector, nombre: e.target.value })}
                placeholder="Nombre Sector (Ej: Sector Norte, Etapa 1)..."
                className="w-full px-3 py-2 border rounded-xl text-xs font-medium"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={nuevoSector.manzana}
                  onChange={e => setNuevoSector({ ...nuevoSector, manzana: e.target.value })}
                  placeholder="Manzana (Ej: Mza C)"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
                <input
                  type="text"
                  value={nuevoSector.nodos_tramo}
                  onChange={e => setNuevoSector({ ...nuevoSector, nodos_tramo: e.target.value })}
                  placeholder="Tramo (Ej: Nodos 12 a 15)"
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>
              <button
                onClick={async () => {
                  if (!nuevoSector.nombre) return;
                  await createSector.mutateAsync({
                    project_id: projectId,
                    nombre: nuevoSector.nombre,
                    manzana: nuevoSector.manzana || null,
                    nodos_tramo: nuevoSector.nodos_tramo || null,
                  });
                  setNuevoSector({ nombre: '', manzana: '', nodos_tramo: '' });
                }}
                disabled={!nuevoSector.nombre || createSector.isPending}
                className="btn-primary w-full py-2 text-xs font-bold"
              >
                + Agregar Sector
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-48 overflow-y-auto border border-gray-100 rounded-xl">
              {sectores.map(s => (
                <div key={s.id} className="p-2.5 text-xs flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800">{s.nombre}</span>
                    {(s.manzana || s.nodos_tramo) && (
                      <span className="text-gray-400 ml-1.5">
                        ({s.manzana ? `Mza ${s.manzana}` : ''} {s.nodos_tramo || ''})
                      </span>
                    )}
                  </div>
                  <span className="badge badge-neutral text-[10px]">Activo</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: SOLICITAR MATERIAL A COMPRAS POR PARADA ─── */}
      {showPedirMaterialModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-800 flex items-center gap-2">
                <ShoppingCart size={16} className="text-amber-600" /> Solicitar Material Faltante a Compras
              </h3>
              <button onClick={() => setShowPedirMaterialModal(null)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <div className="bg-amber-50 p-3 rounded-xl border border-amber-200 text-xs text-amber-800">
              Este pedido se enviará directamente a la <strong>Bandeja de Compras</strong> indicando la tarea detenida ({showPedirMaterialModal.codigo_tarea}) para prioridad de abastecimiento.
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Descripción del Material / Accesorio *</label>
                <input
                  type="text"
                  value={pedidoMaterial.descripcion}
                  onChange={e => setPedidoMaterial({ ...pedidoMaterial, descripcion: e.target.value })}
                  placeholder="Ej: Curva PVC 110mm 45° con aro de goma"
                  className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Cantidad *</label>
                  <input
                    type="number"
                    value={pedidoMaterial.cantidad}
                    onChange={e => setPedidoMaterial({ ...pedidoMaterial, cantidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-600 block mb-1">Unidad</label>
                  <input
                    type="text"
                    value={pedidoMaterial.unidad}
                    onChange={e => setPedidoMaterial({ ...pedidoMaterial, unidad: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-600 block mb-1">Notas de Urgencia para Compras</label>
                <textarea
                  value={pedidoMaterial.notas}
                  onChange={e => setPedidoMaterial({ ...pedidoMaterial, notas: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                  placeholder="Motivo o proveedor sugerido..."
                />
              </div>

              <button
                onClick={handleCrearPedidoDesdeParada}
                disabled={!pedidoMaterial.descripcion || createPurchaseRequest.isPending}
                className="btn-primary w-full py-2.5 text-xs font-bold shadow-md"
              >
                {createPurchaseRequest.isPending ? 'Enviando a Compras...' : 'Emitir Pedido Urgente a Compras'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: EDITAR TAREA / CORRECCIÓN DE DATOS ─── */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <div>
                <span className="text-[11px] font-bold text-blue-600 uppercase tracking-wider block">
                  Edición & Corrección de Tarea
                </span>
                <h3 className="font-extrabold text-lg text-gray-900">
                  {showEditModal.codigo_tarea}: {showEditModal.actividad}
                </h3>
              </div>
              <button
                onClick={() => setShowEditModal(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-blue-50/60 p-3 rounded-xl border border-blue-100 text-xs text-blue-800">
                💡 <strong>Corrección de Registro:</strong> Podés modificar datos erróneos de escritura, equipos asignados, cuadrilla, o cantidades planificadas/reales.
              </div>

              {/* Actividad */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Actividad / Tarea *</label>
                <input
                  type="text"
                  value={formEdit.actividad}
                  onChange={e => setFormEdit({ ...formEdit, actividad: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Ubicación / Sector */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Sector</label>
                  <select
                    value={formEdit.sector_id}
                    onChange={e => {
                      const sec = sectores.find(s => s.id === e.target.value);
                      setFormEdit({
                        ...formEdit,
                        sector_id: e.target.value,
                        sector_nombre: sec ? sec.nombre : formEdit.sector_nombre,
                        manzana: sec?.manzana || formEdit.manzana,
                        nodos_tramo: sec?.nodos_tramo || formEdit.nodos_tramo,
                      });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">(Sin sector vinculado)</option>
                    {sectores.map(s => (
                      <option key={s.id} value={s.id}>{s.nombre} {s.manzana ? `(${s.manzana})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Manzana / Zona</label>
                  <input
                    type="text"
                    value={formEdit.manzana}
                    onChange={e => setFormEdit({ ...formEdit, manzana: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Nodos / Tramo / Calle</label>
                  <input
                    type="text"
                    value={formEdit.nodos_tramo}
                    onChange={e => setFormEdit({ ...formEdit, nodos_tramo: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Cantidades y Rendimiento */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad Planificada</label>
                  <input
                    type="number"
                    step="any"
                    value={formEdit.cantidad_plan}
                    onChange={e => setFormEdit({ ...formEdit, cantidad_plan: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Unidad de Medida</label>
                  <select
                    value={formEdit.unidad_medida}
                    onChange={e => setFormEdit({ ...formEdit, unidad_medida: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                  >
                    <option value="m">Metros (m)</option>
                    <option value="un">Unidades (un)</option>
                    <option value="m3">m³</option>
                    <option value="m2">m²</option>
                    <option value="kg">kg</option>
                    <option value="gl">Global</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Rendimiento Obj (un/h)</label>
                  <input
                    type="number"
                    step="any"
                    value={formEdit.rendimiento_objetivo_h}
                    onChange={e => setFormEdit({ ...formEdit, rendimiento_objetivo_h: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Personal y Responsable */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Responsable / Capataz</label>
                  <select
                    value={formEdit.responsable_id}
                    onChange={e => setFormEdit({ ...formEdit, responsable_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs"
                  >
                    <option value="">Seleccionar operario / capataz...</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name} {emp.legajo ? `(Leg. ${emp.legajo})` : ''}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Operarios Planificados</label>
                  <input
                    type="number"
                    value={formEdit.personal_plan_count}
                    onChange={e => setFormEdit({ ...formEdit, personal_plan_count: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
              </div>

              {/* Equipos Asignados Multi-Selección */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Equipos / Maquinarias Asignadas (Multi-selección)</label>
                <div className="flex flex-wrap gap-1.5 min-h-[34px] p-2 bg-slate-50 border rounded-xl mb-1.5 items-center">
                  {formEdit.equipo_asignado ? (
                    formEdit.equipo_asignado.split(', ').filter(Boolean).map((eq: string, idx: number) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-ecar-blue text-white text-[11px] font-medium shadow-xs">
                        🚜 {eq}
                        <button
                          type="button"
                          onClick={() => toggleEquipoEdit(eq)}
                          className="hover:text-red-200 text-white font-bold ml-1"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] text-gray-400 italic">Sin equipos asignados</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 border rounded-lg bg-white">
                  {vehicles.map(v => {
                    const val = `${v.code} - ${v.description}`;
                    const isSelected = formEdit.equipo_asignado?.includes(val);
                    return (
                      <button
                        key={v.id}
                        type="button"
                        onClick={() => toggleEquipoEdit(val)}
                        className={`px-2 py-0.5 text-[10px] rounded border transition-all ${
                          isSelected ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold' : 'bg-slate-50 text-gray-600 border-gray-200 hover:bg-slate-100'
                        }`}
                      >
                        {isSelected ? '✓ ' : '+ '} {v.code} ({v.description})
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Horario Planificado */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Hora Inicio Plan</label>
                  <input
                    type="time"
                    value={formEdit.hora_inicio_plan}
                    onChange={e => setFormEdit({ ...formEdit, hora_inicio_plan: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Hora Fin Plan</label>
                  <input
                    type="time"
                    value={formEdit.hora_fin_plan}
                    onChange={e => setFormEdit({ ...formEdit, hora_fin_plan: e.target.value })}
                    className="w-full px-2 py-1.5 border rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              {/* Si la tarea ya estaba cerrada, permitir corregir medición */}
              {showEditModal.estado === 'cerrada' && (
                <div className="pt-3 border-t border-slate-200 space-y-3 bg-slate-50 p-3 rounded-xl">
                  <h4 className="text-xs font-extrabold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 size={14} /> Corrección de Medición Real & Desvíos
                  </h4>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Cantidad Real Lograda</label>
                      <input
                        type="number"
                        step="any"
                        value={formEdit.cantidad_real}
                        onChange={e => setFormEdit({ ...formEdit, cantidad_real: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs font-bold font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Personal Real</label>
                      <input
                        type="number"
                        value={formEdit.personal_real_count}
                        onChange={e => setFormEdit({ ...formEdit, personal_real_count: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs font-mono bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-red-600 block mb-1">Minutos Parada</label>
                      <input
                        type="number"
                        value={formEdit.minutos_parada}
                        onChange={e => setFormEdit({ ...formEdit, minutos_parada: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs font-mono text-red-600 font-bold bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Motivo Desvío / Parada</label>
                      <input
                        type="text"
                        value={formEdit.motivo_desvio}
                        onChange={e => setFormEdit({ ...formEdit, motivo_desvio: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white"
                        placeholder="Ej: Faltante material, rotura de caño..."
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-600 block mb-1">Acción Correctiva</label>
                      <input
                        type="text"
                        value={formEdit.accion_correctiva}
                        onChange={e => setFormEdit({ ...formEdit, accion_correctiva: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white"
                        placeholder="Ej: Refuerzo de cuadrilla..."
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-gray-600 block mb-1">Observaciones</label>
                    <textarea
                      value={formEdit.observaciones}
                      onChange={e => setFormEdit({ ...formEdit, observaciones: e.target.value })}
                      rows={2}
                      className="w-full px-2.5 py-1.5 border rounded-xl text-xs bg-white"
                      placeholder="Comentarios adicionales..."
                    />
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowEditModal(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-medium hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={updateTarea.isPending}
                  className="btn-primary px-5 py-2 text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  {updateTarea.isPending ? 'Guardando...' : 'Guardar Cambios'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
