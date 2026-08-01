import React, { useState, useMemo } from 'react';
import {
  ClipboardCheck, ArrowLeft, Plus, AlertTriangle, CheckCircle2,
  Truck, Wrench, QrCode, Calendar, Eye,
  CircleCheck, CircleX, ChevronDown, ChevronUp, Download
} from 'lucide-react';
import { useFuelVehicles, useProjects, useVehicleDailyReports, useCreateVehicleDailyReport } from '../hooks/useData';
import type { FuelVehicle, VehicleDailyReport, VehicleChecklistItem, VehicleFuelLevel, VehicleCondition } from '../lib/types';

// ── Constants ──
const DEFAULT_CHECKLIST: VehicleChecklistItem[] = [
  { item: 'Luces delanteras y traseras', estado: 'ok' },
  { item: 'Frenos', estado: 'ok' },
  { item: 'Neumáticos (presión y desgaste)', estado: 'ok' },
  { item: 'Nivel de aceite', estado: 'ok' },
  { item: 'Nivel de agua / refrigerante', estado: 'ok' },
  { item: 'Espejos retrovisores', estado: 'ok' },
  { item: 'Cinturón de seguridad', estado: 'ok' },
  { item: 'Limpieza interior', estado: 'ok' },
  { item: 'Herramientas de a bordo', estado: 'ok' },
  { item: 'Matafuego (carga vigente)', estado: 'ok' },
  { item: 'Botiquín primeros auxilios', estado: 'ok' },
  { item: 'Balizas / triángulos', estado: 'ok' },
  { item: 'Limpiaparabrisas', estado: 'ok' },
  { item: 'Bocina', estado: 'ok' },
];

const FUEL_LEVELS: { value: VehicleFuelLevel; label: string; icon: string; pct: number }[] = [
  { value: 'vacio', label: 'Vacío', icon: '🔴', pct: 0 },
  { value: 'cuarto', label: '1/4', icon: '🟠', pct: 25 },
  { value: 'medio', label: '1/2', icon: '🟡', pct: 50 },
  { value: 'tres_cuartos', label: '3/4', icon: '🟢', pct: 75 },
  { value: 'lleno', label: 'Lleno', icon: '🟢', pct: 100 },
];

const CONDITION_BADGE: Record<VehicleCondition, { label: string; cls: string; icon: string }> = {
  operativo: { label: 'Operativo', cls: 'bg-green-100 text-green-700', icon: '🟢' },
  con_observaciones: { label: 'Con observaciones', cls: 'bg-yellow-100 text-yellow-700', icon: '🟡' },
  fuera_de_servicio: { label: 'Fuera de servicio', cls: 'bg-red-100 text-red-700', icon: '🔴' },
};

const VEHICLE_ICON: Record<string, string> = {
  camion: '🚛', camioneta: '🛻', auto: '🚗', maquinaria: '🏗️', moto: '🏍️', otro: '🚐',
  'Camioneta': '🛻', 'Camión': '🚛', 'Equipo': '🏗️', 'Mini cargadora': '🏗️', 'Retroexcavadora': '🏗️', 'Batán': '🛢️',
};

const today = () => new Date().toISOString().slice(0, 10);

type ViewMode = 'list' | 'form' | 'detail' | 'qr';

// ── QR Generator Component ──
const QRCodeDisplay: React.FC<{ vehicleId: string; vehicle: FuelVehicle }> = ({ vehicleId, vehicle }) => {
  const appUrl = (import.meta as any).env?.VITE_APP_URL || window.location.origin;
  const qrUrl = `${appUrl}/checkin/${vehicleId}`;
  // Generate a simple SVG QR-like visual (real QR will use qrcode.react if installed)
  const [qrSvg, setQrSvg] = useState<string | null>(null);

  React.useEffect(() => {
    // Dynamically try to load qrcode library
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(qrUrl, { width: 280, margin: 2, color: { dark: '#0f172a', light: '#ffffff' } })
        .then((url: string) => setQrSvg(url))
        .catch(() => setQrSvg(null));
    }).catch(() => setQrSvg(null));
  }, [qrUrl]);

  return (
    <div className="light-card p-6 text-center space-y-4 max-w-md mx-auto">
      <div className="flex items-center justify-center gap-2 text-lg font-bold text-gray-800">
        <QrCode size={24} className="text-ecar-blue" />
        QR — Parte Diario
      </div>
      <div className="flex items-center justify-center gap-3 bg-gray-50 rounded-lg p-3">
        <span className="text-2xl">{VEHICLE_ICON[vehicle.vehicle_type] || '🚐'}</span>
        <div className="text-left">
          <p className="font-bold text-sm text-gray-800">{vehicle.code} — {vehicle.description}</p>
          {vehicle.plate && <p className="font-mono text-xs text-gray-500">{vehicle.plate}</p>}
        </div>
      </div>
      
      {qrSvg ? (
        <img src={qrSvg} alt="QR Code" className="mx-auto rounded-lg border border-gray-200 shadow-sm" />
      ) : (
        <div className="w-[280px] h-[280px] mx-auto bg-gray-100 rounded-lg flex flex-col items-center justify-center border-2 border-dashed border-gray-300">
          <QrCode size={80} className="text-gray-300 mb-2" />
          <p className="text-xs text-gray-400 font-medium">Instalá `qrcode` para generar</p>
          <p className="text-[10px] text-gray-400 mt-1">npm i qrcode @types/qrcode</p>
        </div>
      )}
      
      <p className="text-xs text-gray-400 break-all font-mono bg-gray-50 p-2 rounded-lg">{qrUrl}</p>
      
      {qrSvg && (
        <a
          href={qrSvg}
          download={`QR-${vehicle.code}-${vehicle.plate || 'sin-patente'}.png`}
          className="inline-flex items-center gap-2 bg-ecar-blue text-white px-5 py-2.5 rounded-lg font-bold text-sm shadow-md hover:bg-ecar-blueDark transition-all"
        >
          <Download size={16} /> Descargar QR
        </a>
      )}
      
      <p className="text-xs text-gray-500">
        Imprimí este QR y pegalo en el vehículo.<br />
        El chofer lo escanea para completar el parte diario.
      </p>
    </div>
  );
};

// ── Report Form Component ──
const ReportForm: React.FC<{
  vehicles: FuelVehicle[];
  projects: any[];
  preselectedVehicleId?: string;
  onClose: () => void;
}> = ({ vehicles, projects, preselectedVehicleId, onClose }) => {
  const createReport = useCreateVehicleDailyReport();
  const [vehicleId, setVehicleId] = useState(preselectedVehicleId || '');
  const [driverName, setDriverName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [odometerKm, setOdometerKm] = useState('');
  const [fuelLevel, setFuelLevel] = useState<VehicleFuelLevel>('medio');
  const [checklist, setChecklist] = useState<VehicleChecklistItem[]>(DEFAULT_CHECKLIST.map(c => ({ ...c })));
  const [hasDamage, setHasDamage] = useState(false);
  const [damageDescription, setDamageDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [signedBy, setSignedBy] = useState('');
  const [showChecklist, setShowChecklist] = useState(true);

  const selectedVehicle = vehicles.find(v => v.id === vehicleId);
  
  // Auto-fill driver from vehicle
  React.useEffect(() => {
    if (selectedVehicle?.default_driver && !driverName) {
      setDriverName(selectedVehicle.default_driver);
    }
  }, [selectedVehicle]);

  const faultsCount = checklist.filter(c => c.estado === 'falla').length;
  const kmValue = odometerKm ? parseFloat(odometerKm) : null;
  const kmInvalid = kmValue !== null && selectedVehicle?.tracking_type !== 'hours' && selectedVehicle?.current_km != null && kmValue < selectedVehicle.current_km;
  const hoursInvalid = kmValue !== null && selectedVehicle?.tracking_type === 'hours' && selectedVehicle?.current_hours != null && kmValue < selectedVehicle.current_hours;
  const isInvalid = kmInvalid || hoursInvalid;
  const computedCondition: VehicleCondition = (hasDamage || faultsCount > 0)
      ? 'con_observaciones'
      : 'operativo';

  const toggleCheckItem = (idx: number) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, estado: c.estado === 'ok' ? 'falla' : 'ok' } : c));
  };

  const setCheckNote = (idx: number, nota: string) => {
    setChecklist(prev => prev.map((c, i) => i === idx ? { ...c, nota } : c));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vehicleId || !driverName.trim() || isInvalid) return;

    await createReport.mutateAsync({
      vehicle_id: vehicleId,
      report_date: today(),
      driver_name: driverName.trim(),
      project_id: projectId || null,
      odometer_km: selectedVehicle?.tracking_type === 'hours' ? null : (odometerKm ? parseInt(odometerKm) : null),
      hourmeter: selectedVehicle?.tracking_type === 'hours' ? (odometerKm ? parseFloat(odometerKm) : null) : null,
      fuel_level: fuelLevel,
      checklist,
      has_damage: hasDamage,
      damage_description: hasDamage ? damageDescription : null,
      damage_photos: [],
      observations: observations.trim() || null,
      signed_by: signedBy.trim() || driverName.trim(),
      vehicle_condition_after: computedCondition,
      source: 'web',
    });

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Vehicle + Driver */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Vehículo *</label>
          <select
            value={vehicleId}
            onChange={e => setVehicleId(e.target.value)}
            disabled={!!preselectedVehicleId}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue disabled:bg-gray-100"
            required
          >
            <option value="">Seleccioná un vehículo...</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>
                {VEHICLE_ICON[v.vehicle_type] || '🚐'} {v.code} — {v.description} {v.plate ? `(${v.plate})` : ''}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Chofer / Responsable *</label>
          <input
            value={driverName}
            onChange={e => setDriverName(e.target.value)}
            placeholder="Nombre del chofer"
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
            required
          />
        </div>
      </div>

      {/* Project + km */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Obra / Proyecto</label>
          <select
            value={projectId}
            onChange={e => setProjectId(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Sin asignar</option>
            {projects.filter(p => p.status === 'active').map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">{selectedVehicle?.tracking_type === 'hours' ? 'Hs Horómetro' : 'Km Odómetro'}</label>
          <input
            type="number"
            step={selectedVehicle?.tracking_type === 'hours' ? "0.1" : "1"}
            value={odometerKm}
            onChange={e => setOdometerKm(e.target.value)}
            min={selectedVehicle?.tracking_type === 'hours' ? (selectedVehicle.current_hours || 0) : (selectedVehicle?.current_km || 0)}
            placeholder={selectedVehicle?.tracking_type === 'hours'
              ? (selectedVehicle.current_hours ? `Mínimo: ${selectedVehicle.current_hours.toLocaleString()} hs` : '0')
              : (selectedVehicle?.current_km ? `Mínimo: ${selectedVehicle.current_km.toLocaleString()} km` : '0')}
            className={`w-full px-3 py-2.5 rounded-xl text-sm font-mono focus:ring-2 border ${
              isInvalid
                ? 'border-red-400 bg-red-50 text-red-700 focus:ring-red-200 focus:border-red-400'
                : 'border-gray-300 focus:ring-ecar-blue/30 focus:border-ecar-blue'
            }`}
          />
          {isInvalid && (
            <p className="text-[10px] text-red-600 mt-1 flex items-center gap-1 font-medium">
              <AlertTriangle size={10} /> No puede ser menor a {selectedVehicle?.tracking_type === 'hours' ? selectedVehicle.current_hours?.toLocaleString() + ' hs' : selectedVehicle?.current_km?.toLocaleString() + ' km'} (último registro)
            </p>
          )}
          {!isInvalid && odometerKm && (
            <p className="text-[10px] text-green-600 mt-1">
              ✓ +{(parseFloat(odometerKm) - (selectedVehicle?.tracking_type === 'hours' ? (selectedVehicle.current_hours || 0) : (selectedVehicle?.current_km || 0))).toLocaleString()} {selectedVehicle?.tracking_type === 'hours' ? 'hs' : 'km'} desde último registro
            </p>
          )}
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Fecha</label>
          <input
            type="date"
            value={today()}
            readOnly
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 font-mono"
          />
        </div>
      </div>

      {/* Fuel Level */}
      <div>
        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Nivel de Combustible</label>
        <div className="flex gap-2">
          {FUEL_LEVELS.map(fl => (
            <button
              key={fl.value}
              type="button"
              onClick={() => setFuelLevel(fl.value)}
              className={`flex-1 py-3 rounded-xl text-center text-sm font-bold transition-all border-2 ${
                fuelLevel === fl.value
                  ? 'border-ecar-blue bg-blue-50 text-ecar-blue shadow-sm'
                  : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
              }`}
            >
              <span className="text-lg block">{fl.icon}</span>
              <span className="text-[11px]">{fl.label}</span>
            </button>
          ))}
        </div>
        {/* Visual gauge */}
        <div className="mt-2 w-full bg-gray-100 h-3 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              fuelLevel === 'vacio' ? 'bg-red-500' : fuelLevel === 'cuarto' ? 'bg-orange-500' : fuelLevel === 'medio' ? 'bg-yellow-500' : 'bg-green-500'
            }`}
            style={{ width: `${FUEL_LEVELS.find(f => f.value === fuelLevel)?.pct || 0}%` }}
          />
        </div>
      </div>

      {/* Checklist */}
      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setShowChecklist(!showChecklist)}
          className="w-full p-4 bg-gray-50 flex items-center justify-between hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-2">
            <ClipboardCheck size={18} className="text-slate-600" />
            <span className="font-bold text-gray-800 text-sm">Checklist de Estado</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${faultsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {faultsCount > 0 ? `${faultsCount} falla${faultsCount > 1 ? 's' : ''}` : 'Todo OK'}
            </span>
          </div>
          {showChecklist ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
        </button>

        {showChecklist && (
          <div className="divide-y divide-gray-100">
            {checklist.map((item, idx) => (
              <div key={idx} className={`p-3 flex items-start gap-3 ${item.estado === 'falla' ? 'bg-red-50/50' : 'hover:bg-gray-50'} transition-colors`}>
                <button
                  type="button"
                  onClick={() => toggleCheckItem(idx)}
                  className={`mt-0.5 shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                    item.estado === 'ok'
                      ? 'bg-green-100 text-green-600 hover:bg-green-200'
                      : 'bg-red-100 text-red-600 hover:bg-red-200'
                  }`}
                >
                  {item.estado === 'ok' ? <CircleCheck size={18} /> : <CircleX size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${item.estado === 'falla' ? 'text-red-700' : 'text-gray-700'}`}>
                    {item.item}
                  </p>
                  {item.estado === 'falla' && (
                    <input
                      value={item.nota || ''}
                      onChange={e => setCheckNote(idx, e.target.value)}
                      placeholder="Detalle de la falla..."
                      className="w-full mt-1.5 px-3 py-1.5 border border-red-200 rounded-lg text-xs bg-white focus:ring-2 focus:ring-red-200 focus:border-red-300"
                    />
                  )}
                </div>
                <span className={`shrink-0 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  item.estado === 'ok' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {item.estado === 'ok' ? 'OK' : 'FALLA'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Damage Section */}
      <div className={`border rounded-xl p-4 transition-all ${hasDamage ? 'border-red-300 bg-red-50/30' : 'border-gray-200'}`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={hasDamage}
            onChange={e => setHasDamage(e.target.checked)}
            className="w-5 h-5 rounded-md border-gray-300 text-red-500 focus:ring-red-500"
          />
          <div>
            <span className="font-bold text-sm text-gray-800">¿Hay algo roto o dañado?</span>
            <p className="text-[11px] text-gray-500">Si el vehículo tiene un daño nuevo, marcá esta opción. Se generará un ticket de mantenimiento automáticamente.</p>
          </div>
        </label>

        {hasDamage && (
          <div className="mt-3 space-y-3 ml-8">
            <textarea
              value={damageDescription}
              onChange={e => setDamageDescription(e.target.value)}
              placeholder="Describí el daño o problema encontrado..."
              rows={3}
              className="w-full px-3 py-2 border border-red-200 rounded-xl text-sm focus:ring-2 focus:ring-red-200 focus:border-red-300"
              required
            />
            <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <Wrench size={16} className="text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700">
                <span className="font-bold">Se creará un ticket de mantenimiento automático</span> para este vehículo al guardar el reporte.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Observations + Signature */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Observaciones</label>
          <textarea
            value={observations}
            onChange={e => setObservations(e.target.value)}
            placeholder="Observaciones adicionales..."
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Firma (nombre completo)</label>
          <input
            value={signedBy}
            onChange={e => setSignedBy(e.target.value)}
            placeholder={driverName || 'Nombre del firmante'}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue"
          />
        </div>
      </div>

      {/* Computed condition preview */}
      <div className={`flex items-center gap-3 p-4 rounded-xl border ${
        computedCondition === 'operativo' ? 'bg-green-50 border-green-200' :
        computedCondition === 'con_observaciones' ? 'bg-yellow-50 border-yellow-200' :
        'bg-red-50 border-red-200'
      }`}>
        <span className="text-xl">{CONDITION_BADGE[computedCondition].icon}</span>
        <div>
          <p className="text-xs font-bold text-gray-500 uppercase">Estado resultante del vehículo</p>
          <p className={`font-bold text-sm ${
            computedCondition === 'operativo' ? 'text-green-700' :
            computedCondition === 'con_observaciones' ? 'text-yellow-700' : 'text-red-700'
          }`}>{CONDITION_BADGE[computedCondition].label}</p>
        </div>
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={createReport.isPending || !vehicleId || !driverName.trim() || kmInvalid}
        className="w-full bg-gradient-to-r from-slate-700 to-slate-800 text-white py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg hover:from-slate-800 hover:to-slate-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {createReport.isPending ? (
          <><div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Guardando...</>
        ) : (
          <><ClipboardCheck size={18} /> Registrar Parte Diario</>
        )}
      </button>
    </form>
  );
};

// ── Detail View ──
const ReportDetail: React.FC<{ report: VehicleDailyReport; onClose: () => void }> = ({ report, onClose }) => {
  const condition = CONDITION_BADGE[report.vehicle_condition_after] || CONDITION_BADGE.operativo;
  const faultsCount = (report.checklist || []).filter(c => c.estado === 'falla').length;
  const fuelInfo = FUEL_LEVELS.find(f => f.value === report.fuel_level);

  return (
    <div className="space-y-4">
      <button onClick={onClose} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
        <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver a listado
      </button>

      <div className="light-card p-6 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-2xl">
              {VEHICLE_ICON[report.vehicle?.vehicle_type || ''] || '🚐'}
            </div>
            <div>
              <h3 className="font-bold text-gray-800">{report.vehicle?.code} — {report.vehicle?.description}</h3>
              <p className="text-xs text-gray-500">{report.report_date} · {report.driver_name} · {report.source.toUpperCase()}</p>
            </div>
          </div>
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${condition.cls}`}>
            {condition.icon} {condition.label}
          </span>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Obra</p>
            <p className="text-sm font-medium text-gray-800">{report.project?.name || 'Sin asignar'}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Medición</p>
            <p className="text-sm font-bold font-mono text-gray-800">
              {report.hourmeter ? `${report.hourmeter.toLocaleString()} hs` : (report.odometer_km ? `${report.odometer_km.toLocaleString()} km` : '—')}
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Combustible</p>
            <p className="text-sm font-medium text-gray-800">{fuelInfo?.icon} {fuelInfo?.label}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase">Firmado por</p>
            <p className="text-sm font-medium text-gray-800">{report.signed_by || report.driver_name}</p>
          </div>
        </div>

        {/* Checklist */}
        <div>
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
            <ClipboardCheck size={14} /> Checklist
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${faultsCount > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
              {faultsCount > 0 ? `${faultsCount} falla${faultsCount > 1 ? 's' : ''}` : 'Todo OK'}
            </span>
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {(report.checklist || []).map((item, idx) => (
              <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg text-sm ${item.estado === 'falla' ? 'bg-red-50 border border-red-100' : 'bg-gray-50'}`}>
                {item.estado === 'ok' ? <CircleCheck size={16} className="text-green-500 shrink-0" /> : <CircleX size={16} className="text-red-500 shrink-0" />}
                <span className={item.estado === 'falla' ? 'text-red-700 font-medium' : 'text-gray-700'}>{item.item}</span>
                {item.nota && <span className="text-[10px] text-red-500 ml-auto">({item.nota})</span>}
              </div>
            ))}
          </div>
        </div>

        {/* Damage */}
        {report.has_damage && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={16} className="text-red-600" />
              <span className="font-bold text-sm text-red-700">Daño Reportado</span>
            </div>
            <p className="text-sm text-red-700">{report.damage_description}</p>
          </div>
        )}

        {/* Observations */}
        {report.observations && (
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Observaciones</p>
            <p className="text-sm text-gray-700">{report.observations}</p>
          </div>
        )}
      </div>
    </div>
  );
};

// ── Main Module ──
export const VehicleDailyReportModule: React.FC<{ preselectedVehicleId?: string; onBack?: () => void }> = ({ preselectedVehicleId, onBack }) => {
  const [view, setView] = useState<ViewMode>(preselectedVehicleId ? 'form' : 'list');
  const [selectedReport, setSelectedReport] = useState<VehicleDailyReport | null>(null);
  const [qrVehicle, setQrVehicle] = useState<FuelVehicle | null>(null);
  const [filterVehicle, setFilterVehicle] = useState('');
  const [filterDamage, setFilterDamage] = useState(false);

  const { data: vehicles = [] } = useFuelVehicles();
  const { data: projects = [] } = useProjects();
  const { data: reports = [], isLoading } = useVehicleDailyReports();

  const filteredReports = useMemo(() => {
    let r = reports;
    if (filterVehicle) r = r.filter(rep => rep.vehicle_id === filterVehicle);
    if (filterDamage) r = r.filter(rep => rep.has_damage);
    return r;
  }, [reports, filterVehicle, filterDamage]);

  const todayReports = useMemo(() => reports.filter(r => r.report_date === today()), [reports]);
  const damageReports = useMemo(() => reports.filter(r => r.has_damage), [reports]);
  const vehiclesReportedToday = useMemo(() => new Set(todayReports.map(r => r.vehicle_id)), [todayReports]);

  // QR view
  if (view === 'qr' && qrVehicle) {
    return (
      <div className="space-y-4">
        <button onClick={() => { setView('list'); setQrVehicle(null); }} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver
        </button>
        <QRCodeDisplay vehicleId={qrVehicle.id} vehicle={qrVehicle} />
      </div>
    );
  }

  // Detail view
  if (view === 'detail' && selectedReport) {
    return <ReportDetail report={selectedReport} onClose={() => { setView('list'); setSelectedReport(null); }} />;
  }

  // Form view
  if (view === 'form') {
    return (
      <div className="space-y-4">
        <button onClick={() => { onBack ? onBack() : setView('list'); }} className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-ecar-blue transition-colors group">
          <ArrowLeft size={16} className="group-hover:-translate-x-0.5 transition-transform" /> Volver
        </button>
        <div className="light-card p-6">
          <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center gap-2">
            <ClipboardCheck size={20} className="text-ecar-blue" /> Nuevo Parte Diario Vehicular
          </h3>
          <ReportForm
            vehicles={vehicles}
            projects={projects}
            preselectedVehicleId={preselectedVehicleId}
            onClose={() => onBack ? onBack() : setView('list')}
          />
        </div>
      </div>
    );
  }

  // List view (default)
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-ecar-blueDark to-ecar-blue rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ClipboardCheck size={120} /></div>
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ClipboardCheck size={24} /> Parte Diario Vehicular</h3>
          <p className="text-ecar-blueLight text-sm mt-1">Inspección diaria con checklist, estado y generación de QR por vehículo.</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><ClipboardCheck size={16} className="text-ecar-blue" /> Reportes Hoy</div>
          <p className="text-2xl font-black text-ecar-blue font-mono">{todayReports.length}</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Truck size={16} className="text-sky-500" /> Vehículos Reportados</div>
          <p className="text-2xl font-black text-sky-600 font-mono">{vehiclesReportedToday.size} <span className="text-sm font-medium text-gray-400">/ {vehicles.length}</span></p>
        </div>
        <div className={`light-card p-5 ${damageReports.length > 0 ? 'border-red-200 bg-red-50/30' : 'border-gray-200'}`}>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><AlertTriangle size={16} className="text-red-500" /> Con Daños</div>
          <p className="text-2xl font-black text-red-600 font-mono">{damageReports.length}</p>
        </div>
        <div className="light-card p-5">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-2"><Calendar size={16} className="text-emerald-500" /> Total Reportes</div>
          <p className="text-2xl font-black text-emerald-600 font-mono">{reports.length}</p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setView('form')}
          className="btn-primary"
        >
          <Plus size={16} /> Nuevo Parte
        </button>

        {/* Filters */}
        <div className="flex-1 flex items-center gap-3 justify-end">
          <select
            value={filterVehicle}
            onChange={e => setFilterVehicle(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            <option value="">Todos los vehículos</option>
            {vehicles.map(v => (
              <option key={v.id} value={v.id}>{v.code} — {v.description}</option>
            ))}
          </select>
          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-50 transition-colors">
            <input
              type="checkbox"
              checked={filterDamage}
              onChange={e => setFilterDamage(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300 text-red-500 focus:ring-red-500"
            />
            <AlertTriangle size={14} className="text-red-500" /> Solo con daños
          </label>
        </div>
      </div>

      {/* Quick QR buttons */}
      <div className="light-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-bold text-gray-700 flex items-center gap-2"><QrCode size={16} className="text-ecar-blue" /> Generar QR por Vehículo</h4>
        </div>
        <div className="flex flex-wrap gap-2">
          {vehicles.map(v => (
            <button
              key={v.id}
              onClick={() => { setQrVehicle(v); setView('qr'); }}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold border transition-all hover:shadow-sm ${
                vehiclesReportedToday.has(v.id)
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-ecar-blueLight hover:bg-slate-50'
              }`}
            >
              <span>{VEHICLE_ICON[v.vehicle_type] || '🚐'}</span>
              {v.code}
              {vehiclesReportedToday.has(v.id) && <CheckCircle2 size={12} className="text-green-500" />}
              <QrCode size={12} className="text-gray-400" />
            </button>
          ))}
        </div>
      </div>

      {/* Reports Table */}
      <div className="light-card overflow-hidden">
        <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="font-bold text-gray-800">Historial de Reportes ({filteredReports.length})</h3>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-16"><div className="w-8 h-8 border-4 border-gray-200 border-t-slate-500 rounded-full animate-spin" /></div>
        ) : filteredReports.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <ClipboardCheck size={48} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium text-gray-500">No hay reportes aún</p>
            <p className="text-sm">Creá el primer parte diario vehicular</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th >Fecha</th>
                  <th >Vehículo</th>
                  <th >Chofer</th>
                  <th >Obra</th>
                  <th >Km</th>
                  <th >Combustible</th>
                  <th >Checklist</th>
                  <th >Daño</th>
                  <th >Estado</th>
                  <th ></th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map(r => {
                  const cond = CONDITION_BADGE[r.vehicle_condition_after] || CONDITION_BADGE.operativo;
                  const faults = (r.checklist || []).filter(c => c.estado === 'falla').length;
                  const fl = FUEL_LEVELS.find(f => f.value === r.fuel_level);
                  return (
                    <tr key={r.id} className={`hover:bg-gray-50 ${r.has_damage ? 'bg-red-50/30' : ''}`}>
                      <td className="font-mono text-xs">{r.report_date}</td>
                      <td >
                        <div className="flex items-center gap-2">
                          <span>{VEHICLE_ICON[r.vehicle?.vehicle_type || ''] || '🚐'}</span>
                          <div>
                            <p className="font-medium text-xs">{r.vehicle?.code}</p>
                            <p className="text-[10px] text-gray-400">{r.vehicle?.description}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">{r.driver_name}</td>
                      <td className="text-xs">{r.project?.name || '—'}</td>
                      <td className="font-mono text-xs">{r.hourmeter ? `${r.hourmeter.toLocaleString()} hs` : (r.odometer_km ? `${r.odometer_km.toLocaleString()} km` : '—')}</td>
                      <td className="text-xs">{fl?.icon} {fl?.label}</td>
                      <td >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${faults > 0 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                          {faults > 0 ? `${faults} fallas` : 'OK'}
                        </span>
                      </td>
                      <td >
                        {r.has_damage ? (
                          <span className="badge badge-danger"><AlertTriangle size={10} /> Sí</span>
                        ) : (
                          <span className="text-[10px] text-gray-400">—</span>
                        )}
                      </td>
                      <td >
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${cond.cls}`}>{cond.icon} {cond.label}</span>
                      </td>
                      <td >
                        <button
                          onClick={() => { setSelectedReport(r); setView('detail'); }}
                          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 transition-all"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
