import React, { useState, useEffect } from 'react';
import { validateQRToken } from '../lib/qrToken';
import { supabase } from '../lib/supabase';
import { CheckCircle2, XCircle, Clock, HardHat, Loader2, ShieldCheck, UserCheck, AlertCircle } from 'lucide-react';

type CheckInStatus = 'validating' | 'select_employee' | 'confirming' | 'success' | 'error' | 'already_checked';

export const CheckInPage: React.FC = () => {
  const [status, setStatus] = useState<CheckInStatus>('validating');
  const [error, setError] = useState('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [checkInTime, setCheckInTime] = useState('');
  const [isClockOut, setIsClockOut] = useState(false);

  useEffect(() => {
    validateToken();
  }, []);

  const validateToken = async () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (!token) {
      setStatus('error');
      setError('No se proporcionó un código QR válido.');
      return;
    }

    if (!validateQRToken(token)) {
      setStatus('error');
      setError('El código QR expiró. Pedí al encargado que muestre el QR actualizado.');
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('employees')
        .select('id, full_name, cuil, dni, category:union_categories(name)')
        .eq('employment_status', 'active')
        .order('full_name');

      if (dbError) throw dbError;
      setEmployees(data || []);
      setStatus('select_employee');
    } catch (err: any) {
      setStatus('error');
      setError('Error al cargar empleados: ' + (err?.message || 'Intente de nuevo'));
    }
  };

  const handleSelectEmployee = async (emp: any) => {
    setSelectedEmployee(emp);

    const today = new Date().toISOString().split('T')[0];
    const { data: existing } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('employee_id', emp.id)
      .eq('record_date', today)
      .maybeSingle();

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
  };

  const handleConfirm = async () => {
    if (!selectedEmployee) return;
    setStatus('validating');

    try {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const currentTime = now.toTimeString().slice(0, 8);

      if (isClockOut) {
        const { error: updateErr } = await supabase
          .from('attendance_records')
          .update({ clock_out: currentTime, status: 'present' })
          .eq('employee_id', selectedEmployee.id)
          .eq('record_date', today)
          .is('clock_out', null);
        if (updateErr) throw updateErr;
      } else {
        const { error: insertErr } = await supabase
          .from('attendance_records')
          .insert({
            employee_id: selectedEmployee.id,
            record_date: today,
            clock_in: currentTime,
            status: 'present',
            source: 'mobile',
            worked_hours: 0,
            overtime_hours: 0,
            approved: false,
          });
        if (insertErr) throw insertErr;
      }

      setCheckInTime(currentTime);
      setStatus('success');
    } catch (err: any) {
      setStatus('error');
      setError('Error al registrar: ' + (err?.message || 'Intente de nuevo'));
    }
  };

  const filteredEmployees = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.dni || '').includes(search) ||
    (e.cuil || '').includes(search)
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-ecar-blueDark px-4 py-4 shadow-md">
        <div className="flex items-center justify-center gap-3">
          <HardHat size={24} className="text-white" />
          <div className="text-center">
            <h1 className="text-white text-lg font-bold">ECAR Asistencia</h1>
            <p className="text-blue-200 text-xs">Control de fichaje digital</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">

        {/* Validating */}
        {status === 'validating' && (
          <div className="text-center space-y-4">
            <Loader2 size={48} className="mx-auto text-ecar-blue animate-spin" />
            <p className="text-gray-500 text-sm font-medium">Verificando código QR...</p>
          </div>
        )}

        {/* Error */}
        {status === 'error' && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-red-200 rounded-2xl p-8 text-center space-y-4 shadow-lg">
              <div className="w-20 h-20 mx-auto rounded-full bg-red-100 flex items-center justify-center">
                <XCircle size={40} className="text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">QR Inválido</h2>
              <p className="text-gray-500 text-sm leading-relaxed">{error}</p>
              <div className="bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                <p className="text-xs text-yellow-700 font-medium">⏱ Los códigos QR se renuevan cada 10 minutos</p>
              </div>
            </div>
          </div>
        )}

        {/* Select Employee */}
        {status === 'select_employee' && (
          <div className="max-w-sm w-full space-y-4">
            <div className="text-center space-y-2 mb-4">
              <div className="w-16 h-16 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <ShieldCheck size={32} className="text-green-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">QR Verificado</h2>
              <p className="text-gray-500 text-sm">Seleccioná tu nombre para fichar</p>
            </div>

            {/* Search */}
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por nombre o DNI..."
              autoFocus
              className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all"
            />

            {/* Employee List */}
            <div className="space-y-2 max-h-[55vh] overflow-y-auto pr-1">
              {filteredEmployees.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">Sin resultados</div>
              ) : (
                filteredEmployees.map(emp => (
                  <button
                    key={emp.id}
                    onClick={() => handleSelectEmployee(emp)}
                    className="w-full flex items-center gap-3 p-4 bg-white hover:bg-blue-50/50 border border-gray-200 hover:border-ecar-blue/30 rounded-xl transition-all active:scale-[0.98] shadow-sm group"
                  >
                    <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm shrink-0">
                      {emp.full_name.charAt(0)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{emp.full_name}</p>
                      <p className="text-xs text-gray-400 font-mono truncate">
                        {emp.dni ? `DNI ${emp.dni}` : emp.cuil || 'Sin identificación'}
                        {emp.category?.name ? ` · ${emp.category.name}` : ''}
                      </p>
                    </div>
                    <UserCheck size={18} className="text-gray-300 group-hover:text-ecar-blue transition-colors shrink-0" />
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Confirm Check-In */}
        {status === 'confirming' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center space-y-6 shadow-lg">
              <div className="w-20 h-20 mx-auto rounded-full bg-indigo-100 flex items-center justify-center">
                <span className="text-3xl font-bold text-indigo-700">{selectedEmployee.full_name.charAt(0)}</span>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-900">{selectedEmployee.full_name}</h2>
                <p className="text-gray-400 text-sm font-mono mt-1">{selectedEmployee.cuil || selectedEmployee.dni || ''}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Tipo</span>
                  <span className={`font-bold ${isClockOut ? 'text-amber-600' : 'text-green-600'}`}>
                    {isClockOut ? '🏠 Salida' : '🏗️ Entrada'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Hora</span>
                  <span className="font-mono font-bold text-gray-900">
                    {new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Fecha</span>
                  <span className="text-gray-700 font-medium">
                    {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirm}
                  className="flex-1 py-3 px-4 rounded-xl bg-ecar-blue text-white font-bold text-sm hover:bg-ecar-blueDark transition-all shadow-md active:scale-[0.97]"
                >
                  {isClockOut ? 'Fichar Salida' : 'Fichar Entrada'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Success */}
        {status === 'success' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-green-200 rounded-2xl p-8 text-center space-y-5 shadow-lg">
              <div className="w-24 h-24 mx-auto rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={56} className="text-green-500" />
              </div>

              <div>
                <h2 className="text-2xl font-bold text-green-700">
                  {isClockOut ? '¡Salida Registrada!' : '¡Fichaje Exitoso!'}
                </h2>
                <p className="text-gray-500 text-sm mt-2">{selectedEmployee.full_name}</p>
              </div>

              <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                <Clock size={20} className="mx-auto text-ecar-blue mb-2" />
                <p className="text-3xl font-black font-mono tracking-wider text-gray-900">{checkInTime.slice(0, 5)}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>

              <p className="text-xs text-gray-400">Podés cerrar esta página</p>
            </div>
          </div>
        )}

        {/* Already Checked */}
        {status === 'already_checked' && selectedEmployee && (
          <div className="max-w-sm w-full">
            <div className="bg-white border border-blue-200 rounded-2xl p-8 text-center space-y-5 shadow-lg">
              <div className="w-20 h-20 mx-auto rounded-full bg-blue-100 flex items-center justify-center">
                <Clock size={40} className="text-blue-500" />
              </div>
              <h2 className="text-xl font-bold text-blue-700">Ya fichaste hoy</h2>
              <p className="text-gray-500 text-sm">{selectedEmployee.full_name}, ya registraste entrada y salida para hoy.</p>
              <button
                onClick={() => { setSelectedEmployee(null); setStatus('select_employee'); }}
                className="w-full py-3 rounded-xl border border-gray-300 text-gray-600 font-bold text-sm hover:bg-gray-50 transition-all"
              >
                Volver
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-4 border-t border-gray-200">
        <p className="text-[10px] text-gray-400 font-medium tracking-wider">ECAR · SISTEMA CREADO POR GROW LABS</p>
      </footer>
    </div>
  );
};
