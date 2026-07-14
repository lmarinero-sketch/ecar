// @ts-nocheck
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Polyline, DirectionsRenderer } from '@react-google-maps/api';
import { supabase } from '../../lib/supabase';
import { Loader2, Navigation, AlertTriangle, RefreshCw, Share2, Check, HelpCircle, X, MapPin, MousePointerClick, Smartphone, Clock, Calendar, Truck } from 'lucide-react';

const VEHICLE_COLORS = [
  '#4F46E5', '#E11D48', '#059669', '#D97706', '#7C3AED', 
  '#2563EB', '#DC2626', '#16A34A', '#CA8A04', '#9333EA'
];

const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371; // km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

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
  destination_lat?: number | null;
  destination_lng?: number | null;
}

const SPEED_LIMIT = 110;

export const FleetTrackingMap: React.FC = () => {
  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });

  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeVehicles, setActiveVehicles] = useState<Record<string, ActiveVehicle>>({});
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const selectedVehicle = selectedVehicleId ? activeVehicles[selectedVehicleId] : null;
  const [copied, setCopied] = useState(false);
  const [routes, setRoutes] = useState<Record<string, {lat: number, lng: number}[]>>({});
  const [assigningDestinationFor, setAssigningDestinationFor] = useState<string | null>(null);
  const [tempDestination, setTempDestination] = useState<{lat: number, lng: number} | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  
  // History State
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historySessions, setHistorySessions] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<{ 
    session: any, 
    points: {lat: number, lng: number}[],
    kpis?: { distance: string, time: string, avgSpeed: number, maxSpeed: number, violations: number }
  } | null>(null);
  
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsFetchedFor, setDirectionsFetchedFor] = useState<string | null>(null);

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

  const loadHistorySessions = async () => {
    setLoadingHistory(true);
    try {
      const { data, error } = await supabase
        .from('vehicle_tracking_sessions')
        .select(`
          id,
          vehicle_id,
          driver_name,
          started_at,
          ended_at,
          total_distance_km,
          fuel_vehicles(code, description)
        `)
        .order('started_at', { ascending: false })
        .limit(30);
        
      if (error) throw error;
      setHistorySessions(data || []);
    } catch (err) {
      console.error('Error loading history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectHistorySession = async (session: any) => {
    setShowHistoryModal(false);
    try {
      const { data, error } = await supabase
        .from('vehicle_tracking_points')
        .select('lat, lng, speed, recorded_at')
        .eq('session_id', session.id)
        .order('recorded_at', { ascending: true });
        
      if (error) throw error;
      
      let totalDistance = 0;
      let maxSpeed = 0;
      let violations = 0;
      let sumSpeed = 0;
      let validSpeedCount = 0;

      const points = data.map((p: any, index: number) => {
        if (index > 0) {
          totalDistance += calculateDistance(data[index-1].lat, data[index-1].lng, p.lat, p.lng);
        }
        
        const speedKmh = p.speed ? p.speed * 3.6 : 0;
        if (speedKmh > 0) {
          sumSpeed += speedKmh;
          validSpeedCount++;
        }
        
        if (speedKmh > maxSpeed) maxSpeed = speedKmh;
        if (speedKmh > SPEED_LIMIT) violations++;
        
        return p;
      });
      
      const avgSpeed = validSpeedCount > 0 ? (sumSpeed / validSpeedCount) : 0;
      
      let totalTimeStr = "00:00:00";
      if (data.length > 0) {
        const start = new Date(data[0].recorded_at).getTime();
        const end = new Date(data[data.length - 1].recorded_at).getTime();
        const diffSeconds = Math.floor((end - start) / 1000);
        
        const h = Math.floor(diffSeconds / 3600);
        const m = Math.floor((diffSeconds % 3600) / 60);
        const s = diffSeconds % 60;
        totalTimeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
      }
      
      setSelectedHistory({
        session,
        points: points.map((p: any) => ({ lat: p.lat, lng: p.lng })),
        kpis: {
          distance: totalDistance.toFixed(2),
          time: totalTimeStr,
          avgSpeed: Math.round(avgSpeed),
          maxSpeed: Math.round(maxSpeed),
          violations
        }
      });
      
      if (data && data.length > 0 && map && window.google) {
        const bounds = new window.google.maps.LatLngBounds();
        data.forEach((p: any) => bounds.extend({ lat: p.lat, lng: p.lng }));
        map.fitBounds(bounds);
      }
    } catch(err) {
      console.error(err);
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
    });

    channel.on('broadcast', { event: 'new_destination' }, (payload) => {
      const data = payload.payload;
      setActiveVehicles(prev => {
        if (!prev[data.vehicle_id]) return prev;
        return {
          ...prev,
          [data.vehicle_id]: {
            ...prev[data.vehicle_id],
            destination_lat: data.destination_lat,
            destination_lng: data.destination_lng
          }
        };
      });
    }).subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  }, [map]);

  useEffect(() => {
    if (selectedVehicle && selectedVehicle.destination_lat && selectedVehicle.destination_lng && isLoaded && window.google) {
      const destString = `${selectedVehicle.vehicle_id}-${selectedVehicle.destination_lat}-${selectedVehicle.destination_lng}`;
      if (directionsFetchedFor === destString) return; 

      const directionsService = new window.google.maps.DirectionsService();
      directionsService.route({
        origin: { lat: selectedVehicle.lat, lng: selectedVehicle.lng },
        destination: { lat: selectedVehicle.destination_lat, lng: selectedVehicle.destination_lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      }, (result, status) => {
        if (status === window.google.maps.DirectionsStatus.OK) {
          setDirections(result);
          setDirectionsFetchedFor(destString);
        }
      });
    } else if (!selectedVehicle || !selectedVehicle.destination_lat) {
       setDirections(null);
       setDirectionsFetchedFor(null);
    }
  }, [selectedVehicle, isLoaded, directionsFetchedFor]);

  const onLoad = useCallback(function callback(mapInstance: google.maps.Map) {
    setMap(mapInstance);
  }, []);

  const onUnmount = useCallback(function callback() {
    setMap(null);
  }, []);

  const onMapClick = async (e: google.maps.MapMouseEvent) => {
    if (assigningDestinationFor && e.latLng) {
      setTempDestination({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    }
  };

  const handleConfirmDestination = async (lat: number, lng: number) => {
    if (!assigningDestinationFor) return;
    
    const vehicle = activeVehicles[assigningDestinationFor];
    const vehicleId = assigningDestinationFor;
    
    if (!vehicle) return;

    // Optimistic update
    setActiveVehicles(prev => ({
      ...prev,
      [vehicleId]: {
        ...prev[vehicleId],
        destination_lat: lat,
        destination_lng: lng
      }
    }));
    
    setAssigningDestinationFor(null);
    setTempDestination(null);
    
    // Update DB
    await supabase
      .from('vehicle_tracking_sessions')
      .update({ destination_lat: lat, destination_lng: lng })
      .eq('id', vehicle.session_id);
      
    // Broadcast to driver
    if (channelRef.current) {
      channelRef.current.send({
        type: 'broadcast',
        event: 'new_destination',
        payload: {
          vehicle_id: vehicleId,
          destination_lat: lat,
          destination_lng: lng
        }
      });
    }
  };

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
            onClick={() => {
              setShowHistoryModal(true);
              loadHistorySessions();
            }}
            className="text-xs flex items-center gap-1.5 text-gray-500 hover:text-purple-600 transition-colors bg-white px-3 py-1.5 rounded-lg border border-gray-200 shadow-sm"
          >
            <Clock className="w-3.5 h-3.5" />
            Historial
          </button>
          <button 
            onClick={() => setShowTutorial(true)}
            className="text-xs flex items-center gap-1.5 text-indigo-600 hover:text-indigo-800 transition-colors bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 shadow-sm font-medium"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            ¿Cómo asignar rutas?
          </button>
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
      
      <div className="flex-1 light-card overflow-hidden flex relative">
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
                {vehiclesList.map(v => {
                  const speedKmh = v.speed ? Math.round(v.speed * 3.6) : 0;
                  const isOverSpeed = speedKmh > SPEED_LIMIT;
                  
                  return (
                    <div 
                      key={v.vehicle_id}
                      onClick={() => {
                        if (assigningDestinationFor) return; 
                        setSelectedVehicleId(v.vehicle_id);
                        if (map) map.panTo({ lat: v.lat, lng: v.lng });
                      }}
                      className={`p-3 cursor-pointer transition-colors ${
                        selectedVehicleId === v.vehicle_id 
                          ? (isOverSpeed ? 'bg-red-50 border-l-4 border-red-500' : 'bg-indigo-50 border-l-4 border-indigo-500')
                          : (isOverSpeed ? 'bg-red-50/50 border-l-4 border-transparent hover:bg-red-50' : 'border-l-4 border-transparent hover:bg-indigo-50')
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-gray-800 text-sm flex items-center gap-1.5">
                          <div className={`w-2.5 h-2.5 rounded-full ${isOverSpeed ? 'bg-red-600 animate-pulse' : ''}`} style={{ backgroundColor: isOverSpeed ? undefined : getColorForVehicle(v.vehicle_id) }}></div>
                          {v.vehicle_code || 'Unidad'}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isOverSpeed ? 'bg-red-100 text-red-700 animate-pulse border border-red-200' : 'bg-green-100 text-green-700'}`}>
                          {speedKmh} km/h
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">{v.driver_name}</p>
                      {isOverSpeed && (
                        <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Exceso de velocidad
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Mapa */}
        <div className="flex-1 relative">
          {selectedHistory && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-full shadow-lg font-bold text-sm z-20 flex items-center gap-4 animate-in slide-in-from-top">
              <span className="flex items-center gap-2">
                <Clock className="w-4 h-4" /> 
                Historial: {(selectedHistory.session.fuel_vehicles as any)?.code || 'Unidad'} 
                <span className="font-normal opacity-80">
                  ({new Date(selectedHistory.session.started_at).toLocaleString()})
                </span>
              </span>
              <button 
                onClick={() => {
                  setSelectedHistory(null);
                  if (map && vehiclesList.length > 0 && window.google) {
                    const bounds = new window.google.maps.LatLngBounds();
                    vehiclesList.forEach(v => {
                      if (v.lat && v.lng) bounds.extend({ lat: v.lat, lng: v.lng });
                    });
                    map.fitBounds(bounds);
                  }
                }} 
                className="bg-purple-800 hover:bg-purple-900 rounded-full p-1.5 transition-colors"
                title="Cerrar historial"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <GoogleMap
            mapContainerStyle={{...containerStyle, cursor: assigningDestinationFor ? 'crosshair' : 'default'}}
            center={defaultCenter}
            zoom={12}
            onLoad={onLoad}
            onUnmount={onUnmount}
            onClick={onMapClick}
            options={{
              disableDefaultUI: false,
              zoomControl: true,
              streetViewControl: false,
              mapTypeControl: true,
            }}
          >
            {assigningDestinationFor && (
              <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg font-bold text-sm z-10 animate-pulse pointer-events-none">
                Hacé clic en el mapa para marcar el destino...
              </div>
            )}
            
            {assigningDestinationFor && tempDestination && (
              <InfoWindow
                position={tempDestination}
                onCloseClick={() => setTempDestination(null)}
              >
                <div className="p-2 text-center">
                  <p className="text-sm font-medium text-gray-800 mb-2">¿Confirmar destino?</p>
                  <button
                    onClick={() => handleConfirmDestination(tempDestination.lat, tempDestination.lng)}
                    className="bg-indigo-600 text-white px-4 py-2 rounded font-bold hover:bg-indigo-700 w-full"
                  >
                    Ir aquí
                  </button>
                </div>
              </InfoWindow>
            )}

            {/* Historical Path Rendering */}
            {selectedHistory && selectedHistory.points.length > 0 && (
              <>
                <Polyline
                  path={selectedHistory.points}
                  options={{
                    strokeColor: '#8B5CF6',
                    strokeOpacity: 0.9,
                    strokeWeight: 6,
                    zIndex: 50
                  }}
                />
                <Marker 
                  position={selectedHistory.points[0]}
                  icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/green-dot.png' }}
                  title="Inicio"
                />
                <Marker 
                  position={selectedHistory.points[selectedHistory.points.length - 1]}
                  icon={{ url: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png' }}
                  title="Fin"
                />
              </>
            )}

            {/* Live Vehicles */}
            {!selectedHistory && vehiclesList.map((v) => {
              const speedKmh = v.speed ? Math.round(v.speed * 3.6) : 0;
              const isOverSpeed = speedKmh > SPEED_LIMIT;
              return (
                <Marker
                  key={v.vehicle_id}
                  position={{ lat: v.lat, lng: v.lng }}
                  onClick={() => setSelectedVehicleId(v.vehicle_id)}
                  icon={{
                    path: 'M 0 -1 L 1 0 L 0 1 L -1 0 Z', // Rombo
                    scale: isOverSpeed ? 12 : 10,
                    fillColor: isOverSpeed ? '#DC2626' : (speedKmh > 0 ? '#10B981' : '#F59E0B'),
                    fillOpacity: 1,
                    strokeWeight: 1.5,
                    strokeColor: '#FFFFFF',
                    rotation: v.heading || 0
                  }}
                />
              );
            })}

            {/* Renderizar destinos */}
            {!selectedHistory && vehiclesList.map((v) => (
              v.destination_lat && v.destination_lng && (
                <Marker
                  key={`dest-${v.vehicle_id}`}
                  position={{ lat: v.destination_lat, lng: v.destination_lng }}
                  icon={{
                    url: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png'
                  }}
                  title={`Destino: ${v.vehicle_code || 'Unidad'}`}
                />
              )
            ))}

            {/* Líneas de ruta para vehículos en vivo */}
            {!selectedHistory && Object.entries(routes).map(([vehicleId, path]) => 
              path.length > 0 && (
                <Polyline
                  key={`route-${vehicleId}`}
                  path={path}
                  options={{
                    strokeColor: getColorForVehicle(vehicleId),
                    strokeOpacity: 0.8,
                    strokeWeight: selectedVehicleId === vehicleId ? 6 : 4,
                    zIndex: selectedVehicleId === vehicleId ? 10 : 1
                  }}
                />
              )
            )}

            {!selectedHistory && directions && (
               <DirectionsRenderer 
                  directions={directions} 
                  options={{ suppressMarkers: false }} 
               />
            )}

            {!selectedHistory && selectedVehicle && (
              <InfoWindow
                position={{ lat: selectedVehicle.lat, lng: selectedVehicle.lng }}
                onCloseClick={() => setSelectedVehicleId(null)}
              >
                <div className="p-1 max-w-[200px]">
                  <h4 className="font-bold text-gray-900 border-b pb-1 mb-2 flex items-center justify-between">
                    {selectedVehicle.vehicle_code || 'Unidad'}
                    {selectedVehicle.destination_lat && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full font-bold ml-2">
                        EN RUTA
                      </span>
                    )}
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
                  <button
                    onClick={() => {
                      setAssigningDestinationFor(selectedVehicle.vehicle_id);
                      setTempDestination(null);
                      setSelectedVehicleId(null);
                    }}
                    className="mt-3 w-full bg-indigo-600 text-white text-xs font-bold py-1.5 rounded hover:bg-indigo-700 transition-colors"
                  >
                    {selectedVehicle.destination_lat ? 'Reasignar Destino' : 'Asignar Destino'}
                  </button>
                </div>
              </InfoWindow>
            )}
          </GoogleMap>
          
          {/* History KPIs Panel */}
          {selectedHistory && selectedHistory.kpis && (
            <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-white rounded-2xl shadow-2xl border border-gray-100 p-4 z-20 w-[90%] max-w-4xl flex gap-4 animate-in slide-in-from-bottom">
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Distancia</p>
                <p className="font-black text-xl text-indigo-600">{selectedHistory.kpis.distance} <span className="text-sm font-normal text-gray-500">km</span></p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Duración</p>
                <p className="font-black text-xl text-gray-800 font-mono">{selectedHistory.kpis.time}</p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Vel. Promedio</p>
                <p className="font-black text-xl text-gray-800">{selectedHistory.kpis.avgSpeed} <span className="text-sm font-normal text-gray-500">km/h</span></p>
              </div>
              <div className="flex-1 bg-gray-50 rounded-xl p-3 text-center">
                <p className="text-[10px] text-gray-500 font-bold uppercase mb-1">Vel. Máx</p>
                <p className="font-black text-xl text-gray-800">{selectedHistory.kpis.maxSpeed} <span className="text-sm font-normal text-gray-500">km/h</span></p>
              </div>
              <div className={`flex-1 rounded-xl p-3 text-center ${selectedHistory.kpis.violations > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
                <p className={`text-[10px] font-bold uppercase mb-1 ${selectedHistory.kpis.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>Infracciones (+110)</p>
                <p className={`font-black text-xl ${selectedHistory.kpis.violations > 0 ? 'text-red-600' : 'text-green-600'}`}>{selectedHistory.kpis.violations}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* History Selection Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden animate-in fade-in zoom-in duration-200 max-h-[85vh] flex flex-col">
            <div className="bg-purple-600 p-6 text-white relative shrink-0">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Historial de Recorridos</h3>
              <p className="text-purple-100 text-sm mt-1">Selecciona una sesión pasada para visualizar el recorrido exacto en el mapa.</p>
            </div>
            
            <div className="p-0 overflow-y-auto bg-gray-50 flex-1">
              {loadingHistory ? (
                <div className="p-10 flex flex-col items-center justify-center text-gray-500">
                  <Loader2 className="w-8 h-8 animate-spin mb-3 text-purple-600" />
                  <p>Cargando sesiones históricas...</p>
                </div>
              ) : historySessions.length === 0 ? (
                <div className="p-10 text-center text-gray-500">
                  No hay sesiones de recorrido registradas aún.
                </div>
              ) : (
                <div className="divide-y divide-gray-200">
                  {historySessions.map(session => (
                    <div 
                      key={session.id} 
                      onClick={() => handleSelectHistorySession(session)}
                      className="p-4 bg-white hover:bg-purple-50 cursor-pointer transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                          <Truck className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-bold text-gray-900">
                            {(session.fuel_vehicles as any)?.code || 'Unidad'} - {(session.fuel_vehicles as any)?.description || ''}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center gap-1.5 mt-0.5">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(session.started_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-800">{session.driver_name}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {session.ended_at ? 'Finalizado' : 'Activo o Incompleto'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="p-4 bg-white border-t border-gray-100 shrink-0">
              <button 
                onClick={() => setShowHistoryModal(false)}
                className="w-full bg-gray-100 text-gray-700 px-6 py-2.5 rounded-lg font-bold hover:bg-gray-200 transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tutorial Onboarding Modal */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-indigo-600 p-6 text-white relative">
              <button 
                onClick={() => setShowTutorial(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center mb-4">
                <Navigation className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-bold">Cómo Asignar un Destino</h3>
              <p className="text-indigo-100 text-sm mt-1">Guía rápida para despachar vehículos y enviar rutas automáticamente.</p>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">1. Seleccioná el vehículo</h4>
                  <p className="text-sm text-gray-600">Haz clic en un vehículo de la lista lateral o directamente sobre su ícono en el mapa.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <MousePointerClick className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">2. Activa la Asignación</h4>
                  <p className="text-sm text-gray-600">En la tarjeta de información del vehículo, presiona el botón azul <strong className="text-indigo-600 font-bold">"Asignar Destino"</strong>.</p>
                </div>
              </div>
              
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-1">
                  <Smartphone className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 mb-1">3. Marca el punto en el mapa</h4>
                  <p className="text-sm text-gray-600">Haz clic en cualquier calle para colocar un marcador y luego presiona el botón <strong className="text-indigo-600 font-bold">"Ir aquí"</strong> para confirmar. ¡Listo! El celular del conductor calculará la ruta automáticamente al instante.</p>
                </div>
              </div>
            </div>
            
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button 
                onClick={() => setShowTutorial(false)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors"
              >
                Entendido, ¡probar ahora!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
