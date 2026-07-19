import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { QRCodeSVG } from 'qrcode.react';
import { useImplementationStore } from '../store/useImplementationStore';
import {
  Clock, Users, QrCode, Monitor, CheckCircle2, XCircle, AlertTriangle,
  Calendar, ChevronLeft, ChevronRight, Maximize2, Minimize2, RefreshCw,
  ArrowDownRight, ArrowUpRight, Coffee, UserCheck, Timer, Smartphone, Globe, ScreenShare, Pencil, Check, X, LogOut
} from 'lucide-react';
import { generateQRToken, getTimeRemaining, buildCheckInUrl } from '../lib/qrToken';
import { useEmployees, useAttendance, useUpdateAttendance, useBulkCheckout } from '../hooks/useData';
import { useModalStore } from '../store/useModalStore';

type ViewMode = 'dashboard' | 'qr_display';

export const AttendancePanel: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('dashboard');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [qrData, setQrData] = useState(generateQRToken());
  const [timeLeft, setTimeLeft] = useState(getTimeRemaining());
  const [now, setNow] = useState(new Date());

  const { data: employees = [] } = useEmployees();
  const activeEmployees = employees.filter(e => e.employment_status === 'active');
  const { data: attendanceRecords = [], isLoading, refetch } = useAttendance(selectedDate, selectedDate);
  const updateAttendance = useUpdateAttendance();
  const bulkCheckout = useBulkCheckout();

  const [editingRow, setEditingRow] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ clock_in: '', clock_out: '' });

  const handleBulkCheckout = async () => {
    try {
      const confirmed = await useModalStore.getState().showConfirm('Confirmar Acción', '¿Marcar salida para todos los presentes sin hora de salida?');
      if (!confirmed) return;
      const nowT = new Date().toTimeString().slice(0, 5); // Format HH:MM safely
      const presentIds = attendanceRecords.filter(r => r.clock_in && !r.clock_out).map(r => r.id);
      if (presentIds.length > 0) {
        await bulkCheckout.mutateAsync({ date: selectedDate, checkoutTime: nowT, ids: presentIds });
        useModalStore.getState().showAlert('Éxito', 'Se marcó la salida para todos.');
      } else {
        useModalStore.getState().showAlert('Aviso', 'No hay empleados con salida pendiente.');
      }
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err.message);
    }
  };

  // Auto-refresh QR token & countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setQrData(generateQRToken());
      setTimeLeft(getTimeRemaining());
      setNow(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-refresh attendance data every 30s
  useEffect(() => {
    const interval = setInterval(() => refetch(), 30000);
    return () => clearInterval(interval);
  }, [refetch]);

  const qrUrl = buildCheckInUrl(qrData.token);

  // Stats
  const stats = useMemo(() => {
    const present = attendanceRecords.filter(r => r.clock_in && r.status !== 'absent').length;
    const late = attendanceRecords.filter(r => r.clock_in && formatTime(r.clock_in) > '07:30').length;
    const absent = activeEmployees.length - present;
    const checkedOut = attendanceRecords.filter(r => r.clock_out).length;
    return { present, late, absent: Math.max(0, absent), checkedOut, total: activeEmployees.length };
  }, [attendanceRecords, activeEmployees]);

  const isToday = selectedDate === new Date().toISOString().split('T')[0];

  const changeDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  const progressPct = stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0;

  // ---------- FULLSCREEN QR MODE ----------
  if (viewMode === 'qr_display') {
    return createPortal(
      <div className="fixed inset-0 z-[9999] bg-ecar-blueDark flex flex-col items-center justify-center overflow-hidden">
        {/* Exit button */}
        <button
          onClick={() => setViewMode('dashboard')}
          className="absolute top-6 right-6 z-50 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/10 border border-white/20 text-blue-100 hover:text-white hover:bg-white/20 transition-all text-sm font-bold"
        >
          <Minimize2 size={16} /> Cerrar Pantalla QR
        </button>

        <div className="relative z-10 text-center space-y-8">
          {/* Title */}
          <div>
            <h1 className="text-4xl font-black text-white tracking-tight">FICHAR ASISTENCIA</h1>
            <p className="text-blue-200 text-lg mt-2">Escaneá el código QR con tu celular</p>
          </div>

          {/* QR Code */}
          <div className="relative inline-block">
            <div className="bg-white rounded-2xl p-8 shadow-2xl">
              <QRCodeSVG
                value={qrUrl}
                size={320}
                level="M"
                bgColor="#FFFFFF"
                fgColor="#0B477D"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Timer */}
          <div className="space-y-3">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/10 border border-white/20">
              <Timer size={20} className="text-blue-200" />
              <span className="text-white font-mono text-2xl font-black tracking-widest">
                {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
              </span>
              <span className="text-blue-300 text-sm">para renovación</span>
            </div>
            {timeLeft.totalSeconds < 60 && (
              <p className="text-yellow-300 text-sm font-bold animate-pulse">⚡ El QR se renueva en segundos...</p>
            )}
          </div>

          {/* Live stats */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/20">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-green-200 font-bold">{stats.present} fichados</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <Users size={14} className="text-blue-300" />
              <span className="text-blue-200">{stats.total} en nómina</span>
            </div>
          </div>

          {/* Current time */}
          <p className="text-blue-300/60 font-mono text-sm">
            {now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} ·{' '}
            {now.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>

        {/* Footer */}
        <div className="absolute bottom-6 text-center">
          <p className="text-xs text-blue-300/40 font-medium tracking-[0.2em]">ECAR · SISTEMA CREADO POR GROW LABS</p>
        </div>
      </div>,
      document.body
    );
  }

  // ---------- DASHBOARD MODE ----------
  return (
    <div className="flex flex-col h-[calc(100vh-140px)] gap-4">
      {/* Top Actions Row */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between shrink-0">
        {/* Date Picker */}
        <div className="flex items-center gap-2">
          <button onClick={() => changeDate(-1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronLeft size={16} className="text-gray-600" />
          </button>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 shadow-sm">
            <Calendar size={16} className="text-ecar-blue" />
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="text-sm font-bold text-gray-900 border-none outline-none bg-transparent"
            />
            {isToday && (
              <span className="badge badge-success">HOY</span>
            )}
          </div>
          <button onClick={() => changeDate(1)} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <ChevronRight size={16} className="text-gray-600" />
          </button>
          <button onClick={() => refetch()} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors ml-1" title="Refrescar">
            <RefreshCw size={16} className={`text-gray-600 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* QR Button */}
        {isToday && (
          <div className="flex gap-2">
            <button
              onClick={handleBulkCheckout}
              className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg font-bold text-sm shadow-md hover:bg-amber-600 transition-all"
            >
              <LogOut size={18} />
              Retirar a Todos
            </button>
            <button
              onClick={() => {
                setViewMode('qr_display');
                useImplementationStore.getState().completeItem('e2-29');
              }}
              className="flex items-center gap-2 px-5 py-2.5 bg-ecar-blue text-white rounded-lg font-bold text-sm shadow-md hover:bg-ecar-blueDark hover:shadow-lg transition-all"
            >
              <Monitor size={18} />
              Mostrar QR en Pantalla
            </button>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 shrink-0">
        <StatCard icon={<UserCheck size={20} />} label="Presentes" value={stats.present} total={stats.total} color="green" pct={progressPct} />
        <StatCard icon={<AlertTriangle size={20} />} label="Tardanzas" value={stats.late} color="yellow" />
        <StatCard icon={<XCircle size={20} />} label="Ausentes" value={stats.absent} color="red" />
        <StatCard icon={<ArrowUpRight size={20} />} label="Ficharon Salida" value={stats.checkedOut} total={stats.present} color="blue" />
      </div>

      {/* QR Preview Mini (Today only) */}
      {isToday && (
        <div className="bg-ecar-blueDark rounded-xl p-5 flex items-center gap-6 shadow-lg">
          <div className="bg-white rounded-xl p-3 shrink-0 shadow-md">
            <QRCodeSVG value={qrUrl} size={80} level="M" bgColor="#FFFFFF" fgColor="#0B477D" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-bold text-sm flex items-center gap-2">
              <QrCode size={16} className="text-blue-200" />
              QR Dinámico Activo
            </h4>
            <p className="text-blue-200 text-xs mt-1">
              Se renueva automáticamente cada 10 minutos. Mostralo en un monitor o tablet en la obra.
            </p>
            <div className="flex items-center gap-4 mt-3">
              <div className="flex items-center gap-1.5 text-xs">
                <Timer size={12} className="text-blue-200" />
                <span className="font-mono font-bold text-white">
                  {String(timeLeft.minutes).padStart(2, '0')}:{String(timeLeft.seconds).padStart(2, '0')}
                </span>
                <span className="text-blue-300">restante</span>
              </div>
              <div className="w-px h-4 bg-white/10" />
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs text-green-300 font-bold">EN VIVO</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setViewMode('qr_display');
              useImplementationStore.getState().completeItem('e2-29');
            }}
            className="shrink-0 p-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 transition-all text-blue-200 hover:text-white"
            title="Pantalla completa"
          >
            <Maximize2 size={20} />
          </button>
        </div>
      )}

      {/* Main content (Table) */}
      <div className="bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
        {/* Table header */}
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 shrink-0">
          <h4 className="font-bold text-gray-800 flex items-center gap-2">
            <Clock size={16} className="text-ecar-blue" />
            Registro de Asistencia — {new Date(selectedDate + 'T12:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </h4>
          <span className="text-xs text-gray-400 font-mono">{attendanceRecords.length} registros</span>
        </div>

        {isLoading ? (
          <div className="text-center py-12 text-gray-400">
            <RefreshCw size={24} className="mx-auto mb-2 animate-spin" />
            <p className="text-sm">Cargando registros...</p>
          </div>
        ) : attendanceRecords.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <Calendar size={48} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium">Sin registros para esta fecha</p>
            {isToday && <p className="text-sm mt-1">Los fichajes aparecerán aquí en tiempo real</p>}
          </div>
        ) : (
          /* Table wrapper */
          <div className="overflow-auto flex-1">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  <th className="text-left">Empleado</th>
                  <th className="text-center">Entrada</th>
                  <th className="text-center">Salida</th>
                  <th className="text-center">Hs. Trabajadas</th>
                  <th className="text-center">Estado</th>
                  <th className="text-center">Fuente</th>
                  <th className="text-center">Dispositivo</th>
                  <th className="text-center"></th>
                </tr>
              </thead>
              <tbody>
                {attendanceRecords.map(record => {
                  const emp = record.employee;
                  const isLate = record.clock_in && formatTime(record.clock_in) > '07:30';
                  const effectiveStatus = isLate ? 'late' : record.status;
                  const statusConfig = getStatusConfig(effectiveStatus);
                  const workedStr = record.clock_in && record.clock_out
                    ? calculateWorkedHours(record.clock_in, record.clock_out)
                    : record.clock_in ? 'En obra...' : '—';

                  // Extract device info from metadata
                  const meta = record.metadata as Record<string, any> | null;
                  const deviceIn = meta?.device_in as Record<string, any> | undefined;
                  const deviceOut = meta?.device_out as Record<string, any> | undefined;
                  const deviceInfo = deviceOut || deviceIn;

                  return (
                    <tr key={record.id} className="hover:bg-gray-50 transition-colors group">
                      <td >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-xs shrink-0">
                            {(emp as any)?.full_name?.charAt(0) || '?'}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{(emp as any)?.full_name || 'Empleado'}</p>
                            <p className="text-xs text-gray-400 font-mono">{(emp as any)?.cuil || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        {editingRow === record.id ? (
                          <input type="time" className="border rounded px-2 py-1 text-xs text-center w-24" value={editForm.clock_in} onChange={e => setEditForm({...editForm, clock_in: e.target.value})} />
                        ) : record.clock_in ? (
                          <span className="inline-flex items-center gap-1 text-sm font-mono font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                            <ArrowDownRight size={12} />
                            {formatTime(record.clock_in)}
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center">
                        {editingRow === record.id ? (
                          <input type="time" className="border rounded px-2 py-1 text-xs text-center w-24" value={editForm.clock_out} onChange={e => setEditForm({...editForm, clock_out: e.target.value})} />
                        ) : record.clock_out ? (
                          <span className="inline-flex items-center gap-1 text-sm font-mono font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                            <ArrowUpRight size={12} />
                            {formatTime(record.clock_out)}
                          </span>
                        ) : record.clock_in ? (
                          <span className="text-xs text-blue-500 font-bold flex items-center justify-center gap-1">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                            En obra
                          </span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-center">
                        <span className={`text-sm font-mono font-bold ${workedStr === 'En obra...' ? 'text-blue-500' : 'text-gray-700'}`}>
                          {workedStr}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${statusConfig.classes}`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </span>
                      </td>
                      <td className="text-center">
                        <span className="text-xs text-gray-400 font-medium">
                          {record.source === 'mobile' ? '📱 QR' : record.source === 'biometric' ? '🔐 Bio' : '✋ Manual'}
                        </span>
                      </td>
                      <td className="text-center">
                        {record.source === 'mobile' && deviceInfo ? (
                          <DeviceInfoCell deviceIn={deviceIn} deviceOut={deviceOut} />
                        ) : (
                          <span className="text-xs text-gray-300">—</span>
                        )}
                      </td>
                      <td className="text-center">
                        {editingRow === record.id ? (
                          <div className="flex justify-center gap-1">
                            <button onClick={async () => { await updateAttendance.mutateAsync({ id: record.id, clock_in: editForm.clock_in || null, clock_out: editForm.clock_out || null }); setEditingRow(null); }} className="text-green-600 hover:bg-green-100 p-1 rounded"><Check size={14} /></button>
                            <button onClick={() => setEditingRow(null)} className="text-gray-400 hover:bg-gray-100 p-1 rounded"><X size={14} /></button>
                          </div>
                        ) : (
                          <button onClick={() => { setEditingRow(record.id); setEditForm({ clock_in: formatTime(record.clock_in || ''), clock_out: formatTime(record.clock_out || '') }); }} className="text-blue-500 hover:bg-blue-50 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Pencil size={14} /></button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Employees who haven't checked in (Today only) */}
      {isToday && stats.absent > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-5 shrink-0">
          <h4 className="font-bold text-red-800 text-sm flex items-center gap-2 mb-3">
            <XCircle size={16} />
            Sin fichar hoy ({stats.absent})
          </h4>
          <div className="flex flex-wrap gap-2">
            {activeEmployees
              .filter(emp => !attendanceRecords.some(r => r.employee_id === emp.id))
              .map(emp => (
                <span key={emp.id} className="px-3 py-1.5 bg-white border border-red-200 rounded-lg text-xs font-bold text-red-700">
                  {emp.full_name}
                </span>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Helpers ───

function formatTime(timeStr: string): string {
  if (!timeStr) return '';
  if (timeStr.includes('T')) {
    return new Date(timeStr).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
  return timeStr.slice(0, 5);
}

function calculateWorkedHours(clockIn: string, clockOut: string): string {
  try {
    const inT = formatTime(clockIn);
    const outT = formatTime(clockOut);
    const [inH, inM] = inT.split(':').map(Number);
    const [outH, outM] = outT.split(':').map(Number);
    const totalMin = (outH * 60 + outM) - (inH * 60 + inM);
    if (totalMin <= 0 || isNaN(totalMin)) return '—';
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h}h ${m}m`;
  } catch (e) {
    return '—';
  }
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'present': return { label: 'Presente', classes: 'bg-green-100 text-green-700', icon: <CheckCircle2 size={12} /> };
    case 'late': return { label: 'Tardanza', classes: 'bg-yellow-100 text-yellow-700', icon: <AlertTriangle size={12} /> };
    case 'absent': return { label: 'Ausente', classes: 'bg-red-100 text-red-700', icon: <XCircle size={12} /> };
    case 'half_day': return { label: 'Medio Día', classes: 'bg-blue-100 text-blue-700', icon: <Coffee size={12} /> };
    case 'vacation': return { label: 'Vacaciones', classes: 'bg-ecar-blueLight text-ecar-blue', icon: <Calendar size={12} /> };
    case 'medical': return { label: 'Médico', classes: 'bg-ecar-blueLight text-ecar-blue', icon: <Calendar size={12} /> };
    default: return { label: status, classes: 'bg-gray-100 text-gray-600', icon: null };
  }
}

// ─── Stat Card ───
const StatCard: React.FC<{
  icon: React.ReactNode; label: string; value: number; total?: number; color: string; pct?: number;
}> = ({ icon, label, value, total, color, pct }) => {
  const colorMap: Record<string, { bg: string; text: string; iconBg: string; border: string }> = {
    green: { bg: 'bg-green-50', text: 'text-green-700', iconBg: 'bg-green-100', border: 'border-green-200' },
    yellow: { bg: 'bg-yellow-50', text: 'text-yellow-700', iconBg: 'bg-yellow-100', border: 'border-yellow-200' },
    red: { bg: 'bg-red-50', text: 'text-red-700', iconBg: 'bg-red-100', border: 'border-red-200' },
    blue: { bg: 'bg-blue-50', text: 'text-blue-700', iconBg: 'bg-blue-100', border: 'border-blue-200' },
  };
  const c = colorMap[color] || colorMap.green;

  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4 transition-all`}>
      <div className="flex items-center justify-between mb-2">
        <div className={`p-2 rounded-lg ${c.iconBg} ${c.text}`}>{icon}</div>
        {pct !== undefined && <span className={`text-xs font-bold ${c.text}`}>{pct}%</span>}
      </div>
      <p className={`text-2xl font-black ${c.text}`}>
        {value}
        {total !== undefined && <span className="text-sm font-bold opacity-50">/{total}</span>}
      </p>
      <p className="text-xs font-bold text-gray-500 mt-0.5">{label}</p>
    </div>
  );
};

// ─── Device Info Cell ───
const DeviceInfoCell: React.FC<{
  deviceIn?: Record<string, any>;
  deviceOut?: Record<string, any>;
}> = ({ deviceIn, deviceOut }) => {
  const [expanded, setExpanded] = useState(false);
  const device = deviceOut || deviceIn;
  if (!device) return <span className="text-xs text-gray-300">—</span>;

  const osEmoji = device.os === 'Android' ? '🤖' : device.os === 'iOS' ? '🍎' : device.os === 'Windows' ? '🪟' : '💻';

  return (
    <div className="relative">
      <button
        onClick={() => setExpanded(!expanded)}
        className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-50 border border-ecar-blueLight text-ecar-blue text-[11px] font-bold hover:bg-ecar-blueLight transition-all"
        title="Ver detalles del dispositivo"
      >
        <Smartphone size={11} />
        <span>{osEmoji} {device.os || '?'}</span>
        <span className="text-ecar-blue">·</span>
        <span>{device.browser || '?'}</span>
      </button>

      {expanded && (
        <div className="absolute right-0 top-full mt-1 z-50 w-72 light-card shadow-xl p-4 space-y-3 text-left animate-in fade-in slide-in-from-top-1">
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-black text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Smartphone size={12} className="text-ecar-blue" />
              Dispositivo
            </h5>
            <button onClick={() => setExpanded(false)} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
          </div>

          {deviceIn && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-green-600 uppercase tracking-wider">📥 Entrada</p>
              <DeviceDetailRows device={deviceIn} />
            </div>
          )}

          {deviceOut && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">📤 Salida</p>
              <DeviceDetailRows device={deviceOut} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const DeviceDetailRows: React.FC<{ device: Record<string, any> }> = ({ device }) => (
  <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-xs">
    <span className="text-gray-400 flex items-center gap-1"><Globe size={10} /> OS</span>
    <span className="font-bold text-gray-800">{device.os || 'Desconocido'}</span>
    <span className="text-gray-400 flex items-center gap-1"><Globe size={10} /> Navegador</span>
    <span className="font-bold text-gray-800">{device.browser || 'Desconocido'}</span>
    <span className="text-gray-400 flex items-center gap-1"><ScreenShare size={10} /> Pantalla</span>
    <span className="font-bold text-gray-800">{device.screen_resolution || '—'}</span>
    <span className="text-gray-400 flex items-center gap-1"><Clock size={10} /> Hora</span>
    <span className="font-bold text-gray-800 font-mono">
      {device.timestamp ? new Date(device.timestamp).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—'}
    </span>
    {device.platform && (
      <>
        <span className="text-gray-400">Plataforma</span>
        <span className="font-bold text-gray-800 truncate">{device.platform}</span>
      </>
    )}
  </div>
);
