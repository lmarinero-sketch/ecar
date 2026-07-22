import React, { useState, useEffect, useMemo } from 'react';
import { validateQRToken } from '../lib/qrToken';
import { CheckCircle2, XCircle, Clock, HardHat, Loader2, ShieldCheck, UserCheck, Smartphone, Search, RefreshCw, LogOut } from 'lucide-react';
import { useImplementationStore } from '../store/useImplementationStore';

type CheckInStatus = 'loading' | 'select_employee' | 'confirming' | 'success' | 'error';

/* ─── Device info collector ─── */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Desconocido';
  const lang = navigator.language;
  const screenRes = `${screen.width}x${screen.height}`;
  const online = navigator.onLine;

  // Try to extract device/browser from user agent
  let browser = 'Desconocido';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';

  let os = 'Desconocido';
  if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';
  else if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac OS')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return {
    user_agent: ua,
    platform,
    language: lang,
    screen_resolution: screenRes,
    browser,
    os,
    online,
    timestamp: new Date().toISOString(),
  };
}

export const ManualCheckInPage: React.FC = () => {
  const [status, setStatus] = useState<CheckInStatus>('loading');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [isClockOut, setIsClockOut] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    loadEmployees();
  }, []);

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  const callEdge = async (body: Record<string, any>) => {
    const res = await fetch(`${supabaseUrl}/functions/v1/attendance-checkin`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Error de red' }));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  };

  const loadEmployees = async () => {
    try {
      const { employees: data } = await callEdge({ action: 'get_employees' });
      setEmployees(data || []);
      setStatus('select_employee');
    } catch (err: any) {
      setStatus('error');
      setError('Error al cargar empleados: ' + (err?.message || 'Intente de nuevo'));
    }
  };

  const handleSelectEmployee = async (emp: any) => {
    setSelectedEmployee(emp);

    try {
      const { record: existing } = await callEdge({ action: 'check_status', employee_id: emp.id });

      if (existing && existing.clock_in && existing.clock_out) {
        setStatus('already_checked');
        return;
      }

      if (existing && existing.clock_in && !existing.clock_out) {
        setIsClockOut(true);
      } else {
        setIsClockOut(false);
      }

      setStatus('confirming');
    } catch (err: any) {
      setStatus('error');
      setError('Error al verificar estado: ' + (err?.message || 'Intente de nuevo'));
    }
  };

  const handleConfirm = async () => {
    if (!selectedEmployee) return;
    setStatus('loading');

    try {
      const deviceInfo = getDeviceInfo();
      const action = isClockOut ? 'clock_out' : 'clock_in';

      const result = await callEdge({
        action,
        employee_id: selectedEmployee.id,
        metadata: { ...deviceInfo, manual_by_hr: true, source: 'manual_public_link' },
      });

      useImplementationStore.getState().completeItem('e2-30');
      setCheckInTime(result.time);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError('Error al registrar: ' + (err?.message || 'Intente de nuevo'));
    }
  };

  const filteredEmployees = useMemo(() =>
    employees.filter(e =>
      e.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (e.dni || '').includes(search) ||
      (e.cuil || '').includes(search)
    ), [employees, search]);

  const timeStr = currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  const hour = currentTime.getHours();
  const greeting = hour < 12 ? 'Buenos días' : hour < 18 ? 'Buenas tardes' : 'Buenas noches';

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 flex flex-col">
      <header className="px-4 pt-6 pb-4">
        <div className="flex items-center justify-center gap-3">
          <div className="w-11 h-11 rounded-full bg-white/10 backdrop-blur flex items-center justify-center border border-white/20">
            <HardHat size={22} className="text-ecar-blueLight" />
          </div>
          <div className="text-center">
            <h1 className="text-white text-lg font-bold tracking-tight">ECAR Asistencia</h1>
            <p className="text-ecar-blueLight/80 text-[10px] font-semibold uppercase tracking-widest">Control de fichaje digital</p>
          </div>
        </div>
      </header>

      <div className="text-center mb-4">
        <p className="text-5xl font-black font-mono text-white tracking-wider tabular-nums">{timeStr}</p>
        <p className="text-sm text-slate-400 mt-1 capitalize">{dateStr}</p>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 pb-6">

        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <Loader2 size={48} className="mx-auto text-ecar-blue animate-spin mb-4" />
            <p className="font-bold text-gray-400 text-lg">Cargando...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="max-w-sm w-full mt-4">
            <div className="bg-white/5 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 text-center space-y-4 shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-500/20 flex items-center justify-center">
                <XCircle size={40} className="text-red-400" />
              </div>
              <h2 className="text-xl font-bold text-white">Error</h2>
              <p className="text-slate-300 text-sm leading-relaxed">{error}</p>
            </div>
          </div>
        )}

        {/* Select Employee */}
        {status === 'select_employee' && (
          <div className="max-w-sm w-full space-y-4">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100/10 text-ecar-blue mb-4 shadow-sm">
                <UserCheck size={32} />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">TOMA MANUAL</h1>
              <p className="text-slate-400 font-medium mt-2">Registro manual de asistencia</p>
            </div>

            {/* Search */}
            <div className="relative">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                autoFocus
                className="w-full bg-white/10 backdrop-blur border border-white/20 rounded-xl pl-10 pr-4 py-3.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue/50 transition-all"
              />
            </div>

            {/* Employee List */}
            <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">Sin resultados</div>
              ) : (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-ecar-blue/30 rounded-xl transition-all active:scale-[0.98] group"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-ecar-blue/30 to-blue-500/30 flex items-center justify-center text-ecar-blueLight font-bold text-sm shrink-0 border border-ecar-blue/20">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-white text-sm truncate">{emp.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate">
                        {emp.dni ? `DNI ${emp.dni}` : emp.cuil || 'Sin identificación'}
                        {emp.category?.name ? ` · ${emp.category.name}` : ''}
                      </p>
                    </div>
                    <UserCheck size={18} className="text-slate-600 group-hover:text-ecar-blue transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Device info indicator */}
            <div className="flex items-center justify-center gap-2 text-[10px] text-slate-600">
              <Smartphone size={10} />
              <span>Se registrará información del dispositivo al fichar</span>
            </div>
          </div>
        )}

        {/* Confirm Check-In */}
        {status === 'confirming' && selectedEmployee && (
          <div className="max-w-sm w-full mt-2">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-ecar-blue/20 to-blue-500/20 flex items-center justify-center border border-ecar-blue/30">
                <span className="text-3xl font-bold text-ecar-blueLight">{selectedEmployee.full_name.charAt(0)}</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-white">{selectedEmployee.full_name}</h2>
                <p className="text-slate-500 text-sm font-mono mt-1">{selectedEmployee.cuil || selectedEmployee.dni || ''}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Tipo</span>
                  <span className={`font-bold ${isClockOut ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {isClockOut ? '🏠 Salida' : '🏗️ Entrada'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Hora</span>
                  <span className="font-mono font-bold text-white text-lg">
                    {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Fecha</span>
                  <span className="text-slate-300 font-medium capitalize">
                    {currentTime.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              {/* Device info preview */}
              <div className="bg-slate-800/50 rounded-lg p-3 border border-white/5">
                <div className="flex items-center gap-2 text-[10px] text-slate-500 mb-1">
                  <Smartphone size={10} />
                  <span className="font-bold uppercase tracking-wider">Dispositivo</span>
                </div>
                <p className="text-[10px] text-slate-600 font-mono truncate">{navigator.userAgent.slice(0, 80)}...</p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-white/20 text-slate-400 font-bold text-sm hover:bg-white/5 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3 px-4 rounded-xl font-bold text-sm shadow-lg active:scale-[0.97] transition-all ${
                    isClockOut
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:from-amber-600 hover:to-orange-600'
                      : 'bg-gradient-to-r from-emerald-500 to-ecar-blue text-white hover:from-emerald-600 hover:to-ecar-blue'
                  }`}
                >
                  {isClockOut ? 'Fichar Salida' : 'Fichar Entrada'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && selectedEmployee && (
          <div className="max-w-sm w-full mt-2">
            <div className="bg-white/5 backdrop-blur-xl border border-emerald-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
              {/* Animated check */}
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-500/20 flex items-center justify-center border-2 border-emerald-500/40 animate-pulse">
                <CheckCircle2 size={56} className="text-emerald-400" />
              </div>

              {/* Welcome message */}
              <div className="space-y-1">
                <p className="text-emerald-400 text-sm font-semibold">{greeting},</p>
                <h2 className="text-3xl font-black text-white tracking-tight">
                  {selectedEmployee.full_name.split(' ')[0]}!
                </h2>
                <p className="text-slate-400 text-xs">{selectedEmployee.full_name}</p>
              </div>

              {/* Large Time Display */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-ecar-blue/10 rounded-2xl p-6 border border-emerald-500/20">
                <p className="text-[10px] uppercase tracking-widest text-emerald-400/80 font-bold mb-1">
                  {isClockOut ? 'Salida registrada' : 'Entrada registrada'}
                </p>
                <p className="text-6xl font-black font-mono text-white tracking-wider tabular-nums">
                  {checkInTime.slice(0, 5)}
                </p>
                <p className="text-xs text-slate-500 mt-2 capitalize">{dateStr}</p>
              </div>

              {/* Status badge */}
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold ${
                isClockOut
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}>
                {isClockOut ? '🏠 Salida fichada' : '🏗️ Jornada iniciada'}
              </div>

              <p className="text-[10px] text-slate-600">Podés cerrar esta página · Registro guardado</p>
            </div>
          </div>
        )}

        {/* Already Checked */}
        {status === 'already_checked' && selectedEmployee && (
          <div className="max-w-sm w-full mt-4">
            <div className="bg-white/5 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-8 text-center space-y-5 shadow-2xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-500/20 flex items-center justify-center border border-blue-500/30">
                <Clock size={40} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-bold text-blue-300">Ya fichaste hoy</h2>
              <p className="text-slate-400 text-sm">{selectedEmployee.full_name}, ya registraste entrada y salida para hoy.</p>
              <button
                onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                className="w-full py-3 rounded-xl border border-white/20 text-slate-400 font-bold text-sm hover:bg-white/5 transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-white/5">
        <p className="text-[10px] text-slate-600 font-semibold tracking-widest uppercase">ECAR · Sistema creado por Grow Labs</p>
      </footer>
    </div>
  );
};
