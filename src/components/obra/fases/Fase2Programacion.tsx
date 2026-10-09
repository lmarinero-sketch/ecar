import React, { useState, useMemo } from 'react';
import {
  Calendar, MapPin, Send, CheckCircle2, Clock, Filter, FileText,
  Truck, Wrench, Users, Package, Plus, X
} from 'lucide-react';
import {
  useObraTramos,
  useObraTramoItems,
  useObraOrdenesTrabajo,
  useCreateObraOrdenTrabajo
} from '../../../hooks/useNuevoModuloObra';
import { useEmployees, useFuelVehicles } from '../../../hooks/useData';
import type { ObraTramoItem } from '../../../lib/types';
import { ModalPortal } from '../../common/ModalPortal';

interface Fase2ProgramacionProps {
  projectId: string;
  projectName?: string;
}

export const Fase2Programacion: React.FC<Fase2ProgramacionProps> = ({
  projectId
}) => {
  const { data: tramos = [] } = useObraTramos(projectId);
  const [selectedTramoId, setSelectedTramoId] = useState<string>('');

  const { data: tramoItems = [] } = useObraTramoItems(projectId, selectedTramoId || undefined);
  const { data: odts = [] } = useObraOrdenesTrabajo(projectId);
  const { data: employees = [] } = useEmployees();
  const { data: fuelVehicles = [] } = useFuelVehicles();
  const createOdt = useCreateObraOrdenTrabajo();

  const [activeSubTab, setActiveSubTab] = useState<'para_programar' | 'odts'>('para_programar');
  const [selectedTramoItem, setSelectedTramoItem] = useState<ObraTramoItem | null>(null);

  // Estados de Checklist de Recursos Operativos
  const [resourceTab, setResourceTab] = useState<'maquinaria' | 'personal' | 'herramientas' | 'materiales'>('maquinaria');
  const [selectedVehicles, setSelectedVehicles] = useState<string[]>([]);
  const [selectedPersonnel, setSelectedPersonnel] = useState<string[]>([]);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [customToolInput, setCustomToolInput] = useState('');

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
    'Kit de balizas luminosas nocturnas',
    'Herramientas manuales (palas, picos, carretillas)'
  ], []);

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
    instrucciones_calidad: 'Verificar nivelación y ancho de zanja antes de compactar.'
  });

  // Filtrar ítems para la bandeja "Para Programar"
  const paraProgramarItems = useMemo(() => {
    return tramoItems.filter(ti => {
      const saldo = Number(ti.cantidad_prevista || 0) - Number(ti.cantidad_ejecutada || 0);
      return saldo > 0 && ti.estado !== 'bloqueada';
    });
  }, [tramoItems]);

  const handleOpenProgramar = (ti: ObraTramoItem) => {
    setSelectedTramoItem(ti);
    const saldo = Math.max(0, Number(ti.cantidad_prevista || 0) - Number(ti.cantidad_ejecutada || 0));
    const rendimiento = Number(ti.item?.rendimiento_base_dia) || 70;
    const metaSugerida = Math.min(saldo, rendimiento);

    // Inicializar checklist predeterminado
    setSelectedVehicles(['Retropala HMK 102B (HMK-01)']);
    setSelectedPersonnel(employees.slice(0, 3).map(e => e.full_name));
    setSelectedTools(['Conos y vallas de seguridad vial', 'Nivel óptico / Láser topográfico']);
    setCustomToolInput('');
    setResourceTab('maquinaria');

    setOdtForm({
      fecha: new Date().toISOString().split('T')[0],
      meta_cantidad: metaSugerida,
      cuadrilla_nombre: 'Cuadrilla 1 - B. Guevara',
      responsable_id: employees[0]?.id || '',
      equipo_asignado: 'Retropala HMK',
      materiales_requeridos: 'Cañería, arena de asiento y cinta de señalización',
      inicio_plan: '07:30',
      fin_plan: '16:00',
      instrucciones_calidad: 'Cumplir cota de proyecto y señalización de seguridad.'
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

  const handleAddCustomTool = () => {
    if (!customToolInput.trim()) return;
    if (!selectedTools.includes(customToolInput.trim())) {
      setSelectedTools(prev => [...prev, customToolInput.trim()]);
    }
    setCustomToolInput('');
  };

  const handleEmitirOdt = async () => {
    if (!selectedTramoItem) return;
    const nextNum = `ODT-${String(odts.length + 1).padStart(3, '0')}`;
    const respEmp = employees.find(e => e.id === odtForm.responsable_id);

    // Consolidar resumen de equipos y herramientas seleccionadas
    const maquinasStr = selectedVehicles.length > 0 ? selectedVehicles.join(', ') : 'Ninguna';
    const herramStr = selectedTools.length > 0 ? selectedTools.join(', ') : '';
    const equiposConsolidados = herramStr ? `${maquinasStr} | Herramientas: ${herramStr}` : maquinasStr;

    // Consolidar cuadrilla con personal asignado
    const cuadrillaConsolidada = selectedPersonnel.length > 0
      ? `${odtForm.cuadrilla_nombre} (${selectedPersonnel.length} operarios: ${selectedPersonnel.join(', ')})`
      : odtForm.cuadrilla_nombre;

    await createOdt.mutateAsync({
      project_id: projectId,
      numero_odt: nextNum,
      fecha: odtForm.fecha,
      tramo_item_id: selectedTramoItem.id,
      tramo_id: selectedTramoItem.tramo_id,
      item_id: selectedTramoItem.item_id,
      meta_cantidad: Number(odtForm.meta_cantidad),
      unidad: selectedTramoItem.item?.unidad || 'ml',
      cuadrilla_nombre: cuadrillaConsolidada,
      responsable_id: odtForm.responsable_id || null,
      responsable_nombre: respEmp?.full_name || 'B. Guevara',
      equipo_asignado: equiposConsolidados,
      materiales_requeridos: odtForm.materiales_requeridos || null,
      inicio_plan: odtForm.inicio_plan,
      fin_plan: odtForm.fin_plan,
      instrucciones_calidad: odtForm.instrucciones_calidad,
      estado: 'emitida'
    });

    setSelectedTramoItem(null);
    setActiveSubTab('odts');
  };

  return (
    <div className="space-y-6">
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
          <p className="text-amber-100 text-sm mt-1 max-w-2xl">
            <strong>Bloqueo estricto:</strong> En esta vista no se pueden crear rubros ni alterar cómputos. Seleccione un nodo o tramo para ver las actividades habilitadas con saldo y emitir la ODT diaria.
          </p>
        </div>
      </div>

      {/* Selector de Tramo Topológico */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <MapPin size={20} className="text-amber-600 shrink-0" />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Filtrar por Nodo / Tramo de Obra</label>
            <span className="text-xs text-slate-400">Selecciona el tramo para filtrar la bandeja de tareas pendientes</span>
          </div>
        </div>

        <select
          value={selectedTramoId}
          onChange={e => setSelectedTramoId(e.target.value)}
          className="px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500 min-w-[280px]"
        >
          <option value="">-- Todos los tramos ({tramos.length}) --</option>
          {tramos.map(t => (
            <option key={t.id} value={t.id}>
              {t.codigo} — {t.calle_pasaje || 'Sin calle'} ({t.longitud_m}m)
            </option>
          ))}
        </select>
      </div>

      {/* Navegación interna de Fase 2 */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('para_programar')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
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
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'odts'
              ? 'border-amber-600 text-amber-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText size={16} />
          Órdenes de Trabajo Emitidas ({odts.length})
        </button>
      </div>

      {/* SUBTAB 1: BANDEJA PARA PROGRAMAR */}
      {activeSubTab === 'para_programar' && (
        <div className="space-y-4">
          {paraProgramarItems.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-3" />
              <h4 className="font-bold text-slate-700">No hay tareas pendientes en este tramo</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {selectedTramoId
                  ? 'Todas las actividades planificadas para este tramo ya están programadas o completadas.'
                  : 'Selecciona un tramo específico o carga la planificación en la Fase 1.'}
              </p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs text-slate-500">
                <span>Mostrando actividades con <strong>Saldo &gt; 0</strong> listas para programar cuadrilla y maquinaria</span>
                <span className="font-bold text-slate-700">{paraProgramarItems.length} ítems disponibles</span>
              </div>

              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tramo</th>
                      <th className="py-2.5 px-3">Código</th>
                      <th className="py-2.5 px-3">Actividad Contractual</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-right">Cómputo Tramo</th>
                      <th className="py-2.5 px-3 text-right">Saldo a Ejecutar</th>
                      <th className="py-2.5 px-3 text-right">Rend. Sugerido/Día</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paraProgramarItems.map(ti => {
                      const previsto = Number(ti.cantidad_prevista || 0);
                      const ejecutado = Number(ti.cantidad_ejecutada || 0);
                      const saldo = Math.max(0, previsto - ejecutado);
                      const rend = Number(ti.item?.rendimiento_base_dia || 70);

                      return (
                        <tr key={ti.id} className="hover:bg-amber-50/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{ti.tramo?.codigo || '-'}</td>
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{ti.item?.codigo_item || '-'}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{ti.item?.descripcion || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono uppercase text-slate-500">{ti.item?.unidad || 'ml'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600">{previsto}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">{saldo}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">{rend}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleOpenProgramar(ti)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 mx-auto transition-all shadow-sm"
                            >
                              <Send size={12} />
                              Programar ODT
                            </button>
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
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">N° ODT</th>
                    <th className="py-2.5 px-3">Fecha Programada</th>
                    <th className="py-2.5 px-3">Tramo</th>
                    <th className="py-2.5 px-3">Actividad</th>
                    <th className="py-2.5 px-3 text-right">Meta Planificada</th>
                    <th className="py-2.5 px-3">Cuadrilla Asignada</th>
                    <th className="py-2.5 px-3">Equipo Principal</th>
                    <th className="py-2.5 px-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {odts.map(odt => (
                    <tr key={odt.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{odt.numero_odt}</td>
                      <td className="py-2.5 px-3 font-mono">{odt.fecha}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-700">{odt.tramo?.codigo || '-'}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{odt.item?.descripcion || '-'}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold">
                        {odt.meta_cantidad} {odt.unidad}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700">{odt.cuadrilla_nombre || '-'}</td>
                      <td className="py-2.5 px-3 text-slate-600">{odt.equipo_asignado || '-'}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          odt.estado === 'cumplida' ? 'bg-emerald-100 text-emerald-700' :
                          odt.estado === 'en_ejecucion' ? 'bg-blue-100 text-blue-700' :
                          odt.estado === 'emitida' ? 'bg-amber-100 text-amber-700' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {odt.estado.toUpperCase()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal Programar y Emitir ODT con Checklist de Recursos */}
      <ModalPortal
        isOpen={Boolean(selectedTramoItem)}
        onClose={() => setSelectedTramoItem(null)}
        maxWidth="max-w-2xl"
      >
        {selectedTramoItem && (() => {
          const saldoTramo = Math.max(0, Number(selectedTramoItem.cantidad_prevista || 0) - Number(selectedTramoItem.cantidad_ejecutada || 0));
          const rendimientoSugerido = Number(selectedTramoItem.item?.rendimiento_base_dia || 70);

          return (
            <div className="p-6 space-y-4 overflow-y-auto max-h-[88vh]">
              {/* Encabezado */}
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                    Emisión & Despacho de Orden de Trabajo
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                    {selectedTramoItem.item?.descripcion}
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Tramo: {selectedTramoItem.tramo?.codigo} ({selectedTramoItem.tramo?.calle_pasaje || 'Sin calle'}) | Longitud: {selectedTramoItem.tramo?.longitud_m || 0}m
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-bold">
                    {saldoTramo} {selectedTramoItem.item?.unidad}
                  </span>
                </div>
              </div>

              {/* Parámetros Operativos Principales */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Fecha Programada</label>
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
                      Meta Física ({selectedTramoItem.item?.unidad})
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Máx: {saldoTramo} {selectedTramoItem.item?.unidad}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    max={saldoTramo}
                    value={odtForm.meta_cantidad || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setOdtForm({ ...odtForm, meta_cantidad: Math.min(saldoTramo, Math.max(0, val)) });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold text-amber-700 bg-white"
                  />
                  {/* Botones de selección rápida */}
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setOdtForm({ ...odtForm, meta_cantidad: Math.min(saldoTramo, rendimientoSugerido) })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100/70 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      Rendimiento Diario ({Math.min(saldoTramo, rendimientoSugerido)})
                    </button>
                    <button
                      type="button"
                      onClick={() => setOdtForm({ ...odtForm, meta_cantidad: saldoTramo })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
                    >
                      Saldo Total ({saldoTramo})
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
                    <span>Maquinaria & Flota</span>
                    <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 text-amber-800 font-mono">
                      {selectedVehicles.length}
                    </span>
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
                    <span>Materiales</span>
                  </button>
                </div>

                {/* Contenido según pestaña de recursos activa */}
                <div className="p-4">
                  {/* Pestaña 1: Maquinarias y Movilidades */}
                  {resourceTab === 'maquinaria' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Marque las maquinarias y vehículos asignados a esta jornada:</span>
                        <span className="text-slate-400 text-[11px]">{selectedVehicles.length} seleccionadas</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {availableVehicles.map(veh => {
                          const isSelected = selectedVehicles.includes(veh);
                          return (
                            <label
                              key={veh}
                              onClick={() => toggleVehicle(veh)}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-amber-50/80 border-amber-400 text-amber-900 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-amber-600 text-white' : 'border border-slate-300'
                              }`}>
                                {isSelected ? <CheckCircle2 size={12} /> : null}
                              </div>
                              <Truck size={14} className={isSelected ? 'text-amber-600 shrink-0' : 'text-slate-400 shrink-0'} />
                              <span className="truncate">{veh}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pestaña 2: Personal y Operarios */}
                  {resourceTab === 'personal' && (
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs mb-2">
                        <div>
                          <label className="font-semibold text-slate-600 block mb-1">Nombre Cuadrilla Base</label>
                          <select
                            value={odtForm.cuadrilla_nombre}
                            onChange={e => setOdtForm({ ...odtForm, cuadrilla_nombre: e.target.value })}
                            className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                          >
                            <option value="Cuadrilla 1 - B. Guevara">Cuadrilla 1 - B. Guevara</option>
                            <option value="Cuadrilla 2 - Zanjas y Tapadas">Cuadrilla 2 - Zanjas y Tapadas</option>
                            <option value="Cuadrilla 3 - Fusión y Pruebas">Cuadrilla 3 - Fusión y Pruebas</option>
                          </select>
                        </div>
                        <div className="flex items-end justify-end">
                          <span className="text-[11px] text-slate-500 font-semibold">
                            Operarios asignados: <strong className="text-amber-700">{selectedPersonnel.length}</strong>
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
                        {employees.map(emp => {
                          const isSelected = selectedPersonnel.includes(emp.full_name);
                          return (
                            <label
                              key={emp.id}
                              onClick={() => togglePersonnel(emp.full_name)}
                              className={`flex items-center gap-2.5 p-2 rounded-xl border text-xs font-medium cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-blue-50/80 border-blue-400 text-blue-900 shadow-2xs'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-blue-600 text-white' : 'border border-slate-300'
                              }`}>
                                {isSelected ? <CheckCircle2 size={12} /> : null}
                              </div>
                              <Users size={14} className={isSelected ? 'text-blue-600 shrink-0' : 'text-slate-400 shrink-0'} />
                              <div className="truncate">
                                <span className="block truncate">{emp.full_name}</span>
                                <span className="text-[10px] text-slate-400 block">{emp.category?.name || 'Operario de cuadrilla'}</span>
                              </div>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Pestaña 3: Herramientas y Pañol */}
                  {resourceTab === 'herramientas' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-600">Checklist de herramientas y equipos menores:</span>
                        <span className="text-slate-400 text-[11px]">{selectedTools.length} seleccionadas</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto pr-1">
                        {HERRAMIENTAS_CATALOGO.map(tool => {
                          const isSelected = selectedTools.includes(tool);
                          return (
                            <label
                              key={tool}
                              onClick={() => toggleTool(tool)}
                              className={`flex items-center gap-2 p-1.5 px-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
                                isSelected
                                  ? 'bg-emerald-50 border-emerald-400 text-emerald-900 font-semibold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className={`w-3.5 h-3.5 rounded flex items-center justify-center shrink-0 ${
                                isSelected ? 'bg-emerald-600 text-white' : 'border border-slate-300'
                              }`}>
                                {isSelected ? <CheckCircle2 size={11} /> : null}
                              </div>
                              <span className="truncate">{tool}</span>
                            </label>
                          );
                        })}

                        {/* Herramientas personalizadas adicionales */}
                        {selectedTools.filter(t => !HERRAMIENTAS_CATALOGO.includes(t)).map(tool => (
                          <div
                            key={tool}
                            className="flex items-center justify-between gap-1 p-1.5 px-2.5 rounded-lg border bg-purple-50 border-purple-300 text-purple-900 text-xs font-semibold"
                          >
                            <span className="truncate">⭐ {tool}</span>
                            <button
                              type="button"
                              onClick={() => toggleTool(tool)}
                              className="text-purple-600 hover:text-purple-800"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {/* Agregar herramienta libre */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <input
                          value={customToolInput}
                          onChange={e => setCustomToolInput(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCustomTool(); } }}
                          placeholder="Otra herramienta o equipo específico..."
                          className="flex-1 px-3 py-1.5 border rounded-xl text-xs"
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

                  {/* Pestaña 4: Materiales e Insumos */}
                  {resourceTab === 'materiales' && (
                    <div className="space-y-2 text-xs">
                      <label className="font-semibold text-slate-600 block">
                        Materiales, Caños e Insumos Críticos a Despachar para esta Jornada
                      </label>
                      <textarea
                        value={odtForm.materiales_requeridos}
                        onChange={e => setOdtForm({ ...odtForm, materiales_requeridos: e.target.value })}
                        rows={3}
                        placeholder="Ej: 70m caño PEAD 75mm clase 10, 3 m3 arena de asiento, 1 rollo cinta de advertencia OSSE..."
                        className="w-full px-3 py-2 border rounded-xl text-xs bg-white"
                      />
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
                </div>

                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => setSelectedTramoItem(null)}
                    className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
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
    </div>
  );
};
