import React, { useState, useEffect } from 'react';
import { Search, AlertCircle, Building2, FileText, Activity, AlertTriangle, ShieldCheck, Download, Clock, History } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

// Helpers
const formatARS = (v: number) => `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2 })}`;
const formatPeriod = (p: string) => {
  if (p.length === 6) return `${p.substring(0, 4)}/${p.substring(4)}`;
  return p;
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
  const [apiType, setApiType] = useState<'deudores' | 'cheques'>('deudores');
  const [inputValue, setInputValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any | null>(null);
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
    setApiType(h.query_type);
    setInputValue(h.cuit);
    setData(h.data);
    setError(null);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    setLoading(true);
    setError(null);
    setData(null);

    try {
      // Usamos la Edge Function de Supabase para evitar bloqueos CORS
      const { data: resultData, error: funcError } = await supabase.functions.invoke('bcra-proxy', {
        body: { type: apiType, id: inputValue }
      });

      if (funcError) {
        throw new Error(funcError.message || 'Error al comunicarse con la Edge Function');
      }

      if (resultData.status === 404) {
        throw new Error('El CUIT/Cheque ingresado no posee registros en el BCRA (Sin deudas o denuncias).');
      }

      if (resultData.error) {
        throw new Error(resultData.error);
      }
      
      if (resultData.status === 400) {
        throw new Error('Los datos enviados son incorrectos (verifique el formato del CUIT).');
      }

      setData(resultData.results);
      
      // Guardar en historial
      supabase.from('bcra_queries').insert({
        cuit: inputValue,
        query_type: apiType,
        data: resultData.results
      }).then(() => fetchHistory());

    } catch (err: any) {
      setError(err.message || 'Error al consultar la API del BCRA.');
    } finally {
      setLoading(false);
    }
  };

  // Parsing Central de Deudores Data
  const renderDeudoresDashboard = () => {
    if (!data || !data.periodos || data.periodos.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400">
          No hay información crediticia registrada para este CUIT.
        </div>
      );
    }

    // 1. Process History
    // Sort periods oldest to newest
    const sortedPeriods = [...data.periodos].sort((a, b) => a.periodo.localeCompare(b.periodo));
    
    const historyChartData = sortedPeriods.map(p => {
      const totalMonto = p.entidades.reduce((sum: number, ent: any) => sum + (ent.monto * 1000), 0); // BCRA devuelve montos en miles
      return {
        periodo: formatPeriod(p.periodo),
        monto: totalMonto,
      };
    });

    // 2. Most recent period info
    const lastPeriod = sortedPeriods[sortedPeriods.length - 1];
    const lastPeriodEntities = lastPeriod.entidades;
    const worstSituation = Math.max(...lastPeriodEntities.map((e: any) => e.situacion));
    const totalActual = lastPeriodEntities.reduce((sum: number, ent: any) => sum + (ent.monto * 1000), 0);
    const score = worstSituation <= 1 ? 95 : worstSituation === 2 ? 60 : worstSituation === 3 ? 40 : worstSituation === 4 ? 20 : 12;

    const barChartData = lastPeriodEntities.map((e: any) => ({
      entidad: e.entidad.length > 20 ? e.entidad.substring(0, 20) + '...' : e.entidad,
      monto: e.monto * 1000
    }));

    return (
      <div className="space-y-6 animate-fade-in">
        {/* HEADER SUMMARY */}
        <div className="bg-white border-2 border-red-100 rounded-xl overflow-hidden shadow-sm">
          <div className="bg-red-50 p-4 border-b border-red-100 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{data.denominacion}</h2>
              <p className="text-sm text-gray-600 font-mono mt-1">CUIT: {data.identificacion}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase font-semibold">Período Actual</p>
              <p className="font-mono font-bold text-gray-800">{formatPeriod(lastPeriod.periodo)}</p>
            </div>
          </div>
          
          {worstSituation > 2 && (
            <div className="bg-red-50 text-red-700 p-3 text-sm flex gap-2 font-medium justify-center border-b border-red-100">
              <AlertTriangle size={20} />
              ALERTA CRÍTICA: Este perfil de contribuyente mantiene parámetros de incumplimiento en el registro crediticio.
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-gray-100 bg-white">
            <div className="p-4 flex flex-col items-center justify-center">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Score Calculado</p>
              <div className="flex items-end gap-1">
                <span className={`text-4xl font-black ${score > 60 ? 'text-green-600' : score > 30 ? 'text-orange-500' : 'text-red-600'}`}>
                  {score}
                </span>
                <span className="text-gray-400 font-bold mb-1">/100</span>
              </div>
            </div>
            <div className="p-4 flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Peor Situación BCRA</p>
              <span className={`inline-block px-3 py-1 rounded border text-sm font-bold w-fit ${getSituationColor(worstSituation)}`}>
                {getSituationLabel(worstSituation)}
              </span>
            </div>
            <div className="p-4 flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Total Adeudado</p>
              <p className="font-mono font-bold text-xl text-gray-900">{formatARS(totalActual)}</p>
            </div>
            <div className="p-4 flex flex-col justify-center">
              <p className="text-xs text-gray-400 uppercase font-bold mb-1">Bancos / Entidades</p>
              <p className="font-bold text-lg text-gray-800">{lastPeriodEntities.length}</p>
            </div>
          </div>
        </div>

        {/* CHARTS */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Activity size={18} className="text-ecar-blue" />
              Progresión de Deuda Mes a Mes
            </h4>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historyChartData}>
                  <defs>
                    <linearGradient id="colorMonto" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
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
                    formatter={(value: any) => [formatARS(Number(value) || 0), 'Deuda']}
                    labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area type="monotone" dataKey="monto" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorMonto)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm">
            <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Building2 size={18} className="text-ecar-blue" />
              Distribución por Entidad (Últ. Mes)
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
        </div>

        {/* RECENT PERIOD TABLE */}
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
                    <td className="px-4 py-3 text-right text-gray-500">
                      {e.diasAtraso || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderChequesDenunciados = () => {
    let cheques: any[] = [];
    if (data && data.causales) {
      data.causales.forEach((causalObj: any) => {
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

    if (cheques.length === 0) {
      return (
        <div className="text-center py-12 text-gray-400 flex flex-col items-center">
          <ShieldCheck size={48} className="mb-4 text-green-500 opacity-50" />
          <p>No se encontraron denuncias de cheques para este CUIT/CUIL.</p>
        </div>
      );
    }

    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden animate-fade-in">
        <div className="bg-slate-700 p-3">
          <h4 className="font-bold text-white text-sm uppercase tracking-wider">Registro de Cheques Denunciados / Rechazados</h4>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-gray-600">Nº de Cheque</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Fecha Rechazo</th>
                <th className="px-4 py-3 font-semibold text-gray-600">Causal</th>
                <th className="px-4 py-3 font-semibold text-gray-600 text-right">Monto Nominal (ARS)</th>
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
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto">
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
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-800 font-mono text-sm">{h.cuit}</span>
                    <span className="text-[10px] uppercase font-bold text-gray-400 border px-1.5 rounded bg-white">
                      {h.query_type}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-gray-500">
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
              Módulo a Consultar
            </label>
            <select
              value={apiType}
              onChange={(e) => {
                setApiType(e.target.value as any);
                setInputValue('');
                setData(null);
                setError(null);
              }}
              className="w-full bg-white border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue shadow-sm"
            >
              <option value="deudores">Central de Deudores (Riesgo Crediticio)</option>
              <option value="cheques">Cheques Denunciados / Rechazados</option>
            </select>
          </div>

          <div className="flex-[2]">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">
              Identificador (CUIT/CUIL/CDI sin guiones)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Ej: 20111111112"
                  className="w-full bg-white border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-ecar-blue/20 focus:border-ecar-blue shadow-sm"
                  pattern="[0-9]*"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading || !inputValue.trim()}
                className="bg-ecar-blue text-white px-8 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-all disabled:opacity-50 shadow-sm flex items-center justify-center min-w-[120px]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Generar Informe'
                )}
              </button>
            </div>
          </div>
        </form>
        </div>

      <div className="p-6 min-h-[400px]">
        {error && (
          <div className="bg-red-50 text-red-700 p-5 rounded-xl flex gap-3 text-sm border border-red-100 animate-fade-in shadow-sm">
            <AlertCircle className="shrink-0" size={24} />
            <div>
              <p className="font-bold text-base">Atención requerida</p>
              <p className="mt-1 opacity-90">{error}</p>
            </div>
          </div>
        )}

        {!error && !data && !loading && (
          <div className="text-center py-20 text-gray-400 flex flex-col items-center animate-fade-in">
            {apiType === 'deudores' ? <Building2 size={64} className="mb-6 opacity-10" /> : <FileText size={64} className="mb-6 opacity-10" />}
            <h4 className="text-lg font-bold text-gray-500 mb-2">Plataforma de Análisis Abierta</h4>
            <p className="max-w-md">Ingrese un número de identificación válido para generar el informe interactivo de riesgo utilizando los datos del Banco Central.</p>
          </div>
        )}

        {loading && !data && (
          <div className="text-center py-20 flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 border-4 border-gray-100 border-t-ecar-blue rounded-full animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Conectando con servidores del BCRA...</p>
          </div>
        )}

        {data && !loading && (
          <div id="bcra-report-content" className="w-full bg-white p-4">
            {apiType === 'deudores' ? renderDeudoresDashboard() : renderChequesDenunciados()}
          </div>
        )}
      </div>
      </div>
    </div>
  );
};
