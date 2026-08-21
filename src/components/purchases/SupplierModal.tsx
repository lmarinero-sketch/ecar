import React, { useState, useEffect } from 'react';
import { X, Building2, CreditCard, Landmark, Phone, Check, AlertCircle } from 'lucide-react';
import { useCreateSupplier, useUpdateSupplier, useSuppliers } from '../../hooks/useData';
import { useModalStore } from '../../store/useModalStore';
import type { Supplier } from '../../lib/types';

interface Props {
  supplier?: Supplier | null;
  onClose: () => void;
  onSuccess?: (supplier: Supplier) => void;
}

const CATEGORIES = [
  'Materiales Eléctricos',
  'Construcción y Áridos',
  'Combustibles y Lubricantes',
  'Ferretería y Herramientas',
  'Metalúrgica y Aluminios',
  'Sanitarios y Plomería',
  'Pinturas y Revestimientos',
  'Logística y Transporte',
  'Seguridad y EPP',
  'Servicios Profesionales',
  'Alquiler de Maquinarias',
  'Otros'
];

export const SupplierModal: React.FC<Props> = ({ supplier, onClose, onSuccess }) => {
  const { data: allSuppliers = [] } = useSuppliers();
  const createSupplierMutation = useCreateSupplier();
  const updateSupplierMutation = useUpdateSupplier();

  const [name, setName] = useState(supplier?.name || '');
  const [commercialName, setCommercialName] = useState(supplier?.commercial_name || '');
  const [cuit, setCuit] = useState(supplier?.cuit || '');
  const [taxCondition, setTaxCondition] = useState(supplier?.tax_condition || 'RI');
  const [category, setCategory] = useState(supplier?.category || 'Materiales Eléctricos');
  
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState<string[]>(
    supplier?.payment_methods || ['transferencia', 'cheque']
  );

  // Checking account
  const [hasCheckingAccount, setHasCheckingAccount] = useState<boolean>(supplier?.has_checking_account || false);
  const [creditLimitArs, setCreditLimitArs] = useState<string>(String(supplier?.credit_limit_ars || 0));
  const [creditDays, setCreditDays] = useState<string>(String(supplier?.credit_days || 30));
  const [defaultPaymentCondition, setDefaultPaymentCondition] = useState(supplier?.default_payment_condition || 'Cuenta Corriente');

  // Bank info
  const [bankName, setBankName] = useState(supplier?.bank_name || '');
  const [bankAccountNumber, setBankAccountNumber] = useState(supplier?.bank_account_number || '');
  const [bankCbu, setBankCbu] = useState(supplier?.bank_cbu || '');
  const [bankAlias, setBankAlias] = useState(supplier?.bank_alias || '');
  const [bankAccountHolder, setBankAccountHolder] = useState(supplier?.bank_account_holder || '');

  // Contact info
  const [contactPerson, setContactPerson] = useState(supplier?.contact_person || '');
  const [phone, setPhone] = useState(supplier?.phone || '');
  const [email, setEmail] = useState(supplier?.email || '');
  const [address, setAddress] = useState(supplier?.address || '');
  const [notes, setNotes] = useState(supplier?.notes || '');

  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // CUIT normalization & duplicate check
  useEffect(() => {
    const clean = cuit.replace(/[^0-9]/g, '');
    if (clean.length >= 10) {
      const match = allSuppliers.find(
        s => s.id !== supplier?.id && (s.cuit || '').replace(/[^0-9]/g, '') === clean
      );
      if (match) {
        setDuplicateWarning(`Ya existe un proveedor con este CUIT: "${match.name}"`);
      } else {
        setDuplicateWarning(null);
      }
    } else {
      setDuplicateWarning(null);
    }
  }, [cuit, allSuppliers, supplier]);

  const togglePaymentMethod = (method: string) => {
    if (paymentMethods.includes(method)) {
      setPaymentMethods(paymentMethods.filter(m => m !== method));
    } else {
      setPaymentMethods([...paymentMethods, method]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      useModalStore.getState().showAlert('Atención', 'Debe ingresar la Razón Social o Nombre del proveedor.');
      return;
    }

    const payload: Partial<Supplier> = {
      name: name.trim(),
      commercial_name: commercialName.trim() || null,
      cuit: cuit.trim() || null,
      tax_condition: taxCondition,
      category,
      payment_methods: paymentMethods,
      has_checking_account: hasCheckingAccount,
      credit_limit_ars: parseFloat(creditLimitArs) || 0,
      credit_days: parseInt(creditDays) || 0,
      default_payment_condition: defaultPaymentCondition,
      bank_name: bankName.trim() || null,
      bank_account_number: bankAccountNumber.trim() || null,
      bank_cbu: bankCbu.trim() || null,
      bank_alias: bankAlias.trim() || null,
      bank_account_holder: bankAccountHolder.trim() || null,
      contact_person: contactPerson.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      address: address.trim() || null,
      notes: notes.trim() || null,
      is_fixed: false,
    };

    try {
      if (supplier) {
        await updateSupplierMutation.mutateAsync({ id: supplier.id, ...payload });
        useModalStore.getState().showAlert('Éxito', 'Proveedor actualizado correctamente.');
        if (onSuccess) onSuccess({ ...supplier, ...payload } as Supplier);
      } else {
        await createSupplierMutation.mutateAsync(payload);
        useModalStore.getState().showAlert('Éxito', 'Proveedor creado correctamente.');
      }
      onClose();
    } catch (err: any) {
      useModalStore.getState().showAlert('Error', err?.message || 'Error al guardar el proveedor.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200 animate-fade-in">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-slate-800 to-ecar-blue text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-xs flex items-center justify-center">
              <Building2 size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-base font-black tracking-tight">
                {supplier ? 'Editar Ficha de Proveedor' : 'Nuevo Proveedor Maestro'}
              </h2>
              <p className="text-xs text-white/70">
                Información fiscal, métodos de pago, cuenta corriente y datos bancarios
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-xl transition-colors text-white/80 hover:text-white"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {duplicateWarning && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2 text-xs text-amber-800 font-medium">
              <AlertCircle size={16} className="text-amber-600 shrink-0" />
              <span>{duplicateWarning}</span>
            </div>
          )}

          {/* Section 1: Identificación y Fiscal */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
              <Building2 size={14} className="text-ecar-blue" />
              1. Identificación y Datos Fiscales
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Razón Social / Nombre Completo *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ej. Loma Negra C.I.A.S.A."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nombre Comercial / Fantasía (Alias)
                </label>
                <input
                  type="text"
                  value={commercialName}
                  onChange={e => setCommercialName(e.target.value)}
                  placeholder="Ej. Loma Negra"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CUIT
                </label>
                <input
                  type="text"
                  value={cuit}
                  onChange={e => setCuit(e.target.value)}
                  placeholder="Ej. 30-12345678-9"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Condición Fiscal
                </label>
                <select
                  value={taxCondition}
                  onChange={e => setTaxCondition(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  <option value="RI">IVA Responsable Inscripto</option>
                  <option value="Monotributo">Monotributo</option>
                  <option value="Exento">IVA Exento</option>
                  <option value="Consumidor Final">Consumidor Final</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Rubro / Categoría de Actividad
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
                >
                  {CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Métodos de Pago y Cuenta Corriente */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
              <CreditCard size={14} className="text-ecar-blue" />
              2. Métodos de Pago y Cuenta Corriente
            </h3>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">
                Métodos de Pago Habilitados para este Proveedor:
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'cheque', label: '⚡ Cheque Propio / eCheq' },
                  { id: 'transferencia', label: '🏦 Transferencia Bancaria' },
                  { id: 'cheque_terceros', label: '📄 Endoso Cheque de Terceros' },
                  { id: 'efectivo', label: '💵 Efectivo / Caja Chica' }
                ].map(m => {
                  const isSelected = paymentMethods.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => togglePaymentMethod(m.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-ecar-blue shadow-2xs'
                          : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      {isSelected ? '✓ ' : '+ '}{m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Toggle Cuenta Corriente */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">¿Posee Cuenta Corriente Comercial?</h4>
                  <p className="text-[11px] text-slate-500">
                    Permite cargar facturas a plazo y computar balance de crédito adeudado.
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={hasCheckingAccount}
                    onChange={e => setHasCheckingAccount(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              {hasCheckingAccount && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-200/80 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Límite de Crédito ($ ARS)
                    </label>
                    <input
                      type="number"
                      step="any"
                      min="0"
                      value={creditLimitArs}
                      onChange={e => setCreditLimitArs(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Plazo Acordado (Días)
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={creditDays}
                      onChange={e => setCreditDays(e.target.value)}
                      placeholder="30"
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-mono text-center"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Condición de Pago por Defecto
                    </label>
                    <select
                      value={defaultPaymentCondition}
                      onChange={e => setDefaultPaymentCondition(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium"
                    >
                      <option value="Cuenta Corriente">Cuenta Corriente</option>
                      <option value="30 días fecha factura">30 días fecha factura</option>
                      <option value="60 días fecha factura">60 días fecha factura</option>
                      <option value="Cheque diferido 30 días">Cheque diferido 30 días</option>
                      <option value="Contado">Contado</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 3: Datos Bancarios del Proveedor */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
              <Landmark size={14} className="text-ecar-blue" />
              3. Datos Bancarios del Proveedor
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Banco
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="Ej. Banco Santander / Banco San Juan"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  N° de Cuenta Bancaria
                </label>
                <input
                  type="text"
                  value={bankAccountNumber}
                  onChange={e => setBankAccountNumber(e.target.value)}
                  placeholder="Ej. CC-982736/1"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Titular de la Cuenta
                </label>
                <input
                  type="text"
                  value={bankAccountHolder}
                  onChange={e => setBankAccountHolder(e.target.value)}
                  placeholder="Nombre o Razón Social titular"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  CBU / CVU (22 dígitos)
                </label>
                <input
                  type="text"
                  maxLength={22}
                  value={bankCbu}
                  onChange={e => setBankCbu(e.target.value)}
                  placeholder="0720000000000000000000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Alias CBU
                </label>
                <input
                  type="text"
                  value={bankAlias}
                  onChange={e => setBankAlias(e.target.value)}
                  placeholder="Ej. LOMA.NEGRA.PROVEEDOR"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Contacto y Observaciones */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b pb-1">
              <Phone size={14} className="text-ecar-blue" />
              4. Contacto y Dirección
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Persona de Contacto
                </label>
                <input
                  type="text"
                  value={contactPerson}
                  onChange={e => setContactPerson(e.target.value)}
                  placeholder="Ej. Juan Pérez (Ventas)"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Teléfono / WhatsApp
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ej. 264-1234567"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="ventas@proveedor.com"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dirección / Domicilio Comercial
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Calle, Número, Localidad, Provincia"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>

              <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Observaciones / Notas Internas
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Notas sobre condiciones comerciales, descuentos, etc."
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex justify-between items-center">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 bg-white border border-slate-300 rounded-xl shadow-2xs transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            disabled={createSupplierMutation.isPending || updateSupplierMutation.isPending}
            className="px-6 py-2.5 bg-ecar-blue hover:bg-ecar-blueDark text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
          >
            <Check size={16} />
            {supplier ? 'Guardar Cambios' : 'Crear Proveedor'}
          </button>
        </div>
      </div>
    </div>
  );
};
