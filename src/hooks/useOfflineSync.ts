import { useEffect } from 'react';
import { useOfflineStore } from '../store/useOfflineStore';
import { supabase } from '../lib/supabase';

export function useOfflineSync() {
  const { dailyReportsQueue, removeDailyReport } = useOfflineStore();

  useEffect(() => {
    const handleOnline = async () => {
      if (dailyReportsQueue.length === 0) return;
      
      console.log(`[OfflineSync] Connection restored. Syncing ${dailyReportsQueue.length} items...`);
      
      for (const report of dailyReportsQueue) {
        try {
          const { offline_id, saved_at, ...payload } = report;
          
          // 1. Insert report
          const { error: insertErr } = await supabase.from('vehicle_daily_reports').insert(payload);
          if (insertErr) throw insertErr;

          // 2. Update vehicle condition
          const vehicleUpdates: Record<string, unknown> = {
            vehicle_condition: payload.vehicle_condition_after,
          };
          if (payload.odometer_km) vehicleUpdates.current_km = payload.odometer_km;
          if (payload.has_damage && payload.damage_description) {
            vehicleUpdates.next_maintenance_date = payload.report_date;
            vehicleUpdates.maintenance_notes = `[REPORTE OFFLINE] ${payload.damage_description.substring(0, 200)}`;
          }
          await supabase.from('fuel_vehicles').update(vehicleUpdates).eq('id', payload.vehicle_id);

          console.log(`[OfflineSync] Successfully synced report ${offline_id}`);
          removeDailyReport(offline_id);
        } catch (error) {
          console.error(`[OfflineSync] Failed to sync report ${report.offline_id}`, error);
        }
      }
    };

    window.addEventListener('online', handleOnline);
    
    // Also try to sync right now if we are online and have items
    if (navigator.onLine && dailyReportsQueue.length > 0) {
      handleOnline();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [dailyReportsQueue, removeDailyReport]);
}
