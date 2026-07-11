// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline } from '@react-google-maps/api';
import { supabase } from '../../lib/supabase';
import { Loader2, Navigation, AlertTriangle, RefreshCw, Share2, Check } from 'lucide-react';

const VEHICLE_COLORS = [
  '#4F46E5', '#E11D48', '#059669', '#D97706', '#7C3AED', 
  '#2563EB', '#DC2626', '#16A34A', '#CA8A04', '#9333EA'
];

const getColorForVehicle = (vehicleId: string) => {
  let hash = 0;
  for (let i = 0; i < vehicleId.length; i++) {
    hash = vehicleId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return VEHICLE_COLORS[Math.abs(hash) % VEHICLE_COLORS.length];
};

const containerStyle = {
  width: '100%',
  height: '100%',
  borderRadius: '0.5rem'
};

const defaultCenter = {
  lat: -31.5375, // San Juan por defecto
  lng: -68.5363
};

interface ActiveVehicle {
  session_id: string;
  vehicle_id: string;
  driver_name: string;
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  last_update: string;
  vehicle_code?: string;
  vehicle_description?: string;
}

export const FleetTrackingMap: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeVehicles, setActiveVehicles] = useState<Record<string, ActiveVehicle>>({});
  const [selectedVehicle, setSelectedVehicle] = useState<ActiveVehicle | null>(null);
  const [copied, setCopied] = useState(false);
  const [routes, setRoutes] = useState<Record<string, {lat: number, lng: number}[]>>({});

  const channelRef = useRef<any>(null);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.origin + '/tracking');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Load initial active sessions from DB
  const loadActiveSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_tracking_sessions')
        .select(`
          id,
          vehicle_id,
          driver_name,
          last_lat,
          last_lng,
          last_heading,
          last_speed,
          last_update_at,
          fuel_vehicles(code, description)
        `)
        .eq('is_active', true)
        .not('last_lat', 'is', null);

      if (error) throw error;

      const sessions: Record<string, ActiveVehicle> = {};
      data?.forEach(d => {
        sessions[d.vehicle_id] = {
          session_id: d.id,
          vehicle_id: d.vehicle_id,
          driver_name: d.driver_name,
          lat: d.last_lat,
          lng: d.last_lng,
          heading: d.last_heading,
          speed: d.last_speed,
          last_update: d.last_update_at,
          vehicle_code: (d.fuel_vehicles as any)?.code,
          vehicle_description: (d.fuel_vehicles as any)?.description
        };
      });

      setActiveVehicles(sessions);
      
      if (data && data.length > 0) {
        const sessionIds = data.map(d => d.id);
        const { data: pointsData } = await supabase
          .from('vehicle_tracking_points')
          .select('vehicle_id, lat, lng')
          .in('session_id', sessionIds)
          .order('recorded_at', { ascending: true });
          
        const groupedRoutes: Record<string, {lat: number, lng: number}[]> = {};
        
        if (pointsData) {
          pointsData.forEach(p => {
             if (!groupedRoutes[p.vehicle_id]) groupedRoutes[p.vehicle_id] = [];
             groupedRoutes[p.vehicle_id].push({lat: p.lat, lng: p.lng});
          });
        }
        
        data.forEach(d => {
          if (!groupedRoutes[d.vehicle_id]) groupedRoutes[d.vehicle_id] = [];
          if (d.last_lat && d.last_lng) {
            groupedRoutes[d.vehicle_id].push({ lat: d.last_lat, lng: d.last_lng });
          }
        });
        
        setRoutes(groupedRoutes);
      }
      
      // Auto-center on first load if vehicles exist and map exists
      if (data && data.length > 0 && map && window.google) {
        try {
          const bounds = new window.google.maps.LatLngBounds();
          data.forEach(d => {
            if (d.last_lat && d.last_lng) {
              bounds.extend({ lat: d.last_lat, lng: d.last_lng });
            }
          });
          map.fitBounds(bounds);
        } catch (e) {
          console.warn('Could not fit bounds', e);
        }
      }
      
    } catch (err) {
      console.error('Error cargando sesiones activas:', err);
    }
  };

  useEffect(() => {
    loadActiveSessions();

    // Suscribirse a Broadcasts
    const channel = supabase.channel('fleet-tracking');
    
    channel.on('broadcast', { event: 'location_update' }, (payload) => {
      const data = payload.payload;
      
      setActiveVehicles(prev => ({
        ...prev,
        [data.vehicle_id]: {
          ...(prev[data.vehicle_id] || {}),
          vehicle_id: data.vehicle_id,
          driver_name: data.driver_name,
          lat: data.lat,
          lng: data.lng,
          heading: data.heading,
          speed: data.speed,
          last_update: data.timestamp
        }
      }));

      setRoutes(prev => {
        const vehicleRoutes = prev[data.vehicle_id] || [];
        return {
          ...prev,
          [data.vehicle_id]: [...vehicleRoutes, { lat: data.lat, lng: data.lng }]
        };
      });
    }).subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map]);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <div className="bg-red-50 text-red-700 p-6 rounded-lg border border-red-200 flex flex-col items-center justify-center h-full">
        <AlertTriangle className="w-8 h-8 mb-3" />
        <p className="font-bold">Error cargando el mapa</p>
        <p className="text-sm">Verificá que la API Key de Google Maps sea válida y tenga la API habilitada.</p>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-gray-500">
        <Loader2 className="w-8 h-8 animate-spin mb-3 text-indigo-600" />
        <p>Cargando mapas...</p>
      </div>
    );
  }

  const vehiclesList = Object.values(activeVehicles);

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <Navigation className="w-5 h-5 text-indigo-600" />
            Rastreo Satelital en Vivo
          </h2>
          <p className="text-sm text-gray-500">
            {vehiclesList.length} vehículo{vehiclesList.length !== 1 ? 's' : ''} en tránsito
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleCopyLink}
            className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Share2 className="w-3.5 h-3.5" />}
            {copied ? 'Copiado' : 'Compartir'}
          </button>
          <button 
            onClick={loadActiveSessions}
            className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-indigo-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Sincronizar
          </button>
        </div>
      </div>
      
      <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex relative">
        {/* Sidebar Lista */}
        <div className="w-64 border-r border-gray-200 bg-gray-50 flex flex-col">
          <div className="p-3 border-b border-gray-200 bg-white">
            <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider">Unidades Activas</h3>
          </div>
          <div className="flex-1 overflow-y-auto">
            {vehiclesList.length === 0 ? (
              <div className="p-4 text-center text-sm text-gray-500 mt-4">
                No hay vehículos transmitiendo en este momento.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {vehiclesList.map(v => (
                  <div 
                    key={v.vehicle_id}
                    onClick={() => {
                      setSelectedVehicle(v);
                      if (map) map.panTo({ lat: v.lat, lng: v.lng });
                    }}
                    className={`p-3 cursor-pointer hover:bg-indigo-50 transition-colors ${selectedVehicle?.vehicle_id === v.vehicle_id ? 'bg-indigo-50 border-l-4 border-indigo-500' : 'border-l-4 border-transparent'}`}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: getColorForVehicle(v.vehicle_id) }}></div>
                        {v.vehicle_code || 'Unidad'}
                      </span>
                      <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded font-medium">
                        {v.speed ? Math.round(v.speed * 3.6) : 0} km/h
                      </span>
                    </div>
                    <p className="text-xs text-gray-600">{v.driver_name}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Mapa */}
        <div className="flex-1 relative">
          <GoogleMap
            mapContainerStyle={containerStyle}
            center={defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
            }}
          >
            {vehiclesList.map((v) => (
              <Marker
                key={v.vehicle_id}
                position={{ lat: v.lat, lng: v.lng }}
                onClick={() => setSelectedVehicle(v)}
                icon={{
                  // window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW == 4
                  path: 4,
                  scale: 5,
                  fillColor: v.speed && v.speed > 0 ? '#10B981' : '#F59E0B',
                  fillOpacity: 1,
                  strokeWeight: 2,
                  strokeColor: '#FFFFFF',
                  rotation: v.heading || 0
                }}
              />
            ))}

            {Object.entries(routes).map(([vehicleId, path]) => 
              path.length > 0 && (
                <Polyline
                  key={`route-${vehicleId}`}
                  path={path}
                  options={{
                    strokeColor: getColorForVehicle(vehicleId),
                    strokeOpacity: 0.8,
                    strokeWeight: selectedVehicle?.vehicle_id === vehicleId ? 6 : 4,
                    zIndex: selectedVehicle?.vehicle_id === vehicleId ? 10 : 1
                  }}
                />
              )
            )}

            {selectedVehicle && (
              <InfoWindow
                position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                onCloseClick={() => setSelectedVehicle(null)}
              >
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-gray-900 border-b pb-1 mb-2">
                    {selectedVehicle.vehicle_code || 'Unidad'}
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <p className="flex justify-between gap-4">
                      <span className="text-gray-500">Conductor:</span>
                      <span className="font-medium text-gray-800">{selectedVehicle.driver_name}</span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-gray-500">Velocidad:</span>
                      <span className="font-medium text-gray-800">
                        {selectedVehicle.speed ? Math.round(selectedVehicle.speed * 3.6) : 0} km/h
                      </span>
                    </p>
                    <p className="flex justify-between gap-4">
                      <span className="text-gray-500">Act:</span>
                      <span className="font-medium text-gray-800">
                        {new Date(selectedVehicle.last_update).toLocaleTimeString()}
                      </span>
                    </p>
                  </div>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
        </div>
      </div>
    </div>
  );
};
