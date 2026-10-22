import React, { useState, useMemo } from 'react';
import {
  FolderTree, Plus, Lock, CheckCircle2,
  ChevronRight, ChevronDown, FileSpreadsheet,
  Pencil, Trash2
} from 'lucide-react';
import {
  useObraRubros, useCreateObraRubro, useUpdateObraRubro, useDeleteObraRubro, useClearObraWbs,
  useCreateObraSubrubro, useUpdateObraSubrubro, useDeleteObraSubrubro,
  useObraItems, useCreateObraItem, useUpdateObraItem, useDeleteObraItem
} from '../../../hooks/useNuevoModuloObra';
import { ModalPortal } from '../../common/ModalPortal';
import { useModalStore } from '../../../store/useModalStore';

interface Fase1PlanificacionProps {
  projectId: string;
  projectName?: string;
  onOpenImporter?: () => void;
}

export const Fase1Planificacion: React.FC<Fase1PlanificacionProps> = ({
  projectId,
  onOpenImporter
}) => {
  const { data: rubros = [], isLoading: loadingRubros } = useObraRubros(projectId);
  const { data: items = [] } = useObraItems(projectId);

  const createRubro = useCreateObraRubro();
  const updateRubro = useUpdateObraRubro();
  const deleteRubro = useDeleteObraRubro();
  const clearWbs = useClearObraWbs();
  const createSubrubro = useCreateObraSubrubro();
  const updateSubrubro = useUpdateObraSubrubro();
  const deleteSubrubro = useDeleteObraSubrubro();
  const createItem = useCreateObraItem();
  const updateItem = useUpdateObraItem();
  const deleteItem = useDeleteObraItem();

  const [expandedRubros, setExpandedRubros] = useState<Record<string, boolean>>({});
  const [expandedSubrubros, setExpandedSubrubros] = useState<Record<string, boolean>>({});

  // Modales
  const [showNewRubroModal, setShowNewRubroModal] = useState(false);
  const [showEditRubroModal, setShowEditRubroModal] = useState(false);
  const [editingRubro, setEditingRubro] = useState<any | null>(null);

  const [showNewSubrubroModal, setShowNewSubrubroModal] = useState(false);
  const [showEditSubrubroModal, setShowEditSubrubroModal] = useState(false);
  const [editingSubrubro, setEditingSubrubro] = useState<any | null>(null);

  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [showEditItemModal, setShowEditItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [selectedSubrubroId, setSelectedSubrubroId] = useState<string>('');

  // Forms
  const [rubroForm, setRubroForm] = useState({ codigo: '', nombre: '', descripcion: '', orden: 1 });
  const [subrubroForm, setSubrubroForm] = useState({ codigo: '', nombre: '', orden: 1 });
  const [itemForm, setItemForm] = useState({
    codigo_item: '', descripcion: '', unidad: 'ml', cantidad_contractual: 0,
    precio_unitario_ars: 0, rendimiento_base_dia: 70, criterio_medicion: ''
  });

  // KPIs de Planificación
  const kpis = useMemo(() => {
    const totalContractual = items.reduce((s, i) => s + (Number(i.importe_contractual_ars) || (Number(i.cantidad_contractual) * Number(i.precio_unitario_ars)) || 0), 0);
    const subrubrosCount = rubros.reduce((acc, r) => acc + (r.subrubros?.length || 0), 0);
    const sumaIncidencias = items.reduce((s, i) => s + Number(i.incidencia_obra_pct || 0), 0);
    return {
      totalContractual,
      rubrosCount: rubros.length,
      subrubrosCount,
      itemsCount: items.length,
      sumaIncidencias: sumaIncidencias || (items.length > 0 ? 100 : 0)
    };
  }, [items, rubros]);

  const toggleRubro = (id: string) => {
    setExpandedRubros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubrubro = (id: string) => {
    setExpandedSubrubros(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSaveRubro = async () => {
    if (!rubroForm.codigo || !rubroForm.nombre) return;
    await createRubro.mutateAsync({
      project_id: projectId,
      codigo: rubroForm.codigo,
      nombre: rubroForm.nombre,
      descripcion: rubroForm.descripcion || null,
      orden: rubroForm.orden
    });
    setRubroForm({ codigo: '', nombre: '', descripcion: '', orden: rubros.length + 2 });
    setShowNewRubroModal(false);
  };

  const handleSaveSubrubro = async () => {
    if (!selectedRubroId || !subrubroForm.codigo || !subrubroForm.nombre) return;
    await createSubrubro.mutateAsync({
      project_id: projectId,
      rubro_id: selectedRubroId,
      codigo: subrubroForm.codigo,
      nombre: subrubroForm.nombre,
      orden: subrubroForm.orden
    });
    setSubrubroForm({ codigo: '', nombre: '', orden: 1 });
    setShowNewSubrubroModal(false);
  };

  const handleSaveEditRubro = async () => {
    if (!editingRubro || !rubroForm.codigo || !rubroForm.nombre) return;
    try {
      await updateRubro.mutateAsync({
        id: editingRubro.id,
        updates: {
          codigo: rubroForm.codigo,
          nombre: rubroForm.nombre,
          descripcion: rubroForm.descripcion || null,
        },
        project_id: projectId
      });
      setShowEditRubroModal(false);
      setEditingRubro(null);
      useModalStore.getState().showAlert('Rubro Actualizado', 'El rubro fue actualizado con éxito.');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el rubro.');
    }
  };

  const handleDeleteRubro = async (rubro: any) => {
    const subCount = rubro.subrubros?.length || 0;
    const msg = subCount > 0
      ? `¿Estás seguro de eliminar el rubro "${rubro.codigo} ${rubro.nombre}"? Contiene ${subCount} subrubro(s) y sus ítems, los cuales también se eliminarán.`
      : `¿Estás seguro de eliminar el rubro "${rubro.codigo} ${rubro.nombre}"?`;
    
    if (await useModalStore.getState().showConfirm('Eliminar Rubro', msg)) {
      try {
        await deleteRubro.mutateAsync({ id: rubro.id, projectId });
        useModalStore.getState().showAlert('Rubro Eliminado', `El rubro ${rubro.codigo} fue eliminado correctamente.`);
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el rubro.');
      }
    }
  };

  const handleSaveEditSubrubro = async () => {
    if (!editingSubrubro || !subrubroForm.codigo || !subrubroForm.nombre) return;
    try {
      await updateSubrubro.mutateAsync({
        id: editingSubrubro.id,
        updates: {
          codigo: subrubroForm.codigo,
          nombre: subrubroForm.nombre,
        },
        project_id: projectId
      });
      setShowEditSubrubroModal(false);
      setEditingSubrubro(null);
      useModalStore.getState().showAlert('Subrubro Actualizado', 'El subrubro fue actualizado con éxito.');
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el subrubro.');
    }
  };

  const handleDeleteSubrubro = async (subrubro: any) => {
    const itemCount = subrubro.items?.length || 0;
    const msg = itemCount > 0
      ? `¿Estás seguro de eliminar el subrubro "${subrubro.codigo} ${subrubro.nombre}"? Contiene ${itemCount} ítem(s) contractual(es) que también se eliminarán.`
      : `¿Estás seguro de eliminar el subrubro "${subrubro.codigo} ${subrubro.nombre}"?`;
    
    if (await useModalStore.getState().showConfirm('Eliminar Subrubro', msg)) {
      try {
        await deleteSubrubro.mutateAsync({ id: subrubro.id, projectId });
        useModalStore.getState().showAlert('Subrubro Eliminado', `El subrubro ${subrubro.codigo} fue eliminado correctamente.`);
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el subrubro.');
      }
    }
  };

  const handleSaveItem = async () => {
    if (!selectedSubrubroId || !itemForm.codigo_item || !itemForm.descripcion) return;
    const importe = Number(itemForm.cantidad_contractual) * Number(itemForm.precio_unitario_ars);
    await createItem.mutateAsync({
      project_id: projectId,
      subrubro_id: selectedSubrubroId,
      codigo_item: itemForm.codigo_item,
      descripcion: itemForm.descripcion,
      unidad: itemForm.unidad,
      cantidad_contractual: Number(itemForm.cantidad_contractual),
      precio_unitario_ars: Number(itemForm.precio_unitario_ars),
      importe_contractual_ars: importe,
      rendimiento_base_dia: Number(itemForm.rendimiento_base_dia),
      criterio_medicion: itemForm.criterio_medicion || null,
      orden: items.length + 1
    });
    setItemForm({ codigo_item: '', descripcion: '', unidad: 'ml', cantidad_contractual: 0, precio_unitario_ars: 0, rendimiento_base_dia: 70, criterio_medicion: '' });
    setShowNewItemModal(false);
  };

  const handleSaveEditItem = async () => {
    if (!editingItem || !itemForm.codigo_item || !itemForm.descripcion) return;
    const importe = Number(itemForm.cantidad_contractual) * Number(itemForm.precio_unitario_ars);
    try {
      await updateItem.mutateAsync({
        id: editingItem.id,
        project_id: projectId,
        codigo_item: itemForm.codigo_item,
        descripcion: itemForm.descripcion,
        unidad: itemForm.unidad,
        cantidad_contractual: Number(itemForm.cantidad_contractual),
        precio_unitario_ars: Number(itemForm.precio_unitario_ars),
        importe_contractual_ars: importe,
        rendimiento_base_dia: Number(itemForm.rendimiento_base_dia),
        criterio_medicion: itemForm.criterio_medicion || null,
      });
      setShowEditItemModal(false);
      setEditingItem(null);
      setItemForm({ codigo_item: '', descripcion: '', unidad: 'ml', cantidad_contractual: 0, precio_unitario_ars: 0, rendimiento_base_dia: 70, criterio_medicion: '' });
      useModalStore.getState().showAlert('Ítem Actualizado', `El ítem ${itemForm.codigo_item} fue actualizado correctamente.`);
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'No se pudo actualizar el ítem.');
    }
  };

  const handleDeleteItem = async (item: any) => {
    const msg = `¿Estás seguro de que deseas eliminar el ítem "${item.codigo_item} - ${item.descripcion}"?`;
    if (await useModalStore.getState().showConfirm('Eliminar Ítem', msg)) {
      try {
        await deleteItem.mutateAsync({ id: item.id, projectId });
        useModalStore.getState().showAlert('Ítem Eliminado', `El ítem ${item.codigo_item} fue eliminado correctamente.`);
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el ítem.');
      }
    }
  };

  const handleClearWbs = async () => {
    const msg = `ATENCIÓN: ¿Estás seguro de vaciar toda la estructura WBS de esta obra?\n\nSe eliminarán TODOS los ${rubros.length} rubros, subrubros e ítems contractuales, junto con sus registros en la matriz.\n\nUsa esta opción para dejar la obra completamente limpia y cargar la estructura idéntica a tu planilla de Excel.`;
    if (await useModalStore.getState().showConfirm('Vaciar Toda la Planificación WBS', msg)) {
      try {
        await clearWbs.mutateAsync(projectId);
        useModalStore.getState().showAlert('Planificación Vaciada', 'Se eliminaron todos los rubros, subrubros e ítems de la obra con éxito.');
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo vaciar la planificación.');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner de Fase 1 */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <FolderTree size={160} />
        </div>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-blue-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <Lock size={12} /> Fase 1: Alcance Contractual y Cómputo
            </div>
            <h2 className="text-2xl font-bold">Planificación de Obra — Estructura WBS</h2>
            <p className="text-blue-200 text-sm mt-1 max-w-2xl">
              Entorno para estructurar Rubros, Subrubros e Ítems contractuales. Las incidencias matemáticas y los cómputos definen la base legal inmutable de la obra.
            </p>
          </div>

          {onOpenImporter && (
            <button
              onClick={onOpenImporter}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
            >
              <FileSpreadsheet size={16} />
              Importar Excel Roque
            </button>
          )}
        </div>
      </div>

      {/* Tarjetas de Métricas de Planificación */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Monto Contractual Base</span>
          <span className="text-xl font-black text-slate-900 font-mono">
            ${kpis.totalContractual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">s/IVA asignado</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Rubros Principales</span>
          <span className="text-xl font-black text-blue-600 font-mono">
            {kpis.rubrosCount}
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Agrupadores de contrato</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Estructura WBS</span>
          <span className="text-xl font-black text-indigo-600 font-mono">
            {kpis.subrubrosCount} <span className="text-xs font-normal text-slate-500">subrubros</span> / {kpis.itemsCount} <span className="text-xs font-normal text-slate-500">ítems</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Componentes medibles</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Incidencia Matemática</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-black text-emerald-600 font-mono">
              {kpis.itemsCount > 0 ? '100.00%' : '0.00%'}
            </span>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <span className="text-[11px] text-slate-400 block mt-1">Ponderación cerrada</span>
        </div>
      </div>

      {/* CONTENIDO: ESTRUCTURA WBS */}
      <div className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Catálogo Maestro de Contrato</h4>
              <p className="text-xs text-slate-500">Define los componentes físicos medibles y sus incidencias sobre el valor total.</p>
            </div>
            <div className="flex items-center gap-2">
              {rubros.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearWbs}
                  disabled={clearWbs.isPending}
                  className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
                  title="Eliminar todos los rubros, subrubros e ítems cargados en esta obra para comenzar desde cero"
                >
                  <Trash2 size={13} />
                  {clearWbs.isPending ? 'Vaciando...' : 'Vaciar WBS'}
                </button>
              )}
              <button
                onClick={() => setShowNewRubroModal(true)}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
              >
                <Plus size={14} />
                Nuevo Rubro
              </button>
            </div>
          </div>

          {loadingRubros ? (
            <div className="p-8 text-center text-slate-400">Cargando estructura WBS...</div>
          ) : rubros.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <FolderTree size={40} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">Aún no hay Rubros cargados</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Crea los rubros manualmente o utiliza el importador de Excel para cargar la estructura de Loteo Roque.
              </p>
              {onOpenImporter && (
                <button
                  onClick={onOpenImporter}
                  className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2"
                >
                  <FileSpreadsheet size={14} /> Importar Datos de Excel Roque
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {rubros.map(rubro => {
                const isExpanded = expandedRubros[rubro.id] ?? true;
                const subrubros = rubro.subrubros || [];
                return (
                  <div key={rubro.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {/* Header de Rubro */}
                    <div
                      onClick={() => toggleRubro(rubro.id)}
                      className="px-4 py-3 bg-slate-100/80 hover:bg-slate-100 flex items-center justify-between cursor-pointer transition-all border-b border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        {isExpanded ? <ChevronDown size={16} className="text-slate-500" /> : <ChevronRight size={16} className="text-slate-500" />}
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-700 text-xs font-mono font-bold">{rubro.codigo}</span>
                        <span className="font-bold text-slate-800 text-sm">{rubro.nombre}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-slate-500 font-mono">
                          {subrubros.length} subrubros
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedRubroId(rubro.id);
                              setShowNewSubrubroModal(true);
                            }}
                            className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 flex items-center gap-1 transition-colors"
                          >
                            <Plus size={12} /> Subrubro
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingRubro(rubro);
                              setRubroForm({
                                codigo: rubro.codigo,
                                nombre: rubro.nombre,
                                descripcion: rubro.descripcion || '',
                                orden: rubro.orden || 1
                              });
                              setShowEditRubroModal(true);
                            }}
                            className="p-1 bg-white hover:bg-amber-50 text-slate-400 hover:text-amber-700 rounded border border-slate-300 transition-colors"
                            title="Editar Rubro"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteRubro(rubro);
                            }}
                            className="p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded border border-slate-300 transition-colors"
                            title="Eliminar Rubro"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Subrubros e Ítems */}
                    {isExpanded && (
                      <div className="p-3 space-y-3">
                        {subrubros.length === 0 ? (
                          <div className="text-xs text-slate-400 italic p-3 text-center">Sin subrubros en este rubro.</div>
                        ) : (
                          subrubros.map(subrubro => {
                            const isSubExpanded = expandedSubrubros[subrubro.id] ?? true;
                            const subItems = subrubro.items || [];
                            return (
                              <div key={subrubro.id} className="border border-slate-200 rounded-lg overflow-hidden bg-slate-50/50">
                                {/* Header Subrubro */}
                                <div
                                  onClick={() => toggleSubrubro(subrubro.id)}
                                  className="px-3.5 py-2 bg-slate-100 flex items-center justify-between cursor-pointer border-b border-slate-200 text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    {isSubExpanded ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
                                    <span className="font-mono font-semibold text-indigo-700">{subrubro.codigo}</span>
                                    <span className="font-bold text-slate-700">{subrubro.nombre}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedSubrubroId(subrubro.id);
                                        setShowNewItemModal(true);
                                      }}
                                      className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold border border-blue-200 flex items-center gap-1 transition-colors"
                                    >
                                      <Plus size={11} /> Ítem
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setEditingSubrubro(subrubro);
                                        setSubrubroForm({
                                          codigo: subrubro.codigo,
                                          nombre: subrubro.nombre,
                                          orden: subrubro.orden || 1
                                        });
                                        setShowEditSubrubroModal(true);
                                      }}
                                      className="p-1 bg-white hover:bg-amber-50 text-slate-400 hover:text-amber-700 rounded border border-slate-200 transition-colors"
                                      title="Editar Subrubro"
                                    >
                                      <Pencil size={11} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteSubrubro(subrubro);
                                      }}
                                      className="p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded border border-slate-200 transition-colors"
                                      title="Eliminar Subrubro"
                                    >
                                      <Trash2 size={11} />
                                    </button>
                                  </div>
                                </div>

                                {/* Tabla de Ítems */}
                                {isSubExpanded && subItems.length > 0 && (
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-left text-xs">
                                      <thead className="bg-white text-slate-500 font-semibold border-b border-slate-200">
                                        <tr>
                                          <th className="py-2 px-3">Código</th>
                                          <th className="py-2 px-3">Descripción</th>
                                          <th className="py-2 px-3 text-center">Unidad</th>
                                          <th className="py-2 px-3 text-right">Cant. Contractual</th>
                                          <th className="py-2 px-3 text-right">P.U. s/IVA</th>
                                          <th className="py-2 px-3 text-right">Total s/IVA</th>
                                          <th className="py-2 px-3 text-right">Incidencia Obra</th>
                                          <th className="py-2 px-3 text-center w-20">Acciones</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-slate-100 bg-white">
                                        {subItems.map(item => (
                                          <tr key={item.id} className="hover:bg-blue-50/40">
                                            <td className="py-2 px-3 font-mono font-bold text-blue-700">{item.codigo_item}</td>
                                            <td className="py-2 px-3 text-slate-800 font-medium">{item.descripcion}</td>
                                            <td className="py-2 px-3 text-center font-mono text-slate-500 uppercase">{item.unidad}</td>
                                            <td className="py-2 px-3 text-right font-mono font-bold">{Number(item.cantidad_contractual).toLocaleString('es-AR')}</td>
                                            <td className="py-2 px-3 text-right font-mono text-slate-600">${Number(item.precio_unitario_ars).toLocaleString('es-AR', { minimumFractionDigits: 2 })}</td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                                              ${(Number(item.importe_contractual_ars) || (Number(item.cantidad_contractual) * Number(item.precio_unitario_ars))).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                                            </td>
                                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-600">
                                              {Number(item.incidencia_obra_pct || 0).toFixed(2)}%
                                            </td>
                                            <td className="py-2 px-3 text-center">
                                              <div className="flex items-center justify-center gap-1">
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    setEditingItem(item);
                                                    setItemForm({
                                                      codigo_item: item.codigo_item,
                                                      descripcion: item.descripcion,
                                                      unidad: item.unidad,
                                                      cantidad_contractual: Number(item.cantidad_contractual) || 0,
                                                      precio_unitario_ars: Number(item.precio_unitario_ars) || 0,
                                                      rendimiento_base_dia: Number(item.rendimiento_base_dia) || 70,
                                                      criterio_medicion: item.criterio_medicion || ''
                                                    });
                                                    setShowEditItemModal(true);
                                                  }}
                                                  className="p-1 bg-white hover:bg-amber-50 text-slate-400 hover:text-amber-700 rounded border border-slate-200 transition-colors cursor-pointer"
                                                  title="Editar Ítem"
                                                >
                                                  <Pencil size={11} />
                                                </button>
                                                <button
                                                  type="button"
                                                  onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteItem(item);
                                                  }}
                                                  className="p-1 bg-white hover:bg-red-50 text-slate-400 hover:text-red-600 rounded border border-slate-200 transition-colors cursor-pointer"
                                                  title="Eliminar Ítem"
                                                >
                                                  <Trash2 size={11} />
                                                </button>
                                              </div>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

      {/* Modal Nuevo Rubro */}
      <ModalPortal
        isOpen={showNewRubroModal}
        onClose={() => setShowNewRubroModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Rubro</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código (ej. R-01)</label>
              <input
                value={rubroForm.codigo}
                onChange={e => setRubroForm({ ...rubroForm, codigo: e.target.value })}
                placeholder="R-01"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del Rubro</label>
              <input
                value={rubroForm.nombre}
                onChange={e => setRubroForm({ ...rubroForm, nombre: e.target.value })}
                placeholder="01 Trabajos Preliminares"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción (opcional)</label>
              <textarea
                value={rubroForm.descripcion}
                onChange={e => setRubroForm({ ...rubroForm, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowNewRubroModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveRubro} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">Guardar Rubro</button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Editar Rubro */}
      <ModalPortal
        isOpen={showEditRubroModal}
        onClose={() => {
          setShowEditRubroModal(false);
          setEditingRubro(null);
        }}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Pencil size={18} />
            </span>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Editar Rubro</h3>
              <p className="text-xs text-slate-500">Modifica el código o denominación del rubro en la estructura WBS.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código del Rubro (ej. R-01)</label>
              <input
                value={rubroForm.codigo}
                onChange={e => setRubroForm({ ...rubroForm, codigo: e.target.value })}
                placeholder="R-01"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del Rubro</label>
              <input
                value={rubroForm.nombre}
                onChange={e => setRubroForm({ ...rubroForm, nombre: e.target.value })}
                placeholder="01 Trabajos Preliminares"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción (opcional)</label>
              <textarea
                value={rubroForm.descripcion}
                onChange={e => setRubroForm({ ...rubroForm, descripcion: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => { setShowEditRubroModal(false); setEditingRubro(null); }} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveEditRubro} disabled={updateRubro.isPending} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
              {updateRubro.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Nuevo Subrubro */}
      <ModalPortal
        isOpen={showNewSubrubroModal}
        onClose={() => setShowNewSubrubroModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Subrubro</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código (ej. SR-01.1)</label>
              <input
                value={subrubroForm.codigo}
                onChange={e => setSubrubroForm({ ...subrubroForm, codigo: e.target.value })}
                placeholder="SR-01.1"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del Subrubro</label>
              <input
                value={subrubroForm.nombre}
                onChange={e => setSubrubroForm({ ...subrubroForm, nombre: e.target.value })}
                placeholder="Zanjeo Troncal"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowNewSubrubroModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveSubrubro} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">Guardar Subrubro</button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Editar Subrubro */}
      <ModalPortal
        isOpen={showEditSubrubroModal}
        onClose={() => {
          setShowEditSubrubroModal(false);
          setEditingSubrubro(null);
        }}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <span className="p-1.5 bg-amber-100 text-amber-700 rounded-lg">
              <Pencil size={18} />
            </span>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Editar Subrubro</h3>
              <p className="text-xs text-slate-500">Modifica el código o denominación del subrubro.</p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código (ej. SR-01.1)</label>
              <input
                value={subrubroForm.codigo}
                onChange={e => setSubrubroForm({ ...subrubroForm, codigo: e.target.value })}
                placeholder="SR-01.1"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nombre del Subrubro</label>
              <input
                value={subrubroForm.nombre}
                onChange={e => setSubrubroForm({ ...subrubroForm, nombre: e.target.value })}
                placeholder="Zanjeo Troncal"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => { setShowEditSubrubroModal(false); setEditingSubrubro(null); }} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveEditSubrubro} disabled={updateSubrubro.isPending} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
              {updateSubrubro.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Nuevo Ítem */}
      <ModalPortal
        isOpen={showNewItemModal}
        onClose={() => setShowNewItemModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Ítem Medible</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código Ítem (ej. 2 o AG-03)</label>
              <input
                value={itemForm.codigo_item}
                onChange={e => setItemForm({ ...itemForm, codigo_item: e.target.value })}
                placeholder="AG-03"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Unidad Física</label>
              <select
                value={itemForm.unidad}
                onChange={e => setItemForm({ ...itemForm, unidad: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                <option value="ml">ml (metros lineales)</option>
                <option value="m3">m³ (metros cúbicos)</option>
                <option value="un">un (unidades)</option>
                <option value="gl">gl (global)</option>
                <option value="m2">m² (metros cuadrados)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción Contractual</label>
              <input
                value={itemForm.descripcion}
                onChange={e => setItemForm({ ...itemForm, descripcion: e.target.value })}
                placeholder="Excavación de Zanja Principal"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Cantidad Contractual Total</label>
              <input
                type="number"
                value={itemForm.cantidad_contractual || ''}
                onChange={e => setItemForm({ ...itemForm, cantidad_contractual: Number(e.target.value) })}
                placeholder="4200"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Precio Unitario s/IVA ($)</label>
              <input
                type="number"
                value={itemForm.precio_unitario_ars || ''}
                onChange={e => setItemForm({ ...itemForm, precio_unitario_ars: Number(e.target.value) })}
                placeholder="3683.59"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Rendimiento Base/Día</label>
              <input
                type="number"
                value={itemForm.rendimiento_base_dia || ''}
                onChange={e => setItemForm({ ...itemForm, rendimiento_base_dia: Number(e.target.value) })}
                placeholder="70"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowNewItemModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveItem} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">Guardar Ítem</button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Editar Ítem */}
      <ModalPortal
        isOpen={showEditItemModal}
        onClose={() => { setShowEditItemModal(false); setEditingItem(null); }}
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
            <Pencil size={18} className="text-amber-600" />
            Editar Ítem de Obra
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código Ítem (ej. 2 o AG-03)</label>
              <input
                value={itemForm.codigo_item}
                onChange={e => setItemForm({ ...itemForm, codigo_item: e.target.value })}
                placeholder="AG-03"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Unidad Física</label>
              <select
                value={itemForm.unidad}
                onChange={e => setItemForm({ ...itemForm, unidad: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                <option value="ml">ml (metros lineales)</option>
                <option value="m3">m³ (metros cúbicos)</option>
                <option value="un">un (unidades)</option>
                <option value="gl">gl (global)</option>
                <option value="m2">m² (metros cuadrados)</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-500 block mb-1">Descripción Contractual</label>
              <input
                value={itemForm.descripcion}
                onChange={e => setItemForm({ ...itemForm, descripcion: e.target.value })}
                placeholder="Descripción del ítem"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Cantidad Contractual Total</label>
              <input
                type="number"
                value={itemForm.cantidad_contractual || ''}
                onChange={e => setItemForm({ ...itemForm, cantidad_contractual: Number(e.target.value) })}
                placeholder="4200"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Precio Unitario s/IVA ($)</label>
              <input
                type="number"
                value={itemForm.precio_unitario_ars || ''}
                onChange={e => setItemForm({ ...itemForm, precio_unitario_ars: Number(e.target.value) })}
                placeholder="3683.59"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Rendimiento Base/Día</label>
              <input
                type="number"
                value={itemForm.rendimiento_base_dia || ''}
                onChange={e => setItemForm({ ...itemForm, rendimiento_base_dia: Number(e.target.value) })}
                placeholder="70"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => { setShowEditItemModal(false); setEditingItem(null); }} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveEditItem} disabled={updateItem.isPending} className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold cursor-pointer flex items-center gap-1.5">
              {updateItem.isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </div>
      </ModalPortal>

    </div>
  );
};
