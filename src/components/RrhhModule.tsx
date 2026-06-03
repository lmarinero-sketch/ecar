import React, { useState } from 'react';
import { Users, Search, UserPlus, FileText, Calendar, X, Download, Upload, Printer, FileSpreadsheet, Pencil, Trash2, Tag } from 'lucide-react';
import { AttendancePanel } from './AttendancePanel';
import { AccountantNovedadesPanel } from './AccountantNovedadesPanel';
import { useEmployees, useCreateEmployee, useUpdateEmployee, useDeleteEmployee, useCategories, useAllCategoriesHistory, useCreateCategory, useUpdateCategoryRate, useDeleteCategory, useShifts, useProjects, useEmployeeDocuments, useLetterTemplates, useUploadDocument } from '../hooks/useData';
import { CartaDocumentoPDF, fillTemplate } from './CartaDocumento';
import { EmployeeCostPanel } from './EmployeeCostPanel';
import { EmployeeNovedadesPanel } from './EmployeeNovedadesPanel';
import { CategoriesPanel } from './CategoriesPanel';

type Tab = 'roster' | 'add' | 'legajo' | 'attendance' | 'novedades' | 'categorias';

export const RrhhModule: React.FC = () => {
  const { data: employees = [], isLoading } = useEmployees();
  const { data: categories = [] } = useCategories();
  const { data: allCatHistory = [] } = useAllCategoriesHistory();
  const { data: shifts = [] } = useShifts();
  const { data: projects = [] } = useProjects();
  const { data: templates = [] } = useLetterTemplates();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee();
  const deleteEmployee = useDeleteEmployee();
  const createCategory = useCreateCategory();
  const updateCategoryRate = useUpdateCategoryRate();
  const deleteCategory = useDeleteCategory();

  const [tab, setTab] = useState<Tab>('roster');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [editingEmployee, setEditingEmployee] = useState<any>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [form, setForm] = useState({
    full_name: '', cuil: '', dni: '', birth_date: '', address: '', phone: '',
    emergency_contact: '', category_id: '', current_project_id: '', shift_id: '', hire_date: '',
    bank_name: '', bank_alias_cbu: '', trial_start_date: '', obra_social: '', art_provider: '',
    modo_liquidacion: 'mensual', retribucion_pactada: '',
  });

  const activeEmployees = employees.filter(e => e.employment_status === 'active');
  const filtered = activeEmployees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase()) ||
    (e.cuil || '').includes(search) ||
    (e.dni || '').includes(search)
  );

  const calcAntiguedad = (hireDate: string | null) => {
    if (!hireDate) return '—';
    const diff = Date.now() - new Date(hireDate).getTime();
    const years = Math.floor(diff / (365.25 * 86400000));
    const months = Math.floor((diff % (365.25 * 86400000)) / (30.44 * 86400000));
    if (years > 0) return `${years}a ${months}m`;
    return `${months} meses`;
  };

  const handleCreate = async () => {
    await createEmployee.mutateAsync({
      ...form,
      category_id: form.category_id || null,
      current_project_id: form.current_project_id || null,
      shift_id: form.shift_id || null,
      retribucion_pactada: form.retribucion_pactada ? parseFloat(form.retribucion_pactada) : null,
    });
    setForm({ full_name: '', cuil: '', dni: '', birth_date: '', address: '', phone: '', emergency_contact: '', category_id: '', current_project_id: '', shift_id: '', hire_date: '', bank_name: '', bank_alias_cbu: '', trial_start_date: '', obra_social: '', art_provider: '', modo_liquidacion: 'mensual', retribucion_pactada: '' });
    setTab('roster');
  };

  const selectedEmployee = employees.find(e => e.id === selectedId);

  if (isLoading) return <div className="text-center py-12 text-gray-400">Cargando personal...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-800 to-indigo-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><Users size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><Users size={24} /> RRHH & Legajos Digitales</h3>
          <p className="text-indigo-100 text-sm mt-1">
            {activeEmployees.length} empleados activos · Categorías UOCRA · Parte diario de asistencia
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-white border border-gray-200 rounded-xl p-1 shadow-sm">
        {([
          { id: 'roster', label: 'Nómina', icon: Users },
          { id: 'add', label: 'Nuevo Empleado', icon: UserPlus },
          { id: 'legajo', label: 'Legajo Digital', icon: FileText },
          { id: 'categorias', label: 'Categorías UOCRA', icon: Tag },
          { id: 'attendance', label: 'Asistencia', icon: Calendar },
          { id: 'novedades', label: 'Novedades', icon: FileSpreadsheet },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${tab === t.id ? 'bg-ecar-blue text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {/* TAB: Roster */}
      {tab === 'roster' && (
        <div className="space-y-4">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por nombre, CUIL o DNI..." className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ecar-blue/30" />
          </div>

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Users size={48} className="mx-auto mb-3 opacity-30" />
              <p className="font-medium">Sin empleados registrados</p>
              <button onClick={() => setTab('add')} className="mt-3 text-ecar-blue font-bold text-sm">+ Agregar primer empleado</button>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">CUIL</th>
                    <th className="px-4 py-3">Categoría</th>
                    <th className="px-4 py-3">Obra</th>
                    <th className="px-4 py-3">Antigüedad</th>
                    <th className="px-4 py-3">Banco / Alias</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filtered.map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs">
                            {emp.full_name.charAt(0)}
                          </div>
                          <span className="font-bold text-gray-900">{emp.full_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-600">{emp.cuil || '—'}</td>
                      <td className="px-4 py-3 text-gray-700">{emp.category?.name || '—'}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{emp.project?.name || '—'}</td>
                      <td className="px-4 py-3 text-xs font-bold text-indigo-600">{calcAntiguedad(emp.hire_date)}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{emp.bank_alias_cbu || emp.bank_name || '—'}</td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => { setSelectedId(emp.id); setTab('legajo'); }} className="text-ecar-blue hover:underline text-xs font-bold">Ver legajo</button>
                          <button onClick={() => { setEditingEmployee(emp); setEditForm({ full_name: emp.full_name, cuil: emp.cuil || '', dni: emp.dni || '', birth_date: emp.birth_date || '', address: emp.address || '', phone: emp.phone || '', emergency_contact: emp.emergency_contact || '', category_id: emp.category_id || '', current_project_id: emp.current_project_id || '', shift_id: emp.shift_id || '', hire_date: emp.hire_date || '', bank_name: emp.bank_name || '', bank_alias_cbu: emp.bank_alias_cbu || '', trial_start_date: emp.trial_start_date || '', obra_social: emp.obra_social || '', art_provider: emp.art_provider || '', modo_liquidacion: emp.modo_liquidacion || 'mensual', retribucion_pactada: emp.retribucion_pactada || '' }); }} className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors" title="Editar"><Pencil size={14} /></button>
                          <button onClick={() => setDeleteTarget(emp)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors" title="Dar de baja"><Trash2 size={14} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB: Add Employee */}
      {tab === 'add' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 max-w-3xl">
          <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><UserPlus size={20} /> Nuevo Empleado</h3>
          
          {/* Datos personales */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos Personales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-1">Nombre Completo *</label>
              <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">CUIL</label>
              <input value={form.cuil} onChange={e => setForm({ ...form, cuil: e.target.value })} placeholder="20-12345678-9" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">DNI</label>
              <input value={form.dni} onChange={e => setForm({ ...form, dni: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Fecha Nacimiento</label>
              <input type="date" value={form.birth_date} onChange={e => setForm({ ...form, birth_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label>
              <input value={form.phone} onChange={e => { const raw = e.target.value.replace(/\D/g, ''); if (raw.length <= 10) setForm({ ...form, phone: raw }); }} placeholder="2645438114" maxLength={10} inputMode="numeric" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs font-bold text-gray-500 block mb-1">Dirección</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Contacto Emergencia</label>
              <input value={form.emergency_contact} onChange={e => setForm({ ...form, emergency_contact: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          {/* Datos laborales */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Datos Laborales</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Fecha Ingreso (Alta ARCA)</label>
              <input type="date" value={form.hire_date} onChange={e => setForm({ ...form, hire_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Inicio Período de Prueba</label>
              <input type="date" value={form.trial_start_date} onChange={e => setForm({ ...form, trial_start_date: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Categoría UOCRA</label>
              <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name} ($ {c.hourly_rate_ars}/h)</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Obra Actual</label>
              <select value={form.current_project_id} onChange={e => setForm({ ...form, current_project_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Sin asignar</option>
                {projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Turno</label>
              <select value={form.shift_id} onChange={e => setForm({ ...form, shift_id: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="">Seleccionar</option>
                {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Modo Liquidación</label>
              <select value={form.modo_liquidacion} onChange={e => setForm({ ...form, modo_liquidacion: e.target.value })} className="w-full px-3 py-2 border rounded-lg text-sm">
                <option value="mensual">Mensual</option>
                <option value="quincenal">Quincenal</option>
                <option value="jornalizado">Jornalizado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Retribución Pactada ($)</label>
              <input type="number" value={form.retribucion_pactada} onChange={e => setForm({ ...form, retribucion_pactada: e.target.value })} placeholder="0.00" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
          </div>

          {/* Datos bancarios y cobertura */}
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Banco y Cobertura</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Banco</label>
              <input value={form.bank_name} onChange={e => setForm({ ...form, bank_name: e.target.value })} placeholder="Ej: Banco Nación" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Alias / CBU</label>
              <input value={form.bank_alias_cbu} onChange={e => setForm({ ...form, bank_alias_cbu: e.target.value })} placeholder="Ej: JUAN.PEREZ.MP o CBU" className="w-full px-3 py-2 border rounded-lg text-sm font-mono" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Obra Social</label>
              <input value={form.obra_social} onChange={e => setForm({ ...form, obra_social: e.target.value })} placeholder="Ej: UOCRA" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">ART</label>
              <input value={form.art_provider} onChange={e => setForm({ ...form, art_provider: e.target.value })} placeholder="Ej: Experta ART" className="w-full px-3 py-2 border rounded-lg text-sm" />
            </div>
          </div>

          <div className="mt-2">
            <button onClick={handleCreate} disabled={!form.full_name || createEmployee.isPending} className="bg-ecar-blue text-white px-6 py-2 rounded-lg font-bold text-sm disabled:opacity-50">
              {createEmployee.isPending ? 'Guardando...' : 'Registrar Empleado'}
            </button>
          </div>
        </div>
      )}

      {/* TAB: Legajo Digital */}
      {tab === 'legajo' && (
        <LegajoView
          employee={selectedEmployee}
          employees={employees.filter(e => e.employment_status === 'active')}
          templates={templates}
          onSelect={setSelectedId}
          onBack={() => setTab('roster')}
          calcAntiguedad={calcAntiguedad}
        />
      )}

      {/* TAB: Categorías UOCRA */}
      {tab === 'categorias' && (
        <CategoriesPanel
          categories={categories}
          allHistory={allCatHistory}
          createCategory={createCategory}
          updateCategoryRate={updateCategoryRate}
          deleteCategory={deleteCategory}
        />
      )}

      {/* TAB: Attendance — QR Dynamic System */}
      {tab === 'attendance' && (
        <AttendancePanel />
      )}

      {/* TAB: Novedades al Contador */}
      {tab === 'novedades' && (
        <AccountantNovedadesPanel />
      )}

      {/* Edit Employee Modal */}
      {editingEmployee && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-lg">Editar Empleado</h3>
              <button onClick={() => setEditingEmployee(null)}><X size={20} className="text-gray-400" /></button>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Datos Personales</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-3">
                <label className="text-xs font-bold text-gray-500 block mb-1">Nombre Completo *</label>
                <input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">CUIL</label>
                <input value={editForm.cuil} onChange={e => setEditForm({ ...editForm, cuil: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">DNI</label>
                <input value={editForm.dni} onChange={e => setEditForm({ ...editForm, dni: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Fecha Nacimiento</label>
                <input type="date" value={editForm.birth_date} onChange={e => setEditForm({ ...editForm, birth_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Teléfono</label>
                <input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-bold text-gray-500 block mb-1">Dirección</label>
                <input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Contacto Emergencia</label>
                <input value={editForm.emergency_contact} onChange={e => setEditForm({ ...editForm, emergency_contact: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Datos Laborales</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Fecha Ingreso</label>
                <input type="date" value={editForm.hire_date} onChange={e => setEditForm({ ...editForm, hire_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Inicio Período Prueba</label>
                <input type="date" value={editForm.trial_start_date} onChange={e => setEditForm({ ...editForm, trial_start_date: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Categoría UOCRA</label>
                <select value={editForm.category_id} onChange={e => setEditForm({ ...editForm, category_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="">Seleccionar</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name} ($ {c.hourly_rate_ars}/h)</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Obra Actual</label>
                <select value={editForm.current_project_id} onChange={e => setEditForm({ ...editForm, current_project_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="">Sin asignar</option>
                  {projects.filter((p: any) => p.status === 'active').map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Turno</label>
                <select value={editForm.shift_id} onChange={e => setEditForm({ ...editForm, shift_id: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="">Seleccionar</option>
                  {shifts.map(s => <option key={s.id} value={s.id}>{s.name} ({s.start_time} - {s.end_time})</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Modo Liquidación</label>
                <select value={editForm.modo_liquidacion} onChange={e => setEditForm({ ...editForm, modo_liquidacion: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm">
                  <option value="mensual">Mensual</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="jornalizado">Jornalizado</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Retribución Pactada ($)</label>
                <input type="number" value={editForm.retribucion_pactada} onChange={e => setEditForm({ ...editForm, retribucion_pactada: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Banco y Cobertura</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Banco</label>
                <input value={editForm.bank_name} onChange={e => setEditForm({ ...editForm, bank_name: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Alias / CBU</label>
                <input value={editForm.bank_alias_cbu} onChange={e => setEditForm({ ...editForm, bank_alias_cbu: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm font-mono" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Obra Social</label>
                <input value={editForm.obra_social} onChange={e => setEditForm({ ...editForm, obra_social: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">ART</label>
                <input value={editForm.art_provider} onChange={e => setEditForm({ ...editForm, art_provider: e.target.value })} className="w-full px-3 py-2 border rounded-xl text-sm" />
              </div>
            </div>

            <button
              onClick={async () => {
                try {
                  await updateEmployee.mutateAsync({ id: editingEmployee.id, ...editForm, category_id: editForm.category_id || null, current_project_id: editForm.current_project_id || null, shift_id: editForm.shift_id || null, retribucion_pactada: editForm.retribucion_pactada ? parseFloat(editForm.retribucion_pactada) : null });
                  setEditingEmployee(null);
                } catch (err: any) { alert(err.message); }
              }}
              disabled={updateEmployee.isPending || !editForm.full_name}
              className="w-full bg-ecar-blue text-white py-3 rounded-lg font-bold text-sm disabled:opacity-50 hover:bg-ecar-blueDark transition-colors"
            >
              {updateEmployee.isPending ? 'Guardando...' : '✓ Guardar Cambios'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Employee Confirmation */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-sm w-full p-6 space-y-4">
            <h3 className="font-bold text-lg text-red-600">Dar de Baja</h3>
            <p className="text-sm text-gray-600">
              ¿Dás de baja a <span className="font-bold">{deleteTarget.full_name}</span>? El empleado pasará a estado "Desvinculado" y no se eliminará del sistema.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg font-bold text-sm hover:bg-gray-200">Cancelar</button>
              <button
                onClick={async () => {
                  try { await deleteEmployee.mutateAsync(deleteTarget.id); setDeleteTarget(null); } catch (err: any) { alert(err.message); }
                }}
                disabled={deleteEmployee.isPending}
                className="flex-1 bg-red-500 text-white py-2 rounded-lg font-bold text-sm hover:bg-red-600 disabled:opacity-50"
              >Dar de Baja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Legajo Digital
const DOC_TYPES = [
  { value: 'dni', label: 'DNI' },
  { value: 'cuil', label: 'CUIL' },
  { value: 'art', label: 'ART' },
  { value: 'contrato', label: 'Contrato' },
  { value: 'recibo_sueldo', label: 'Recibo de Sueldo' },
  { value: 'certificado', label: 'Certificado' },
  { value: 'licencia', label: 'Licencia' },
  { value: 'otro', label: 'Otro' },
];

const FILE_ACCEPT = [
  'image/jpeg','image/png','image/webp','image/gif',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
].join(',');

const getFileIcon = (url: string | null | undefined) => {
  if (!url) return '📎';
  const lower = url.toLowerCase();
  if (lower.includes('.pdf')) return '📄';
  if (lower.includes('.doc') || lower.includes('.docx')) return '📝';
  if (lower.includes('.xls') || lower.includes('.xlsx') || lower.includes('.csv')) return '📊';
  if (lower.match(/\.(jpg|jpeg|png|webp|gif)/)) return '🖼️';
  return '📎';
};

const formatFileSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const LegajoView: React.FC<{
  employee: any;
  employees: any[];
  templates: any[];
  onSelect: (id: string) => void;
  onBack: () => void;
  calcAntiguedad: (d: string | null) => string;
}> = ({ employee, employees, templates, onSelect, onBack, calcAntiguedad }) => {
  const { data: docs = [] } = useEmployeeDocuments(employee?.id || '');
  const uploadDoc = useUploadDocument();
  const [showUpload, setShowUpload] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [docType, setDocType] = useState('otro');
  const [docTitle, setDocTitle] = useState('');
  const [uploadError, setUploadError] = useState('');
  // Carta Documento state
  const [cartaData, setCartaData] = useState<any>(null);
  const [showMotivoInput, setShowMotivoInput] = useState<{template: any} | null>(null);
  const [motivoText, setMotivoText] = useState('');

  if (!employee) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-bold text-lg mb-4">Seleccionar Empleado</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {employees.map(e => (
            <button key={e.id} onClick={() => onSelect(e.id)} className="text-left p-3 border rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all">
              <p className="font-bold text-sm text-gray-900">{e.full_name}</p>
              <p className="text-xs text-gray-400 font-mono">{e.cuil || 'Sin CUIL'}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 52428800) {
      setUploadError('El archivo supera los 50MB permitidos.');
      return;
    }
    setSelectedFile(file);
    setUploadError('');
    // Auto-fill title with file name (without extension)
    if (!docTitle) {
      setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !docTitle.trim()) return;
    setUploadError('');
    try {
      await uploadDoc.mutateAsync({
        employeeId: employee.id,
        file: selectedFile,
        docType,
        title: docTitle.trim(),
      });
      // Reset form
      setSelectedFile(null);
      setDocTitle('');
      setDocType('otro');
      setShowUpload(false);
    } catch (err: any) {
      setUploadError(err?.message || 'Error al subir el archivo. Intentá de nuevo.');
    }
  };

  return (
    <div className="space-y-4">
      <button onClick={onBack} className="text-ecar-blue text-sm font-bold hover:underline">← Volver a nómina</button>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-indigo-50 p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-indigo-200 flex items-center justify-center text-indigo-700 font-bold text-xl">
              {employee.full_name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">{employee.full_name}</h3>
              <p className="text-sm text-gray-500">CUIL: {employee.cuil || '—'} · DNI: {employee.dni || '—'}</p>
              <p className="text-xs text-indigo-600 font-bold mt-1">{employee.category?.name || 'Sin categoría'} · {employee.project?.name || 'Sin obra asignada'}</p>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div><span className="text-xs font-bold text-gray-400 block">Teléfono</span>{employee.phone || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Dirección</span>{employee.address || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Alta ARCA</span>{employee.hire_date || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Período Prueba</span>{employee.trial_start_date || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Emergencia</span>{employee.emergency_contact || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Antigüedad</span><span className="text-indigo-600 font-bold">{calcAntiguedad(employee.hire_date)}</span></div>
            <div><span className="text-xs font-bold text-gray-400 block">Modo Liquidación</span>{employee.modo_liquidacion || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">Retribución</span>{employee.retribucion_pactada ? `$ ${Number(employee.retribucion_pactada).toLocaleString('es-AR')}` : '—'}</div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-100 pt-4">
            <div><span className="text-xs font-bold text-gray-400 block">🏦 Banco</span>{employee.bank_name || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">🔗 Alias/CBU</span><span className="font-mono text-xs">{employee.bank_alias_cbu || '—'}</span></div>
            <div><span className="text-xs font-bold text-gray-400 block">🏥 Obra Social</span>{employee.obra_social || '—'}</div>
            <div><span className="text-xs font-bold text-gray-400 block">🛡️ ART</span>{employee.art_provider || '—'}</div>
          </div>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="flex justify-between items-center mb-4">
          <h4 className="font-bold text-gray-900 flex items-center gap-2"><FileText size={16} /> Documentos del Legajo</h4>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1 hover:opacity-90 transition-opacity"
          >
            {showUpload ? <><X size={14} /> Cancelar</> : <><Upload size={14} /> Subir Documento</>}
          </button>
        </div>

        {/* Upload form */}
        {showUpload && (
          <div className="bg-gray-50 rounded-xl p-4 mb-4 border border-dashed border-gray-300 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Tipo de Documento</label>
                <select
                  value={docType}
                  onChange={e => setDocType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm bg-white"
                >
                  {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Título del Documento *</label>
                <input
                  value={docTitle}
                  onChange={e => setDocTitle(e.target.value)}
                  placeholder="Ej: DNI Frente, Contrato laboral..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-gray-500 block mb-1">Archivo *</label>
              <label className="flex items-center justify-center w-full h-24 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:border-ecar-blue hover:bg-blue-50/30 transition-all">
                <div className="text-center">
                  {selectedFile ? (
                    <>
                      <p className="text-sm font-bold text-gray-700">{selectedFile.name}</p>
                      <p className="text-xs text-gray-400">{formatFileSize(selectedFile.size)}</p>
                    </>
                  ) : (
                    <>
                      <Upload size={20} className="mx-auto text-gray-400 mb-1" />
                      <p className="text-xs text-gray-400">Imágenes, PDF, Word, Excel (máx 50MB)</p>
                    </>
                  )}
                </div>
                <input
                  type="file"
                  accept={FILE_ACCEPT}
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
            </div>

            {uploadError && (
              <p className="text-sm text-red-500 font-medium">{uploadError}</p>
            )}

            <button
              onClick={handleUpload}
              disabled={!selectedFile || !docTitle.trim() || uploadDoc.isPending}
              className="bg-ecar-blue text-white px-5 py-2 rounded-lg font-bold text-sm disabled:opacity-50 flex items-center gap-2"
            >
              {uploadDoc.isPending ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                  Subiendo...
                </>
              ) : 'Guardar Documento'}
            </button>
          </div>
        )}

        {/* Document list */}
        {docs.length === 0 && !showUpload ? (
          <div className="text-center py-8 text-gray-400">
            <FileText size={36} className="mx-auto mb-2 opacity-30" />
            <p className="text-sm">Sin documentos. Subí DNI, ART, contrato, etc.</p>
            <button onClick={() => setShowUpload(true)} className="mt-2 text-ecar-blue font-bold text-sm">+ Subir primer documento</button>
          </div>
        ) : (
          <div className="space-y-2">
            {docs.map(d => (
              <div key={d.id} className="flex justify-between items-center p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{getFileIcon(d.file_url)}</span>
                  <div>
                    <p className="text-sm font-bold text-gray-800">{d.title}</p>
                    <p className="text-xs text-gray-400">
                      {DOC_TYPES.find(t => t.value === d.doc_type)?.label || d.doc_type}
                      {d.document_date ? ` · ${d.document_date}` : ''}
                    </p>
                  </div>
                </div>
                {d.file_url ? (
                  <a
                    href={d.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ecar-blue hover:bg-blue-50 p-2 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                  >
                    <Download size={14} /> Descargar
                  </a>
                ) : (
                  <span className="text-gray-300 p-2 text-xs font-bold flex items-center gap-1">
                    Sin archivo
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Letter Templates */}
      {templates.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
          <h4 className="font-bold text-gray-900 mb-3 flex items-center gap-2"><Printer size={16} /> Cartas Documento Disponibles</h4>
          <p className="text-xs text-gray-400 mb-3">Formato oficial Correo Argentino. Se genera con los datos del empleado ya cargados, listo para imprimir.</p>
          <div className="space-y-2">
            {templates.map(t => (
              <div key={t.id} className="p-3 hover:bg-gray-50 rounded-lg border border-gray-100 transition-colors">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.category === 'disciplinary' ? 'Disciplinaria' : t.category === 'termination' ? 'Desvinculación' : t.category}</p>
                  </div>
                  <button
                    onClick={() => {
                      if (t.body_template.includes('{{motivo}}')) {
                        setShowMotivoInput({ template: t });
                        setMotivoText('');
                      } else {
                        const body = fillTemplate(t.body_template, employee);
                        setCartaData({
                          remitente: 'ECAR Constructora',
                          remitenteDomicilio: '',
                          remitenteCp: '5400',
                          remitenteLocalidad: 'San Juan',
                          remitenteProvincia: 'San Juan',
                          destinatario: employee.full_name,
                          destinatarioDomicilio: employee.address || '',
                          destinatarioCp: '',
                          destinatarioLocalidad: 'San Juan',
                          destinatarioProvincia: 'San Juan',
                          bodyText: body,
                          fecha: new Date().toLocaleDateString('es-AR'),
                        });
                      }
                    }}
                    className="bg-ecar-blue text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:opacity-90 transition-opacity"
                  >
                    <Printer size={12} /> Generar Carta
                  </button>
                </div>

                {/* Motivo input for apercibimiento */}
                {showMotivoInput?.template.id === t.id && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                    <label className="text-xs font-bold text-amber-700 block">Motivo del apercibimiento *</label>
                    <input
                      value={motivoText}
                      onChange={e => setMotivoText(e.target.value)}
                      placeholder="Ej: inasistencia injustificada del día 03/05/2026"
                      className="w-full px-3 py-2 border border-amber-300 rounded-lg text-sm"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!motivoText.trim()) return;
                          const body = fillTemplate(t.body_template, employee, motivoText.trim());
                          setCartaData({
                            remitente: 'ECAR Constructora',
                            remitenteDomicilio: '',
                            remitenteCp: '5400',
                            remitenteLocalidad: 'San Juan',
                            remitenteProvincia: 'San Juan',
                            destinatario: employee.full_name,
                            destinatarioDomicilio: employee.address || '',
                            destinatarioCp: '',
                            destinatarioLocalidad: 'San Juan',
                            destinatarioProvincia: 'San Juan',
                            bodyText: body,
                            fecha: new Date().toLocaleDateString('es-AR'),
                          });
                          setShowMotivoInput(null);
                        }}
                        disabled={!motivoText.trim()}
                        className="bg-amber-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold disabled:opacity-50"
                      >
                        Continuar
                      </button>
                      <button
                        onClick={() => setShowMotivoInput(null)}
                        className="text-gray-500 text-xs font-bold px-3 py-1.5"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Carta Documento PDF Preview */}
      {cartaData && (
        <CartaDocumentoPDF data={cartaData} onClose={() => setCartaData(null)} />
      )}

      {/* Novedades: Ausencias y Adelantos */}
      <EmployeeNovedadesPanel employeeId={employee.id} employeeName={employee.full_name} />

      {/* Costo Salarial & F.931 */}
      <EmployeeCostPanel employee={employee} />
    </div>
  );
};

