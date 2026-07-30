import React, { useState, useMemo } from 'react';
import {
  HardHat, Search, Download, Users, UserCheck, UserX,
  DollarSign, ChevronDown, ChevronUp
} from 'lucide-react';
import { useEmployees } from '../hooks/useData';

function formatARS(v: number) {
  return `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export const WorkerPaymentsModule: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'terminated'>('all');
  const [sortField, setSortField] = useState<'name' | 'monto'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [expandedId] = useState<string | null>(null);

  // Filter & sort
  const filtered = useMemo(() => {
    let list = employees.filter(emp => {
      if (statusFilter !== 'all' && emp.employment_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          (emp.full_name || '').toLowerCase().includes(q) ||
          (emp.cuil || '').includes(q) ||
          (emp.bank_alias_cbu || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    list.sort((a, b) => {
      if (sortField === 'name') {
        const cmp = (a.full_name || '').localeCompare(b.full_name || '');
        return sortAsc ? cmp : -cmp;
      }
      const cmp = (Number(a.retribucion_pactada) || 0) - (Number(b.retribucion_pactada) || 0);
      return sortAsc ? cmp : -cmp;
    });

    return list;
  }, [employees, search, statusFilter, sortField, sortAsc]);

  const totalMonto = filtered.reduce((s, e) => s + (Number(e.retribucion_pactada) || 0), 0);
  const totalActivos = employees.filter(e => e.employment_status === 'active').length;
  const totalInactivos = employees.filter(e => e.employment_status !== 'active').length;

  const toggleSort = (field: 'name' | 'monto') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const SortIcon = ({ field }: { field: 'name' | 'monto' }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-white/40" />;
    return sortAsc
      ? <ChevronUp size={12} className="text-white" />
      : <ChevronDown size={12} className="text-white" />;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Activo', cls: 'bg-emerald-100 text-emerald-700' };
      case 'suspended': return { text: 'Suspendido', cls: 'bg-amber-100 text-amber-700' };
      case 'terminated': return { text: 'Desvinculado', cls: 'bg-red-100 text-red-700' };
      default: return { text: status, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  // PDF Export
  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pagos a Obreros</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; }
      h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #333; padding: 5px 8px; }
      th { background: #1a365d; color: white; text-align: center; font-size: 10px; text-transform: uppercase; }
      td { font-size: 10px; }
      .right { text-align: right; }
      .center { text-align: center; }
      .bold { font-weight: bold; }
      .total-row td { background: #e2e8f0; font-weight: bold; font-size: 11px; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <h1>PAGOS A OBREROS — MAESTRO DE DATOS BANCARIOS</h1>
    <table>
      <thead><tr>
        <th>N°</th><th>Apellido y Nombre</th><th>Alias / CBU</th>
        <th>Titular Cuenta</th><th>Monto Referencia</th><th>Estado</th><th>Observación</th>
      </tr></thead><tbody>`;

    filtered.forEach((emp, i) => {
      const st = statusLabel(emp.employment_status);
      html += `<tr>
        <td class="center">${i + 1}</td>
        <td class="bold">${(emp.full_name || '').toUpperCase()}</td>
        <td class="center">${emp.bank_alias_cbu || ''}</td>
        <td class="center">${(emp.full_name || '').toUpperCase()}</td>
        <td class="right bold">${Number(emp.retribucion_pactada) ? formatARS(Number(emp.retribucion_pactada)) : ''}</td>
        <td class="center">${st.text}</td>
        <td>${emp.observations || ''}</td>
      </tr>`;
    });

    html += `<tr class="total-row">
      <td colspan="4">TOTAL</td>
      <td class="right">${formatARS(totalMonto)}</td>
      <td colspan="2"></td>
    </tr></tbody></table>
    <p style="text-align:center;margin-top:30px;font-size:9px;color:#999;">ECAR Construcciones · Sistema de Gestión</p>
    </body></html>`;

    const printWin = window.open('', '_blank');
    if (printWin) {
      printWin.document.write(html);
      printWin.document.close();
      setTimeout(() => printWin.print(), 500);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><HardHat size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2">
            <HardHat size={24} /> Pagos a Obreros
          </h3>
          <p className="text-amber-200 text-sm mt-1">
            Maestro de obreros con datos bancarios, montos de referencia y exportación PDF
          </p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="light-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
            <DollarSign size={20} className="text-amber-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Total Monto Referencia</p>
            <p className="text-xl font-black font-mono text-gray-800">{formatARS(totalMonto)}</p>
          </div>
        </div>
        <div className="light-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
            <UserCheck size={20} className="text-emerald-700" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Obreros Activos</p>
            <p className="text-xl font-black text-emerald-700">{totalActivos}</p>
          </div>
        </div>
        <div className="light-card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
            <UserX size={20} className="text-red-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500">Inactivos / Desvinculados</p>
            <p className="text-xl font-black text-red-600">{totalInactivos}</p>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex-1 min-w-[220px] relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar por nombre, CUIL o alias..."
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
          className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all font-medium"
        >
          <option value="all">Todos los estados</option>
          <option value="active">Activos</option>
          <option value="suspended">Suspendidos</option>
          <option value="terminated">Desvinculados</option>
        </select>
        <button
          onClick={exportPDF}
          className="bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-900 shadow-md transition-all"
        >
          <Download size={14} /> Exportar PDF
        </button>
      </div>

      {/* Table */}
      <div className="light-card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16">
            <div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-500">Sin resultados</p>
            <p className="text-xs mt-1">Probá ajustando los filtros de búsqueda.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold w-12">N°</th>
                  <th
                    className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold cursor-pointer select-none hover:bg-slate-700 transition-colors"
                    onClick={() => toggleSort('name')}
                  >
                    <span className="flex items-center gap-1">Apellido y Nombre <SortIcon field="name" /></span>
                  </th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Alias / CBU</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Titular Cuenta</th>
                  <th
                    className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold cursor-pointer select-none hover:bg-slate-700 transition-colors"
                    onClick={() => toggleSort('monto')}
                  >
                    <span className="flex items-center justify-end gap-1">Monto Referencia <SortIcon field="monto" /></span>
                  </th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Estado</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Observación</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp, i) => {
                  const st = statusLabel(emp.employment_status);
                  const isExpanded = expandedId === emp.id;
                  return (
                    <React.Fragment key={emp.id}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${emp.employment_status !== 'active' ? 'opacity-60' : ''}`}
                      >
                        <td className="px-3 py-2.5 text-center text-xs text-gray-500 font-mono">{i + 1}</td>
                        <td className="px-3 py-2.5">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800 text-[10px] font-bold shrink-0 ring-1 ring-amber-200/60">
                              {(emp.full_name || '?').charAt(0)}
                            </div>
                            <div>
                              <span className="font-bold text-xs text-gray-800 uppercase">{emp.full_name}</span>
                              {emp.cuil && <p className="text-[10px] text-gray-400 font-mono">{emp.cuil}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-2.5 text-center font-mono text-xs font-bold text-gray-700">{emp.bank_alias_cbu || <span className="text-gray-300 font-normal italic">Sin CBU</span>}</td>
                        <td className="px-3 py-2.5 text-center text-xs text-gray-600 uppercase">{emp.full_name}</td>
                        <td className="px-3 py-2.5 text-right font-mono font-bold text-gray-900">
                          {Number(emp.retribucion_pactada) ? formatARS(Number(emp.retribucion_pactada)) : <span className="text-gray-300">—</span>}
                        </td>
                        <td className="px-3 py-2.5 text-center">
                          <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.text}</span>
                        </td>
                        <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[200px] truncate" title={emp.observations || ''}>
                          {emp.observations || ''}
                        </td>
                      </tr>
                      {/* Expandable detail */}
                      {isExpanded && (
                        <tr className="bg-amber-50/50">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                              <div><span className="font-bold text-gray-500">DNI:</span> <span className="text-gray-800">{emp.dni || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Teléfono:</span> <span className="text-gray-800">{emp.phone || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Banco:</span> <span className="text-gray-800">{emp.bank_name || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Categoría:</span> <span className="text-gray-800">{emp.category?.name || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Obra Social:</span> <span className="text-gray-800">{emp.obra_social || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">ART:</span> <span className="text-gray-800">{emp.art_provider || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Modo Liquidación:</span> <span className="text-gray-800">{emp.modo_liquidacion || '—'}</span></div>
                              <div><span className="font-bold text-gray-500">Empleador:</span> <span className="text-gray-800">{emp.employer_entity || '—'}</span></div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {/* Total row */}
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="px-3 py-3" colSpan={4}>
                    <span className="text-sm uppercase">Total</span>
                    <span className="text-xs text-slate-400 ml-2">({filtered.length} obreros)</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-sm">{formatARS(totalMonto)}</td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
