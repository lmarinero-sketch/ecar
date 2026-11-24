import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Fuel,
  Package,
  Printer,
  AlertTriangle,
  Truck,
  MapPin,
  User,
  Calendar,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { FuelLoad } from '../lib/types';
import { printFuelValeTicket58mm } from '../lib/generateFuelValePdf';
import { printTicket58mmRemito } from '../lib/orderPdfExport';

const formatDateTimeAR = (val?: string | null) => {
  if (!val) return '—';
  const d = new Date(val);
  if (isNaN(d.getTime())) return val;
  return d.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDateOnlyAR = (val?: string | null) => {
  if (!val) return '—';
  const parts = val.split('T')[0].split('-');
  if (parts.length === 3) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return val;
};

export const TicketVerifyPage: React.FC = () => {
  const params = new URLSearchParams(window.location.search);
  const tipo = (params.get('tipo') || 'vale').toLowerCase();
  const codigo = params.get('codigo') || '';
  const fallbackObra = params.get('obra') || '';
  const fallbackResp = params.get('resp') || '';
  const fallbackFecha = params.get('fecha') || '';
  const fallbackDesp = params.get('desp') || '';

  const [loading, setLoading] = useState(true);
  const [fuelLoad, setFuelLoad] = useState<FuelLoad | null>(null);
  const [remitoData, setRemitoData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const loadVerification = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        if (tipo === 'vale') {
          if (!codigo) {
            if (active) setErrorMsg('No se especificó el código de solicitud del vale.');
            return;
          }
          const { data, error } = await supabase
            .from('fuel_loads')
            .select('*')
            .or(`load_number.eq.${codigo},id.eq.${codigo}`)
            .limit(1)
            .maybeSingle();

          if (error) throw error;
          if (!data) {
            if (active) setErrorMsg(`No se encontró ningún Vale de Combustible con código "${codigo}".`);
            return;
          }
          if (active) setFuelLoad(data as FuelLoad);
        } else {
          // Remito: intentar buscar en logistics_deliveries o purchase_requests
          if (codigo) {
            const cleanIdPrefix = codigo.replace(/^0001-/, '').toLowerCase();
            const { data: delivery } = await supabase
              .from('logistics_deliveries')
              .select('*, project:projects(name), items:logistics_delivery_items(*)')
              .or(`remito_number.eq.${codigo}`)
              .limit(1)
              .maybeSingle();

            if (delivery) {
              if (active) setRemitoData({ source: 'delivery', record: delivery });
              return;
            }

            // Buscar en purchase_requests por coincidencia de inicio de UUID si tiene formato 0001-XXXXXXXX
            if (/^[0-9a-f]{8}$/i.test(cleanIdPrefix)) {
              const { data: reqs } = await supabase
                .from('purchase_requests')
                .select('*, project:projects(name), items:purchase_request_items(*)')
                .order('created_at', { ascending: false })
                .limit(100);

              const matched = (reqs || []).find((r: any) =>
                String(r.id || '').toLowerCase().startsWith(cleanIdPrefix)
              );
              if (matched) {
                if (active) setRemitoData({ source: 'purchase_request', record: matched });
                return;
              }
            }
          }

          // Fallback con los datos embebidos en el QR del ticket
          if (active && (codigo || fallbackObra || fallbackResp)) {
            setRemitoData({
              source: 'qr_params',
              record: {
                remito_number: codigo || 'SIN-NRO',
                obra: fallbackObra || 'Pañol Central / Obra',
                responsable: fallbackResp || 'Personal Autorizado',
                despachante: fallbackDesp || 'Pañol ECAR',
                fecha: fallbackFecha || '—',
              },
            });
          } else if (active) {
            setErrorMsg('No se encontraron datos del remito para verificar.');
          }
        }
      } catch (err: any) {
        if (active) setErrorMsg(err?.message || 'Error al verificar el comprobante.');
      } finally {
        if (active) setLoading(false);
      }
    };

    loadVerification();
    return () => {
      active = false;
    };
  }, [tipo, codigo, fallbackObra, fallbackResp, fallbackFecha, fallbackDesp]);

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4 flex flex-col items-center">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0B2240] to-slate-800 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              {tipo === 'vale' ? <Fuel size={22} className="text-amber-400" /> : <Package size={22} className="text-sky-400" />}
            </div>
            <div>
              <h1 className="font-black text-lg tracking-wide">ECAR · Verificación</h1>
              <p className="text-xs text-slate-300">
                {tipo === 'vale' ? 'Vale de Combustible y Lubricantes' : 'Remito de Despacho / Pañol'}
              </p>
            </div>
          </div>
          <ShieldCheck size={24} className="text-emerald-400 shrink-0" />
        </div>

        <div className="p-6">
          {loading ? (
            <div className="py-12 text-center text-slate-400 space-y-3">
              <div className="w-8 h-8 border-4 border-slate-200 border-t-[#0B2240] rounded-full animate-spin mx-auto" />
              <p className="text-sm font-medium">Verificando comprobante en ECAR...</p>
            </div>
          ) : errorMsg ? (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-2">
              <AlertTriangle size={28} className="text-red-500 mx-auto" />
              <p className="font-bold text-red-800 text-sm">{errorMsg}</p>
            </div>
          ) : tipo === 'vale' && fuelLoad ? (
            <div className="space-y-5">
              {/* Estado */}
              <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400 block">N° de Solicitud</span>
                  <span className="text-xl font-black font-mono text-[#0B2240]">{fuelLoad.load_number}</span>
                </div>
                {fuelLoad.workflow_status === 'completed' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Carga Completada
                  </span>
                ) : fuelLoad.workflow_status === 'authorized' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-sky-100 text-sky-800 border border-sky-200 flex items-center gap-1">
                    <CheckCircle2 size={14} /> Autorizado para Cargar
                  </span>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
                    <Clock size={14} /> Pendiente de Autorización
                  </span>
                )}
              </div>

              {/* Datos */}
              <div className="divide-y divide-slate-100 text-sm border border-slate-200 rounded-xl overflow-hidden">
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                  <span className="text-slate-500 flex items-center gap-1.5"><Calendar size={14} /> Fecha</span>
                  <span className="font-semibold text-slate-800">{formatDateOnlyAR(fuelLoad.load_date)}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                  <span className="text-slate-500 flex items-center gap-1.5"><Truck size={14} /> Vehículo</span>
                  <span className="font-bold text-slate-900 text-right">
                    {fuelLoad.vehicle_code} — {fuelLoad.vehicle_description}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                  <span className="text-slate-500 flex items-center gap-1.5"><Fuel size={14} /> Combustible</span>
                  <span className="font-semibold text-slate-800">{fuelLoad.fuel_type || '—'}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-amber-50/60">
                  <span className="text-slate-700 font-bold">
                    {fuelLoad.workflow_status === 'completed' ? 'Litros Cargados' : 'Litros Autorizados'}
                  </span>
                  <span className="font-mono font-black text-base text-[#0B2240]">
                    {fuelLoad.workflow_status === 'completed'
                      ? `${fuelLoad.liters || fuelLoad.requested_liters || 0} L`
                      : `${fuelLoad.requested_liters || 0} L`}
                  </span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                  <span className="text-slate-500 flex items-center gap-1.5"><User size={14} /> Solicitante / Chofer</span>
                  <span className="font-semibold text-slate-800">{fuelLoad.driver_name || fuelLoad.requested_by || '—'}</span>
                </div>
                <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                  <span className="text-slate-500 flex items-center gap-1.5"><MapPin size={14} /> Obra / Centro</span>
                  <span className="font-semibold text-slate-800 text-right">{fuelLoad.project_name || 'Uso General'}</span>
                </div>
                {fuelLoad.station_name && (
                  <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                    <span className="text-slate-500">Estación / Origen</span>
                    <span className="font-semibold text-slate-800">{fuelLoad.station_name}</span>
                  </div>
                )}
              </div>

              {fuelLoad.supervisor_signature && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900">
                  <span className="font-bold block uppercase text-[10px] text-emerald-700 mb-0.5">Autorización de Gerencia</span>
                  {fuelLoad.supervisor_signature}
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => printFuelValeTicket58mm(fuelLoad)}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer size={15} /> Imprimir Ticket 58mm
                </button>
                <a
                  href={`/fuel-request`}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-[#0B2240] hover:bg-slate-800 text-white text-xs font-bold flex items-center justify-center gap-2 text-center"
                >
                  <FileText size={15} /> Portal Combustible
                </a>
              </div>
            </div>
          ) : remitoData ? (
            <div className="space-y-5">
              {(() => {
                const isDelivery = remitoData.source === 'delivery';
                const isReq = remitoData.source === 'purchase_request';
                const rec = remitoData.record;
                const remitoNum = isDelivery
                  ? rec.remito_number || codigo
                  : isReq
                    ? `0001-${String(rec.id).slice(0, 8).toUpperCase()}`
                    : rec.remito_number;
                const obraName = isDelivery || isReq ? rec.project?.name || fallbackObra || 'Obra Central' : rec.obra;
                const receptor = isDelivery
                  ? rec.driver_name || fallbackResp || 'Chofer / Receptor'
                  : isReq
                    ? rec.received_by || rec.requested_by || fallbackResp || 'Jefe de Obra'
                    : rec.responsable;
                const despachante = isDelivery
                  ? fallbackDesp || 'Logística ECAR'
                  : isReq
                    ? rec.dispatched_by || 'Pañol Central'
                    : rec.despachante;
                const fechaDisplay = isDelivery
                  ? formatDateTimeAR(rec.scheduled_date || rec.created_at)
                  : isReq
                    ? formatDateTimeAR(rec.dispatched_at || rec.created_at)
                    : rec.fecha;
                const itemsList = isDelivery
                  ? (rec.items || []).map((i: any) => ({
                      quantity: Number(i.quantity || 1),
                      unit: i.unit || 'u',
                      description: i.description || i.item_name || 'Material',
                    }))
                  : isReq
                    ? (rec.items || []).map((i: any) => ({
                        quantity: Number(i.quantity_sent ?? i.quantity ?? 1),
                        unit: i.unit || 'u',
                        description: i.description || 'Material',
                      }))
                    : [];

                return (
                  <>
                    <div className="flex items-center justify-between flex-wrap gap-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-slate-400 block">Remito N°</span>
                        <span className="text-xl font-black font-mono text-[#0B2240]">{remitoNum}</span>
                      </div>
                      <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                        <CheckCircle2 size={14} /> Comprobante Verificado
                      </span>
                    </div>

                    <div className="divide-y divide-slate-100 text-sm border border-slate-200 rounded-xl overflow-hidden">
                      <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                        <span className="text-slate-500">Fecha</span>
                        <span className="font-semibold text-slate-800">{fechaDisplay}</span>
                      </div>
                      <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                        <span className="text-slate-500">Obra / Destino</span>
                        <span className="font-bold text-slate-900 text-right">{obraName}</span>
                      </div>
                      <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                        <span className="text-slate-500">Receptor</span>
                        <span className="font-semibold text-slate-800">{receptor}</span>
                      </div>
                      <div className="px-4 py-2.5 flex justify-between gap-4 bg-white">
                        <span className="text-slate-500">Despachó</span>
                        <span className="font-semibold text-slate-800">{despachante}</span>
                      </div>
                    </div>

                    {itemsList.length > 0 && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="bg-slate-50 px-4 py-2 text-xs font-bold uppercase text-slate-600 border-b border-slate-200">
                          Detalle de Ítems ({itemsList.length})
                        </div>
                        <ul className="divide-y divide-slate-100 text-sm">
                          {itemsList.map((it: any, idx: number) => (
                            <li key={idx} className="px-4 py-2 flex justify-between gap-3 bg-white">
                              <span className="text-slate-800 font-medium">{it.description}</span>
                              <span className="font-mono font-bold text-[#0B2240] shrink-0">
                                {it.quantity} {it.unit}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() =>
                        printTicket58mmRemito({
                          remitoNumber: remitoNum,
                          date: fechaDisplay,
                          obra: obraName,
                          responsable: receptor,
                          despachante,
                          notes: rec.notes || undefined,
                          items: itemsList,
                        })
                      }
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Printer size={15} /> Reimprimir Ticket 58mm
                    </button>
                  </>
                );
              })()}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
