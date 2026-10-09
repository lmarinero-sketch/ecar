import React, { useState, useMemo } from 'react';
import {
  FolderTree, Plus, MapPin, Lock, CheckCircle2,
  ChevronRight, ChevronDown, Layers, FileSpreadsheet
} from 'lucide-react';
import {
  useObraTramos, useCreateObraTramo,
  useObraRubros, useCreateObraRubro, useCreateObraSubrubro,
  useObraItems, useCreateObraItem,
  useObraTramoItems
} from '../../../hooks/useNuevoModuloObra';
import { ModalPortal } from '../../common/ModalPortal';

interface Fase1PlanificacionProps {
  projectId: string;
  projectName?: string;
  onOpenImporter?: () => void;
}

export const Fase1Planificacion: React.FC<Fase1PlanificacionProps> = ({
  projectId,
  onOpenImporter
}) => {
  const { data: tramos = [] } = useObraTramos(projectId);
  const { data: rubros = [], isLoading: loadingRubros } = useObraRubros(projectId);
  const { data: items = [] } = useObraItems(projectId);
  const { data: tramoItems = [] } = useObraTramoItems(projectId);

  const createTramo = useCreateObraTramo();
  const createRubro = useCreateObraRubro();
  const createSubrubro = useCreateObraSubrubro();
  const createItem = useCreateObraItem();

  const [activeTab, setActiveTab] = useState<'wbs' | 'tramos' | 'matriz'>('wbs');
  const [expandedRubros, setExpandedRubros] = useState<Record<string, boolean>>({});
  const [expandedSubrubros, setExpandedSubrubros] = useState<Record<string, boolean>>({});

  // Modales
  const [showNewRubroModal, setShowNewRubroModal] = useState(false);
  const [showNewSubrubroModal, setShowNewSubrubroModal] = useState(false);
  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [showNewItemModal, setShowNewItemModal] = useState(false);
  const [selectedSubrubroId, setSelectedSubrubroId] = useState<string>('');
  const [showNewTramoModal, setShowNewTramoModal] = useState(false);

  // Forms
  const [rubroForm, setRubroForm] = useState({ codigo: '', nombre: '', descripcion: '', orden: 1 });
  const [subrubroForm, setSubrubroForm] = useState({ codigo: '', nombre: '', orden: 1 });
  const [itemForm, setItemForm] = useState({
    codigo_item: '', descripcion: '', unidad: 'ml', cantidad_contractual: 0,
    precio_unitario_ars: 0, rendimiento_base_dia: 70, criterio_medicion: ''
  });
  const [tramoForm, setTramoForm] = useState({
    codigo: '', nodo_inicio: '', nodo_fin: '', longitud_m: 0,
    calle_pasaje: '', diametro_mm: 75, servicios_count: 0, hidrantes_count: 0
  });

  // KPIs de Planificación
  const kpis = useMemo(() => {
    const totalContractual = items.reduce((s, i) => s + (Number(i.importe_contractual_ars) || (Number(i.cantidad_contractual) * Number(i.precio_unitario_ars)) || 0), 0);
    const totalMetros = tramos.reduce((s, t) => s + Number(t.longitud_m || 0), 0);
    const sumaIncidencias = items.reduce((s, i) => s + Number(i.incidencia_obra_pct || 0), 0);
    return {
      totalContractual,
      totalMetros,
      tramosCount: tramos.length,
      rubrosCount: rubros.length,
      itemsCount: items.length,
      sumaIncidencias: sumaIncidencias || (items.length > 0 ? 100 : 0)
    };
  }, [items, tramos, rubros]);

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

  const handleSaveTramo = async () => {
    if (!tramoForm.codigo || !tramoForm.nodo_inicio || !tramoForm.nodo_fin) return;
    await createTramo.mutateAsync({
      project_id: projectId,
      codigo: tramoForm.codigo,
      nodo_inicio: tramoForm.nodo_inicio,
      nodo_fin: tramoForm.nodo_fin,
      longitud_m: Number(tramoForm.longitud_m),
      calle_pasaje: tramoForm.calle_pasaje || null,
      diametro_mm: Number(tramoForm.diametro_mm) || 75,
      servicios_count: Number(tramoForm.servicios_count) || 0,
      hidrantes_count: Number(tramoForm.hidrantes_count) || 0,
      orden: tramos.length + 1
    });
    setTramoForm({ codigo: '', nodo_inicio: '', nodo_fin: '', longitud_m: 0, calle_pasaje: '', diametro_mm: 75, servicios_count: 0, hidrantes_count: 0 });
    setShowNewTramoModal(false);
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
              Único entorno habilitado para estructurar Rubros, Subrubros, Ítems y Tramos. Las incidencias matemáticas y los cómputos definen la base legal inmutable de la obra.
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
          <span className="text-xs font-semibold text-slate-500 block mb-1">Longitud Total de Traza</span>
          <span className="text-xl font-black text-blue-600 font-mono">
            {kpis.totalMetros.toLocaleString('es-AR')} <span className="text-sm font-medium">ml</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">{kpis.tramosCount} tramos topológicos</span>
        </div>

        <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
          <span className="text-xs font-semibold text-slate-500 block mb-1">Estructura WBS</span>
          <span className="text-xl font-black text-indigo-600 font-mono">
            {kpis.rubrosCount} <span className="text-xs font-normal text-slate-500">rubros</span> / {kpis.itemsCount} <span className="text-xs font-normal text-slate-500">ítems</span>
          </span>
          <span className="text-[11px] text-slate-400 block mt-1">Cálculo de Incidencia</span>
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

      {/* Navegación interna de Fase 1 */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('wbs')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'wbs'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FolderTree size={16} />
          Estructura Jerárquica WBS (Rubros → Subrubros → Ítems)
        </button>

        <button
          onClick={() => setActiveTab('tramos')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'tramos'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin size={16} />
          Nodos y Tramos Espaciales ({tramos.length})
        </button>

        <button
          onClick={() => setActiveTab('matriz')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeTab === 'matriz'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} />
          Matriz Cómputos Tramo × Ítem ({tramoItems.length})
        </button>
      </div>

      {/* CONTENIDO TAB 1: ESTRUCTURA WBS */}
      {activeTab === 'wbs' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Catálogo Maestro de Contrato</h4>
              <p className="text-xs text-slate-500">Define los componentes físicos medibles y sus incidencias sobre el valor total.</p>
            </div>
            <button
              onClick={() => setShowNewRubroModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} />
              + Nuevo Rubro
            </button>
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
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedRubroId(rubro.id);
                            setShowNewSubrubroModal(true);
                          }}
                          className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded text-xs font-semibold border border-slate-300 flex items-center gap-1"
                        >
                          <Plus size={12} /> Subrubro
                        </button>
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
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedSubrubroId(subrubro.id);
                                      setShowNewItemModal(true);
                                    }}
                                    className="px-2 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded text-[11px] font-semibold border border-blue-200 flex items-center gap-1"
                                  >
                                    <Plus size={11} /> Ítem
                                  </button>
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
      )}

      {/* CONTENIDO TAB 2: TRAMOS */}
      {activeTab === 'tramos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Topología Espacial de la Obra</h4>
              <p className="text-xs text-slate-500">División en tramos y nodos donde se ejecuta la obra.</p>
            </div>
            <button
              onClick={() => setShowNewTramoModal(true)}
              className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} />
              + Nuevo Tramo
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Código Tramo</th>
                    <th className="py-2.5 px-3">Nodo Inicio</th>
                    <th className="py-2.5 px-3">Nodo Fin</th>
                    <th className="py-2.5 px-3 text-right">Longitud (m)</th>
                    <th className="py-2.5 px-3">Calle / Pasaje</th>
                    <th className="py-2.5 px-3 text-center">Diámetro</th>
                    <th className="py-2.5 px-3 text-center">Servicios (u)</th>
                    <th className="py-2.5 px-3 text-center">Hidrantes (u)</th>
                    <th className="py-2.5 px-3">Observaciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tramos.map(tramo => (
                    <tr key={tramo.id} className="hover:bg-blue-50/40">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{tramo.codigo}</td>
                      <td className="py-2 px-3 font-mono">{tramo.nodo_inicio}</td>
                      <td className="py-2 px-3 font-mono">{tramo.nodo_fin}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold">{tramo.longitud_m} m</td>
                      <td className="py-2 px-3 text-slate-700">{tramo.calle_pasaje || '-'}</td>
                      <td className="py-2 px-3 text-center font-mono">Ø{tramo.diametro_mm}</td>
                      <td className="py-2 px-3 text-center font-mono">{tramo.servicios_count || 0}</td>
                      <td className="py-2 px-3 text-center font-mono">{tramo.hidrantes_count || 0}</td>
                      <td className="py-2 px-3 text-slate-400 text-[11px] truncate max-w-xs">{tramo.observaciones || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: MATRIZ CÓMPUTOS */}
      {activeTab === 'matriz' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h4 className="font-bold text-slate-800 text-sm">Matriz de Estado Actual (Tramo × Ítem)</h4>
            <p className="text-xs text-slate-500">Cómputo inicial previsto y saldo disponible por cada actividad en cada tramo.</p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tramo</th>
                    <th className="py-2.5 px-3">Código</th>
                    <th className="py-2.5 px-3">Actividad</th>
                    <th className="py-2.5 px-3 text-center">Unidad</th>
                    <th className="py-2.5 px-3 text-right">Previsto</th>
                    <th className="py-2.5 px-3 text-right">Ejecutado</th>
                    <th className="py-2.5 px-3 text-right">Saldo</th>
                    <th className="py-2.5 px-3 text-center">% Avance</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tramoItems.map(ti => {
                    const previsto = Number(ti.cantidad_prevista || 0);
                    const ejecutado = Number(ti.cantidad_ejecutada || 0);
                    const saldo = Math.max(0, previsto - ejecutado);
                    const pct = previsto > 0 ? Math.round((ejecutado / previsto) * 100) : 0;
                    return (
                      <tr key={ti.id} className="hover:bg-blue-50/40">
                        <td className="py-2 px-3 font-mono font-bold text-blue-700">{ti.tramo?.codigo || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{ti.item?.codigo_item || '-'}</td>
                        <td className="py-2 px-3 font-medium text-slate-800">{ti.item?.descripcion || '-'}</td>
                        <td className="py-2 px-3 text-center font-mono text-slate-500 uppercase">{ti.item?.unidad || '-'}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold">{previsto}</td>
                        <td className="py-2 px-3 text-right font-mono text-emerald-600">{ejecutado}</td>
                        <td className="py-2 px-3 text-right font-mono font-bold text-slate-700">{saldo}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold">{pct}%</td>
                        <td className="py-2 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ti.estado === 'terminada' ? 'bg-emerald-100 text-emerald-700' :
                            ti.estado === 'en_ejecucion' ? 'bg-blue-100 text-blue-700' :
                            ti.estado === 'para_programar' ? 'bg-amber-100 text-amber-700' :
                            ti.estado === 'bloqueada' ? 'bg-red-100 text-red-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {ti.estado.replace('_', ' ')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

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

      {/* Modal Nuevo Tramo */}
      <ModalPortal
        isOpen={showNewTramoModal}
        onClose={() => setShowNewTramoModal(false)}
        maxWidth="max-w-lg"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-800">Crear Nuevo Tramo Topológico</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Código Tramo (ej. N1 - N2)</label>
              <input
                value={tramoForm.codigo}
                onChange={e => setTramoForm({ ...tramoForm, codigo: e.target.value })}
                placeholder="N1 - N2"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Longitud (m)</label>
              <input
                type="number"
                value={tramoForm.longitud_m || ''}
                onChange={e => setTramoForm({ ...tramoForm, longitud_m: Number(e.target.value) })}
                placeholder="165"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nodo Inicio</label>
              <input
                value={tramoForm.nodo_inicio}
                onChange={e => setTramoForm({ ...tramoForm, nodo_inicio: e.target.value })}
                placeholder="N1"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Nodo Fin</label>
              <input
                value={tramoForm.nodo_fin}
                onChange={e => setTramoForm({ ...tramoForm, nodo_fin: e.target.value })}
                placeholder="N2"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Calle / Pasaje</label>
              <input
                value={tramoForm.calle_pasaje}
                onChange={e => setTramoForm({ ...tramoForm, calle_pasaje: e.target.value })}
                placeholder="Pasaje N°13"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Diámetro (mm)</label>
              <input
                type="number"
                value={tramoForm.diametro_mm || ''}
                onChange={e => setTramoForm({ ...tramoForm, diametro_mm: Number(e.target.value) })}
                placeholder="75"
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
            <button onClick={() => setShowNewTramoModal(false)} className="px-4 py-2 border rounded-xl text-xs font-semibold cursor-pointer">Cancelar</button>
            <button onClick={handleSaveTramo} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold cursor-pointer">Guardar Tramo</button>
          </div>
        </div>
      </ModalPortal>
    </div>
  );
};
