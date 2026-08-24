import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Fuel, QrCode } from 'lucide-react';
import type { VehicleDailyReport, FuelLoad } from '../lib/types';

export const VehicleExpandedData: React.FC<{ vehicleId: string }> = ({ vehicleId }) => {
  const { data: qrs, isLoading: loadingQrs } = useQuery<VehicleDailyReport[]>({
    queryKey: ['vehicle_qrs', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicle_daily_reports')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('report_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  const { data: fuels, isLoading: loadingFuels } = useQuery<FuelLoad[]>({
    queryKey: ['vehicle_fuels', vehicleId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fuel_loads')
        .select('*')
        .eq('vehicle_id', vehicleId)
        .order('load_date', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data || [];
    }
  });

  return (
    <div className="mt-3 ml-14 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2 mb-3">
          <QrCode size={16} className="text-ecar-blue" />
          Últimos Registros QR
        </h4>
        {loadingQrs ? (
          <p className="text-xs text-gray-400">Cargando...</p>
        ) : qrs && qrs.length > 0 ? (
          <ul className="space-y-2">
            {qrs.map(qr => (
              <li key={qr.id} className="text-xs flex items-center justify-between border-b border-gray-50 pb-1">
                <span className="font-mono text-gray-500">{qr.report_date}</span>
                <span className="font-medium">{qr.driver_name}</span>
                <span className={`px-1.5 py-0.5 rounded font-bold ${qr.vehicle_condition_after === 'operativo' ? 'bg-green-100 text-green-700' : qr.vehicle_condition_after === 'con_observaciones' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>
                  {qr.vehicle_condition_after}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">No hay registros recientes.</p>
        )}
      </div>

      <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-sm">
        <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2 mb-3">
          <Fuel size={16} className="text-amber-500" />
          Últimas Cargas de Combustible
        </h4>
        {loadingFuels ? (
          <p className="text-xs text-gray-400">Cargando...</p>
        ) : fuels && fuels.length > 0 ? (
          <ul className="space-y-2">
            {fuels.map(f => (
              <li key={f.id} className="text-xs flex items-center justify-between border-b border-gray-50 pb-1">
                <span className="font-mono text-gray-500">{f.load_date}</span>
                <span className="font-medium text-amber-700">{f.liters} L</span>
                <span className="text-gray-500">{(f.odometer_km || f.hourmeter || 0).toLocaleString()} {f.odometer_km ? 'km' : 'hs'}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-400">No hay cargas recientes.</p>
        )}
      </div>
    </div>
  );
};
