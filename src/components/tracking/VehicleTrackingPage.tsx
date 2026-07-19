import React, { useState, useEffect, useRef } from 'react';
import { supabase, ECAR_TENANT_ID } from '../../lib/supabase';
import { MapPin, Navigation, Truck, User, Play, Square, AlertTriangle, Timer } from 'lucide-react';
import { GoogleMap, useJsApiLoader, Marker, DirectionsRenderer } from '@react-google-maps/api';
import type { FuelVehicle } from '../../lib/types';

interface TrackingPoint {
  lat: number;
  lng: number;
  heading: number | null;
  speed: number | null;
  accuracy: number;
}

const SPEED_LIMIT = 110;

export const VehicleTrackingPage: React.FC = () => {
  const [step, setStep] = useState<'setup' | 'tracking'>('setup');
  const [vehicles, setVehicles] = useState<FuelVehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Setup Form
  const [driverName, setDriverName] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  
  // Tracking State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [currentLocation, setCurrentLocation] = useState<TrackingPoint | null>(null);
  
  // Stats
  const [sessionStartTime, setSessionStartTime] = useState<number | null>(null);
  const [maxSpeed, setMaxSpeed] = useState<number>(0);
  const [elapsedTimeStr, setElapsedTimeStr] = useState<string>('00:00');
  
  const [destination, setDestination] = useState<{lat: number, lng: number} | null>(null);
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [directionsFetchedFor, setDirectionsFetchedFor] = useState<{lat: number, lng: number} | null>(null);

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ''
  });
  
  const wakeLockRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const channelRef = useRef<any>(null);
  const lastDbInsertRef = useRef<number>(0);
  const DB_INSERT_INTERVAL = 15000; // 15 seconds

  useEffect(() => {
    loadVehicles();
    return () => {
      stopTracking(false);
    };
  }, []);

  // Update elapsed time
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (step === 'tracking' && sessionStartTime) {
      interval = setInterval(() => {
        const diff = Math.floor((Date.now() - sessionStartTime) / 1000);
        const mins = Math.floor(diff / 60).toString().padStart(2, '0');
        const secs = (diff % 60).toString().padStart(2, '0');
        const hrs = Math.floor(diff / 3600);
        if (hrs > 0) {
           setElapsedTimeStr(`${hrs}:${mins.padStart(2, '0')}:${secs}`);
        } else {
           setElapsedTimeStr(`${mins}:${secs}`);
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, sessionStartTime]);

  useEffect(() => {
    if (destination && currentLocation && isLoaded && window.google) {
      if (directionsFetchedFor?.lat === destination.lat && directionsFetchedFor?.lng === destination.lng) {
        return; // Ya calculamos la ruta para este destino
      }
      
      const directionsService = new window.google.maps.DirectionsService();
      
      directionsService.route(
        {
          origin: { lat: currentLocation.lat, lng: currentLocation.lng },
          destination: destination,
          travelMode: window.google.maps.TravelMode.DRIVING,
        },
        (result: any, status: any) => {
          if (status === window.google.maps.DirectionsStatus.OK) {
            setDirections(result);
            setDirectionsFetchedFor(destination);
          }
        }
      );
    }
  }, [destination, currentLocation, isLoaded, directionsFetchedFor]);

  const loadVehicles = async () => {
    try {
      const { data, error } = await supabase
        .from('fuel_vehicles')
        .select('*')
        .eq('status', 'active')
        .order('description');
        
      if (error) throw error;
      setVehicles(data || []);
      
      // Intentar cargar el nombre del conductor guardado previamente
      const savedDriver = localStorage.getItem('fleet_driver_name');
      if (savedDriver) setDriverName(savedDriver);
      
    } catch (err: any) {
      setError('Error al cargar vehículos: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const requestWakeLock = async () => {
    try {
      if ('wakeLock' in navigator) {
        // @ts-ignore
        wakeLockRef.current = await navigator.wakeLock.request('screen');
      }
    } catch (err) {
      console.warn('Wake Lock no soportado o bloqueado:', err);
    }
  };

  const startTracking = async () => {
    if (!driverName.trim() || !selectedVehicleId) {
      setError('Por favor completá todos los campos.');
      return;
    }
    
    setError('');
    localStorage.setItem('fleet_driver_name', driverName);
    
    try {
      setLoading(true);
      
      // 1. Pedir permisos de ubicación antes de crear la sesión
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true });
      });

      // 2. Crear sesión en DB
      const { data: sessionData, error: sessionErr } = await supabase
        .from('vehicle_tracking_sessions')
        .insert({
          tenant_id: ECAR_TENANT_ID,
          vehicle_id: selectedVehicleId,
          driver_name: driverName,
          is_active: true
        })
        .select()
        .single();
        
      if (sessionErr) {
        // If it fails because of unique constraint, another session is active
        if (sessionErr.code === '23505') {
          // Terminar la sesión anterior y reintentar
          await supabase
            .from('vehicle_tracking_sessions')
            .update({ is_active: false, ended_at: new Date().toISOString() })
            .eq('vehicle_id', selectedVehicleId)
            .eq('is_active', true);
            
          const { data: retryData, error: retryErr } = await supabase
            .from('vehicle_tracking_sessions')
            .insert({
              tenant_id: ECAR_TENANT_ID,
              vehicle_id: selectedVehicleId,
              driver_name: driverName,
              is_active: true
            })
            .select()
            .single();
            
          if (retryErr) throw retryErr;
          setSessionId(retryData.id);
        } else {
          throw sessionErr;
        }
      } else {
        setSessionId(sessionData.id);
      }
      
      // Reset Stats
      setSessionStartTime(Date.now());
      setMaxSpeed(0);
      setElapsedTimeStr('00:00');
      
      // 3. Activar Wake Lock
      await requestWakeLock();
      
      // 4. Conectar a Realtime Channel
      const channel = supabase.channel(`fleet-tracking`);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('Conectado al canal realtime');
        }
      });
      
      channel.on('broadcast', { event: 'new_destination' }, (payload) => {
        const data = payload.payload;
        if (data.vehicle_id === selectedVehicleId) {
          setDestination({ lat: data.destination_lat, lng: data.destination_lng });
        }
      });
      
      channel.on('broadcast', { event: 'force_stop' }, (payload) => {
        const data = payload.payload;
        if (data.vehicle_id === selectedVehicleId) {
          stopTracking(false);
          setError('El administrador ha finalizado el recorrido.');
        }
      });
      
      channelRef.current = channel;
      
      // 5. Iniciar tracking GPS
      startGpsWatch(sessionData?.id || sessionId);
      
      setStep('tracking');
    } catch (err: any) {
      console.error(err);
      setError('Error al iniciar: ' + (err.message || 'Permiso de ubicación denegado.'));
    } finally {
      setLoading(false);
    }
  };
  
  const startGpsWatch = (sid: string | null) => {
    if (!navigator.geolocation) {
      setError('Geolocalización no soportada por el navegador.');
      return;
    }
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (position) => {
        const pt: TrackingPoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          heading: position.coords.heading, // 0-360
          speed: position.coords.speed,     // m/s
          accuracy: position.coords.accuracy // meters
        };
        
        const speedKmh = pt.speed ? Math.round(pt.speed * 3.6) : 0;
        setMaxSpeed(prev => Math.max(prev, speedKmh));
        setCurrentLocation(pt);
        
        // Broadcast inmediato (alta frecuencia, baja latencia, no se guarda)
        if (channelRef.current) {
          channelRef.current.send({
            type: 'broadcast',
            event: 'location_update',
            payload: {
              vehicle_id: selectedVehicleId,
              driver_name: driverName,
              ...pt,
              timestamp: new Date().toISOString()
            }
          });
        }
        
        // Guardar histórico en DB (baja frecuencia, cada 15 segs)
        const now = Date.now();
        if (sid && (now - lastDbInsertRef.current > DB_INSERT_INTERVAL)) {
          lastDbInsertRef.current = now;
          
          supabase.from('vehicle_tracking_points').insert({
            session_id: sid,
            vehicle_id: selectedVehicleId,
            ...pt,
            recorded_at: new Date().toISOString()
          }).then();
          
          supabase.from('vehicle_tracking_sessions').update({
            last_lat: pt.lat,
            last_lng: pt.lng,
            last_heading: pt.heading,
            last_speed: pt.speed,
            last_accuracy: pt.accuracy,
            last_update_at: new Date().toISOString()
          }).eq('id', sid).then();
        }
      },
      (err) => {
        console.warn('GPS Error:', err);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000
      }
    );
  };

  const stopTracking = async (updateDb = true) => {
    // 1. Limpiar GPS
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    
    // 2. Limpiar Realtime
    if (channelRef.current) {
      channelRef.current.unsubscribe();
      channelRef.current = null;
    }
    
    // 3. Soltar Wake Lock
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(console.warn);
      wakeLockRef.current = null;
    }
    
    // 4. Cerrar sesión en DB
    if (updateDb && sessionId) {
      try {
        await supabase
          .from('vehicle_tracking_sessions')
          .update({ is_active: false, ended_at: new Date().toISOString() })
          .eq('id', sessionId);
      } catch (e) {
        console.error('Error cerrando sesión:', e);
      }
    }
    
    setSessionId(null);
    setCurrentLocation(null);
    setDestination(null);
    setDirections(null);
    setDirectionsFetchedFor(null);
    setSessionStartTime(null);
    setStep('setup');
  };

  if (loading && step === 'setup') {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-ecar-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }
  
  const currentSpeedKmh = currentLocation?.speed ? Math.round(currentLocation.speed * 3.6) : 0;
  const isOverSpeed = currentSpeedKmh > SPEED_LIMIT;

  return (
    <div className={`min-h-screen flex flex-col ${step === 'tracking' ? 'bg-black' : 'bg-gray-100'}`}>
      {step === 'setup' && (
        <header className="bg-ecar-blueDark p-6 text-center relative overflow-hidden shadow-md shrink-0 z-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-700/30 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="bg-white rounded-xl p-2 inline-block mb-3 relative z-10 shadow-md">
            <img src="/rombo.jpeg" alt="Logo" className="h-10 w-auto object-contain" />
          </div>
          <div className="flex items-center justify-center gap-2 text-white relative z-10">
            <Navigation size={20} className="text-blue-300" />
            <h1 className="text-lg font-bold tracking-wide">GPS Flota ECAR</h1>
          </div>
        </header>
      )}
      
      <div className={`flex-1 flex flex-col w-full ${step === 'setup' ? 'p-4 max-w-md mx-auto overflow-auto' : 'relative overflow-hidden'}`}>
        {error && (
          <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-start gap-3 m-4 shadow-sm border border-red-100 absolute z-50 top-0 left-0 right-0">
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}
        
        {step === 'setup' ? (
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mt-4">
            <div className="p-6 bg-gradient-to-b from-slate-50 to-white">
              <h2 className="text-xl font-bold text-gray-800 mb-1">Iniciar Viaje</h2>
              <p className="text-sm text-gray-500 mb-6">Asignate un vehículo y comenzá a transmitir tu ubicación al tablero central.</p>
              
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <User className="w-4 h-4 text-ecar-blue" />
                    Tu Nombre
                  </label>
                  <input
                    type="text"
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="Ej. Juan Pérez"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ecar-blue focus:border-transparent outline-none transition-all"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                    <Truck className="w-4 h-4 text-ecar-blue" />
                    Vehículo
                  </label>
                  <select
                    value={selectedVehicleId}
                    onChange={(e) => setSelectedVehicleId(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-ecar-blue focus:border-transparent outline-none transition-all appearance-none"
                  >
                    <option value="">Seleccioná un vehículo...</option>
                    {vehicles.map(v => (
                      <option key={v.id} value={v.id}>
                        {v.code} - {v.description} ({v.plate || 'Sin patente'})
                      </option>
                    ))}
                  </select>
                </div>
                
                <button
                  onClick={startTracking}
                  disabled={loading || !driverName || !selectedVehicleId}
                  className="btn-primary w-full mt-6
                ">
                  <Play className="w-5 h-5 fill-current" />
                  COMENZAR TRACKING
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-4 flex items-center justify-center gap-1">
                  <MapPin className="w-3 h-3" />
                  La app te pedirá permiso de ubicación
                </p>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Full Screen Map */}
            <div className="absolute inset-0 z-0 bg-gray-900">
              {isLoaded && currentLocation ? (
                <GoogleMap
                  mapContainerStyle={{ width: '100%', height: '100%' }}
                  center={currentLocation}
                  zoom={16}
                  options={{ 
                    disableDefaultUI: true, 
                    gestureHandling: 'greedy',
                    styles: [
                      { elementType: "geometry", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.stroke", stylers: [{ color: "#242f3e" }] },
                      { elementType: "labels.text.fill", stylers: [{ color: "#746855" }] },
                      { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#d59563" }] },
                      { featureType: "road", elementType: "geometry", stylers: [{ color: "#38414e" }] },
                      { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#212a37" }] },
                      { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#9ca5b3" }] },
                      { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#746855" }] },
                      { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1f2835" }] },
                      { featureType: "road.highway", elementType: "labels.text.fill", stylers: [{ color: "#f3d19c" }] },
                      { featureType: "water", elementType: "geometry", stylers: [{ color: "#17263c" }] },
                      { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#515c6d" }] },
                      { featureType: "water", elementType: "labels.text.stroke", stylers: [{ color: "#17263c" }] }
                    ]
                  }}
                >
                  <Marker 
                    position={currentLocation} 
                    icon={{ path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 6, fillColor: isOverSpeed ? '#ef4444' : '#3b82f6', fillOpacity: 1, strokeWeight: 2, strokeColor: 'white', rotation: currentLocation.heading || 0 }} 
                    zIndex={5}
                  />
                  {directions && (
                    <DirectionsRenderer 
                      directions={directions} 
                      options={{ suppressMarkers: false, polylineOptions: { strokeColor: '#2563EB', strokeWeight: 6 } }} 
                    />
                  )}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500">
                  <div className="w-12 h-12 border-4 border-ecar-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p>Obteniendo ubicación GPS...</p>
                </div>
              )}
            </div>

            {/* Destination Alert Overlay */}
            {destination && (
              <div className="absolute top-4 left-4 right-4 z-10 animate-in slide-in-from-top-4">
                <div className="bg-ecar-blue text-white rounded-xl shadow-lg p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-ecar-blueLight">Nuevo Destino</p>
                      <p className="font-bold text-sm">Dirígete a la ruta marcada</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Floating Info Panel at Bottom - DARK MODE */}
            <div className="absolute bottom-0 left-0 right-0 z-10 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/60 to-transparent">
              <div className={`rounded-2xl shadow-2xl p-5 w-full max-w-md mx-auto relative overflow-hidden transition-colors duration-300 ${isOverSpeed ? 'bg-red-900 border-2 border-red-500' : 'bg-gray-900 border border-gray-700'}`}>
                <div className={`absolute top-0 left-0 w-full h-1 ${isOverSpeed ? 'bg-red-500 animate-pulse' : 'bg-ecar-blue'}`}></div>
                
                <div className="flex items-center justify-between mb-5 mt-1">
                  <div>
                    <h2 className="text-2xl font-black text-white tracking-tight">En Viaje</h2>
                    <p className="text-sm font-medium text-gray-400 flex items-center gap-1.5 mt-0.5">
                      <Truck className="w-3.5 h-3.5" />
                      {vehicles.find(v => v.id === selectedVehicleId)?.code || 'Unidad'} • {driverName}
                    </p>
                  </div>
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center relative shadow-sm ${isOverSpeed ? 'bg-red-950' : 'bg-gray-800'}`}>
                    <div className={`absolute inset-0 border-4 border-t-transparent rounded-full ${isOverSpeed ? 'border-red-500 animate-ping' : 'border-ecar-blue animate-spin'}`}></div>
                    <Navigation className={`w-5 h-5 ${isOverSpeed ? 'text-red-500' : 'text-ecar-blue'}`} />
                  </div>
                </div>
                
                {isOverSpeed && (
                  <div className="mb-4 bg-red-500/20 border border-red-500 text-red-100 p-3 rounded-xl flex items-center gap-3 animate-pulse">
                     <AlertTriangle className="w-6 h-6 text-red-500 shrink-0" />
                     <div>
                       <p className="font-bold">¡Exceso de Velocidad!</p>
                       <p className="text-xs">Reduzca la velocidad (Límite {SPEED_LIMIT} km/h)</p>
                     </div>
                  </div>
                )}
                
                {destination && currentLocation && (
                  <a 
                    href={`https://www.google.com/maps/dir/?api=1&origin=${currentLocation.lat},${currentLocation.lng}&destination=${destination.lat},${destination.lng}&travelmode=driving`}
                    target="_blank" rel="noreferrer"
                    className="w-full mb-4 bg-ecar-blue text-white font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 hover:bg-ecar-blue transition-all shadow-lg shadow-ecar-blue/30 active:scale-95"
                  >
                    <Navigation className="w-5 h-5 fill-current" />
                    Navegación Asistida (GPS)
                  </a>
                )}
                
                <div className="grid grid-cols-3 gap-3 mb-5">
                  <div className={`rounded-xl p-3 text-center border ${isOverSpeed ? 'bg-red-950 border-red-500/50' : 'bg-gray-800 border-gray-700'}`}>
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Velocidad</p>
                    <p className={`font-black text-xl ${isOverSpeed ? 'text-red-400' : 'text-white'}`}>{currentSpeedKmh} <span className="text-xs font-normal text-gray-500">km/h</span></p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1">Vel. Max</p>
                    <p className="font-bold text-white text-lg">{maxSpeed} <span className="text-xs font-normal text-gray-500">km/h</span></p>
                  </div>
                  <div className="bg-gray-800 rounded-xl p-3 text-center border border-gray-700 flex flex-col justify-center">
                    <p className="text-[10px] text-gray-400 font-bold uppercase mb-1 flex justify-center items-center gap-1"><Timer size={10} /> Tiempo</p>
                    <p className="font-bold text-white text-lg font-mono">{elapsedTimeStr}</p>
                  </div>
                </div>
                
                <button
                  onClick={() => stopTracking(true)}
                  className="w-full bg-red-950 hover:bg-red-900 text-red-400 font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 border border-red-900/50"
                >
                  <Square className="w-5 h-5 fill-current" />
                  Finalizar Recorrido
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
