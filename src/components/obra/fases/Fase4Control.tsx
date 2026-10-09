import React, { useState, useMemo } from 'react';
import {
  ShieldCheck, FileCheck, Layers, CheckCircle2,
  XCircle, Plus, Lock, Eye
} from 'lucide-react';
import {
  useObraHitos, useUpdateObraHito, useCreateObraHito,
  useObraTramos, useObraItems, useObraTramoItems,
  useObraCertificados, useCreateObraCertificado
} from '../../../hooks/useNuevoModuloObra';
import type { ObraHito, ObraCertificado } from '../../../lib/types';
import { ModalPortal } from '../../common/ModalPortal';

interface Fase4ControlProps {
  projectId: string;
  projectName?: string;
}

export const Fase4Control: React.FC<Fase4ControlProps> = ({
  projectId
}) => {
  const { data: hitos = [] } = useObraHitos(projectId);
  const { data: tramos = [] } = useObraTramos(projectId);
  const { data: items = [] } = useObraItems(projectId);
  const { data: tramoItems = [] } = useObraTramoItems(projectId);
  const { data: certificados = [] } = useObraCertificados(projectId);

  const updateHito = useUpdateObraHito();
  const createHito = useCreateObraHito();
  const createCertificado = useCreateObraCertificado();

  const [activeSubTab, setActiveSubTab] = useState<'hitos' | 'semaforo' | 'certificados'>('hitos');

  // Modal Hito
  const [selectedHito, setSelectedHito] = useState<ObraHito | null>(null);
  const [hitoForm, setHitoForm] = useState({
    acta_numero: '',
    inspector_nombre: 'Inspector OSSE',
    fecha_inspeccion: new Date().toISOString().split('T')[0]
  });

  // Modal Nuevo Hito
  const [showNewHitoModal, setShowNewHitoModal] = useState(false);
  const [newHito, setNewHito] = useState({
    codigo_hito: 'HI-01',
    nombre: 'Inspección y Laboratorio de Base de Asiento',
    tipo: 'laboratorio' as ObraHito['tipo'],
    ente_regulador: 'OSSE / Laboratorio',
    tramo_id: ''
  });

  // Modal Generar Certificado
  const [showNuevoCertModal, setShowNuevoCertModal] = useState(false);
  const [selectedCertificadoView, setSelectedCertificadoView] = useState<ObraCertificado | null>(null);
  const [certForm, setCertForm] = useState({
    periodo_desde: '2026-08-01',
    periodo_hasta: '2026-08-31',
    observaciones: 'Certificación de avance físico de red PEAD y conexiones'
  });

  // Cálculo preliminar para nuevo certificado
  const previewCertificado = useMemo(() => {
    const ultimoCert = certificados[0];
    const numeroCert = (ultimoCert?.numero_certificado || 0) + 1;

    // Calcular por cada ítem la cantidad ejecutada total acumulada
    const lineas = items.map(item => {
      // Buscar la suma de cantidades ejecutadas en todos los tramos para este ítem
      const tiList = tramoItems.filter(ti => ti.item_id === item.id);
      const cantAcumulada = tiList.reduce((s, ti) => s + Number(ti.cantidad_ejecutada || 0), 0);
      const cantContractual = Number(item.cantidad_contractual) || 0;
      const pu = Number(item.precio_unitario_ars) || 0;

      // Buscar línea anterior en el último certificado cerrado
      const lineaAnt = ultimoCert?.lineas?.find(l => l.item_id === item.id);
      const cantAnterior = Number(lineaAnt?.cantidad_acumulada || 0);
      const cantPeriodo = Math.max(0, cantAcumulada - cantAnterior);

      const impContr = cantContractual * pu;
      const impAnt = cantAnterior * pu;
      const impPres = cantPeriodo * pu;
      const impAcum = cantAcumulada * pu;
      const saldo = Math.max(0, impContr - impAcum);
      const avancePct = cantContractual > 0 ? (cantAcumulada / cantContractual) * 100 : 0;

      return {
        item_id: item.id,
        codigo_item: item.codigo_item,
        descripcion: item.descripcion,
        unidad: item.unidad,
        cantidad_contractual: cantContractual,
        precio_unitario_ars: pu,
        importe_contractual_ars: impContr,
        cantidad_anterior: cantAnterior,
        cantidad_presente: cantPeriodo,
        cantidad_acumulada: cantAcumulada,
        importe_anterior: impAnt,
        importe_presente: impPres,
        importe_acumulado: impAcum,
        saldo_importe: saldo,
        avance_acumulado_pct: avancePct
      };
    });

    const anteriorTotal = lineas.reduce((s, l) => s + l.importe_anterior, 0);
    const presenteTotal = lineas.reduce((s, l) => s + l.importe_presente, 0);
    const acumuladoTotal = lineas.reduce((s, l) => s + l.importe_acumulado, 0);
    const baseContractual = lineas.reduce((s, l) => s + l.importe_contractual_ars, 0);
    const saldoTotal = Math.max(0, baseContractual - acumuladoTotal);
    const avanceGlobalPct = baseContractual > 0 ? (acumuladoTotal / baseContractual) * 100 : 0;

    const iva = presenteTotal * 0.21;
    const totalConIva = presenteTotal + iva;
    const fondoReparo = presenteTotal * 0.05; // 5% retención
    const neto = totalConIva - fondoReparo;

    return {
      numeroCert,
      baseContractual,
      anteriorTotal,
      presenteTotal,
      acumuladoTotal,
      saldoTotal,
      avanceGlobalPct,
      iva,
      totalConIva,
      fondoReparo,
      neto,
      lineas
    };
  }, [certificados, items, tramoItems]);

  const handleEmitirCertificado = async () => {
    await createCertificado.mutateAsync({
      certificado: {
        project_id: projectId,
        numero_certificado: previewCertificado.numeroCert,
        periodo_desde: certForm.periodo_desde,
        periodo_hasta: certForm.periodo_hasta,
        base_contractual_ars: previewCertificado.baseContractual,
        anterior_sin_iva: previewCertificado.anteriorTotal,
        presente_sin_iva: previewCertificado.presenteTotal,
        acumulado_sin_iva: previewCertificado.acumuladoTotal,
        saldo_sin_iva: previewCertificado.saldoTotal,
        avance_acumulado_pct: previewCertificado.avanceGlobalPct,
        iva_presente: previewCertificado.iva,
        total_con_iva: previewCertificado.totalConIva,
        fondo_reparo_retencion: previewCertificado.fondoReparo,
        amortizacion_anticipo: 0,
        neto_a_cobrar: previewCertificado.neto,
        estado: 'cerrado',
        observaciones: certForm.observaciones
      },
      lineas: previewCertificado.lineas
    });

    setShowNuevoCertModal(false);
  };

  const handleResolverHito = async (estado: 0 | 100) => {
    if (!selectedHito) return;
    await updateHito.mutateAsync({
      id: selectedHito.id,
      estado_binario: estado,
      acta_numero: hitoForm.acta_numero,
      inspector_nombre: hitoForm.inspector_nombre,
      fecha_inspeccion: hitoForm.fecha_inspeccion
    });
    setSelectedHito(null);
  };

  return (
    <div className="space-y-6">
      {/* Banner de Fase 4 */}
      <div className="bg-gradient-to-r from-purple-900 to-indigo-950 text-white rounded-2xl p-6 shadow-md relative overflow-hidden">
        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none">
          <ShieldCheck size={160} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/20 text-purple-200 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck size={12} /> Fase 4: Auditoría, Hitos & Certificación
            </div>
            <h2 className="text-2xl font-bold">Control de Calidad & Estados de Pago</h2>
            <p className="text-purple-200 text-sm mt-1 max-w-2xl">
              <strong>Hitos binarios:</strong> No admiten términos medios (están al 0% o al 100%). La certificación contractual se genera automáticamente de la suma de mediciones físicas aprobadas.
            </p>
          </div>

          <button
            onClick={() => setShowNuevoCertModal(true)}
            className="px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg transition-all"
          >
            <FileCheck size={16} />
            + Generar Certificado Mensual
          </button>
        </div>
      </div>

      {/* Navegación de Subtabs */}
      <div className="flex border-b border-slate-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveSubTab('hitos')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'hitos'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldCheck size={16} />
          Hitos Técnicos Binarios (0% / 100%) ({hitos.length})
        </button>

        <button
          onClick={() => setActiveSubTab('semaforo')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'semaforo'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers size={16} />
          Semáforo Topológico por Tramo (Base 3/3)
        </button>

        <button
          onClick={() => setActiveSubTab('certificados')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-all ${
            activeSubTab === 'certificados'
              ? 'border-purple-600 text-purple-700 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck size={16} />
          Certificados Contractuales Emitidos ({certificados.length})
        </button>
      </div>

      {/* SUBTAB 1: HITOS BINARIOS */}
      {activeSubTab === 'hitos' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <h4 className="font-bold text-slate-800 text-sm">Inspecciones, Protocolos y Ensayos Regulatorios</h4>
              <p className="text-xs text-slate-500">Un hito al 0% bloquea el avance de las tareas sucesoras en ese tramo.</p>
            </div>
            <button
              onClick={() => setShowNewHitoModal(true)}
              className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Plus size={14} />
              + Nuevo Hito de Control
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {hitos.length === 0 ? (
              <div className="col-span-2 p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
                <ShieldCheck size={40} className="mx-auto text-slate-300 mb-3" />
                <h4 className="font-bold text-slate-700">Sin hitos registrados</h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Agrega los hitos de inspección de zanja, ensayos de laboratorio o pruebas hidráulicas requeridas por OSSE o comitente.
                </p>
              </div>
            ) : (
              hitos.map(hito => {
                const esAprobado = hito.estado_binario === 100;
                return (
                  <div
                    key={hito.id}
                    className={`bg-white rounded-2xl p-5 border transition-all shadow-sm ${
                      esAprobado ? 'border-emerald-200 bg-emerald-50/20' : 'border-red-200 bg-red-50/20'
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                          {hito.codigo_hito}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">{hito.ente_regulador || 'OSSE'}</span>
                      </div>

                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-black uppercase flex items-center gap-1 ${
                        esAprobado ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {esAprobado ? <CheckCircle2 size={13} /> : <XCircle size={13} />}
                        {esAprobado ? '100% APROBADO' : '0% PENDIENTE'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm mb-1">{hito.nombre}</h4>
                    <p className="text-xs text-slate-500 mb-3">
                      Tramo: <strong className="text-blue-700 font-mono">{hito.tramo?.codigo || 'General'}</strong>
                    </p>

                    <div className="bg-white p-3 rounded-xl border border-slate-100 text-xs space-y-1 mb-4">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Acta / Protocolo N°:</span>
                        <span className="font-mono font-bold text-slate-700">{hito.acta_numero || 'Sin acta registrada'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Inspector Responsable:</span>
                        <span className="text-slate-700 font-medium">{hito.inspector_nombre || '-'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Fecha de Resolución:</span>
                        <span className="font-mono text-slate-700">{hito.fecha_inspeccion || '-'}</span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          setSelectedHito(hito);
                          setHitoForm({
                            acta_numero: hito.acta_numero || '',
                            inspector_nombre: hito.inspector_nombre || 'Inspector OSSE',
                            fecha_inspeccion: hito.fecha_inspeccion || new Date().toISOString().split('T')[0]
                          });
                        }}
                        className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all text-center"
                      >
                        Gestionar Protocolo / Acta
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: SEMÁFORO TOPOLÓGICO */}
      {activeSubTab === 'semaforo' && (
        <div className="space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-600">
            Control de <strong>Base 3/3</strong> (Nivelación, Aporte y Compactación) y estado de colocación de cañerías por tramo topológico.
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto max-h-[550px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Tramo</th>
                    <th className="py-2.5 px-3">Pasaje / Calle</th>
                    <th className="py-2.5 px-3 text-right">Longitud</th>
                    <th className="py-2.5 px-3 text-center">Diámetro</th>
                    <th className="py-2.5 px-3 text-center">Base 3/3</th>
                    <th className="py-2.5 px-3 text-center">Cañería</th>
                    <th className="py-2.5 px-3 text-center">Servicios</th>
                    <th className="py-2.5 px-3 text-center">Estado General</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tramos.map(tramo => {
                    const tis = tramoItems.filter(ti => ti.tramo_id === tramo.id);
                    const todasTerminadas = tis.length > 0 && tis.every(ti => ti.estado === 'terminada');
                    const algunaEnEjecucion = tis.some(ti => ti.estado === 'en_ejecucion');

                    return (
                      <tr key={tramo.id} className="hover:bg-purple-50/30">
                        <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{tramo.codigo}</td>
                        <td className="py-2.5 px-3 text-slate-700">{tramo.calle_pasaje || '-'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold">{tramo.longitud_m} m</td>
                        <td className="py-2.5 px-3 text-center font-mono">Ø{tramo.diametro_mm}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                            3/3 OK
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-blue-100 text-blue-800">
                            Colocada
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono">{tramo.servicios_count || 0}</td>
                        <td className="py-2.5 px-3 text-center">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            todasTerminadas ? 'bg-emerald-100 text-emerald-700' :
                            algunaEnEjecucion ? 'bg-amber-100 text-amber-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {todasTerminadas ? 'COMPLETO' : algunaEnEjecucion ? 'EN CURSO' : 'HABILITADO'}
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

      {/* SUBTAB 3: CERTIFICADOS CONTRACTUALES */}
      {activeSubTab === 'certificados' && (
        <div className="space-y-4">
          {certificados.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-slate-300">
              <FileCheck size={40} className="mx-auto text-slate-300 mb-3" />
              <h4 className="font-bold text-slate-700">Aún no se han emitido certificados</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Genera el primer certificado mensual a partir de las mediciones físicas registradas en el período.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {certificados.map(cert => (
                <div key={cert.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
                  <div className="flex flex-col md:flex-row md:items-center justify-between pb-3 border-b border-slate-100 gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-purple-100 text-purple-700 font-black text-lg flex items-center justify-center font-mono">
                        N°{cert.numero_certificado}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">
                          Certificado de Obra N° {cert.numero_certificado}
                        </h4>
                        <span className="text-xs text-slate-500 font-mono">
                          Período: {cert.periodo_desde} al {cert.periodo_hasta} | Emisión: {cert.fecha_emision}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs uppercase flex items-center gap-1">
                        <Lock size={12} /> CERRADO / INMUTABLE
                      </span>
                      <button
                        onClick={() => setSelectedCertificadoView(cert)}
                        className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all"
                      >
                        <Eye size={14} /> Ver Detalle Ítems
                      </button>
                    </div>
                  </div>

                  {/* Resumen Económico del Certificado */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-4 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Anterior s/IVA</span>
                      <span className="font-mono font-bold text-slate-700">
                        ${Number(cert.anterior_sin_iva || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                      <span className="text-purple-600 font-semibold block text-[10px]">Período s/IVA</span>
                      <span className="font-mono font-black text-purple-900 text-sm">
                        ${Number(cert.presente_sin_iva || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">Acumulado s/IVA</span>
                      <span className="font-mono font-bold text-slate-800">
                        ${Number(cert.acumulado_sin_iva || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 block text-[10px]">% Avance Acumulado</span>
                      <span className="font-mono font-bold text-emerald-600 text-sm">
                        {Number(cert.avance_acumulado_pct || 0).toFixed(2)}%
                      </span>
                    </div>

                    <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200">
                      <span className="text-emerald-700 font-bold block text-[10px]">Neto Liquidado c/IVA</span>
                      <span className="font-mono font-black text-emerald-800 text-sm">
                        ${Number(cert.neto_a_cobrar || 0).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal Resolver Hito Binario */}
      <ModalPortal
        isOpen={Boolean(selectedHito)}
        onClose={() => setSelectedHito(null)}
        maxWidth="max-w-md"
      >
        {selectedHito && (
          <div className="p-6 space-y-4">
            <h3 className="font-bold text-lg text-slate-900">
              Protocolo de Liberación Técnica: {selectedHito.codigo_hito}
            </h3>
            <p className="text-xs text-slate-500 font-mono">{selectedHito.nombre}</p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">N° de Acta o Protocolo de Laboratorio</label>
                <input
                  value={hitoForm.acta_numero}
                  onChange={e => setHitoForm({ ...hitoForm, acta_numero: e.target.value })}
                  placeholder="Ej. ACTA-OSSE-2026-402"
                  className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Inspector / Laboratorista</label>
                <input
                  value={hitoForm.inspector_nombre}
                  onChange={e => setHitoForm({ ...hitoForm, inspector_nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Fecha de Inspección</label>
                <input
                  type="date"
                  value={hitoForm.fecha_inspeccion}
                  onChange={e => setHitoForm({ ...hitoForm, fecha_inspeccion: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <button
                onClick={() => setSelectedHito(null)}
                className="px-3 py-2 border rounded-xl text-xs font-semibold text-slate-600 flex-1 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleResolverHito(0)}
                className="px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
              >
                <XCircle size={14} /> Rechazar (0%)
              </button>
              <button
                onClick={() => handleResolverHito(100)}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1 shadow-md cursor-pointer"
              >
                <CheckCircle2 size={14} /> Aprobar (100%)
              </button>
            </div>
          </div>
        )}
      </ModalPortal>

      {/* Modal Nuevo Hito */}
      <ModalPortal
        isOpen={showNewHitoModal}
        onClose={() => setShowNewHitoModal(false)}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <h3 className="font-bold text-lg text-slate-900">Crear Nuevo Hito de Control</h3>
          <div className="space-y-3 text-xs">
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Código Hito (ej. HI-01)</label>
              <input
                value={newHito.codigo_hito}
                onChange={e => setNewHito({ ...newHito, codigo_hito: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm font-mono"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Nombre del Hito</label>
              <input
                value={newHito.nombre}
                onChange={e => setNewHito({ ...newHito, nombre: e.target.value })}
                placeholder="Inspección de fondo de zanja y laboratorio"
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Ente / Responsable</label>
              <input
                value={newHito.ente_regulador}
                onChange={e => setNewHito({ ...newHito, ente_regulador: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm"
              />
            </div>
            <div>
              <label className="font-semibold text-slate-600 block mb-1">Tramo Asociado</label>
              <select
                value={newHito.tramo_id}
                onChange={e => setNewHito({ ...newHito, tramo_id: e.target.value })}
                className="w-full px-3 py-2 border rounded-xl text-sm bg-white"
              >
                <option value="">-- General para toda la obra --</option>
                {tramos.map(t => (
                  <option key={t.id} value={t.id}>{t.codigo} ({t.calle_pasaje})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
            <button
              onClick={() => setShowNewHitoModal(false)}
              className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={async () => {
                await createHito.mutateAsync({
                  project_id: projectId,
                  codigo_hito: newHito.codigo_hito,
                  nombre: newHito.nombre,
                  tipo: newHito.tipo,
                  ente_regulador: newHito.ente_regulador,
                  tramo_id: newHito.tramo_id || null,
                  estado_binario: 0
                });
                setShowNewHitoModal(false);
              }}
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold cursor-pointer"
            >
              Guardar Hito
            </button>
          </div>
        </div>
      </ModalPortal>

      {/* Modal Generar Certificado Periódico */}
      <ModalPortal
        isOpen={showNuevoCertModal}
        onClose={() => setShowNuevoCertModal(false)}
        maxWidth="max-w-4xl"
      >
        <div className="p-6 space-y-4 overflow-y-auto max-h-[88vh]">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block">Liquidación Contractual Oficial</span>
                <h3 className="font-bold text-xl text-slate-900">Emisión de Certificado de Obra N° {previewCertificado.numeroCert}</h3>
              </div>
              <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-lg text-xs font-mono font-bold">
                Avance Acumulado: {previewCertificado.avanceGlobalPct.toFixed(2)}%
              </span>
            </div>

            {/* Período */}
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Período Desde</label>
                <input
                  type="date"
                  value={certForm.periodo_desde}
                  onChange={e => setCertForm({ ...certForm, periodo_desde: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-600 block mb-1">Período Hasta</label>
                <input
                  type="date"
                  value={certForm.periodo_hasta}
                  onChange={e => setCertForm({ ...certForm, periodo_hasta: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-sm"
                />
              </div>
            </div>

            {/* Tabla de Liquidación por Ítem */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ítem</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-right">Cant. Contractual</th>
                    <th className="py-2 px-3 text-right">Cant. Anterior</th>
                    <th className="py-2 px-3 text-right">Cant. Período</th>
                    <th className="py-2 px-3 text-right">Cant. Acum.</th>
                    <th className="py-2 px-3 text-right">Importe Período s/IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {previewCertificado.lineas.map(l => (
                    <tr key={l.item_id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{l.codigo_item}</td>
                      <td className="py-2 px-3 text-slate-800">{l.descripcion}</td>
                      <td className="py-2 px-3 text-right font-mono">{l.cantidad_contractual} {l.unidad}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400">{l.cantidad_anterior}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">{l.cantidad_presente}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{l.cantidad_acumulada}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        ${l.importe_presente.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Resumen Económico */}
            <div className="bg-slate-900 text-white rounded-2xl p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block text-[10px]">SUBTOTAL PERÍODO s/IVA</span>
                <span className="text-base font-bold text-white">
                  ${previewCertificado.presenteTotal.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">IVA (21%)</span>
                <span className="text-base font-bold text-white">
                  ${previewCertificado.iva.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">FONDO REPARO (5%)</span>
                <span className="text-base font-bold text-amber-400">
                  -${previewCertificado.fondoReparo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
              <div>
                <span className="text-emerald-400 block text-[10px] font-bold">LÍQUIDO A FACTURAR</span>
                <span className="text-lg font-black text-emerald-400">
                  ${previewCertificado.neto.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => setShowNuevoCertModal(false)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleEmitirCertificado}
                className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg cursor-pointer"
              >
                <Lock size={14} />
                Aprobar y Emitir Certificado (Inmutable)
              </button>
            </div>
          </div>
      </ModalPortal>

      {/* Modal Ver Detalle de Certificado Emitido */}
      <ModalPortal
        isOpen={Boolean(selectedCertificadoView)}
        onClose={() => setSelectedCertificadoView(null)}
        maxWidth="max-w-4xl"
      >
        {selectedCertificadoView && (
          <div className="p-6 space-y-4 overflow-y-auto max-h-[88vh]">
            <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
              <div>
                <h3 className="font-bold text-xl text-slate-900">
                  Certificado N° {selectedCertificadoView.numero_certificado} — Detalle
                </h3>
                <span className="text-xs text-slate-500 font-mono">
                  Período: {selectedCertificadoView.periodo_desde} al {selectedCertificadoView.periodo_hasta}
                </span>
              </div>
              <button
                onClick={() => setSelectedCertificadoView(null)}
                className="px-3 py-1.5 border rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-[400px] overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0 z-10 border-b border-slate-200">
                  <tr>
                    <th className="py-2 px-3">Ítem</th>
                    <th className="py-2 px-3">Descripción</th>
                    <th className="py-2 px-3 text-right">Cant. Contractual</th>
                    <th className="py-2 px-3 text-right">Anterior</th>
                    <th className="py-2 px-3 text-right">Período</th>
                    <th className="py-2 px-3 text-right">Acumulado</th>
                    <th className="py-2 px-3 text-right">Monto Período s/IVA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(selectedCertificadoView.lineas || []).map(l => (
                    <tr key={l.id} className="hover:bg-slate-50">
                      <td className="py-2 px-3 font-mono font-bold text-blue-700">{l.codigo_item}</td>
                      <td className="py-2 px-3 text-slate-800">{l.descripcion}</td>
                      <td className="py-2 px-3 text-right font-mono">{l.cantidad_contractual} {l.unidad}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-400">{l.cantidad_anterior}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-purple-700">{l.cantidad_presente}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-800">{l.cantidad_acumulada}</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-emerald-700">
                        ${Number(l.importe_presente).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </ModalPortal>
    </div>
  );
};
