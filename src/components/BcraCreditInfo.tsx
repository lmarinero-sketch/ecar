import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Building2, Download, ShieldCheck, History, Clock, Activity, FileWarning, BrainCircuit, Landmark, CheckCircle, FileText } from 'lucide-react';
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

const mockAfipData = (cuit: string) => {
  const isCompany = cuit.startsWith('30') || cuit.startsWith('33');
  return {
    estado: 'ACTIVO',
    tipo: isCompany ? 'Persona Jurídica' : 'Persona Física',
    regimen: isCompany ? 'Régimen General' : 'Monotributo',
    categoria: isCompany ? 'Responsable Inscripto' : 'Categoría C',
    actividad: isCompany ? 'Venta al por mayor de vehículos' : 'Servicios personales n.c.p.',
    impuestos: isCompany ? ['IVA', 'Ganancias', 'Empleador'] : ['Monotributo']
  };
};

const generateSimulatedInsights = (afip: any, score: number) => {
  const maxCapacity = afip.regimen === 'Monotributo' ? '$ 450.000,00' : '$ 3.500.000,00';
  
  if (score > 70) {
    return {
      perfil: 'Excelente comportamiento de pago. No registra atrasos significativos ni cheques rechazados recientes. Demuestra gran solvencia y capacidad para asumir nuevos compromisos crediticios en base a sus ingresos AFIP.',
      capacidadMaxima: maxCapacity,
      veredicto: 'APROBADO',
      color: 'bg-green-100 text-green-800 border-green-200'
    };
  } else if (score > 40) {
    return {
      perfil: 'Comportamiento regular. Presenta algunas demoras bancarias menores o deuda moderada. Nivel de riesgo aceptable pero requiere seguimiento cercano o garantías adicionales.',
      capacidadMaxima: afip.regimen === 'Monotributo' ? '$ 150.000,00' : '$ 1.000.000,00',
      veredicto: 'EVALUACIÓN MANUAL',
      color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
    };
  } else {
    return {
      perfil: 'Alto riesgo crediticio. Presenta moras severas en el sistema financiero o historial negativo de cheques. Capacidad de repago fuertemente comprometida ante los ingresos declarados.',
      capacidadMaxima: '$ 0,00',
      veredicto: 'RECHAZADO',
      color: 'bg-red-100 text-red-800 border-red-200'
    };
  }
};

export const BcraCreditInfo: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ deudores: any, cheques: any } | null>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const fetchHistory = async () => {
    try {
      const { data: h } = await supabase
        .from('bcra_queries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);
      if (h) setHistory(h);
    } catch (e) {
      console.error('Error fetching BCRA history', e);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const downloadPDF = async () => {
    const reportElement = document.getElementById('bcra-report-content');
    if (!reportElement) return;

    setIsGeneratingPdf(true);
    try {
      const canvas = await html2canvas(reportElement, {
        scale: 2,
        useCORS: true,
        logging: false
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage('/logoECAR.png', 'PNG', 10, 10, 30, 30);
      pdf.setFontSize(18);
      pdf.text('Informe de Verificacion BCRA', 50, 20);
      pdf.setFontSize(12);
      pdf.text(`Fecha: ${new Date().toLocaleDateString()}`, 50, 28);
      pdf.text(`Identificador: ${inputValue}`, 50, 34);

      pdf.addImage(imgData, 'PNG', 10, 50, pdfWidth - 20, pdfHeight - 20);

      pdf.save(`Informe_BCRA_${inputValue}.pdf`);
    } catch (err) {
      console.error('Error generando PDF', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const loadFromHistory = (h: any) => {
    setInputValue(h.cuit);
    if (h.query_type === 'integral') {
      setData(h.data);
    } else if (h.query_type === 'deudores') {
      setData({ deudores: h.data, cheques: null });
    } else if (h.query_type === 'cheques') {
      setData({ deudores: null, cheques: h.data });
    }
    setError(null);
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

      // Compute totals for AI
      let totalDeuda = 0;
      let peorSit = 0;
      if (deudoresData?.periodos?.length > 0) {
        const sorted = [...deudoresData.periodos].sort((a: any, b: any) => a.periodo.localeCompare(b.periodo));
        const last = sorted[sorted.length - 1];
        totalDeuda = last.entidades.reduce((sum: number, ent: any) => sum + (ent.monto * 1000), 0);
        peorSit = Math.max(...last.entidades.map((e: any) => e.situacion));
      }

      let totalCheques = 0;
      if (chequesData) {
        let flatCheques: any[] = [];
        if (Array.isArray(chequesData)) {
          flatCheques = chequesData;
        } else if (chequesData.causales) {
          chequesData.causales.forEach((c: any) => {
            c.entidades?.forEach((e: any) => {
              e.detalle?.forEach((ch: any) => flatCheques.push(ch));
            });
          });
        }
        totalCheques = flatCheques.filter(c => !c.fechaPago).reduce((sum, c) => sum + (c.monto || 0), 0);
      }

      const scoreCalc = peorSit <= 1 ? 95 : peorSit === 2 ? 60 : peorSit === 3 ? 40 : peorSit === 4 ? 20 : peorSit > 4 ? 12 : 100;
      const afipDataMock = mockAfipData(inputValue);

      let realInsights = null;
      try {
        const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-insights', {
          body: {
            afip: afipDataMock,
            score: scoreCalc,
            deuda: totalDeuda,
            cheques: totalCheques,
            peorSituacion: peorSit
          }
        });
        if (!aiError && aiResponse) {
          realInsights = aiResponse;
        }
      } catch (aiErr) {
        console.error('Error fetching AI insights:', aiErr);
      }

      const combinedData = { deudores: deudoresData, cheques: chequesData, insights: realInsights };
      setData(combinedData);
      
      // Guardar en historial
      supabase.from('bcra_queries').insert({
        cuit: inputValue,
        query_type: 'integral',
        data: combinedData
      }).then(() => fetchHistory());

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
    const d1 = new Date(a.fechaRechazo?.split('/').reverse().join('-') || a.fecha || 0).getTime();
    const d2 = new Date(b.fechaRechazo?.split('/').reverse().join('-') || b.fecha || 0).getTime();
    return d1 - d2;
  });

  const chequesByMonth = new Map<string, number>();
  chequesSorted.forEach(c => {
    if (!c.fechaPago) {
      const dateStr = c.fechaRechazo || c.fecha;
      if (dateStr) {
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const monthYear = `${parts[2]}/${parts[1]}`;
          chequesByMonth.set(monthYear, (chequesByMonth.get(monthYear) || 0) + (c.monto || 0));
        }
      }
    }
  });

  const chequesChartData = Array.from(chequesByMonth.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([periodo, monto]) => ({ periodo, monto }));

  const totalChequesRechazadosImpagos = cheques.filter(c => !c.fechaPago).reduce((sum, c) => sum + (c.monto || 0), 0);

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

    const afip = mockAfipData(cuitIdentificacion);
    // Use real insights from API if available, otherwise fallback to simulated
    const insights = (data as any).insights || generateSimulatedInsights(afip, score);

    return (
      <div className="space-y-6">
        {/* AFIP & AI INSIGHTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border-2 border-indigo-100 rounded-xl overflow-hidden shadow-sm">
            <div className="bg-indigo-50 p-3 border-b border-indigo-100 flex items-center gap-2">
              <Landmark size={18} className="text-indigo-600" />
              <h4 className="font-bold text-indigo-900 text-sm uppercase tracking-wider">Padrón AFIP (Constancia)</h4>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Estado</p>
                <div className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
                  <CheckCircle size={14} className="text-green-500" />
                  {afip.estado}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Tipo de Persona</p>
                <p className="text-sm font-medium text-gray-900">{afip.tipo}</p>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Régimen y Categoría</p>
                <div className="flex gap-2">
                  <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-xs font-bold border border-gray-200">{afip.regimen}</span>
                  <span className="bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded text-xs font-bold border border-indigo-200">{afip.categoria}</span>
                </div>
              </div>
              <div className="col-span-2">
                <p className="text-xs text-gray-500 font-bold uppercase mb-1">Actividad Principal</p>
                <p className="text-sm text-gray-700">{afip.actividad}</p>
              </div>
            </div>
          </div>

          <div className="bg-white border-2 border-purple-100 rounded-xl overflow-hidden shadow-sm flex flex-col">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3 flex items-center gap-2">
              <BrainCircuit size={18} className="text-white" />
              <h4 className="font-bold text-white text-sm uppercase tracking-wider">AI Insights: Análisis de Crédito</h4>
            </div>
            <div className="p-5 flex flex-col justify-between flex-1 gap-4">
              <p className="text-sm text-gray-700 leading-relaxed italic border-l-4 border-purple-300 pl-3">
                "{insights.perfil}"
              </p>
              <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-auto">
                <div>
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Deuda Recomendada (Máx)</p>
                  <p className="text-lg font-black text-gray-900 font-mono">{insights.capacidadMaxima}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 font-bold uppercase mb-1">Sugerencia</p>
                  <span className={`px-3 py-1.5 rounded-md text-xs font-black uppercase tracking-wider border ${insights.color}`}>
                    {insights.veredicto}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* HEADER SUMMARY */}
        <div className="bg-white border-2 border-slate-200 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{nombre}</h2>
              <p className="text-sm text-gray-600 font-mono mt-1">CUIT: {cuitIdentificacion}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Último Período (Deuda)</p>
              <p className="font-mono font-bold text-gray-800">{lastPeriod ? formatPeriod(lastPeriod.periodo) : 'N/A'}</p>
            </div>
          </div>
          
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
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Activity size={18} className="text-ecar-blue" />
                Progresión de Deuda Bancaria
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyChartData}>
                    <defs>
                      <linearGradient id="colorMontoBancaria" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
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
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="monto" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorMontoBancaria)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-center text-gray-400">
              Sin historial de deuda bancaria
            </div>
          )}

          {chequesChartData.length > 0 ? (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                <FileWarning size={18} className="text-orange-500" />
                Progresión Cheques Impagos
              </h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chequesChartData}>
                    <defs>
                      <linearGradient id="colorMontoCheques" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
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
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Area type="monotone" dataKey="monto" stroke="#f97316" strokeWidth={3} fillOpacity={1} fill="url(#colorMontoCheques)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm flex items-center justify-center text-gray-400 text-center flex-col gap-2">
              <ShieldCheck size={32} className="text-green-500 opacity-50" />
              <span>Sin historial de cheques impagos</span>
            </div>
          )}
        </div>

        {/* BANK DISTRIBUTION CHART */}
        {barChartData.length > 0 && (
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-ecar-blue" />
              Distribución por Entidad Bancaria (Últ. Mes)
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barChartData} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f3f4f6" />
                  <XAxis type="number" tickFormatter={(val) => `$${(val/1000000).toFixed(1)}M`} tick={{fontSize: 12}} hide />
                  <YAxis dataKey="entidad" type="category" tick={{fontSize: 11, fill: '#6b7280'}} width={120} axisLine={false} tickLine={false} />
                  <RechartsTooltip 
                    formatter={(value: any) => [formatARS(Number(value) || 0), 'Deuda']}
                    cursor={{fill: '#f9fafb'}}
                  />
                  <Bar dataKey="monto" fill="#3b82f6" radius={[0, 4, 4, 0]} />
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
    <div className="flex flex-col lg:flex-row gap-6 w-full">
      {/* Sidebar Historial */}
      <div className="w-full lg:w-1/4">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden sticky top-6">
          <div className="bg-slate-700 p-4 flex items-center gap-2">
            <History className="text-white" size={18} />
            <h3 className="font-bold text-white uppercase text-sm tracking-wider">Últimas Consultas</h3>
          </div>
          <div className="divide-y divide-gray-100 max-h-[500px] overflow-y-auto">
            {history.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500">No hay consultas previas</div>
            ) : (
              history.map((h, i) => (
                <div 
                  key={i} 
                  className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => loadFromHistory(h)}
                >
                  <div className="flex flex-col mb-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-gray-800 text-sm truncate" title={h.data?.deudores?.denominacion || h.data?.denominacion || 'Desconocido'}>
                        {h.data?.deudores?.denominacion || h.data?.denominacion || 'Sin Denominación'}
                      </span>
                      <span className="text-[10px] uppercase font-bold text-gray-400 border px-1.5 rounded bg-white shrink-0">
                        {h.query_type}
                      </span>
                    </div>
                    <span className="text-gray-500 font-mono text-xs mt-0.5">CUIT: {h.cuit}</span>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-gray-400 font-medium">
                    <Clock size={12} />
                    <span>{new Date(h.created_at).toLocaleDateString()} {new Date(h.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="w-full lg:w-3/4 bg-gray-50/30 rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
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
