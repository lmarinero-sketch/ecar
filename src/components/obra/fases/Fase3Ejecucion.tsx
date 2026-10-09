import React, { useState, useMemo } from 'react';
import {
  HardHat, Play, CheckCircle2, Clock, AlertTriangle,
  MapPin, Check, TrendingUp
} from 'lucide-react';
import {
  useObraOrdenesTrabajo,
  useObraParteDiarioItems,
  useCreateObraParteDiarioItem
} from '../../../hooks/useNuevoModuloObra';
import type { ObraOrdenTrabajo } from '../../../lib/types';

interface Fase3EjecucionProps {
  projectId: string;
  projectName?: string;
}

export const Fase3Ejecucion: React.FC<Fase3EjecucionProps> = ({
  projectId
}) => {
  const [selectedFecha, setSelectedFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const { data: odts = [] } = useObraOrdenesTrabajo(projectId, selectedFecha);
  const { data: partesDelDia = [] } = useObraParteDiarioItems(projectId, selectedFecha);
  const createParteItem = useCreateObraParteDiarioItem();

  const [activeOdt, setActiveOdt] = useState<ObraOrdenTrabajo | null>(null);

  // Formulario de Terreno
  const [form, setForm] = useState({
    cantidad_real: 0,
    hora_inicio_real: '07:45',
    hora_fin_real: '16:00',
    horas_trabajadas: 8,
    personal_real_count: 4,
    equipo_usado: '',
    horometro_inicio: '',
    horometro_fin: '',
    minutos_parada: 0,
    motivo_parada: '',
    novedades_interferencias: '',
    incidente_calidad: '',
    responsable_carga: 'Capataz de Turno'
  });

  const [showParadaForm, setShowParadaForm] = useState(false);

  // Totales de producción de hoy
  const kpisDia = useMemo(() => {
    const totalEjecutadoHoy = partesDelDia.reduce((s, p) => s + Number(p.cantidad_real || 0), 0);
    const totalMinutosParada = partesDelDia.reduce((s, p) => s + Number(p.minutos_parada || 0), 0);
    return {
      partesCount: partesDelDia.length,
      totalEjecutadoHoy,
      totalHorasParada: (totalMinutosParada / 60).toFixed(1)
    };
  }, [partesDelDia]);

  const handleOpenReporte = (odt: ObraOrdenTrabajo) => {
    setActiveOdt(odt);
    setForm({
      cantidad_real: odt.meta_cantidad || 0,
      hora_inicio_real: '07:45',
      hora_fin_real: '16:00',
      horas_trabajadas: 8,
      personal_real_count: 4,
      equipo_usado: odt.equipo_asignado || 'Retropala HMK',
      horometro_inicio: '',
      horometro_fin: '',
      minutos_parada: 0,
      motivo_parada: '',
      novedades_interferencias: '',
      incidente_calidad: '',
      responsable_carga: odt.responsable_nombre || 'Capataz'
    });
    setShowParadaForm(false);
  };

  const handleGuardarParte = async () => {
    if (!activeOdt) return;
    const meta = Number(activeOdt.meta_cantidad || 0);
    const real = Number(form.cantidad_real || 0);
    const pct = meta > 0 ? Math.round((real / meta) * 100) : 100;

    await createParteItem.mutateAsync({
      project_id: projectId,
      odt_id: activeOdt.id,
      tramo_item_id: activeOdt.tramo_item_id,
      fecha: selectedFecha,
      cantidad_real: real,
      unidad: activeOdt.unidad,
      cumplimiento_pct: pct,
      hora_inicio_real: form.hora_inicio_real,
      hora_fin_real: form.hora_fin_real,
      horas_trabajadas: Number(form.horas_trabajadas) || 8,
      personal_real_count: Number(form.personal_real_count) || 1,
      equipo_usado: form.equipo_usado,
      horometro_inicio: form.horometro_inicio ? Number(form.horometro_inicio) : null,
      horometro_fin: form.horometro_fin ? Number(form.horometro_fin) : null,
      minutos_parada: Number(form.minutos_parada) || 0,
      motivo_parada: form.motivo_parada || null,
      novedades_interferencias: form.novedades_interferencias || null,
      incidente_calidad: form.incidente_calidad || null,
      responsable_carga: form.responsable_carga,
      estado: 'cargado'
    });

    setActiveOdt(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Modo Terreno */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <HardHat size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <HardHat size={12} /> Fase 3: Operación en Terreno (Tablet / Móvil)
            </div>
            <h2 className="text-2xl font-bold">Ejecución & Avance Físico Real</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-2xl">
              <strong>Cero subjetividad:</strong> El avance se carga exclusivamente en unidades métricas reales de producción ($ml$, $u$, $m^3$). El sistema calcula el porcentaje de avance y su impacto ponderado en el rubro y la obra.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/20 flex items-center gap-3">
            <Clock size={18} className="text-emerald-300" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-200 block">Fecha de Turno</span>
              <input
                type="date"
                value={selectedFecha}
                onChange={e => setSelectedFecha(e.target.value)}
                className="bg-transparent text-white font-bold text-sm focus:outline-none cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Métricas del Turno */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Órdenes Activas de Hoy</span>
            <span className="text-2xl font-black text-slate-900 font-mono">{odts.length} ODTs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Producción Total Registrada</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{kpisDia.totalEjecutadoHoy}</span>
            <span className="text-xs text-slate-400 ml-1">unidades de avance</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Tiempos Muertos / Paradas</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{kpisDia.totalHorasParada} h</span>
            <span className="text-xs text-slate-400 ml-1">perdidas por desvíos</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Grid de Órdenes de Trabajo del Día */}
      <div>
        <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
          <span>Órdenes Diarias de Trabajo (ODT) Asignadas</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
            Turno: {selectedFecha}
          </span>
        </h3>

        {odts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700">No hay ODTs emitidas para esta fecha</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              El Jefe de Obra debe programar actividades y emitir ODTs desde la <strong>Fase 2 (Programación)</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {odts.map(odt => {
              const estaCumplida = odt.estado === 'cumplida';
              return (
                <div
                  key={odt.id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                    estaCumplida ? 'border-emerald-200 bg-emerald-50/20' : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-xs">
                        {odt.numero_odt}
                      </span>
                      <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        Tramo {odt.tramo?.codigo}
                      </span>
                    </div>

                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      estaCumplida ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
                      {estaCumplida ? 'Reportado' : 'Pendiente Carga'}
                    </span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-base mb-1">
                    {odt.item?.descripcion}
                  </h4>
                  <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" />
                    {odt.tramo?.calle_pasaje || 'Sin calle'} — Ø{odt.tramo?.diametro_mm}mm
                  </p>

                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs mb-4">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Meta a Cumplir</span>
                      <span className="font-bold text-slate-800 font-mono">{odt.meta_cantidad} {odt.unidad}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Cuadrilla</span>
                      <span className="font-semibold text-slate-700">{odt.cuadrilla_nombre || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Maquinaria</span>
                      <span className="font-semibold text-slate-700">{odt.equipo_asignado || '-'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Horario Plan</span>
                      <span className="font-mono text-slate-700">{odt.inicio_plan} a {odt.fin_plan}</span>
                    </div>
                  </div>

                  {estaCumplida ? (
                    <div className="flex items-center gap-2 text-emerald-700 text-xs font-bold bg-emerald-100/60 p-2.5 rounded-xl">
                      <CheckCircle2 size={16} />
                      <span>Producción registrada y verificada</span>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleOpenReporte(odt)}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.98]"
                    >
                      <Play size={16} />
                      Cargar Producción Real (Tablet)
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de Partes Registrados Hoy */}
      {partesDelDia.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-3 bg-slate-50 border-b border-slate-200 font-bold text-xs text-slate-700">
            Resumen de Registros de Terreno Transmitidos Hoy ({partesDelDia.length})
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2.5 px-3">ODT</th>
                  <th className="py-2.5 px-3">Tramo</th>
                  <th className="py-2.5 px-3">Actividad</th>
                  <th className="py-2.5 px-3 text-right">Cant. Real</th>
                  <th className="py-2.5 px-3 text-center">Cumplimiento</th>
                  <th className="py-2.5 px-3">Horas / Personal</th>
                  <th className="py-2.5 px-3">Paradas</th>
                  <th className="py-2.5 px-3">Responsable</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {partesDelDia.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-mono font-bold text-amber-700">{p.odt?.numero_odt || '-'}</td>
                    <td className="py-2.5 px-3 font-mono text-blue-700">{p.tramo_item?.tramo?.codigo || '-'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-800">{p.tramo_item?.item?.descripcion || '-'}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                      {p.cantidad_real} {p.unidad}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        Number(p.cumplimiento_pct) >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {p.cumplimiento_pct}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">
                      {p.horas_trabajadas}h ({p.personal_real_count} operarios)
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">
                      {p.minutos_parada > 0 ? (
                        <span className="text-red-600 font-bold">{p.minutos_parada}m: {p.motivo_parada}</span>
                      ) : (
                        <span className="text-emerald-600 font-semibold">Sin paradas</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{p.responsable_carga || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal / Panel de Carga de Producción en Terreno */}
      {activeOdt && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-start">
              <div>
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Parte Diario — Terreno</span>
                <h3 className="font-bold text-lg text-slate-900">{activeOdt.item?.descripcion}</h3>
                <p className="text-xs text-slate-500 font-mono">
                  ODT: {activeOdt.numero_odt} | Tramo {activeOdt.tramo?.codigo} ({activeOdt.tramo?.calle_pasaje})
                </p>
              </div>
              <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-mono font-bold">
                Meta: {activeOdt.meta_cantidad} {activeOdt.unidad}
              </span>
            </div>

            {/* Input Gigante para Tablet de Producción Real */}
            <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-center">
              <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                ¿Cuántos {activeOdt.unidad} se produjeron hoy en terreno?
              </label>
              <div className="flex items-center justify-center gap-2 mt-2">
                <input
                  type="number"
                  step="any"
                  value={form.cantidad_real || ''}
                  onChange={e => setForm({ ...form, cantidad_real: Number(e.target.value) })}
                  className="w-40 text-center text-3xl font-black font-mono text-emerald-700 bg-white border-2 border-emerald-500 rounded-2xl py-2 px-3 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                />
                <span className="text-xl font-bold font-mono text-emerald-800 uppercase">{activeOdt.unidad}</span>
              </div>
              <span className="text-xs text-emerald-600 block mt-2 font-medium">
                Cumplimiento calculado: {activeOdt.meta_cantidad > 0 ? Math.round((form.cantidad_real / activeOdt.meta_cantidad) * 100) : 100}%
              </span>
            </div>

            {/* Datos Operativos */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Hora Inicio Real</label>
                <input
                  type="time"
                  value={form.hora_inicio_real}
                  onChange={e => setForm({ ...form, hora_inicio_real: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Hora Fin Real</label>
                <input
                  type="time"
                  value={form.hora_fin_real}
                  onChange={e => setForm({ ...form, hora_fin_real: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Personal en Cuadrilla (operarios)</label>
                <input
                  type="number"
                  value={form.personal_real_count}
                  onChange={e => setForm({ ...form, personal_real_count: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Horas Trabajadas</label>
                <input
                  type="number"
                  value={form.horas_trabajadas}
                  onChange={e => setForm({ ...form, horas_trabajadas: Number(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>
            </div>

            {/* Paradas y Desvíos */}
            <div className="border border-slate-200 rounded-2xl p-3 bg-slate-50">
              <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-xs text-slate-700 flex items-center gap-1.5">
                  <AlertTriangle size={14} className="text-amber-600" />
                  ¿Hubo Tiempos Muertos o Paradas?
                </span>
                <button
                  type="button"
                  onClick={() => setShowParadaForm(!showParadaForm)}
                  className="text-xs font-bold text-amber-700 underline"
                >
                  {showParadaForm ? 'Ocultar' : '+ Registrar Parada'}
                </button>
              </div>

              {showParadaForm && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">Minutos de Parada</label>
                      <input
                        type="number"
                        value={form.minutos_parada || ''}
                        onChange={e => setForm({ ...form, minutos_parada: Number(e.target.value) })}
                        placeholder="60"
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-semibold text-slate-500 block mb-1">Causa Raíz</label>
                      <select
                        value={form.motivo_parada}
                        onChange={e => setForm({ ...form, motivo_parada: e.target.value })}
                        className="w-full px-2.5 py-1.5 border rounded-lg text-xs bg-white"
                      >
                        <option value="">-- Seleccionar --</option>
                        <option value="Interferencia de caño existente">Interferencia de caño existente</option>
                        <option value="Lluvia / Clima adverso">Lluvia / Clima adverso</option>
                        <option value="Falta de material / cañería">Falta de material / cañería</option>
                        <option value="Falla mecánica de retroexcavadora">Falla mecánica de retroexcavadora</option>
                        <option value="Espera de inspección / ensayo">Espera de inspección / ensayo</option>
                        <option value="Otro">Otro motivo</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Observaciones y Novedades */}
            <div>
              <label className="text-xs font-semibold text-slate-500 block mb-1">Novedades o Interferencias de Campo</label>
              <textarea
                value={form.novedades_interferencias}
                onChange={e => setForm({ ...form, novedades_interferencias: e.target.value })}
                rows={2}
                placeholder="Cruces de servicios, estado del terreno, observaciones..."
                className="w-full px-3 py-2 border rounded-xl text-xs"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveOdt(null)}
                className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleGuardarParte}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95"
              >
                <Check size={16} />
                Finalizar y Transmitir ODT
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
