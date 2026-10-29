import React, { useState, useMemo } from 'react';
import {
  HardHat, Play, CheckCircle2, Clock, AlertTriangle,
  MapPin, Check, TrendingUp, Eye, Trash2, Calendar
} from 'lucide-react';
import {
  useObraOrdenesTrabajo,
  useObraParteDiarioItems,
  useCreateObraParteDiarioItem,
  useDeleteObraParteDiarioItem,
  useDeleteObraOrdenTrabajo
} from '../../../hooks/useNuevoModuloObra';
import type { ObraOrdenTrabajo } from '../../../lib/types';
import { ModalPortal } from '../../common/ModalPortal';
import { useModalStore } from '../../../store/useModalStore';

interface Fase3EjecucionProps {
  projectId: string;
  projectName?: string;
}

// Calcula la duración en horas decimales (resta de Hora Fin - Hora Inicio)
function calcularDuracionHoras(inicio: string, fin: string): number {
  if (!inicio || !fin) return 0;
  const [hIni, mIni] = inicio.split(':').map(Number);
  const [hFin, mFin] = fin.split(':').map(Number);
  if (isNaN(hIni) || isNaN(mIni) || isNaN(hFin) || isNaN(mFin)) return 0;
  const minInicio = hIni * 60 + mIni;
  const minFin = hFin * 60 + mFin;
  const diff = minFin - minInicio;
  if (diff <= 0) return 0;
  return Number((diff / 60).toFixed(2));
}

function formatearDuracionLegible(horasDecimales: number): string {
  const totalMin = Math.round(horasDecimales * 60);
  if (totalMin <= 0) return '0 min';
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h === 0) return `${m} min (${horasDecimales} hs)`;
  if (m === 0) return `${h} hs`;
  return `${h}h ${m}m (${horasDecimales} hs)`;
}

export const Fase3Ejecucion: React.FC<Fase3EjecucionProps> = ({
  projectId
}) => {
  const [selectedFecha, setSelectedFecha] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  // Por defecto mostramos todas las ODTs activas e historial para que nunca "desaparezca" lo cargado
  const [filtrarSoloFecha, setFiltrarSoloFecha] = useState<boolean>(false);

  const { data: allOdts = [] } = useObraOrdenesTrabajo(projectId);
  const { data: allPartes = [] } = useObraParteDiarioItems(projectId);
  const createParteItem = useCreateObraParteDiarioItem();
  const deleteParteItem = useDeleteObraParteDiarioItem();
  const deleteOdt = useDeleteObraOrdenTrabajo();

  const [activeOdt, setActiveOdt] = useState<ObraOrdenTrabajo | null>(null);
  const [viewingOdtReport, setViewingOdtReport] = useState<ObraOrdenTrabajo | null>(null);

  // Formulario de Terreno (usamos strings en inputs numéricos para poder borrar limpiamente sin que quede un 0 trabado)
  const [form, setForm] = useState({
    cantidad_real: '',
    hora_inicio_real: '07:30',
    hora_fin_real: '16:00',
    horas_trabajadas: '8.5',
    personal_real_count: '3',
    equipo_usado: '',
    horometro_inicio: '',
    horometro_fin: '',
    minutos_parada: '',
    motivo_parada: '',
    novedades_interferencias: '',
    incidente_calidad: '',
    responsable_carga: 'Capataz de Turno'
  });

  const [showParadaForm, setShowParadaForm] = useState(false);

  // Mapa de avance real acumulado por cada ODT
  const odtProgressMap = useMemo(() => {
    const map: Record<string, {
      ejecutadoAcumulado: number;
      pctAcumulado: number;
      saldoPendiente: number;
      partesOdt: typeof allPartes;
      esta100Cumplida: boolean;
    }> = {};

    allOdts.forEach(o => {
      const partesOdt = allPartes.filter(p => p.odt_id === o.id);
      const ejecutadoAcumulado = partesOdt.reduce((acc, p) => acc + Number(p.cantidad_real || 0), 0);
      const meta = Number(o.meta_cantidad || 0);
      const pctAcumulado = meta > 0 ? Math.min(100, Math.round((ejecutadoAcumulado / meta) * 100)) : 0;
      const saldoPendiente = Math.max(0, Number((meta - ejecutadoAcumulado).toFixed(2)));
      const esta100Cumplida = meta > 0 && ejecutadoAcumulado >= meta;
      map[o.id] = {
        ejecutadoAcumulado,
        pctAcumulado,
        saldoPendiente,
        partesOdt,
        esta100Cumplida
      };
    });

    return map;
  }, [allOdts, allPartes]);

  // ODTs visibles (siempre incluye ODTs abiertas si no se filtra por fecha exacta)
  const visibleOdts = useMemo(() => {
    const validas = allOdts.filter(o => o.estado !== 'anulada');
    if (!filtrarSoloFecha) return validas;
    return validas.filter(o => {
      const prog = odtProgressMap[o.id];
      const sigueAbierta = !prog?.esta100Cumplida;
      return o.fecha === selectedFecha || sigueAbierta;
    });
  }, [allOdts, filtrarSoloFecha, selectedFecha, odtProgressMap]);

  // Partes visibles
  const visiblePartes = useMemo(() => {
    if (!filtrarSoloFecha) return allPartes;
    return allPartes.filter(p => p.fecha === selectedFecha);
  }, [allPartes, filtrarSoloFecha, selectedFecha]);

  // Totales de producción
  const kpis = useMemo(() => {
    const odtsAbiertasCount = visibleOdts.filter(o => !odtProgressMap[o.id]?.esta100Cumplida).length;
    const odtsCumplidasCount = visibleOdts.filter(o => odtProgressMap[o.id]?.esta100Cumplida).length;
    const totalEjecutado = visiblePartes.reduce((s, p) => s + Number(p.cantidad_real || 0), 0);
    const totalMinutosParada = visiblePartes.reduce((s, p) => s + Number(p.minutos_parada || 0), 0);
    return {
      odtsAbiertasCount,
      odtsCumplidasCount,
      partesCount: visiblePartes.length,
      totalEjecutado,
      totalHorasParada: (totalMinutosParada / 60).toFixed(1)
    };
  }, [visibleOdts, visiblePartes, odtProgressMap]);

  const handleOpenReporte = (odt: ObraOrdenTrabajo) => {
    setActiveOdt(odt);
    const prog = odtProgressMap[odt.id];
    const saldoSugerido = prog && prog.saldoPendiente > 0 ? prog.saldoPendiente : Number(odt.meta_cantidad || 0);

    // Extraer cantidad real de operarios desde cuadrilla_nombre (ej. "(2 operarios: ...)")
    const matchOp = odt.cuadrilla_nombre?.match(/\((\d+)\s*operario/i);
    const opCount = matchOp ? matchOp[1] : '2';

    const horaIni = odt.inicio_plan ? odt.inicio_plan.slice(0, 5) : '07:30';
    const horaFin = odt.fin_plan ? odt.fin_plan.slice(0, 5) : '16:00';
    const duracionInicial = calcularDuracionHoras(horaIni, horaFin);

    setForm({
      cantidad_real: String(saldoSugerido),
      hora_inicio_real: horaIni,
      hora_fin_real: horaFin,
      horas_trabajadas: String(duracionInicial),
      personal_real_count: opCount,
      equipo_usado: odt.equipo_asignado || 'Retropala HMK',
      horometro_inicio: '',
      horometro_fin: '',
      minutos_parada: '',
      motivo_parada: '',
      novedades_interferencias: '',
      incidente_calidad: '',
      responsable_carga: odt.responsable_nombre || 'Capataz'
    });
    setShowParadaForm(false);
  };

  const handleHoraInicioChange = (nuevaHoraIni: string) => {
    const duracion = calcularDuracionHoras(nuevaHoraIni, form.hora_fin_real);
    setForm(prev => ({
      ...prev,
      hora_inicio_real: nuevaHoraIni,
      horas_trabajadas: String(duracion)
    }));
  };

  const handleHoraFinChange = (nuevaHoraFin: string) => {
    const duracion = calcularDuracionHoras(form.hora_inicio_real, nuevaHoraFin);
    setForm(prev => ({
      ...prev,
      hora_fin_real: nuevaHoraFin,
      horas_trabajadas: String(duracion)
    }));
  };

  const handleGuardarParte = async () => {
    if (!activeOdt) return;
    const real = Number(form.cantidad_real || 0);
    if (real <= 0) {
      useModalStore.getState().showAlert('Cantidad Requerida', 'Ingresá una cantidad producida mayor a 0.');
      return;
    }

    const meta = Number(activeOdt.meta_cantidad || 0);
    const progPrevio = odtProgressMap[activeOdt.id]?.ejecutadoAcumulado || 0;
    const nuevoAcumulado = progPrevio + real;
    const pct = meta > 0 ? Math.round((nuevoAcumulado / meta) * 100) : 100;
    const horasCalc = form.horas_trabajadas !== ''
      ? Number(form.horas_trabajadas)
      : calcularDuracionHoras(form.hora_inicio_real, form.hora_fin_real);

    await createParteItem.mutateAsync({
      project_id: projectId,
      odt_id: activeOdt.id,
      item_id: activeOdt.item_id,
      tramo_item_id: activeOdt.tramo_item_id || null,
      tramo_id: activeOdt.tramo_id || null,
      fecha: selectedFecha,
      cantidad_real: real,
      unidad: activeOdt.unidad,
      cumplimiento_pct: pct,
      hora_inicio_real: form.hora_inicio_real,
      hora_fin_real: form.hora_fin_real,
      horas_trabajadas: horasCalc,
      personal_real_count: Math.max(1, Number(form.personal_real_count) || 1),
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

  const handleDeleteParte = async (parteId: string) => {
    if (await useModalStore.getState().showConfirm(
      'Eliminar Registro de Terreno',
      '¿Estás seguro de eliminar este parte diario? El avance acumulado y el estado de la ODT se recalcularán automáticamente.'
    )) {
      try {
        await deleteParteItem.mutateAsync({ id: parteId, projectId });
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar el registro.');
      }
    }
  };

  const handleDeleteOdt = async (odt: ObraOrdenTrabajo) => {
    if (await useModalStore.getState().showConfirm(
      'Eliminar / Anular ODT',
      `¿Estás seguro de eliminar la orden ${odt.numero_odt} y sus registros asociados? El saldo volverá a estar disponible en Fase 2.`
    )) {
      try {
        await deleteOdt.mutateAsync({ id: odt.id, projectId });
        if (viewingOdtReport?.id === odt.id) setViewingOdtReport(null);
      } catch (err: any) {
        useModalStore.getState().showAlert('Error', err?.message || 'No se pudo eliminar la ODT.');
      }
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Banner de Modo Terreno */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <HardHat size={160} />
        </div>
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <HardHat size={12} /> Fase 3: Operación en Terreno (Tablet / Móvil)
            </div>
            <h2 className="text-2xl font-bold">Ejecución & Avance Físico Real</h2>
            <p className="text-emerald-100 text-sm mt-1 max-w-3xl">
              <strong>Regla Operativa:</strong> Una ODT permanece <strong>Abierta (En Ejecución)</strong> hasta alcanzar el <strong>100%</strong> de su meta física. Las horas trabajadas se calculan automáticamente a partir de la duración real (<code className="text-emerald-200">Hora Fin - Hora Inicio</code>).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="bg-white/10 hover:bg-white/15 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-white/20 flex items-center gap-2 text-xs font-bold cursor-pointer">
              <input
                type="checkbox"
                checked={!filtrarSoloFecha}
                onChange={e => setFiltrarSoloFecha(!e.target.checked)}
                className="rounded text-emerald-500 focus:ring-emerald-400"
              />
              <span>Mostrar Todas las ODTs e Historial</span>
            </label>

            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl border border-white/20 flex items-center gap-3">
              <Calendar size={18} className="text-emerald-300" />
              <div>
                <span className="text-[10px] uppercase font-bold text-emerald-200 block">Fecha de Parte Diario</span>
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
      </div>

      {/* Métricas de Ejecución */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">ODTs Abiertas (Pendientes / En Curso)</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{kpis.odtsAbiertasCount} ODTs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">ODTs Cerradas al 100%</span>
            <span className="text-2xl font-black text-emerald-600 font-mono">{kpis.odtsCumplidasCount} ODTs</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Producción Física Registrada</span>
            <span className="text-2xl font-black text-blue-600 font-mono">{kpis.totalEjecutado.toLocaleString('es-AR')}</span>
            <span className="text-xs text-slate-400 ml-1">en {kpis.partesCount} parte(s)</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block mb-1">Tiempos Muertos / Paradas</span>
            <span className="text-2xl font-black text-amber-600 font-mono">{kpis.totalHorasParada} h</span>
            <span className="text-xs text-slate-400 ml-1">registradas</span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <AlertTriangle size={20} />
          </div>
        </div>
      </div>

      {/* Grid de Órdenes de Trabajo */}
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <span>Órdenes de Trabajo (ODT) en Terreno ({visibleOdts.length})</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 font-normal">
              {filtrarSoloFecha ? `Filtrado por: ${selectedFecha}` : 'Mostrando todas las ODTs emitidas y ejecutadas'}
            </span>
          </h3>
        </div>

        {visibleOdts.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
            <Clock size={40} className="mx-auto text-slate-300 mb-3" />
            <h4 className="font-bold text-slate-700">No hay ODTs emitidas aún</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Generá una Orden de Trabajo desde la <strong>Fase 2 (Programación)</strong> para que aparezca acá lista para cargar producción.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {visibleOdts.map(odt => {
              const prog = odtProgressMap[odt.id] || {
                ejecutadoAcumulado: 0,
                pctAcumulado: 0,
                saldoPendiente: Number(odt.meta_cantidad || 0),
                partesOdt: [],
                esta100Cumplida: false
              };
              const estaCumplida = prog.esta100Cumplida;
              const enEjecucionParcial = !estaCumplida && prog.ejecutadoAcumulado > 0;

              return (
                <div
                  key={odt.id}
                  className={`bg-white rounded-2xl p-5 border transition-all shadow-sm flex flex-col justify-between ${
                    estaCumplida
                      ? 'border-emerald-300 bg-emerald-50/20'
                      : enEjecucionParcial
                      ? 'border-blue-300 bg-blue-50/10 hover:border-blue-500'
                      : 'border-slate-200 hover:border-emerald-500'
                  }`}
                >
                  <div>
                    <div className="flex justify-between items-start gap-2 mb-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-mono font-bold text-xs">
                          {odt.numero_odt}
                        </span>
                        {odt.item?.codigo_item && (
                          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                            WBS {odt.item.codigo_item}
                          </span>
                        )}
                        {odt.tramo?.codigo && (
                          <span className="text-xs font-mono font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                            Tramo {odt.tramo.codigo}
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-slate-400">
                          ({odt.fecha})
                        </span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 ${
                        estaCumplida
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : enEjecucionParcial
                          ? 'bg-blue-100 text-blue-800 border border-blue-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}>
                        {estaCumplida
                          ? '🟢 Cerrada 100%'
                          : enEjecucionParcial
                          ? `🔵 Abierta (${prog.pctAcumulado}%)`
                          : '🟠 Abierta (0%)'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-base mb-1">
                      {odt.item?.descripcion || 'Actividad Contractual'}
                    </h4>
                    {odt.tramo?.calle_pasaje ? (
                      <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                        <MapPin size={12} className="text-slate-400" />
                        {odt.tramo.calle_pasaje} — Ø{odt.tramo.diametro_mm}mm
                      </p>
                    ) : (
                      <p className="text-xs text-slate-400 mb-3">
                        Actividad WBS programada para jornada diaria
                      </p>
                    )}

                    {/* Barra de progreso acumulada de la ODT */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 mb-3">
                      <div className="flex justify-between items-center text-xs mb-1.5">
                        <span className="font-semibold text-slate-600">Avance Acumulado ODT:</span>
                        <span className="font-mono font-black text-slate-900">
                          {prog.ejecutadoAcumulado.toLocaleString('es-AR')} / {Number(odt.meta_cantidad).toLocaleString('es-AR')} {odt.unidad} ({prog.pctAcumulado}%)
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            estaCumplida ? 'bg-emerald-500' : prog.pctAcumulado > 0 ? 'bg-blue-600' : 'bg-slate-300'
                          }`}
                          style={{ width: `${prog.pctAcumulado}%` }}
                        />
                      </div>
                      {!estaCumplida && (
                        <div className="flex justify-between items-center text-[11px] text-amber-800 font-semibold mt-1.5">
                          <span>Saldo pendiente p/ cerrar al 100%:</span>
                          <span className="font-mono font-bold">{prog.saldoPendiente.toLocaleString('es-AR')} {odt.unidad}</span>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 grid grid-cols-2 gap-2 text-xs mb-4">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Meta ODT</span>
                        <span className="font-bold text-slate-800 font-mono">{odt.meta_cantidad} {odt.unidad}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Horario Plan</span>
                        <span className="font-mono text-slate-700">{odt.inicio_plan} a {odt.fin_plan}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Cuadrilla Asignada</span>
                        <span className="font-semibold text-slate-700">{odt.cuadrilla_nombre || '-'}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-slate-400 block text-[10px]">Maquinaria y Herramientas</span>
                        <span className="font-semibold text-slate-700">{odt.equipo_asignado || '-'}</span>
                      </div>
                      {odt.materiales_requeridos && (
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[10px]">Materiales / Observaciones</span>
                          <span className="font-semibold text-amber-800">{odt.materiales_requeridos}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    {!estaCumplida ? (
                      <button
                        type="button"
                        onClick={() => handleOpenReporte(odt)}
                        className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer"
                      >
                        <Play size={15} />
                        {enEjecucionParcial
                          ? `Cargar Saldo Restante (${prog.saldoPendiente} ${odt.unidad})`
                          : 'Cargar Producción Real (Tablet)'}
                      </button>
                    ) : (
                      <div className="flex items-center justify-between gap-2 text-emerald-800 text-xs font-bold bg-emerald-100/80 p-2.5 rounded-xl border border-emerald-300">
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 size={16} />
                          ODT Completada al 100%
                        </span>
                        <span className="font-mono">{prog.ejecutadoAcumulado} {odt.unidad}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewingOdtReport(odt)}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Eye size={14} />
                        Ver Informe de lo Cargado ({prog.partesOdt.length})
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteOdt(odt)}
                        className="p-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl transition-colors cursor-pointer"
                        title="Eliminar ODT si fue emitida por error"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Historial de Partes Registrados */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <span className="font-bold text-xs text-slate-800">
            Resumen de Registros de Terreno Cargados ({visiblePartes.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Hacé clic en <strong>Informe</strong> para ver el detalle completo o en el ícono de papelera para borrar un parte con error
          </span>
        </div>
        {visiblePartes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            Aún no hay partes diarios de producción cargados.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">ODT</th>
                  <th className="py-2.5 px-3">Código WBS / Tramo</th>
                  <th className="py-2.5 px-3">Actividad Contractual</th>
                  <th className="py-2.5 px-3 text-right">Cant. Real</th>
                  <th className="py-2.5 px-3 text-center">Cumplimiento</th>
                  <th className="py-2.5 px-3">Horario / Duración</th>
                  <th className="py-2.5 px-3">Paradas / Novedades</th>
                  <th className="py-2.5 px-3">Responsable</th>
                  <th className="py-2.5 px-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {visiblePartes.map(p => {
                  const codigoWbs = p.item?.codigo_item || p.odt?.item?.codigo_item || p.tramo?.codigo || p.tramo_item?.tramo?.codigo || '-';
                  const actividadDesc = p.item?.descripcion || p.odt?.item?.descripcion || p.tramo_item?.item?.descripcion || '-';
                  const parentOdt = allOdts.find(o => o.id === p.odt_id);

                  return (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono whitespace-nowrap">{p.fecha}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-amber-700 whitespace-nowrap">{p.odt?.numero_odt || '-'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">{codigoWbs}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{actividadDesc}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700 whitespace-nowrap">
                        {Number(p.cantidad_real).toLocaleString('es-AR')} {p.unidad}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${
                          Number(p.cumplimiento_pct) >= 100 ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {p.cumplimiento_pct}%
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                        <span className="font-mono font-semibold text-slate-800">{p.horas_trabajadas} hs</span>
                        <span className="text-[11px] text-slate-400 ml-1">
                          ({p.hora_inicio_real || '-'} a {p.hora_fin_real || '-'} · {p.personal_real_count} op.)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">
                        {p.minutos_parada > 0 ? (
                          <span className="text-red-600 font-bold">{p.minutos_parada}m: {p.motivo_parada}</span>
                        ) : (
                          <span className="text-emerald-600 font-semibold">Sin paradas</span>
                        )}
                        {p.novedades_interferencias && (
                          <span className="block text-[11px] text-slate-500 mt-0.5">{p.novedades_interferencias}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{p.responsable_carga || '-'}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          {parentOdt && (
                            <button
                              type="button"
                              onClick={() => setViewingOdtReport(parentOdt)}
                              className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                              title="Ver Informe de la ODT"
                            >
                              <Eye size={12} /> Informe
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleDeleteParte(p.id)}
                            disabled={deleteParteItem.isPending}
                            className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg cursor-pointer"
                            title="Eliminar este Parte Diario"
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
        )}
      </div>

      {/* Modal / Panel de Carga de Producción en Terreno */}
      <ModalPortal
        isOpen={Boolean(activeOdt)}
        onClose={() => setActiveOdt(null)}
        maxWidth="max-w-xl"
        closeOnBackdrop={false}
      >
        {activeOdt && (() => {
          const prog = odtProgressMap[activeOdt.id];
          const prevEjecutado = prog?.ejecutadoAcumulado || 0;
          const cantActualNum = Number(form.cantidad_real || 0);
          const nuevoTotalOdt = prevEjecutado + cantActualNum;
          const metaOdt = Number(activeOdt.meta_cantidad || 0);
          const pctNuevo = metaOdt > 0 ? Math.round((nuevoTotalOdt / metaOdt) * 100) : 100;
          const duracionCalculada = calcularDuracionHoras(form.hora_inicio_real, form.hora_fin_real);

          return (
            <div className="p-6 space-y-4 overflow-y-auto max-h-[90vh]">
              <div className="border-b border-slate-100 pb-3 flex justify-between items-start gap-3">
                <div>
                  <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block">Parte Diario — Terreno</span>
                  <h3 className="font-bold text-lg text-slate-900">{activeOdt.item?.descripcion}</h3>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    ODT: {activeOdt.numero_odt} |{' '}
                    {activeOdt.tramo?.codigo
                      ? `Tramo ${activeOdt.tramo.codigo} (${activeOdt.tramo.calle_pasaje || ''})`
                      : `WBS ${activeOdt.item?.codigo_item || '-'}`}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-mono font-bold block">
                    Meta ODT: {activeOdt.meta_cantidad} {activeOdt.unidad}
                  </span>
                  {prevEjecutado > 0 && (
                    <span className="text-[11px] font-mono text-blue-700 font-bold block mt-1">
                      Ya cargado: {prevEjecutado} {activeOdt.unidad} (Saldo: {prog?.saldoPendiente} {activeOdt.unidad})
                    </span>
                  )}
                </div>
              </div>

              {/* Input Gigante para Tablet de Producción Real */}
              <div className="bg-emerald-50/60 p-4 rounded-2xl border border-emerald-200 text-center">
                <label className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
                  ¿Cuántos {activeOdt.unidad} se produjeron en este turno?
                </label>
                <div className="flex items-center justify-center gap-2 mt-2">
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={form.cantidad_real}
                    onChange={e => setForm({ ...form, cantidad_real: e.target.value })}
                    placeholder="0"
                    className="w-44 text-center text-3xl font-black font-mono text-emerald-700 bg-white border-2 border-emerald-500 rounded-2xl py-2 px-3 focus:outline-none focus:ring-4 focus:ring-emerald-200"
                  />
                  <span className="text-xl font-bold font-mono text-emerald-800 uppercase">{activeOdt.unidad}</span>
                </div>
                <span className="text-xs text-emerald-700 block mt-2 font-semibold">
                  Cumplimiento acumulado ODT: {nuevoTotalOdt} / {metaOdt} {activeOdt.unidad} ({pctNuevo}%) —{' '}
                  {pctNuevo >= 100 ? '🟢 Se cerrará al 100%' : '🔵 Quedará Abierta con saldo pendiente'}
                </span>
              </div>

              {/* Datos Operativos con Cálculo Automático de Horas (Fin - Inicio) */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Hora Inicio Real</label>
                  <input
                    type="time"
                    value={form.hora_inicio_real}
                    onChange={e => handleHoraInicioChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Hora Fin Real</label>
                  <input
                    type="time"
                    value={form.hora_fin_real}
                    onChange={e => handleHoraFinChange(e.target.value)}
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Personal en Cuadrilla (operarios)</label>
                  <input
                    type="number"
                    min={0}
                    value={form.personal_real_count}
                    onChange={e => setForm({ ...form, personal_real_count: e.target.value })}
                    placeholder="Ej: 2"
                    className="w-full px-3 py-2 border rounded-xl text-sm font-mono font-bold"
                  />
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-slate-600">Horas Trabajadas (Fin - Inicio)</label>
                    <span className="text-[10px] font-mono font-bold text-blue-700">
                      {formatearDuracionLegible(duracionCalculada)}
                    </span>
                  </div>
                  <input
                    type="number"
                    step="any"
                    min={0}
                    value={form.horas_trabajadas}
                    onChange={e => setForm({ ...form, horas_trabajadas: e.target.value })}
                    placeholder="Ej: 0.5"
                    className="w-full px-3 py-2 border border-blue-300 bg-blue-50/40 rounded-xl text-sm font-mono font-bold text-blue-800"
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
                    className="text-xs font-bold text-amber-700 underline cursor-pointer"
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
                          min={0}
                          value={form.minutos_parada}
                          onChange={e => setForm({ ...form, minutos_parada: e.target.value })}
                          placeholder="60"
                          className="w-full px-2.5 py-1.5 border rounded-lg text-xs font-mono bg-white"
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
                  type="button"
                  onClick={() => setActiveOdt(null)}
                  className="px-4 py-2.5 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleGuardarParte}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg active:scale-95 cursor-pointer"
                >
                  <Check size={16} />
                  Guardar Parte de Producción
                </button>
              </div>
            </div>
          );
        })()}
      </ModalPortal>

      {/* Modal Informe de ODT y Producción Cargada */}
      <ModalPortal
        isOpen={Boolean(viewingOdtReport)}
        onClose={() => setViewingOdtReport(null)}
        maxWidth="max-w-4xl"
      >
        {viewingOdtReport && (() => {
          const prog = odtProgressMap[viewingOdtReport.id] || {
            ejecutadoAcumulado: 0,
            pctAcumulado: 0,
            saldoPendiente: Number(viewingOdtReport.meta_cantidad || 0),
            partesOdt: [],
            esta100Cumplida: false
          };

          return (
            <div className="p-6 space-y-5 overflow-y-auto max-h-[90vh]">
              <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-800 font-mono font-black text-xs">
                      {viewingOdtReport.numero_odt}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-mono font-bold text-xs">
                      WBS {viewingOdtReport.item?.codigo_item || '-'}
                    </span>
                    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                      prog.esta100Cumplida
                        ? 'bg-emerald-100 text-emerald-800'
                        : prog.ejecutadoAcumulado > 0
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}>
                      {prog.esta100Cumplida ? '🟢 CERRADA 100%' : `🔵 ABIERTA (${prog.pctAcumulado}%)`}
                    </span>
                  </div>
                  <h3 className="font-bold text-lg text-slate-900 mt-2">
                    {viewingOdtReport.item?.descripcion || 'Actividad de Obra'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Fecha ODT: <strong className="font-mono">{viewingOdtReport.fecha}</strong> | Horario Plan: <strong className="font-mono">{viewingOdtReport.inicio_plan} a {viewingOdtReport.fin_plan}</strong> | Responsable: <strong>{viewingOdtReport.responsable_nombre || '-'}</strong>
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteOdt(viewingOdtReport)}
                  className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Trash2 size={13} /> Eliminar ODT
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  <span className="text-[11px] text-slate-500 font-semibold block">Meta Asignada</span>
                  <span className="text-lg font-black text-slate-900 font-mono">
                    {Number(viewingOdtReport.meta_cantidad).toLocaleString('es-AR')} {viewingOdtReport.unidad}
                  </span>
                </div>
                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200">
                  <span className="text-[11px] text-emerald-700 font-semibold block">Total Cargado en Terreno</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">
                    {prog.ejecutadoAcumulado.toLocaleString('es-AR')} {viewingOdtReport.unidad} ({prog.pctAcumulado}%)
                  </span>
                </div>
                <div className="bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                  <span className="text-[11px] text-amber-800 font-semibold block">Saldo Pendiente ODT</span>
                  <span className="text-lg font-black text-amber-900 font-mono">
                    {prog.saldoPendiente.toLocaleString('es-AR')} {viewingOdtReport.unidad}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Cuadrilla y Operarios</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdtReport.cuadrilla_nombre || '-'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Maquinaria y Herramientas</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdtReport.equipo_asignado || '-'}</p>
                </div>
                <div className="md:col-span-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase block">Materiales y Observaciones</span>
                  <p className="font-semibold text-slate-800 mt-0.5">{viewingOdtReport.materiales_requeridos || 'Sin observaciones de materiales'}</p>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-bold text-sm text-slate-800">
                  Detalle de Partes Diarios Cargados ({prog.partesOdt.length})
                </h4>
                {prog.partesOdt.length === 0 ? (
                  <div className="p-6 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-xs text-slate-500">
                    Aún no se cargaron partes diarios para esta ODT.
                  </div>
                ) : (
                  <div className="overflow-x-auto border border-slate-200 rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Fecha</th>
                          <th className="py-2 px-3 text-right">Cant. Real</th>
                          <th className="py-2 px-3 text-center">Horario Real</th>
                          <th className="py-2 px-3 text-center">Duración (Horas)</th>
                          <th className="py-2 px-3 text-center">Personal</th>
                          <th className="py-2 px-3">Paradas / Novedades</th>
                          <th className="py-2 px-3 text-center">Eliminar</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {prog.partesOdt.map(p => (
                          <tr key={p.id}>
                            <td className="py-2 px-3 font-mono">{p.fecha}</td>
                            <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                              {Number(p.cantidad_real).toLocaleString('es-AR')} {p.unidad}
                            </td>
                            <td className="py-2 px-3 text-center font-mono">
                              {p.hora_inicio_real || '-'} a {p.hora_fin_real || '-'}
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-bold text-blue-700">
                              {p.horas_trabajadas} hs
                            </td>
                            <td className="py-2 px-3 text-center font-mono">{p.personal_real_count} op.</td>
                            <td className="py-2 px-3 text-slate-600">
                              {p.minutos_parada > 0 ? `${p.minutos_parada}m (${p.motivo_parada})` : 'Sin paradas'}
                              {p.novedades_interferencias ? ` | ${p.novedades_interferencias}` : ''}
                            </td>
                            <td className="py-2 px-3 text-center">
                              <button
                                type="button"
                                onClick={() => handleDeleteParte(p.id)}
                                className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded border border-red-200 cursor-pointer"
                                title="Eliminar parte diario"
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

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                {!prog.esta100Cumplida && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = viewingOdtReport;
                      setViewingOdtReport(null);
                      handleOpenReporte(target);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer"
                  >
                    + Cargar Nuevo Avance
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setViewingOdtReport(null)}
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
