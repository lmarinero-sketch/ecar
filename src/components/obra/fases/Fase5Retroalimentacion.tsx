import React, { useState, useMemo } from 'react';
import {
  RotateCcw, TrendingUp, AlertTriangle, Lightbulb, CheckCircle2,
  Plus, BookOpen, Database
} from 'lucide-react';
import {
  useObraItems,
  useObraParteDiarioItems,
  useObraLeccionesAprendidas,
  useCreateObraLeccionAprendida
} from '../../../hooks/useNuevoModuloObra';
import type { ObraLeccionAprendida } from '../../../lib/types';

interface Fase5RetroalimentacionProps {
  projectId: string;
  projectName?: string;
}

export const Fase5Retroalimentacion: React.FC<Fase5RetroalimentacionProps> = ({
  projectId
}) => {
  const { data: items = [] } = useObraItems(projectId);
  const { data: partes = [] } = useObraParteDiarioItems(projectId);
  const { data: lecciones = [] } = useObraLeccionesAprendidas(projectId);
  const createLeccion = useCreateObraLeccionAprendida();

  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    categoria: 'rendimiento' as ObraLeccionAprendida['categoria'],
    titulo: '',
    descripcion_problema: '',
    causa_raiz: '',
    accion_adoptada: '',
    rendimiento_cotizado: 70,
    rendimiento_real_obtenido: 55,
    impacto_costo_ars: 0,
    recomendacion_futura: '',
    autor: 'Ingeniero de Obra'
  });

  const [catalogoActualizado, setCatalogoActualizado] = useState(false);

  // Análisis de Paradas por Causa Raíz
  const paradasStats = useMemo(() => {
    const mapa: Record<string, { minutos: number; eventos: number }> = {};
    partes.forEach(p => {
      if (p.minutos_parada && p.minutos_parada > 0) {
        const motivo = p.motivo_parada || 'Sin motivo especificado';
        if (!mapa[motivo]) mapa[motivo] = { minutos: 0, eventos: 0 };
        mapa[motivo].minutos += Number(p.minutos_parada);
        mapa[motivo].eventos += 1;
      }
    });

    return Object.entries(mapa).map(([motivo, data]) => ({
      motivo,
      horas: (data.minutos / 60).toFixed(1),
      eventos: data.eventos,
      costoEstimado: data.minutos * 250 // Costo estimado cuadrilla/minuto
    })).sort((a, b) => Number(b.horas) - Number(a.horas));
  }, [partes]);

  // Comparativa de Rendimientos
  const rendimientoBenchmark = useMemo(() => {
    return items.slice(0, 8).map(item => {
      const partesItem = partes.filter(p => p.tramo_item?.item_id === item.id);
      const totalProducido = partesItem.reduce((s, p) => s + Number(p.cantidad_real || 0), 0);
      const diasTrabajados = partesItem.length || 1;
      const promedioReal = partesItem.length > 0 ? Math.round(totalProducido / diasTrabajados) : Number(item.rendimiento_base_dia);
      const teorico = Number(item.rendimiento_base_dia) || 70;
      const desvio = teorico > 0 ? Math.round(((promedioReal - teorico) / teorico) * 100) : 0;

      return {
        id: item.id,
        codigo: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad,
        teorico,
        real: promedioReal,
        desvio
      };
    });
  }, [items, partes]);

  const handleSaveLeccion = async () => {
    if (!form.titulo || !form.descripcion_problema) return;
    await createLeccion.mutateAsync({
      project_id: projectId,
      categoria: form.categoria,
      titulo: form.titulo,
      descripcion_problema: form.descripcion_problema,
      causa_raiz: form.causa_raiz || null,
      accion_adoptada: form.accion_adoptada,
      rendimiento_cotizado: Number(form.rendimiento_cotizado),
      rendimiento_real_obtenido: Number(form.rendimiento_real_obtenido),
      impacto_costo_ars: Number(form.impacto_costo_ars) || 0,
      recomendacion_futura: form.recomendacion_futura,
      autor: form.autor
    });

    setForm({
      categoria: 'rendimiento',
      titulo: '',
      descripcion_problema: '',
      causa_raiz: '',
      accion_adoptada: '',
      rendimiento_cotizado: 70,
      rendimiento_real_obtenido: 55,
      impacto_costo_ars: 0,
      recomendacion_futura: '',
      autor: 'Ingeniero de Obra'
    });
    setShowNewModal(false);
  };

  const handleActualizarCatalogo = () => {
    setCatalogoActualizado(true);
    setTimeout(() => setCatalogoActualizado(false), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Fase 5 */}
      <div className="bg-gradient-to-r from-teal-900 to-cyan-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <RotateCcw size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-500/20 text-teal-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <RotateCcw size={12} /> Fase 5: Inteligencia Operativa & Cierre del Ciclo
            </div>
            <h2 className="text-2xl font-bold">Retroalimentación & Lecciones de Obra</h2>
            <p className="text-teal-200 text-sm mt-1 max-w-2xl">
              Cierra el ciclo de ingeniería comparando los <strong>rendimientos reales de campo</strong> contra la estimación teórica presupuestada para recalibrar los futuros presupuestos y cotizaciones de ECAR.
            </p>
          </div>

          <button
            onClick={() => setShowNewModal(true)}
            className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <Plus size={16} />
            + Registrar Lección Aprendida
          </button>
        </div>
      </div>

      {/* Grid: Benchmarking y Paradas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tabla Benchmarking Rendimientos */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Benchmark: Rendimiento Real vs. Teórico</h3>
              <p className="text-xs text-slate-400">Comparativa de unidades/día cotizadas vs. producidas en terreno</p>
            </div>
            <TrendingUp size={20} className="text-teal-600" />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-2 px-3">Actividad</th>
                  <th className="py-2 px-3 text-right">Cotizado</th>
                  <th className="py-2 px-3 text-right">Real Terreno</th>
                  <th className="py-2 px-3 text-center">Desvío</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rendimientoBenchmark.map(b => (
                  <tr key={b.id} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3">
                      <span className="font-mono font-bold text-blue-700 mr-1.5">{b.codigo}</span>
                      <span className="text-slate-800 font-medium">{b.descripcion}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                      {b.teorico} {b.unidad}/d
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                      {b.real} {b.unidad}/d
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`px-2 py-0.5 rounded-full font-mono font-bold text-[10px] ${
                        b.desvio >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {b.desvio > 0 ? `+${b.desvio}%` : `${b.desvio}%`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-between items-center">
            <span className="text-xs text-slate-500">
              ¿Deseas sincronizar estos rendimientos al catálogo de cotización?
            </span>
            <button
              onClick={handleActualizarCatalogo}
              disabled={catalogoActualizado}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                catalogoActualizado
                  ? 'bg-emerald-600 text-white'
                  : 'bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200'
              }`}
            >
              {catalogoActualizado ? (
                <>
                  <CheckCircle2 size={13} /> ¡Catálogo Actualizado!
                </>
              ) : (
                <>
                  <Database size={13} /> Actualizar Catálogo Base
                </>
              )}
            </button>
          </div>
        </div>

        {/* Ranking de Tiempos Muertos y Paradas */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center pb-2 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-slate-800 text-base">Causa Raíz de Tiempos Muertos</h3>
              <p className="text-xs text-slate-400">Pérdidas operativas registradas en los partes diarios</p>
            </div>
            <AlertTriangle size={20} className="text-amber-600" />
          </div>

          {paradasStats.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No hay tiempos muertos reportados en los partes de esta obra.
            </div>
          ) : (
            <div className="space-y-3">
              {paradasStats.map((p, idx) => (
                <div key={idx} className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{p.motivo}</span>
                    <span className="text-slate-400 text-[11px]">{p.eventos} incidentes reportados</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="font-bold text-amber-700 text-sm block">{p.horas} horas</span>
                    <span className="text-slate-400 text-[10px]">~${p.costoEstimado.toLocaleString('es-AR')}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Repositorio de Lecciones Aprendidas */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
        <div className="flex justify-between items-center pb-2 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-800 text-base">Bitácora de Lecciones Aprendidas</h3>
            <p className="text-xs text-slate-400">Historial de soluciones adoptadas para optimizar futuros proyectos</p>
          </div>
          <BookOpen size={20} className="text-slate-400" />
        </div>

        {lecciones.length === 0 ? (
          <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
            <Lightbulb size={32} className="mx-auto text-amber-500 mb-2" />
            <p className="text-xs text-slate-600 font-semibold">Aún no hay lecciones registradas en este proyecto.</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Registra desviaciones de suelo, interferencias de servicios o mejoras constructivas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lecciones.map(lec => (
              <div key={lec.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs">
                <div className="flex justify-between items-start">
                  <span className="px-2 py-0.5 rounded bg-teal-100 text-teal-800 font-bold uppercase text-[10px]">
                    {lec.categoria}
                  </span>
                  <span className="text-slate-400 text-[11px]">{lec.autor}</span>
                </div>

                <h4 className="font-bold text-slate-900 text-sm">{lec.titulo}</h4>
                <p className="text-slate-600"><strong>Problema:</strong> {lec.descripcion_problema}</p>
                <p className="text-slate-700"><strong>Acción Adoptada:</strong> {lec.accion_adoptada}</p>

                <div className="bg-white p-2.5 rounded-lg border border-slate-100 mt-2 text-emerald-800 font-medium">
                  💡 <strong>Recomendación para futuras obras:</strong> {lec.recomendacion_futura}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal Nueva Lección Aprendida */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-4">
            <h3 className="font-bold text-lg text-slate-900">Registrar Lección Aprendida</h3>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Categoría</label>
                  <select
                    value={form.categoria}
                    onChange={e => setForm({ ...form, categoria: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
                  >
                    <option value="rendimiento">Rendimiento de Cuadrilla</option>
                    <option value="interferencia_suelo">Interferencia de Suelo</option>
                    <option value="calidad">Calidad y Ensayos</option>
                    <option value="maquinaria">Maquinaria / Equipos</option>
                    <option value="proveedor">Materiales / Proveedor</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-600 block mb-1">Título de la Lección</label>
                  <input
                    value={form.titulo}
                    onChange={e => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ej: Suelo rocoso en Pasaje 9"
                    className="w-full px-3 py-2 border rounded-xl text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Descripción del Problema / Desvío</label>
                <textarea
                  value={form.descripcion_problema}
                  onChange={e => setForm({ ...form, descripcion_problema: e.target.value })}
                  rows={2}
                  placeholder="Qué ocurrió en el terreno..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Acción Correctiva Adoptada</label>
                <textarea
                  value={form.accion_adoptada}
                  onChange={e => setForm({ ...form, accion_adoptada: e.target.value })}
                  rows={2}
                  placeholder="Cómo se resolvió en la obra..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-600 block mb-1">Recomendación para Futuras Cotizaciones</label>
                <textarea
                  value={form.recomendacion_futura}
                  onChange={e => setForm({ ...form, recomendacion_futura: e.target.value })}
                  rows={2}
                  placeholder="Considerar martillo neumático o cotizar con rendimiento de 40 m/día..."
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
              <button
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveLeccion}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-md"
              >
                Guardar Lección
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
