import React, { useState, useMemo } from 'react';
import {
  Calendar, MapPin, Send, CheckCircle2, Clock, Filter, FileText
} from 'lucide-react';
import {
  useObraTramos,
  useObraTramoItems,
  useObraOrdenesTrabajo,
  useCreateObraOrdenTrabajo
} from '../../../hooks/useNuevoModuloObra';
import { useEmployees } from '../../../hooks/useData';
import type { ObraTramoItem } from '../../../lib/types';

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
  const createOdt = useCreateObraOrdenTrabajo();

  const [activeSubTab, setActiveSubTab] = useState<'para_programar' | 'odts'>('para_programar');
  const [selectedTramoItem, setSelectedTramoItem] = useState<ObraTramoItem | null>(null);

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

    setOdtForm({
      fecha: new Date().toISOString().split('T')[0],
      meta_cantidad: metaSugerida,
      cuadrilla_nombre: 'Cuadrilla 1 - B. Guevara',
      responsable_id: employees[0]?.id || '',
      equipo_asignado: 'Retropala HMK',
      materiales_requeridos: '',
      inicio_plan: '07:30',
      fin_plan: '16:00',
      instrucciones_calidad: 'Cumplir cota de proyecto y señalización de seguridad.'
    });
  };

  const handleEmitirOdt = async () => {
    if (!selectedTramoItem) return;
    const nextNum = `ODT-${String(odts.length + 1).padStart(3, '0')}`;
    const respEmp = employees.find(e => e.id === odtForm.responsable_id);

    await createOdt.mutateAsync({
      project_id: projectId,
      numero_odt: nextNum,
      fecha: odtForm.fecha,
      tramo_item_id: selectedTramoItem.id,
      tramo_id: selectedTramoItem.tramo_id,
      item_id: selectedTramoItem.item_id,
      meta_cantidad: Number(odtForm.meta_cantidad),
      unidad: selectedTramoItem.item?.unidad || 'ml',
      cuadrilla_nombre: odtForm.cuadrilla_nombre,
      responsable_id: odtForm.responsable_id || null,
      responsable_nombre: respEmp?.full_name || 'B. Guevara',
      equipo_asignado: odtForm.equipo_asignado,
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

      {/* Modal Programar y Emitir ODT */}
      {selectedTramoItem && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <span className="text-xs font-bold text-amber-600 uppercase tracking-wider block">Emisión de Orden de Trabajo</span>
              <h3 className="font-bold text-lg text-slate-900 mt-0.5">
                {selectedTramoItem.item?.descripcion}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                Tramo: {selectedTramoItem.tramo?.codigo} ({selectedTramoItem.tramo?.calle_pasaje})
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Fecha Programada</label>
                <input
                  type="date"
                  value={odtForm.fecha}
                  onChange={e => setOdtForm({ ...odtForm, fecha: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">
                  Meta Física a Cumplir ({selectedTramoItem.item?.unidad})
                </label>
                <input
                  type="number"
                  value={odtForm.meta_cantidad || ''}
                  onChange={e => setOdtForm({ ...odtForm, meta_cantidad: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold text-amber-700"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Cuadrilla Asignada</label>
                <select
                  value={odtForm.cuadrilla_nombre}
                  onChange={e => setOdtForm({ ...odtForm, cuadrilla_nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="Cuadrilla 1 - B. Guevara">Cuadrilla 1 - B. Guevara</option>
                  <option value="Cuadrilla 2 - Zanjas y Tapadas">Cuadrilla 2 - Zanjas y Tapadas</option>
                  <option value="Cuadrilla 3 - Fusión y Pruebas">Cuadrilla 3 - Fusión y Pruebas</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-500 block mb-1">Responsable Técnico</label>
                <select
                  value={odtForm.responsable_id}
                  onChange={e => setOdtForm({ ...odtForm, responsable_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                >
                  <option value="">-- Seleccionar --</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Maquinaria / Equipo Principal</label>
                <input
                  value={odtForm.equipo_asignado}
                  onChange={e => setOdtForm({ ...odtForm, equipo_asignado: e.target.value })}
                  placeholder="Retropala HMK / Termofusora PEAD"
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div className="col-span-2">
                <label className="text-xs font-semibold text-slate-500 block mb-1">Instrucciones de Calidad / Seguridad</label>
                <textarea
                  value={odtForm.instrucciones_calidad}
                  onChange={e => setOdtForm({ ...odtForm, instrucciones_calidad: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setSelectedTramoItem(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmitirOdt}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md"
              >
                <Send size={14} />
                Confirmar y Emitir ODT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
