import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, Clock, Loader2, UserCheck, Smartphone, Search } from 'lucide-react';
import { useImplementationStore } from '../store/useImplementationStore';

type CheckInStatus = 'loading' | 'select_employee' | 'confirming' | 'success' | 'error' | 'already_checked';

/* ─── Device info collector ─── */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  const platform = navigator.platform || 'Desconocido';
  const lang = navigator.language;
  const screenRes = `${screen.width}x${screen.height}`;
  const online = navigator.onLine;

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
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans text-slate-800">
      {/* HEADER TIPO ECAR */}
      <header className="bg-white border-b border-slate-200 px-4 pt-6 pb-4 shadow-sm z-10">
        <div className="max-w-md mx-auto flex items-center justify-center gap-3">
          <img src="/rombo.jpeg" alt="ECAR Rombo" className="w-12 h-12 object-contain rounded shadow-sm border border-slate-100" />
          <div className="text-left">
            <h1 className="text-ecar-blue text-xl font-bold tracking-tight leading-tight">ECAR Asistencia</h1>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Control de Fichaje Digital</p>
          </div>
        </div>
      </header>

      {/* CLOCK */}
      <div className="text-center py-6 bg-gradient-to-b from-white to-slate-50 border-b border-slate-100">
        <p className="text-5xl font-black font-mono text-ecar-blue tracking-wider tabular-nums">{timeStr}</p>
        <p className="text-sm font-medium text-slate-500 mt-1 capitalize">{dateStr}</p>
      </div>

      <main className="flex-1 flex items-start justify-center px-4 py-8">
        {/* LOADING STATE */}
        {status === 'loading' && (
          <div className="text-center py-12 animate-in fade-in zoom-in duration-300">
            <Loader2 size={48} className="mx-auto text-ecar-blue animate-spin mb-4" />
            <p className="font-bold text-slate-500 text-lg">Cargando...</p>
          </div>
        )}

        {/* ERROR */}
        {status === 'error' && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-50 flex items-center justify-center">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-slate-800">Error</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{error}</p>
              <button onClick={() => { setStatus('select_employee'); setError(''); }} className="btn-primary w-full mt-4 py-3">Reintentar</button>
            </div>
          </div>
        )}

        {/* SELECT EMPLOYEE */}
        {status === 'select_employee' && (
          <div className="max-w-md w-full space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-ecar-blue mb-4 shadow-sm border border-blue-100">
                <UserCheck size={32} />
              </div>
              <h1 className="text-2xl font-black text-slate-800 tracking-tight">TOMA MANUAL</h1>
              <p className="text-slate-500 font-medium mt-1">Seleccione al empleado para registrar su asistencia</p>
            </div>

            {/* Search */}
            <div className="relative shadow-sm">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar por nombre o DNI..."
                autoFocus
                className="w-full bg-white border border-slate-300 rounded-xl pl-11 pr-4 py-3.5 text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all"
              />
            </div>

            {/* Employee List */}
            <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1 scrollbar-thin">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">Sin resultados</div>
              ) : (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full flex items-center gap-4 p-4 bg-white hover:bg-slate-50 border border-slate-200 hover:border-ecar-blue/40 rounded-xl transition-all shadow-sm active:scale-[0.98] group"
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-50 to-slate-100 flex items-center justify-center text-ecar-blue font-black text-lg shrink-0 border border-slate-200 group-hover:border-ecar-blue/30 shadow-sm">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-[15px] truncate group-hover:text-ecar-blue transition-colors">{emp.full_name}</p>
                      <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                        {emp.dni ? `DNI ${emp.dni}` : emp.cuil || 'Sin identificación'}
                        {emp.category?.name ? ` · ${emp.category.name}` : ''}
                      </p>
                    </div>
                    <UserCheck size={20} className="text-slate-300 group-hover:text-ecar-blue transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>

            {/* Device info indicator */}
            <div className="flex items-center justify-center gap-2 text-[10px] font-medium text-slate-400">
              <Smartphone size={12} />
              <span>Se registrará información del dispositivo por seguridad</span>
            </div>
          </div>
        )}

        {/* CONFIRM CHECK-IN */}
        {status === 'confirming' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
              {/* Top Accent */}
              <div className={`absolute top-0 left-0 w-full h-1.5 ${isClockOut ? 'bg-orange-400' : 'bg-emerald-400'}`}></div>

              <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center border-4 border-white shadow-md">
                <span className="text-4xl font-black text-ecar-blue">{selectedEmployee.full_name.charAt(0)}</span>
              </div>

              <div>
                <h2 className="text-2xl font-bold text-slate-800 leading-tight">{selectedEmployee.full_name}</h2>
                <p className="text-slate-500 text-sm font-mono mt-1">{selectedEmployee.cuil || selectedEmployee.dni || ''}</p>
              </div>

              <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Tipo de Fichaje</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider ${isClockOut ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {isClockOut ? '🏠 Salida' : '🏗️ Entrada'}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Hora actual</span>
                  <span className="font-mono font-bold text-slate-800 text-lg">
                    {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-500 font-medium">Fecha</span>
                  <span className="text-slate-600 font-medium capitalize">
                    {currentTime.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
              </div>

              {/* Device info preview */}
              <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1">
                  <Smartphone size={10} />
                  <span className="font-bold uppercase tracking-wider">Dispositivo de Registro</span>
                </div>
                <p className="text-[10px] text-slate-500 font-mono truncate">{navigator.userAgent.slice(0, 80)}...</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                  className="flex-1 py-3.5 px-4 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className={`flex-1 py-3.5 px-4 rounded-xl font-bold text-sm shadow-md active:scale-[0.97] transition-all text-white ${
                    isClockOut
                      ? 'bg-orange-500 hover:bg-orange-600'
                      : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {isClockOut ? 'Confirmar Salida' : 'Confirmar Entrada'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* SUCCESS */}
        {status === 'success' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-emerald-200 rounded-2xl p-8 text-center space-y-6 shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-50/50 pointer-events-none"></div>
              
              {/* Animated check */}
              <div className="w-24 h-24 mx-auto rounded-full bg-emerald-100 flex items-center justify-center border-4 border-white shadow-md relative z-10">
                <CheckCircle2 size={56} className="text-emerald-500" />
              </div>

              <div className="space-y-1 relative z-10">
                <p className="text-emerald-600 text-sm font-bold uppercase tracking-wide">{greeting},</p>
                <h2 className="text-3xl font-black text-slate-800 tracking-tight">
                  {selectedEmployee.full_name.split(' ')[0]}!
                </h2>
                <p className="text-slate-500 text-sm font-medium mt-1">{selectedEmployee.full_name}</p>
              </div>

              {/* Large Time Display */}
              <div className="bg-white rounded-2xl p-6 border border-emerald-100 shadow-sm relative z-10">
                <p className="text-[10px] uppercase tracking-widest text-emerald-500 font-black mb-2">
                  {isClockOut ? 'Salida registrada a las' : 'Entrada registrada a las'}
                </p>
                <p className="text-6xl font-black font-mono text-slate-800 tracking-wider tabular-nums">
                  {checkInTime.slice(0, 5)}
                </p>
                <p className="text-sm font-medium text-slate-500 mt-2 capitalize">{dateStr}</p>
              </div>

              <div className={`inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold shadow-sm relative z-10 ${
                isClockOut
                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                  : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}>
                {isClockOut ? '🏠 Salida fichada correctamente' : '🏗️ Jornada iniciada correctamente'}
              </div>

              <p className="text-[11px] font-medium text-slate-400 relative z-10 pt-2">Podés cerrar esta página · Registro guardado</p>
              
              <button
                onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                className="w-full mt-4 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all relative z-10"
              >
                Registrar a otra persona
              </button>
            </div>
          </div>
        )}

        {/* ALREADY CHECKED */}
        {status === 'already_checked' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-blue-200 rounded-2xl p-8 text-center space-y-6 shadow-xl">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-50 flex items-center justify-center border border-blue-100">
                <Clock size={40} className="text-blue-500" />
              </div>
              <h2 className="text-2xl font-black text-slate-800">Ya fichaste hoy</h2>
              <p className="text-slate-600 font-medium leading-relaxed">
                <span className="font-bold">{selectedEmployee.full_name}</span>, ya registraste tu entrada y salida correspondientes a la jornada de hoy.
              </p>
              <button
                onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                className="w-full py-3.5 rounded-xl border-2 border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm"
              >
                Volver al buscador
              </button>
            </div>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="text-center py-6 border-t border-slate-200 bg-white">
        <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">
          ECAR · Sistema creado por Grow Labs
        </p>
      </footer>
    </div>
  );
};
