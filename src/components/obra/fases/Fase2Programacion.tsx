import React, { useState, useMemo } from 'react';
import {
  Calendar, Send, CheckCircle2, Clock, Filter, FileText,
  Truck, Wrench, Users, Package, Plus, Search,
  FolderTree
} from 'lucide-react';
import {
  useObraRubros,
  useObraItems,
  useObraOrdenesTrabajo,
  useCreateObraOrdenTrabajo,
  useObraParteDiarioItems
} from '../../../hooks/useNuevoModuloObra';
import { useEmployees, useFuelVehicles } from '../../../hooks/useData';
import type { ObraItem } from '../../../lib/types';
import { ModalPortal } from '../../common/ModalPortal';

interface Fase2ProgramacionProps {
  projectId: string;
  projectName?: string;
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
  const createOdt = useCreateObraOrdenTrabajo();

  const [selectedRubroId, setSelectedRubroId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSubTab, setActiveSubTab] = useState<'para_programar' | 'odts'>('para_programar');
  const [selectedWbsItem, setSelectedWbsItem] = useState<(ObraItem & { saldo: number; contractual: number; programadoOdt: number; ejecutadoReal: number; rubroNombre: string }) | null>(null);

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
    instrucciones_calidad: 'Verificar alineación, cotas de nivel y normas de seguridad laboral.'
  });

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
        const programadoOdt = odts
          .filter(o => o.item_id === item.id && o.estado !== 'anulada')
          .reduce((acc, o) => acc + Number(o.meta_cantidad || 0), 0);
        const ejecutadoReal = partes
          .filter(p => p.item_id === item.id || (p.odt?.item_id === item.id))
          .reduce((acc, p) => acc + Number(p.cantidad_real || 0), 0);

        const saldo = Math.max(0, contractual - programadoOdt);
        const rubroNombre = subrubroToRubro.get(item.subrubro_id) || 'Rubro General';

        return {
          ...item,
          contractual,
          programadoOdt,
          ejecutadoReal,
          saldo,
          rubroNombre
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
        return true;
      });
  }, [items, rubros, odts, partes, selectedRubroId, searchQuery]);

  const handleOpenProgramar = (item: any) => {
    setSelectedWbsItem(item);
    const rend = Number(item.rendimiento_base_dia) || 70;
    const metaSugerida = item.saldo > 0 ? Math.min(item.saldo, rend) : rend;

    // Inicializar checklist
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
      materiales_requeridos: 'Materiales base según especificación técnica del ítem',
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

  const handleAddCustomTool = () => {
    if (!customToolInput.trim()) return;
    if (!selectedTools.includes(customToolInput.trim())) {
      setSelectedTools(prev => [...prev, customToolInput.trim()]);
    }
    setCustomToolInput('');
  };

  const handleEmitirOdt = async () => {
    if (!selectedWbsItem) return;
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
      item_id: selectedWbsItem.id,
      meta_cantidad: Number(odtForm.meta_cantidad),
      unidad: selectedWbsItem.unidad || 'ml',
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

    setSelectedWbsItem(null);
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
            Toma las actividades contractuales de la <strong>Estructura WBS</strong> y programa las Órdenes de Trabajo diarias asignando metas, cuadrilla, maquinaria y herramientas.
          </p>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda WBS */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <FolderTree size={20} className="text-amber-600 shrink-0" />
          <div>
            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Filtrar Actividades WBS</label>
            <span className="text-xs text-slate-400">Seleccioná un rubro o buscá por código/actividad para programar</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-2xl justify-end">
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

          <div className="relative flex-1 min-w-[200px]">
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
                <span>Actividades contractuales de la WBS disponibles para programar en ODTs</span>
                <span className="font-bold text-slate-700">{paraProgramarItems.length} actividades disponibles</span>
              </div>

              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Código WBS</th>
                      <th className="py-2.5 px-3">Rubro</th>
                      <th className="py-2.5 px-3">Actividad Contractual</th>
                      <th className="py-2.5 px-3 text-center">Unidad</th>
                      <th className="py-2.5 px-3 text-right">Cómputo Total</th>
                      <th className="py-2.5 px-3 text-right">Programado en ODTs</th>
                      <th className="py-2.5 px-3 text-right">Saldo por Programar</th>
                      <th className="py-2.5 px-3 text-right">Rend. Base/Día</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paraProgramarItems.map(item => {
                      const rend = Number(item.rendimiento_base_dia) || 70;

                      return (
                        <tr key={item.id} className="hover:bg-amber-50/40">
                          <td className="py-2.5 px-3 font-mono font-bold text-slate-700">{item.codigo_item || '-'}</td>
                          <td className="py-2.5 px-3 text-slate-500 text-[11px] truncate max-w-[140px]">{item.rubroNombre}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-900">{item.descripcion || '-'}</td>
                          <td className="py-2.5 px-3 text-center font-mono uppercase text-slate-500">{item.unidad || 'ml'}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-600 font-semibold">{item.contractual.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-mono text-blue-600">{item.programadoOdt.toLocaleString('es-AR')}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-700">
                            {item.saldo.toLocaleString('es-AR')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-slate-500">{rend}</td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              onClick={() => handleOpenProgramar(item)}
                              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 mx-auto transition-all shadow-sm cursor-pointer"
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
              <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">N° ODT</th>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Código WBS</th>
                      <th className="py-2.5 px-3">Actividad Contractual</th>
                      <th className="py-2.5 px-3 text-right">Meta Asignada</th>
                      <th className="py-2.5 px-3">Cuadrilla Asignada</th>
                      <th className="py-2.5 px-3">Equipos / Flota</th>
                      <th className="py-2.5 px-3 text-center">Horario</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {odts.map(odt => (
                      <tr key={odt.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{odt.numero_odt}</td>
                        <td className="py-2.5 px-3 font-mono">{odt.fecha}</td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-600">{odt.item?.codigo_item || '-'}</td>
                        <td className="py-2.5 px-3 font-medium text-slate-800">{odt.item?.descripcion || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-800">
                          {Number(odt.meta_cantidad || 0).toLocaleString('es-AR')} {odt.unidad}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 truncate max-w-xs">{odt.cuadrilla_nombre || '-'}</td>
                        <td className="py-2.5 px-3 text-slate-600 truncate max-w-xs">{odt.equipo_asignado || '-'}</td>
                        <td className="py-2.5 px-3 text-center font-mono text-slate-500">{odt.inicio_plan} - {odt.fin_plan}</td>
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
          )}
        </div>
      )}

      {/* Modal Programar y Emitir ODT con Checklist de Recursos */}
      <ModalPortal
        isOpen={Boolean(selectedWbsItem)}
        onClose={() => setSelectedWbsItem(null)}
        maxWidth="max-w-2xl"
      >
        {selectedWbsItem && (() => {
          const saldoItem = selectedWbsItem.saldo;
          const rendSugerido = Number(selectedWbsItem.rendimiento_base_dia) || 70;

          return (
            <div className="p-6 space-y-4 overflow-y-auto max-h-[88vh]">
              {/* Encabezado */}
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
                <div>
                  <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">
                    Emisión & Despacho de Orden de Trabajo
                  </span>
                  <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                    {selectedWbsItem.codigo_item} — {selectedWbsItem.descripcion}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Rubro: <strong className="text-slate-700">{selectedWbsItem.rubroNombre}</strong> | Cómputo Total: <span className="font-mono">{selectedWbsItem.contractual} {selectedWbsItem.unidad}</span>
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo por Programar</span>
                  <span className="px-2.5 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-xs font-mono font-bold">
                    {saldoItem.toLocaleString('es-AR')} {selectedWbsItem.unidad}
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
                      Meta Física ({selectedWbsItem.unidad})
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">
                      Saldo: {saldoItem} {selectedWbsItem.unidad}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={1}
                    value={odtForm.meta_cantidad || ''}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setOdtForm({ ...odtForm, meta_cantidad: Math.max(0, val) });
                    }}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold text-amber-700 bg-white"
                  />
                  {/* Botones de selección rápida */}
                  <div className="flex gap-1.5 mt-1.5">
                    <button
                      type="button"
                      onClick={() => setOdtForm({ ...odtForm, meta_cantidad: saldoItem > 0 ? Math.min(saldoItem, rendSugerido) : rendSugerido })}
                      className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-100/70 text-amber-800 hover:bg-amber-200 transition-colors cursor-pointer"
                    >
                      Rendimiento Diario ({saldoItem > 0 ? Math.min(saldoItem, rendSugerido) : rendSugerido})
                    </button>
                    {saldoItem > 0 && (
                      <button
                        type="button"
                        onClick={() => setOdtForm({ ...odtForm, meta_cantidad: saldoItem })}
                        className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-800 hover:bg-slate-300 transition-colors cursor-pointer"
                      >
                        Saldo Total ({saldoItem})
                      </button>
                    )}
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

                {/* Contenido de la pestaña activa de recursos */}
                <div className="p-3">
                  {/* Pestaña 1: Maquinaria */}
                  {resourceTab === 'maquinaria' && (
                    <div className="space-y-2">
                      <span className="text-[11px] text-slate-500 block">
                        Selecciona los vehículos, camiones o máquinas pesadas asignadas a esta orden:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
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

                  {/* Pestaña 4: Materiales e Insumos */}
                  {resourceTab === 'materiales' && (
                    <div className="space-y-2 text-xs">
                      <label className="font-semibold text-slate-600 block">
                        Materiales e Insumos Críticos a Despachar para esta Jornada
                      </label>
                      <textarea
                        value={odtForm.materiales_requeridos}
                        onChange={e => setOdtForm({ ...odtForm, materiales_requeridos: e.target.value })}
                        rows={3}
                        placeholder="Ej: Materiales específicos para la ejecución de la actividad..."
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
                    onClick={() => setSelectedWbsItem(null)}
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
