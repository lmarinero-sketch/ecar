import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet, Download, Calendar, Users, Clock,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  ChevronLeft, ChevronRight, Briefcase, UserPlus, UserMinus,
  Printer
} from 'lucide-react';
import { useEmployees, useAttendance } from '../hooks/useData';

type NovedadType = 'alta' | 'baja' | 'cambio_categoria' | 'asistencia_perfecta' | 'ausencia' | 'tardanza' | 'vacaciones' | 'medico';

interface NovedadItem {
  type: NovedadType;
  employee: string;
  category?: string;
  detail: string;
  date?: string;
}

export const AccountantNovedadesPanel: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth());
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [filterType, setFilterType] = useState<'all' | 'asistencia' | 'novedades'>('all');

  const { data: employees = [] } = useEmployees();
  const activeEmployees = employees.filter(e => e.employment_status === 'active');

  // Calculate date range for the selected month
  const startDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-01`;
  const lastDay = new Date(selectedYear, selectedMonth + 1, 0).getDate();
  const endDate = `${selectedYear}-${String(selectedMonth + 1).padStart(2, '0')}-${lastDay}`;

  const { data: attendanceRecords = [], isLoading } = useAttendance(startDate, endDate);

  const monthName = new Date(selectedYear, selectedMonth).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });

  const changeMonth = (delta: number) => {
    let m = selectedMonth + delta;
    let y = selectedYear;
    if (m < 0) { m = 11; y--; }
    if (m > 11) { m = 0; y++; }
    setSelectedMonth(m);
    setSelectedYear(y);
  };

  // ---------- COMPUTE ATTENDANCE SUMMARY PER EMPLOYEE ----------
  const employeeSummaries = useMemo(() => {
    const workingDaysInMonth = getWorkingDays(selectedYear, selectedMonth);

    return activeEmployees.map(emp => {
      const records = attendanceRecords.filter(r => r.employee_id === emp.id);
      const daysPresent = records.filter(r => r.status === 'present' || r.status === 'late').length;
      const daysLate = records.filter(r => r.status === 'late').length;
      const daysAbsent = records.filter(r => r.status === 'absent').length;
      const daysVacation = records.filter(r => r.status === 'vacation').length;
      const daysMedical = records.filter(r => r.status === 'medical').length;
      const daysHalfDay = records.filter(r => r.status === 'half_day').length;

      const totalWorkedHours = records.reduce((sum, r) => {
        if (r.clock_in && r.clock_out) {
          const [inH, inM] = r.clock_in.split(':').map(Number);
          const [outH, outM] = r.clock_out.split(':').map(Number);
          return sum + ((outH * 60 + outM) - (inH * 60 + inM)) / 60;
        }
        return sum + (r.worked_hours || 0);
      }, 0);

      const overtimeHours = records.reduce((sum, r) => sum + (r.overtime_hours || 0), 0);
      const isPerfect = daysPresent >= workingDaysInMonth && daysLate === 0 && daysAbsent === 0;

      return {
        employee: emp,
        daysPresent,
        daysLate,
        daysAbsent,
        daysVacation,
        daysMedical,
        daysHalfDay,
        totalWorkedHours: Math.round(totalWorkedHours * 10) / 10,
        overtimeHours: Math.round(overtimeHours * 10) / 10,
        isPerfect,
        workingDaysInMonth,
        dailyRate: (emp.category as any)?.daily_rate_ars || 0,
        categoryName: (emp.category as any)?.name || 'Sin categoría',
      };
    });
  }, [activeEmployees, attendanceRecords, selectedYear, selectedMonth]);

  // ---------- COMPUTE NOVEDADES ----------
  const novedades = useMemo((): NovedadItem[] => {
    const items: NovedadItem[] = [];

    // Altas del mes
    employees
      .filter(e => e.hire_date && e.hire_date >= startDate && e.hire_date <= endDate)
      .forEach(e => {
        items.push({
          type: 'alta',
          employee: e.full_name,
          category: (e.category as any)?.name,
          detail: `Ingreso: ${e.hire_date}. CUIL: ${e.cuil || 'Pendiente'}`,
          date: e.hire_date!,
        });
      });

    // Bajas del mes
    employees
      .filter(e => e.termination_date && e.termination_date >= startDate && e.termination_date <= endDate)
      .forEach(e => {
        items.push({
          type: 'baja',
          employee: e.full_name,
          detail: `Baja: ${e.termination_date}. Motivo: ${e.termination_reason || 'No especificado'}`,
          date: e.termination_date!,
        });
      });

    // Asistencia perfecta
    employeeSummaries
      .filter(s => s.isPerfect && s.daysPresent > 0)
      .forEach(s => {
        items.push({
          type: 'asistencia_perfecta',
          employee: s.employee.full_name,
          category: s.categoryName,
          detail: `${s.daysPresent} días, ${s.totalWorkedHours}hs totales. Sin faltas ni tardanzas.`,
        });
      });

    // Ausencias
    employeeSummaries
      .filter(s => s.daysAbsent > 0)
      .forEach(s => {
        items.push({
          type: 'ausencia',
          employee: s.employee.full_name,
          category: s.categoryName,
          detail: `${s.daysAbsent} día(s) de ausencia en el mes.`,
        });
      });

    // Tardanzas
    employeeSummaries
      .filter(s => s.daysLate > 0)
      .forEach(s => {
        items.push({
          type: 'tardanza',
          employee: s.employee.full_name,
          category: s.categoryName,
          detail: `${s.daysLate} día(s) con tardanza.`,
        });
      });

    // Vacaciones
    employeeSummaries
      .filter(s => s.daysVacation > 0)
      .forEach(s => {
        items.push({
          type: 'vacaciones',
          employee: s.employee.full_name,
          detail: `${s.daysVacation} día(s) de vacaciones.`,
        });
      });

    // Licencia médica
    employeeSummaries
      .filter(s => s.daysMedical > 0)
      .forEach(s => {
        items.push({
          type: 'medico',
          employee: s.employee.full_name,
          detail: `${s.daysMedical} día(s) de licencia médica.`,
        });
      });

    return items;
  }, [employees, employeeSummaries, startDate, endDate]);

  // ---------- AGGREGATE STATS ----------
  const stats = useMemo(() => {
    const totalPresent = employeeSummaries.reduce((s, e) => s + e.daysPresent, 0);
    const totalAbsent = employeeSummaries.reduce((s, e) => s + e.daysAbsent, 0);
    const totalLate = employeeSummaries.reduce((s, e) => s + e.daysLate, 0);
    const totalHours = employeeSummaries.reduce((s, e) => s + e.totalWorkedHours, 0);
    const totalOvertime = employeeSummaries.reduce((s, e) => s + e.overtimeHours, 0);
    const perfectCount = employeeSummaries.filter(s => s.isPerfect && s.daysPresent > 0).length;
    return { totalPresent, totalAbsent, totalLate, totalHours: Math.round(totalHours), totalOvertime: Math.round(totalOvertime), perfectCount };
  }, [employeeSummaries]);

  // ---------- FILTER NOVEDADES ----------
  const filteredNovedades = filterType === 'all' ? novedades
    : filterType === 'novedades' ? novedades.filter(n => n.type === 'alta' || n.type === 'baja' || n.type === 'cambio_categoria')
    : novedades.filter(n => n.type !== 'alta' && n.type !== 'baja' && n.type !== 'cambio_categoria');

  // ---------- EXPORT CSV ----------
  const handleExportCSV = () => {
    const headers = ['Empleado', 'CUIL', 'Categoría', 'Días Presentes', 'Tardanzas', 'Ausencias', 'Vacaciones', 'Médico', 'Hs Trabajadas', 'Hs Extra', 'Jornal Diario', 'Asistencia Perfecta'];
    const rows = employeeSummaries.map(s => [
      s.employee.full_name,
      s.employee.cuil || '',
      s.categoryName,
      s.daysPresent,
      s.daysLate,
      s.daysAbsent,
      s.daysVacation,
      s.daysMedical,
      s.totalWorkedHours,
      s.overtimeHours,
      s.dailyRate,
      s.isPerfect ? 'SÍ' : 'NO',
    ]);

    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `novedades_contador_${selectedYear}_${String(selectedMonth + 1).padStart(2, '0')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const novedadConfig: Record<NovedadType, { label: string; icon: React.ReactNode; classes: string }> = {
    alta: { label: 'Alta', icon: <UserPlus size={14} />, classes: 'bg-green-100 text-green-700' },
    baja: { label: 'Baja', icon: <UserMinus size={14} />, classes: 'bg-red-100 text-red-700' },
    cambio_categoria: { label: 'Cambio Cat.', icon: <Briefcase size={14} />, classes: 'bg-ecar-blueLight text-ecar-blue' },
    asistencia_perfecta: { label: 'Asist. Perfecta', icon: <CheckCircle2 size={14} />, classes: 'bg-emerald-100 text-emerald-700' },
    ausencia: { label: 'Ausencia', icon: <XCircle size={14} />, classes: 'bg-red-100 text-red-700' },
    tardanza: { label: 'Tardanza', icon: <AlertTriangle size={14} />, classes: 'bg-yellow-100 text-yellow-700' },
    vacaciones: { label: 'Vacaciones', icon: <Calendar size={14} />, classes: 'bg-blue-100 text-blue-700' },
    medico: { label: 'Médico', icon: <Clock size={14} />, classes: 'bg-ecar-blueLight text-ecar-blue' },
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Month Picker + Actions */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        {/* Month Picker */}
        <div className="flex items-center gap-2">
          <button onClick={() => changeMonth(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-ecar-blue" />
            <span className="text-sm font-bold text-gray-900 capitalize">{monthName}</span>
          </div>
          <button onClick={() => changeMonth(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-gray-700 font-bold text-sm hover:bg-gray-50 transition-all"
          >
            <Printer size={16} /> Imprimir
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold text-sm hover:bg-emerald-700 transition-all shadow-md"
          >
            <Download size={16} /> Exportar CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard icon={<Users size={18} />} label="En Nómina" value={activeEmployees.length} color="indigo" />
        <KPICard icon={<CheckCircle2 size={18} />} label="Días Presentes" value={stats.totalPresent} color="green" />
        <KPICard icon={<XCircle size={18} />} label="Ausencias" value={stats.totalAbsent} color="red" />
        <KPICard icon={<AlertTriangle size={18} />} label="Tardanzas" value={stats.totalLate} color="yellow" />
        <KPICard icon={<Clock size={18} />} label="Hs Trabajadas" value={stats.totalHours} suffix="hs" color="blue" />
        <KPICard icon={<TrendingUp size={18} />} label="Asist. Perfecta" value={stats.perfectCount} color="emerald" />
      </div>

      {/* Novedades List */}
      <div className="light-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <FileSpreadsheet size={16} className="text-ecar-blue" />
            Novedades del Mes — <span className="capitalize">{monthName}</span>
          </h4>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            {([
              { id: 'all', label: 'Todas' },
              { id: 'asistencia', label: 'Asistencia' },
              { id: 'novedades', label: 'Altas/Bajas' },
            ] as const).map(f => (
              <button
                key={f.id}
                onClick={() => setFilterType(f.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-bold transition-all ${filterType === f.id ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando datos de asistencia...</div>
        ) : filteredNovedades.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <FileSpreadsheet size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Sin novedades para este período</p>
            <p className="text-sm mt-1">Los datos aparecerán cuando haya registros de asistencia.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredNovedades.map((nov, i) => {
              const cfg = novedadConfig[nov.type];
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-3.5 hover:bg-gray-50 transition-colors">
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold shrink-0 ${cfg.classes}`}>
                    {cfg.icon} {cfg.label}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{nov.employee}</p>
                    <p className="text-xs text-gray-500 truncate">{nov.detail}</p>
                  </div>
                  {nov.category && (
                    <span className="text-xs text-gray-400 font-medium hidden md:block">{nov.category}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detailed Attendance Table */}
      <div className="light-card overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 bg-gray-50">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Users size={16} className="text-ecar-blue" />
            Resumen de Asistencia por Empleado
          </h4>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Cargando...</div>
        ) : employeeSummaries.length === 0 ? (
          <div className="text-center py-12 text-gray-400 text-sm">Sin empleados activos.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                <tr>
                  <th className="px-4 py-3">Empleado</th>
                  <th className="px-4 py-3">CUIL</th>
                  <th className="px-4 py-3">Categoría</th>
                  <th className="px-4 py-3 text-center">Presentes</th>
                  <th className="px-4 py-3 text-center">Tard.</th>
                  <th className="px-4 py-3 text-center">Ausenc.</th>
                  <th className="px-4 py-3 text-center">Vac.</th>
                  <th className="px-4 py-3 text-center">Méd.</th>
                  <th className="px-4 py-3 text-right">Hs Trab.</th>
                  <th className="px-4 py-3 text-right">Hs Extra</th>
                  <th className="px-4 py-3 text-right">Jornal</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employeeSummaries.map(s => (
                  <tr key={s.employee.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-xs shrink-0">
                          {s.employee.full_name.charAt(0)}
                        </div>
                        <span className="font-bold text-gray-900">{s.employee.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{s.employee.cuil || '—'}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{s.categoryName}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="font-mono font-bold text-green-700">{s.daysPresent}</span>
                      <span className="text-gray-400 text-xs">/{s.workingDaysInMonth}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.daysLate > 0 ? (
                        <span className="font-mono font-bold text-yellow-700">{s.daysLate}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.daysAbsent > 0 ? (
                        <span className="font-mono font-bold text-red-700">{s.daysAbsent}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.daysVacation > 0 ? (
                        <span className="font-mono font-bold text-blue-700">{s.daysVacation}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.daysMedical > 0 ? (
                        <span className="font-mono font-bold text-ecar-blue">{s.daysMedical}</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold text-gray-800">{s.totalWorkedHours}h</td>
                    <td className="px-4 py-3 text-right">
                      {s.overtimeHours > 0 ? (
                        <span className="font-mono font-bold text-ecar-blue">{s.overtimeHours}h</span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-gray-600">
                      {s.dailyRate > 0 ? `$ ${s.dailyRate.toLocaleString('es-AR')}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {s.isPerfect && s.daysPresent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">✓ Perfecta</span>
                      ) : s.daysAbsent > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">Ausencias</span>
                      ) : s.daysPresent === 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-500">Sin datos</span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-700">Irregular</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Helpers ───

function getWorkingDays(year: number, month: number): number {
  let count = 0;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let d = 1; d <= daysInMonth; d++) {
    const day = new Date(year, month, d).getDay();
    if (day !== 0 && day !== 6) count++; // Exclude weekends
  }
  return count;
}

// ─── KPI Card ───
const KPICard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: number;
  suffix?: string;
  color: string;
}> = ({ icon, label, value, suffix, color }) => {
  const colors: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    indigo: { bg: 'bg-slate-50', text: 'text-ecar-blue', iconBg: 'bg-ecar-blueLight', border: 'border-ecar-blueLight' },
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', border: 'border-green-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', border: 'border-red-200' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', iconBg: 'bg-yellow-100', border: 'border-yellow-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', border: 'border-blue-200' },
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700', iconBg: 'bg-emerald-100', border: 'border-emerald-200' },
  };
  const c = colors[color] || colors.indigo;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className={`p-1.5 rounded-lg ${c.iconBg} ${c.text} w-fit mb-2`}>{icon}</div>
      <p className={`text-xl font-black ${c.text} font-mono`}>
        {value}{suffix && <span className="text-sm font-bold ml-0.5">{suffix}</span>}
      </p>
      <p className="text-xs font-bold text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};
