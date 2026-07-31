import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Building2, Download, ShieldCheck, Clock, Activity, FileWarning } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const formatARS = (amount: number) => {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 2
  }).format(amount);
};

const formatPeriod = (p: string) => {
  if (p && p.length === 6) return `${p.substring(0, 4)}/${p.substring(4)}`;
  return p;
};

const getDiasAtrasoText = (situacion: number, diasAtraso: number | undefined) => {
  if (diasAtraso !== undefined && diasAtraso > 0) return diasAtraso.toString();
  switch (situacion) {
    case 1: return 'N/A';
    case 2: return '31 a 90';
    case 3: return '91 a 180';
    case 4: return '181 a 360';
    case 5: return '+360';
    case 6: return '+360';
    default: return 'N/A';
  }
};

const getSituationColor = (sit: number) => {
  switch (sit) {
    case 1: return 'bg-green-100 text-green-700 border-green-200';
    case 2: return 'bg-yellow-100 text-yellow-700 border-yellow-200';
    case 3: return 'bg-orange-100 text-orange-700 border-orange-200';
    case 4: return 'bg-red-100 text-red-700 border-red-200';
    case 5: return 'bg-red-900 text-white border-red-700';
    case 6: return 'bg-gray-800 text-white border-gray-600';
    default: return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

const getSituationLabel = (sit: number) => {
  switch (sit) {
    case 1: return 'Sit. 1 (Normal)';
    case 2: return 'Sit. 2 (Riesgo Bajo)';
    case 3: return 'Sit. 3 (Riesgo Medio)';
    case 4: return 'Sit. 4 (Riesgo Alto)';
    case 5: return 'Sit. 5 (Irrecuperable)';
    case 6: return 'Sit. 6 (Irrecup. Disposición Técnica)';
    default: return `Sit. ${sit}`;
  }
};



export const BcraCreditInfo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ deudores: any, cheques: any } | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const downloadPDF = async () => {
    const reportElement = document.getElementById('bcra-report-content');
    if (!reportElement) return;

    setIsGeneratingPdf(true);
    try {
      const originalWidth = reportElement.style.width;
      const originalMaxW = reportElement.style.maxWidth;
      reportElement.style.width = '1000px';
      reportElement.style.maxWidth = '1000px';

      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      reportElement.style.width = originalWidth;
      reportElement.style.maxWidth = originalMaxW;

      const imgData = canvas.toDataURL('image/png');
      const doc = new jsPDF('p', 'pt', 'a4');
      
      const COLOR_BLUE = '#0B2240'; 
      const COLOR_RED = '#D22027'; 
      const FONT_TITLE = 'helvetica';

      try {
        const response = await fetch('/logoECAR.png');
        if (response.ok) {
          const blob = await response.blob();
          const base64 = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
          doc.addImage(base64, 'PNG', 40, 40, 100, 35);
        }
      } catch (e) {
        console.warn('No se pudo cargar el logo', e);
      }
      
      doc.setFont(FONT_TITLE, 'bold');
      doc.setTextColor(COLOR_BLUE);
      doc.setFontSize(16);
      doc.text('INFORME DE VERIFICACIÓN', 250, 55);
      doc.text('BCRA & AFIP', 250, 75);

      doc.setFont(FONT_TITLE, 'normal');
      doc.setTextColor('#666666');
      doc.setFontSize(10);
      doc.text(`Identificador: ${inputValue}`, 250, 100);
      doc.text(`Generado: ${new Date().toLocaleDateString('es-AR')} ${new Date().toLocaleTimeString('es-AR', {hour: '2-digit', minute:'2-digit'})}`, 250, 115);

      const barY = 140;
      const barHeight = 12;
      doc.setFillColor(COLOR_RED);
      doc.rect(40, barY, 150, barHeight, 'F');
      doc.setFillColor(COLOR_BLUE);
      doc.rect(190, barY, 365, barHeight, 'F');

      const pdfWidth = doc.internal.pageSize.getWidth();
      const imgWidth = pdfWidth - 80;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      doc.addImage(imgData, 'PNG', 40, 170, imgWidth, imgHeight);

      doc.save(`Informe_BCRA_${inputValue}.pdf`);
    } catch (err) {
      console.error('Error generando PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };



  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Realizamos ambas peticiones en paralelo
      const [resDeudores, resCheques] = await Promise.allSettled([
        supabase.functions.invoke('bcra-proxy', { body: { type: 'deudores', id: inputValue } }),
        supabase.functions.invoke('bcra-proxy', { body: { type: 'cheques', id: inputValue } })
      ]);

      const getPayload = (res: any) => {
        if (res.status === 'fulfilled' && !res.value.error) {
          const d = res.value.data;
          if (d && d.status === 200) return d.results;
        }
        return null;
      };

      const deudoresData = getPayload(resDeudores);
      const chequesData = getPayload(resCheques);

      if (!deudoresData && (!chequesData || (chequesData.causales && chequesData.causales.length === 0) || !chequesData.causales)) {
        // Fallback si chequesData no tiene array
        if (!deudoresData && (!chequesData || chequesData.length === 0)) {
           throw new Error('El CUIT ingresado no posee registros en el BCRA (Sin deudas ni cheques rechazados).');
        }
      }

      const combinedData = { deudores: deudoresData, cheques: chequesData };
      setData(combinedData);
      


    } catch (err: any) {
      setError(err.message || 'Error al consultar la API del BCRA.');
    } finally {
      setLoading(false);
    }
  };

  // CHEQUES PROCESSING
  let cheques: any[] = [];
  if (data?.cheques) {
    if (Array.isArray(data.cheques)) {
      cheques = data.cheques;
    } else if (data.cheques.causales) {
      data.cheques.causales.forEach((causalObj: any) => {
        causalObj.entidades?.forEach((entidadObj: any) => {
          entidadObj.detalle?.forEach((cheque: any) => {
            cheques.push({
              ...cheque,
              causal: causalObj.causal
            });
          });
        });
      });
    }
  }

  const chequesSorted = [...cheques].sort((a, b) => {
    const parseDate = (dStr: string) => {
      if (!dStr) return 0;
      if (dStr.includes('/')) return new Date(dStr.split('/').reverse().join('-')).getTime();
      return new Date(dStr).getTime();
    };
    return parseDate(a.fechaRechazo || a.fecha_rechazo || a.fecha) - parseDate(b.fechaRechazo || b.fecha_rechazo || b.fecha);
  });

  const chequesByMonth = new Map<string, number>();
  chequesSorted.forEach(c => {
    const dateStr = c.fechaRechazo || c.fecha_rechazo || c.fecha || '';
    if (dateStr) {
      let monthYear = '';
      if (dateStr.includes('/')) {
        const parts = dateStr.split('/');
        if (parts.length === 3) monthYear = `${parts[2]}/${parts[1]}`;
      } else if (dateStr.includes('-')) {
        const parts = dateStr.split('-');
        if (parts.length >= 2) monthYear = `${parts[0]}/${parts[1]}`;
      } else if (dateStr.length >= 6) {
         monthYear = `${dateStr.substring(0, 4)}/${dateStr.substring(4, 6)}`;
      }
      if (monthYear) {
        chequesByMonth.set(monthYear, (chequesByMonth.get(monthYear) || 0) + (Number(c.monto) || 0));
      }
    }
  });

  const chequesChartData = Array.from(chequesByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, monto]) => ({ periodo, monto }));

  const totalChequesRechazadosImpagos = cheques.filter(c => !c.fechaPago && !c.fecha_pago).reduce((sum, c) => sum + (Number(c.monto) || 0), 0);

  // DEUDORES PROCESSING
  const periodosDeudores = data?.deudores?.periodos || [];
  const sortedPeriods = [...periodosDeudores].sort((a, b) => a.periodo.localeCompare(b.periodo));
  
  const historyChartData = sortedPeriods.map(p => {
    const totalMonto = p.entidades.reduce((sum: number, ent: any) => sum + (ent.monto * 1000), 0);
    return {
      periodo: formatPeriod(p.periodo),
      monto: totalMonto,
    };
  });

  const lastPeriod = sortedPeriods.length > 0 ? sortedPeriods[sortedPeriods.length - 1] : null;
  const lastPeriodEntities = lastPeriod ? lastPeriod.entidades : [];
  const worstSituation = lastPeriodEntities.length > 0 ? Math.max(...lastPeriodEntities.map((e: any) => e.situacion)) : 0;
  const totalActual = lastPeriodEntities.reduce((sum: number, ent: any) => sum + (ent.monto * 1000), 0);
  const score = worstSituation <= 1 ? 95 : worstSituation === 2 ? 60 : worstSituation === 3 ? 40 : worstSituation === 4 ? 20 : worstSituation > 4 ? 12 : 100;

  const barChartData = lastPeriodEntities.map((e: any) => ({
    entidad: e.entidad.length > 20 ? e.entidad.substring(0, 20) + '...' : e.entidad,
    monto: e.monto * 1000
  }));

  const renderDashboard = () => {
    if (!data) return null;

    const nombre = data.deudores?.denominacion || (cheques.length > 0 && cheques[0].denominacion) || 'Desconocido';
    const cuitIdentificacion = data.deudores?.identificacion || inputValue;

    return (
      <div className="space-y-6">
        {/* PREMIUM HEADER BANNER */}
        <div className="bg-gradient-to-r from-[#0B2240] to-slate-800 rounded-2xl overflow-hidden shadow-xl p-6 relative flex flex-col md:flex-row items-start md:items-center justify-between text-white border border-slate-700/50">
          <div className="absolute top-0 right-0 p-8 opacity-5">
            <Building2 size={120} />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white uppercase tracking-wider mb-1">{nombre}</h2>
            <div className="flex items-center gap-3 text-slate-300 font-mono tracking-widest text-sm">
              <span>CUIT: {cuitIdentificacion}</span>
              <span className="w-1 h-1 rounded-full bg-slate-500"></span>
              <span>Ref. BCRA</span>
            </div>
          </div>
          <div className="relative z-10 mt-4 md:mt-0 text-left md:text-right bg-black/20 p-3 rounded-xl border border-white/10 backdrop-blur-md">
            <p className="text-xs text-slate-300 uppercase font-semibold tracking-wider mb-1">Información actualizada al</p>
            <div className="flex items-center gap-2 justify-start md:justify-end">
              <Clock size={16} className="text-red-400" />
              <p className="font-mono font-bold text-white tracking-widest text-lg">{lastPeriod ? formatPeriod(lastPeriod.periodo) : 'N/A'}</p>
            </div>
          </div>
        </div>



        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg">
          {worstSituation > 2 && (
            <div className="bg-red-50 text-red-700 px-4 py-3 border-b border-red-100 flex items-center gap-2 text-sm">
              <AlertCircle size={16} />
              <span className="font-bold">ALERTA CRÍTICA:</span> Este perfil mantiene parámetros de incumplimiento en el registro crediticio bancario.
            </div>
          )}

          {totalChequesRechazadosImpagos > 0 && (
            <div className="bg-orange-50 text-orange-700 px-4 py-3 border-b border-orange-100 flex items-center gap-2 text-sm">
              <FileWarning size={16} />
              <span className="font-bold">ALERTA CHEQUES:</span> Existen cheques rechazados impagos por {formatARS(totalChequesRechazadosImpagos)}.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100">
            <div className="p-5 text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Score Calculado</p>
              <div className="flex items-baseline justify-center gap-1">
                <span className={`text-4xl font-black ${score > 70 ? 'text-green-500' : score > 40 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {score}
                </span>
                <span className="text-gray-400 font-bold">/100</span>
              </div>
            </div>
            <div className="p-5 flex flex-col justify-center items-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Peor Situación BCRA</p>
              {worstSituation > 0 ? (
                <span className={`px-3 py-1 rounded-full text-sm font-bold border ${getSituationColor(worstSituation)}`}>
                  {getSituationLabel(worstSituation)}
                </span>
              ) : (
                <span className="text-gray-400 font-bold">N/A</span>
              )}
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Total Deuda Bancaria</p>
              <p className="text-xl font-mono font-bold text-gray-800">{formatARS(totalActual)}</p>
            </div>
            <div className="p-5 text-center">
              <p className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-2">Total Cheques Impagos</p>
              <p className="text-xl font-mono font-bold text-gray-800">{formatARS(totalChequesRechazadosImpagos)}</p>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {historyChartData.length > 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg flex flex-col">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
                <Activity size={18} className="text-white" />
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Progresión de Deuda Bancaria</h4>
              </div>
              <div className="h-64 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyChartData}>
                    <defs>
                      <linearGradient id="colorMontoBancaria" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#0B2240" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#0B2240" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodo" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <YAxis 
                      tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} 
                      tick={{fontSize: 12, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [formatARS(Number(value) || 0), 'Deuda Bancaria']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="monto" stroke="#0B2240" strokeWidth={3} fillOpacity={1} fill="url(#colorMontoBancaria)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm flex items-center justify-center text-slate-400 p-5">
              Sin historial de deuda bancaria
            </div>
          )}

          {chequesChartData.length > 0 ? (
            <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg flex flex-col">
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex items-center gap-2">
                <FileWarning size={18} className="text-red-500" />
                <h4 className="font-bold text-white text-sm uppercase tracking-wider">Progresión Cheques Impagos</h4>
              </div>
              <div className="h-64 p-5">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chequesChartData}>
                    <defs>
                      <linearGradient id="colorMontoCheques" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#D22027" stopOpacity={0.5}/>
                        <stop offset="95%" stopColor="#D22027" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="periodo" tick={{fontSize: 12, fill: '#9ca3af'}} axisLine={false} tickLine={false} />
                    <YAxis 
                      tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} 
                      tick={{fontSize: 12, fill: '#9ca3af'}} 
                      axisLine={false} 
                      tickLine={false} 
                    />
                    <RechartsTooltip 
                      formatter={(value: any) => [formatARS(Number(value) || 0), 'Cheques Impagos']}
                      labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="monto" stroke="#D22027" strokeWidth={3} fillOpacity={1} fill="url(#colorMontoCheques)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md flex items-center justify-center text-slate-400 text-center flex-col gap-2 p-5 h-full">
              <ShieldCheck size={32} className="text-green-500 opacity-50" />
              <span>Sin historial de cheques impagos</span>
            </div>
          )}
        </div>

        {/* BANK DISTRIBUTION CHART */}
        {barChartData.length > 0 && (
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300 hover:shadow-lg flex flex-col">
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-4 border-b border-slate-700 flex items-center gap-2 text-white">
              <Building2 size={18} className="text-white" />
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Distribución por Entidad Bancaria (Últ. Mes)</h4>
            </div>
            <div className="h-64 p-5">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12}} hide />
                  <YAxis dataKey="entidad" type="category" tick={{fontSize: 11, fill: '#6b7280'}} width={120} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    formatter={(value: any) => [formatARS(Number(value) || 0), 'Deuda']}
                    cursor={{fill: '#f9fafb'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="monto" fill="#0B2240" radius={[0, 4, 4, 0]} barSize={24} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* RECENT PERIOD TABLE */}
        {lastPeriodEntities.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-700 p-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Exposición Financiera Institucional Activa</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">Entidad Financiera</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Perfil de Riesgo</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Saldo de Exposición (ARS)</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Días de Mora</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lastPeriodEntities.map((e: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{e.entidad}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2.5 py-1 rounded border text-xs font-bold ${getSituationColor(e.situacion)}`}>
                          Sit. {e.situacion}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                        {formatARS(e.monto * 1000)}
                      </td>
                      <td className="px-4 py-3 text-right text-gray-500 font-medium">
                        {getDiasAtrasoText(e.situacion, e.diasAtrasoPago)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHEQUES TABLE */}
        {cheques.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden">
            <div className="bg-slate-700 p-3">
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">Registro de Cheques Denunciados / Rechazados</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-gray-600">Nro. Cheque</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Fecha Rechazo</th>
                    <th className="px-4 py-3 font-semibold text-gray-600">Causal</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-right">Monto</th>
                    <th className="px-4 py-3 font-semibold text-gray-600 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cheques.map((c: any, i: number) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-gray-900 font-medium">{c.nroCheque || c.numeroCheque || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{c.fechaRechazo || c.fecha || 'N/A'}</td>
                      <td className="px-4 py-3 font-bold text-red-600 uppercase text-xs">{c.causal || 'SIN FONDOS'}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">
                        {c.monto ? formatARS(c.monto) : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2.5 py-1 rounded text-xs font-bold border ${c.fechaPago ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-800 text-white border-red-900'}`}>
                          {c.fechaPago ? 'Pagado' : 'Incumplimiento'}
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
    );
  };

  return (
    <div className="w-full">
      {/* Main Content */}
      <div className="w-full bg-gray-50/30 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
        {/* Search Header */}
        <div className="p-6 border-b border-gray-100 bg-white flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Building2 className="text-ecar-blue" size={24} />
              <h3 className="font-bold text-xl text-gray-900">Informe Integral de Verificación BCRA</h3>
            </div>
            <p className="text-sm text-gray-500">Consulta los registros públicos del Banco Central de la República Argentina mediante conexión segura directa.</p>
          </div>
          {data && !loading && !error && (
            <button
              onClick={downloadPDF}
              disabled={isGeneratingPdf}
              className="flex items-center justify-center gap-2 bg-slate-800 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700 transition-colors disabled:opacity-50 shrink-0"
            >
              {isGeneratingPdf ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Download size={16} />
              )}
              {isGeneratingPdf ? 'Generando...' : 'Descargar PDF'}
            </button>
          )}
        </div>

        <div className="p-6 bg-white border-b border-gray-100">
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 bg-gray-50 p-4 rounded-xl border border-gray-100">
          <div className="flex-1">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Identificador (CUIT/CUIL/CDI sin guiones)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="Ej: 30715428956"
                  className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue shadow-sm font-mono transition-all"
                  maxLength={11}
                />
              </div>
              <button
                type="submit"
                disabled={loading || inputValue.length < 11}
                className="bg-ecar-blue text-white px-6 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm whitespace-nowrap"
              >
                {loading ? 'Consultando...' : 'Generar Informe'}
              </button>
            </div>
          </div>
          </form>
        </div>

        {error && (
          <div className="m-6 bg-red-50 text-red-700 p-5 rounded-xl flex gap-3 text-sm border border-red-100 shadow-sm">
            <AlertCircle className="shrink-0 mt-0.5" size={18} />
            <div>
              <p className="font-bold mb-1">No se pudo obtener el reporte completo</p>
              <p>{error}</p>
            </div>
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center">
            <div className="w-10 h-10 border-4 border-gray-200 border-t-ecar-blue rounded-full animate-spin mb-4" />
            <p className="font-medium text-gray-500">Conectando con BCRA y consultando bases...</p>
            <p className="text-sm mt-2 max-w-sm">Esta operación es integral, por lo que estamos recabando deuda crediticia y cheques rechazados en tiempo real.</p>
          </div>
        )}

        {data && !loading && (
          <div id="bcra-report-content" className="w-full bg-white p-4">
            {renderDashboard()}
          </div>
        )}
      </div>
    </div>
  );
};
