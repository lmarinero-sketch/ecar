import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  HardHat, Search, Download, Users, Plus,
  ChevronDown, ChevronUp, Edit2, BarChart3,
  TableProperties, TrendingUp, Crown, Banknote,
  Check, Trash2, X, Calendar, Eye
} from 'lucide-react';
import {
  useEmployees, useUpdateEmployee, useAllWorkerPaymentItems,
  useWeeklyPayments, useCreateWeeklyPayment,
  useWeeklyPaymentItems, useCreateWeeklyPaymentItem,
  useUpdateWeeklyPaymentItem, useDeleteWeeklyPaymentItem
} from '../hooks/useData';

function formatARS(v: number) {
  return `$ ${v.toLocaleString('es-AR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ═══════════════════════════════════════════════════════════════════
// METRICS PANEL
// ═══════════════════════════════════════════════════════════════════
const MetricsPanel: React.FC = () => {
  const { data: paymentItems = [], isLoading } = useAllWorkerPaymentItems();
  const { data: employees = [] } = useEmployees();

  const monthlyData = useMemo(() => {
    const map: Record<string, number> = {};
    paymentItems.forEach(item => {
      const date = item.payment?.payment_date || item.created_at;
      if (!date) return;
      const key = date.slice(0, 7);
      map[key] = (map[key] || 0) + Number(item.monto || 0);
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, total]) => {
        const [y, m] = month.split('-');
        return { month, label: `${MONTHS[parseInt(m) - 1]} ${y.slice(2)}`, total };
      });
  }, [paymentItems]);

  const topWorkers = useMemo(() => {
    const map: Record<string, { name: string; total: number; count: number }> = {};
    paymentItems.forEach(item => {
      const name = (item.titular_cuenta || item.concepto || 'Sin nombre').toUpperCase();
      if (!map[name]) map[name] = { name, total: 0, count: 0 };
      map[name].total += Number(item.monto || 0);
      map[name].count += 1;
    });
    return Object.values(map).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [paymentItems]);

  const totalPaid = paymentItems.reduce((s, i) => s + Number(i.monto || 0), 0);
  const totalPayments = paymentItems.length;
  const maxBar = Math.max(...monthlyData.map(d => d.total), 1);

  if (isLoading) return <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total Abonado (histórico)</p>
          <p className="text-xl font-black font-mono text-gray-800">{formatARS(totalPaid)}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Pagos Realizados</p>
          <p className="text-xl font-black text-gray-800">{totalPayments}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Trabajadores Activos</p>
          <p className="text-xl font-black text-emerald-700">{employees.filter(e => e.employment_status === 'active').length}</p>
        </div>
        <div className="light-card p-4">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Promedio por Pago</p>
          <p className="text-xl font-black font-mono text-gray-800">{totalPayments > 0 ? formatARS(totalPaid / totalPayments) : '—'}</p>
        </div>
      </div>

      <div className="light-card p-5">
        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-4">
          <TrendingUp size={16} className="text-amber-600" /> Gasto Mensual en Trabajadores
        </h4>
        {monthlyData.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin datos de pagos registrados aún.</p>
        ) : (
          <div className="flex items-end gap-2 h-48">
            {monthlyData.map(d => (
              <div key={d.month} className="flex-1 flex flex-col items-center gap-1 group">
                <div className="relative w-full flex justify-center">
                  <span className="absolute -top-6 text-[9px] font-mono font-bold text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white px-1 rounded shadow-sm border">
                    {formatARS(d.total)}
                  </span>
                </div>
                <div
                  className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t-md transition-all duration-300 hover:from-amber-700 hover:to-amber-500 min-h-[4px] cursor-pointer"
                  style={{ height: `${(d.total / maxBar) * 100}%` }}
                  title={`${d.label}: ${formatARS(d.total)}`}
                />
                <span className="text-[9px] font-bold text-gray-500 mt-1">{d.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="light-card p-5">
        <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2 mb-4">
          <Crown size={16} className="text-amber-600" /> Top 10 Trabajadores — Mayor Monto Abonado
        </h4>
        {topWorkers.length === 0 ? (
          <p className="text-center text-sm text-gray-400 py-8">Sin datos.</p>
        ) : (
          <div className="space-y-2">
            {topWorkers.map((w, i) => {
              const pct = (w.total / (topWorkers[0]?.total || 1)) * 100;
              return (
                <div key={w.name} className="flex items-center gap-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                    i === 0 ? 'bg-amber-500 text-white' : i === 1 ? 'bg-gray-300 text-gray-700' : i === 2 ? 'bg-amber-200 text-amber-800' : 'bg-gray-100 text-gray-500'
                  }`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-xs font-bold text-gray-800 truncate">{w.name}</span>
                      <span className="text-xs font-mono font-bold text-gray-700 ml-2 shrink-0">{formatARS(w.total)}</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-1.5 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-gray-400">{w.count} pagos</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAY WORKER MODAL
// ═══════════════════════════════════════════════════════════════════
const PayWorkerModal: React.FC<{
  paymentId: string;
  currentItemsCount: number;
  onClose: () => void;
  onSuccess: () => void;
}> = ({ paymentId, currentItemsCount, onClose, onSuccess }) => {
  const { data: employees = [] } = useEmployees();
  const createItem = useCreateWeeklyPaymentItem();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [monto, setMonto] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) setShowDropdown(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = employees.filter(emp =>
    emp.employment_status === 'active' && (!searchTerm ||
      (emp.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.cuil || '').includes(searchTerm))
  );

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  const handleSave = async () => {
    if (!selectedEmployee) return;
    const finalMonto = parseFloat(monto.replace(/[^\d.,]/g, '').replace(',', '.')) || 0;
    if (finalMonto <= 0) return;

    await createItem.mutateAsync({
      payment_id: paymentId,
      concepto: 'SUELDO TRABAJADORES',
      monto: finalMonto,
      alias_cbu: selectedEmployee.bank_alias_cbu || '',
      titular_cuenta: selectedEmployee.full_name || '',
      nro_factura: '',
      observaciones: observaciones.trim(),
      source_type: 'sueldos_obreros',
      orden: currentItemsCount,
    });
    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center border-b pb-3">
          <h4 className="font-bold text-lg text-gray-800 flex items-center gap-2"><Banknote size={20} className="text-amber-600" /> Registrar Pago a Trabajador</h4>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
        </div>

        <div className="space-y-4">
          <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Buscar y Seleccionar Trabajador</label>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-3 text-gray-400" />
              <input
                value={searchTerm}
                onChange={e => { setSearchTerm(e.target.value); setSelectedEmployeeId(''); setShowDropdown(true); }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Nombre o CUIL..."
                className="w-full pl-9 pr-8 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all"
              />
              <ChevronDown size={16} className="absolute right-3 top-3 text-gray-400 cursor-pointer" onClick={() => setShowDropdown(!showDropdown)} />
            </div>
            {showDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-100 rounded-xl shadow-xl max-h-60 overflow-y-auto">
                {filteredEmployees.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">Sin resultados</div>
                ) : filteredEmployees.map(emp => (
                  <div
                    key={emp.id}
                    className="px-4 py-2.5 hover:bg-amber-50 cursor-pointer text-sm border-b border-gray-50 last:border-0 flex justify-between items-center"
                    onClick={() => { setSelectedEmployeeId(emp.id); setSearchTerm(emp.full_name || ''); setShowDropdown(false); setMonto(String(emp.retribucion_pactada || '')); }}
                  >
                    <div>
                      <span className="font-bold text-gray-800">{emp.full_name}</span>
                      {emp.cuil && <span className="ml-2 text-xs text-gray-500">({emp.cuil})</span>}
                    </div>
                    {emp.retribucion_pactada && <span className="text-xs font-mono text-amber-700 font-bold">{formatARS(Number(emp.retribucion_pactada))}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>

          {selectedEmployee && (
            <div className="bg-amber-50 p-3 rounded-xl border border-amber-100 space-y-1">
              <p className="text-xs text-amber-800 font-bold">Datos Bancarios:</p>
              <p className="text-sm font-mono text-amber-900">{selectedEmployee.bank_alias_cbu || 'Sin CBU cargado'}</p>
              {selectedEmployee.retribucion_pactada && (
                <p className="text-xs text-amber-600">Monto referencia: {formatARS(Number(selectedEmployee.retribucion_pactada))}</p>
              )}
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Monto a Pagar</label>
            <input value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00"
              className="w-full px-4 py-2.5 border rounded-xl text-sm font-mono bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all" />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Observaciones</label>
            <input value={observaciones} onChange={e => setObservaciones(e.target.value)} placeholder="Ej: Adelanto, Quincena, Cancelación..."
              className="w-full px-4 py-2.5 border rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all" />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t mt-6">
          <button onClick={onClose} className="px-5 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl">Cancelar</button>
          <button onClick={handleSave} disabled={!selectedEmployeeId || !monto || createItem.isPending}
            className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2">
            {createItem.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />}
            Guardar Pago
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// PAYMENT MANAGEMENT TAB
// ═══════════════════════════════════════════════════════════════════
const PaymentManagementTab: React.FC = () => {
  const { data: weeklyPayments = [], isLoading: loadingPayments } = useWeeklyPayments();
  const createPayment = useCreateWeeklyPayment();

  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [showNewPayment, setShowNewPayment] = useState(false);
  const [newDate, setNewDate] = useState(new Date().toISOString().slice(0, 10));

  // Filter weekly payments to only show worker-related
  const workerPayments = useMemo(() => weeklyPayments, [weeklyPayments]);

  const handleCreatePayment = async () => {
    const result = await createPayment.mutateAsync({
      payment_date: newDate,
      responsible: 'Sistema',
      notes: 'Pago a trabajadores',
    });
    setSelectedPaymentId(result.id);
    setShowNewPayment(false);
  };

  if (selectedPaymentId) {
    return <PaymentDetailView paymentId={selectedPaymentId} onBack={() => setSelectedPaymentId(null)} />;
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Seleccioná una semana de pago o creá una nueva para registrar pagos a trabajadores.</p>
        <button onClick={() => setShowNewPayment(true)} className="bg-amber-600 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-700 shadow-md transition-all">
          <Plus size={16} /> Nueva Semana de Pago
        </button>
      </div>

      {/* New Payment Quick Form */}
      {showNewPayment && (
        <div className="light-card p-4 border-2 border-amber-200 bg-amber-50/30">
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Fecha de Pago</label>
              <input type="date" value={newDate} onChange={e => setNewDate(e.target.value)}
                className="w-full px-4 py-2.5 border rounded-xl text-sm bg-white focus:ring-2 ring-amber-200" />
            </div>
            <button onClick={handleCreatePayment} disabled={createPayment.isPending}
              className="bg-amber-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-700 disabled:opacity-50 transition-all">
              Crear
            </button>
            <button onClick={() => setShowNewPayment(false)} className="text-gray-400 hover:text-gray-600 px-3 py-2.5">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Payment weeks list */}
      {loadingPayments ? (
        <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>
      ) : workerPayments.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Banknote size={48} className="mx-auto text-gray-300 mb-3" />
          <p className="font-bold text-gray-500">Sin semanas de pago registradas</p>
          <p className="text-xs mt-1">Creá una nueva semana de pago para comenzar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {workerPayments.map(p => (
            <PaymentWeekCard key={p.id} payment={p} onClick={() => setSelectedPaymentId(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
};

// ─── Payment Week Card ───
const PaymentWeekCard: React.FC<{ payment: any; onClick: () => void }> = ({ payment, onClick }) => {
  const { data: items = [] } = useWeeklyPaymentItems(payment.id);
  const workerItems = items.filter((i: any) => i.source_type === 'sueldos_obreros');
  const total = workerItems.reduce((s: number, i: any) => s + Number(i.monto || 0), 0);
  const pagados = workerItems.filter((i: any) => i.pagado).length;
  const d = new Date(payment.payment_date + 'T12:00:00');
  const dateLabel = d.toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <div onClick={onClick} className="light-card p-4 cursor-pointer hover:shadow-md hover:border-amber-200 transition-all group">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Calendar size={14} className="text-amber-600" />
          <span className="text-sm font-bold text-gray-800 capitalize">{dateLabel}</span>
        </div>
        <Eye size={14} className="text-gray-300 group-hover:text-amber-600 transition-colors" />
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-gray-400 uppercase font-bold">Trabajadores</p>
          <p className="text-lg font-black font-mono text-gray-800">{workerItems.length > 0 ? formatARS(total) : '—'}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-400 uppercase font-bold">Pagados</p>
          <p className="text-sm font-bold">
            <span className="text-emerald-600">{pagados}</span>
            <span className="text-gray-300"> / </span>
            <span className="text-gray-500">{workerItems.length}</span>
          </p>
        </div>
      </div>
      {workerItems.length > 0 && (
        <div className="w-full bg-gray-100 rounded-full h-1.5 mt-3">
          <div className="bg-emerald-500 h-1.5 rounded-full transition-all" style={{ width: `${workerItems.length > 0 ? (pagados / workerItems.length) * 100 : 0}%` }} />
        </div>
      )}
    </div>
  );
};

// ─── Payment Detail View ───
const PaymentDetailView: React.FC<{ paymentId: string; onBack: () => void }> = ({ paymentId, onBack }) => {
  const { data: items = [], isLoading } = useWeeklyPaymentItems(paymentId);
  const updateItem = useUpdateWeeklyPaymentItem();
  const deleteItem = useDeleteWeeklyPaymentItem();

  const [showPayModal, setShowPayModal] = useState(false);

  const workerItems = items.filter((i: any) => i.source_type === 'sueldos_obreros');
  const total = workerItems.reduce((s: number, i: any) => s + Number(i.monto || 0), 0);
  const pagados = workerItems.filter((i: any) => i.pagado).length;

  const togglePagado = (item: any) => {
    updateItem.mutate({ id: item.id, payment_id: paymentId, pagado: !item.pagado });
  };

  const handleDelete = (item: any) => {
    if (confirm(`¿Eliminar pago de ${item.titular_cuenta}?`)) {
      deleteItem.mutate({ id: item.id, payment_id: paymentId });
    }
  };

  // PDF export
  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Pagos a Trabajadores</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; }
      h1 { text-align: center; font-size: 16px; margin-bottom: 4px; }
      .sub { text-align: center; font-size: 11px; color: #666; margin-bottom: 20px; }
      table { width: 100%; border-collapse: collapse; margin-bottom: 15px; }
      th, td { border: 1px solid #333; padding: 5px 8px; }
      th { background: #1a365d; color: white; text-align: center; font-size: 10px; text-transform: uppercase; }
      td { font-size: 10px; }
      .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
      .total-row td { background: #e2e8f0; font-weight: bold; }
      .paid { color: #16a34a; } .pending { color: #dc2626; }
      @media print { body { padding: 15px; } }
    </style></head><body>
    <h1>PAGOS A TRABAJADORES</h1>
    <p class="sub">Detalle de pagos registrados</p>
    <table><thead><tr>
      <th>N°</th><th>Trabajador</th><th>Alias / CBU</th><th>Monto</th><th>Estado</th><th>Observación</th>
    </tr></thead><tbody>`;
    workerItems.forEach((item: any, i: number) => {
      html += `<tr>
        <td class="center">${i + 1}</td>
        <td class="bold">${(item.titular_cuenta || '').toUpperCase()}</td>
        <td class="center">${item.alias_cbu || ''}</td>
        <td class="right bold">${formatARS(Number(item.monto || 0))}</td>
        <td class="center ${item.pagado ? 'paid' : 'pending'}">${item.pagado ? '✓ Pagado' : 'Pendiente'}</td>
        <td>${item.observaciones || ''}</td>
      </tr>`;
    });
    html += `<tr class="total-row"><td colspan="3">TOTAL</td><td class="right">${formatARS(total)}</td><td class="center">${pagados}/${workerItems.length}</td><td></td></tr></tbody></table>
    <p style="text-align:center;margin-top:30px;font-size:9px;color:#999;">ECAR Construcciones · Sistema de Gestión</p></body></html>`;
    const printWin = window.open('', '_blank');
    if (printWin) { printWin.document.write(html); printWin.document.close(); setTimeout(() => printWin.print(), 500); }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="flex items-center gap-2 text-sm font-bold text-gray-600 hover:text-gray-800 transition-colors">
          <ChevronDown size={16} className="rotate-90" /> Volver a semanas
        </button>
        <div className="flex items-center gap-2">
          <button onClick={exportPDF} className="bg-gray-800 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-900 transition-all">
            <Download size={14} /> PDF
          </button>
          <button onClick={() => setShowPayModal(true)} className="bg-amber-600 text-white px-4 py-2 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-amber-700 shadow-md transition-all">
            <Plus size={16} /> Agregar Trabajador
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-3">
        <div className="light-card p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Total a Pagar</p>
          <p className="text-lg font-black font-mono text-gray-800">{formatARS(total)}</p>
        </div>
        <div className="light-card p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Pagados</p>
          <p className="text-lg font-black text-emerald-700">{pagados} <span className="text-sm text-gray-400">/ {workerItems.length}</span></p>
        </div>
        <div className="light-card p-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Pendientes</p>
          <p className="text-lg font-black text-red-600">{workerItems.length - pagados}</p>
        </div>
      </div>

      {/* Items Table */}
      <div className="light-card overflow-hidden">
        {isLoading ? (
          <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>
        ) : workerItems.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Users size={48} className="mx-auto text-gray-300 mb-3" />
            <p className="font-bold text-gray-500">Sin pagos registrados en esta semana</p>
            <p className="text-xs mt-1">Usá "Agregar Trabajador" para registrar un pago.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-800 text-white">
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold w-12">N°</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Trabajador</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Alias / CBU</th>
                  <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold">Monto</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Estado</th>
                  <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Observación</th>
                  <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold w-20">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {workerItems.map((item: any, i: number) => (
                  <tr key={item.id} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${item.pagado ? 'bg-emerald-50/30' : ''}`}>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-500 font-mono">{i + 1}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-amber-800 text-[10px] font-bold shrink-0">
                          {(item.titular_cuenta || '?').charAt(0)}
                        </div>
                        <span className="font-bold text-xs text-gray-800 uppercase">{item.titular_cuenta}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 text-center text-xs text-gray-600 font-mono">{item.alias_cbu || '—'}</td>
                    <td className="px-3 py-2.5 text-right font-bold font-mono text-gray-800">{formatARS(Number(item.monto || 0))}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => togglePagado(item)}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full cursor-pointer transition-all ${
                          item.pagado ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-red-100 text-red-700 hover:bg-red-200'
                        }`}>
                        {item.pagado ? '✓ Pagado' : 'Pendiente'}
                      </button>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-gray-500">{item.observaciones || '—'}</td>
                    <td className="px-3 py-2.5 text-center">
                      <button onClick={() => handleDelete(item)} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-800 text-white font-bold">
                  <td className="px-3 py-3" colSpan={3}>
                    <span className="text-sm uppercase">Total</span>
                    <span className="text-xs text-slate-400 ml-2">({workerItems.length} trabajadores)</span>
                  </td>
                  <td className="px-3 py-3 text-right font-mono font-black text-sm">{formatARS(total)}</td>
                  <td className="px-3 py-3 text-center text-xs">
                    <span className="text-emerald-400">{pagados}</span>
                    <span className="text-slate-500"> / </span>
                    <span className="text-slate-300">{workerItems.length}</span>
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showPayModal && (
        <PayWorkerModal
          paymentId={paymentId}
          currentItemsCount={workerItems.length}
          onClose={() => setShowPayModal(false)}
          onSuccess={() => setShowPayModal(false)}
        />
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// INLINE EDITABLE CELL
// ═══════════════════════════════════════════════════════════════════
const EditableCell: React.FC<{
  value: string; field: string; employeeId: string; updateEmployee: any; className?: string; isMono?: boolean;
}> = ({ value, field, employeeId, updateEmployee, className = '', isMono = false }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  const handleSave = () => {
    if (editValue !== (value || '')) updateEmployee.mutate({ id: employeeId, [field]: editValue || null });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') { setEditValue(value || ''); setEditing(false); }
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1">
        <input value={editValue} onChange={e => setEditValue(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleSave} autoFocus
          className={`w-full px-2 py-1 border border-amber-300 rounded-lg text-xs bg-amber-50 focus:ring-2 ring-amber-200 ${isMono ? 'font-mono' : ''}`} />
      </div>
    );
  }

  return (
    <div className={`group/cell cursor-pointer hover:bg-amber-50 rounded px-1 py-0.5 transition-colors flex items-center gap-1 ${className}`}
      onClick={() => { setEditValue(value || ''); setEditing(true); }} title="Clic para editar">
      <span className={`${isMono ? 'font-mono' : ''} ${!value ? 'text-gray-300 italic' : ''}`}>{value || 'Sin dato'}</span>
      <Edit2 size={10} className="text-gray-300 opacity-0 group-hover/cell:opacity-100 transition-opacity shrink-0" />
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
export const WorkerPaymentsModule: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const updateEmployee = useUpdateEmployee();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'terminated'>('all');
  const [sortField, setSortField] = useState<'name' | 'monto'>('name');
  const [sortAsc, setSortAsc] = useState(true);
  const [activeTab, setActiveTab] = useState<'tabla' | 'pagos' | 'metricas'>('tabla');

  const filtered = useMemo(() => {
    let list = employees.filter(emp => {
      if (statusFilter !== 'all' && emp.employment_status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (emp.full_name || '').toLowerCase().includes(q) || (emp.cuil || '').includes(q) || (emp.bank_alias_cbu || '').toLowerCase().includes(q);
      }
      return true;
    });
    list.sort((a, b) => {
      if (sortField === 'name') { const cmp = (a.full_name || '').localeCompare(b.full_name || ''); return sortAsc ? cmp : -cmp; }
      const cmp = (Number(a.retribucion_pactada) || 0) - (Number(b.retribucion_pactada) || 0);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [employees, search, statusFilter, sortField, sortAsc]);

  const totalMonto = filtered.reduce((s, e) => s + (Number(e.retribucion_pactada) || 0), 0);

  const toggleSort = (field: 'name' | 'monto') => {
    if (sortField === field) setSortAsc(!sortAsc);
    else { setSortField(field); setSortAsc(true); }
  };

  const SortIcon = ({ field }: { field: 'name' | 'monto' }) => {
    if (sortField !== field) return <ChevronDown size={12} className="text-white/40" />;
    return sortAsc ? <ChevronUp size={12} className="text-white" /> : <ChevronDown size={12} className="text-white" />;
  };

  const statusLabel = (status: string) => {
    switch (status) {
      case 'active': return { text: 'Activo', cls: 'bg-emerald-100 text-emerald-700' };
      case 'suspended': return { text: 'Suspendido', cls: 'bg-amber-100 text-amber-700' };
      case 'terminated': return { text: 'Desvinculado', cls: 'bg-red-100 text-red-700' };
      default: return { text: status, cls: 'bg-gray-100 text-gray-600' };
    }
  };

  const exportPDF = () => {
    let html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Maestro de Trabajadores</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; font-size: 11px; padding: 30px; }
      h1 { text-align: center; font-size: 18px; margin-bottom: 20px; text-decoration: underline; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #333; padding: 5px 8px; }
      th { background: #1a365d; color: white; text-align: center; font-size: 10px; text-transform: uppercase; }
      td { font-size: 10px; }
      .right { text-align: right; } .center { text-align: center; } .bold { font-weight: bold; }
      .total-row td { background: #e2e8f0; font-weight: bold; font-size: 11px; }
    </style></head><body>
    <h1>MAESTRO DE TRABAJADORES — DATOS BANCARIOS</h1><table><thead><tr>
      <th>N°</th><th>Apellido y Nombre</th><th>Alias / CBU</th><th>Titular</th><th>Monto Ref.</th><th>Estado</th><th>Obs.</th>
    </tr></thead><tbody>`;
    filtered.forEach((emp, i) => {
      const st = statusLabel(emp.employment_status);
      html += `<tr><td class="center">${i + 1}</td><td class="bold">${(emp.full_name || '').toUpperCase()}</td><td class="center">${emp.bank_alias_cbu || ''}</td><td class="center">${(emp.full_name || '').toUpperCase()}</td><td class="right bold">${Number(emp.retribucion_pactada) ? formatARS(Number(emp.retribucion_pactada)) : ''}</td><td class="center">${st.text}</td><td>${emp.observations || ''}</td></tr>`;
    });
    html += `<tr class="total-row"><td colspan="4">TOTAL</td><td class="right">${formatARS(totalMonto)}</td><td colspan="2"></td></tr></tbody></table></body></html>`;
    const w = window.open('', '_blank');
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 500); }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-700 via-amber-800 to-slate-800 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><HardHat size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><HardHat size={24} /> Pagos a Trabajadores</h3>
          <p className="text-amber-200 text-sm mt-1">Maestro editable, gestión de pagos semanales y métricas</p>
        </div>
      </div>

      {/* Tab Switch */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 w-fit">
        <button onClick={() => setActiveTab('tabla')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'tabla' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <TableProperties size={15} /> Maestro
        </button>
        <button onClick={() => setActiveTab('pagos')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'pagos' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <Banknote size={15} /> Gestión de Pagos
        </button>
        <button onClick={() => setActiveTab('metricas')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'metricas' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
          <BarChart3 size={15} /> Métricas
        </button>
      </div>

      {activeTab === 'metricas' ? <MetricsPanel /> : activeTab === 'pagos' ? <PaymentManagementTab /> : (
        <>
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex-1 min-w-[220px] relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, CUIL o alias..."
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all" />
            </div>
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 focus:bg-white focus:ring-2 ring-amber-200 transition-all font-medium">
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="suspended">Suspendidos</option>
              <option value="terminated">Desvinculados</option>
            </select>
            <button onClick={exportPDF} className="bg-gray-800 text-white px-4 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-gray-900 shadow-md transition-all">
              <Download size={14} /> Exportar PDF
            </button>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 flex items-center justify-between gap-2 text-xs text-amber-800">
            <div className="flex items-center gap-2">
              <Edit2 size={13} className="shrink-0" />
              <span><strong>Edición inline:</strong> Hacé clic en cualquier celda de Alias/CBU, Monto u Observación para editar.</span>
            </div>
            <div className="flex items-center gap-1.5 font-bold text-amber-900 bg-amber-100/70 px-2.5 py-1 rounded-md border border-amber-200 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Sincronizado en tiempo real con RRHH / Legajos
            </div>
          </div>

          {/* Table */}
          <div className="light-card overflow-hidden">
            {isLoading ? (
              <div className="text-center py-16"><div className="w-8 h-8 border-3 border-gray-200 border-t-amber-600 rounded-full animate-spin mx-auto" /></div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
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
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold cursor-pointer select-none hover:bg-slate-700 transition-colors" onClick={() => toggleSort('name')}>
                        <span className="flex items-center gap-1">Apellido y Nombre <SortIcon field="name" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Alias / CBU</th>
                      <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Titular Cuenta</th>
                      <th className="px-3 py-2.5 text-right text-[10px] uppercase tracking-wider font-bold cursor-pointer select-none hover:bg-slate-700 transition-colors" onClick={() => toggleSort('monto')}>
                        <span className="flex items-center justify-end gap-1">Monto Referencia <SortIcon field="monto" /></span>
                      </th>
                      <th className="px-3 py-2.5 text-center text-[10px] uppercase tracking-wider font-bold">Estado</th>
                      <th className="px-3 py-2.5 text-left text-[10px] uppercase tracking-wider font-bold">Observación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((emp, i) => {
                      const st = statusLabel(emp.employment_status);
                      return (
                        <tr key={emp.id} className={`hover:bg-gray-50 transition-colors border-b border-gray-100 ${emp.employment_status !== 'active' ? 'opacity-60' : ''}`}>
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
                          <td className="px-3 py-2.5 text-center text-xs text-gray-700">
                            <EditableCell value={emp.bank_alias_cbu || ''} field="bank_alias_cbu" employeeId={emp.id} updateEmployee={updateEmployee} isMono />
                          </td>
                          <td className="px-3 py-2.5 text-center text-xs text-gray-600 uppercase">{emp.full_name}</td>
                          <td className="px-3 py-2.5 text-right text-gray-900">
                            <EditableCell value={emp.retribucion_pactada ? String(emp.retribucion_pactada) : ''} field="retribucion_pactada" employeeId={emp.id} updateEmployee={updateEmployee} isMono className="justify-end font-bold" />
                          </td>
                          <td className="px-3 py-2.5 text-center">
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${st.cls}`}>{st.text}</span>
                          </td>
                          <td className="px-3 py-2.5 text-xs text-gray-500 max-w-[200px]">
                            <EditableCell value={emp.observations || ''} field="observations" employeeId={emp.id} updateEmployee={updateEmployee} />
                          </td>
                        </tr>
                      );
                    })}
                    <tr className="bg-slate-800 text-white font-bold">
                      <td className="px-3 py-3" colSpan={4}>
                        <span className="text-sm uppercase">Total</span>
                        <span className="text-xs text-slate-400 ml-2">({filtered.length} trabajadores)</span>
                      </td>
                      <td className="px-3 py-3 text-right font-mono font-black text-sm">{formatARS(totalMonto)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};
