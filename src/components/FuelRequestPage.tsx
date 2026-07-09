import React, { useState, useEffect, useRef } from 'react';
import { Fuel, Check, Send, Truck, Droplets, Gauge, FileText, AlertCircle } from 'lucide-react';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';

type Vehicle = { id: string; code: string; description: string; vehicle_type: string; plate?: string };
type Project = { id: string; name: string };


export const FuelRequestPage: React.FC = () => {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [form, setForm] = useState({
    vehicle_code: '',
    requested_liters: '',
    odometer_km: '',
    project_name: '',
    requested_by: '',
    observations: '',
  });

  // WebGL animated background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext('webgl');
    if (!gl) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      gl.viewport(0, 0, canvas.width, canvas.height);
    };
    resize();
    window.addEventListener('resize', resize);

    const vsrc = `
      attribute vec2 a_position;
      void main() { gl_Position = vec4(a_position, 0.0, 1.0); }
    `;
    const fsrc = `
      precision mediump float;
      uniform float u_time;
      uniform vec2 u_resolution;
      
      vec3 palette(float t) {
        vec3 a = vec3(0.1, 0.15, 0.25);
        vec3 b = vec3(0.05, 0.12, 0.2);
        vec3 c = vec3(0.8, 1.0, 1.2);
        vec3 d = vec3(0.0, 0.15, 0.35);
        return a + b * cos(6.28318 * (c * t + d));
      }
      
      void main() {
        vec2 uv = gl_FragCoord.xy / u_resolution;
        float t = u_time * 0.15;
        
        float wave1 = sin(uv.x * 3.0 + t) * 0.5 + 0.5;
        float wave2 = sin(uv.y * 2.5 - t * 0.7 + uv.x * 1.5) * 0.5 + 0.5;
        float wave3 = sin((uv.x + uv.y) * 2.0 + t * 0.5) * 0.5 + 0.5;
        
        float blend = wave1 * 0.4 + wave2 * 0.35 + wave3 * 0.25;
        
        vec3 col = palette(blend + t * 0.1);
        col = mix(col, vec3(0.08, 0.12, 0.22), 0.3);
        
        // Subtle vignette
        float vig = 1.0 - length(uv - 0.5) * 0.8;
        col *= vig;
        
        gl_FragColor = vec4(col, 1.0);
      }
    `;

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    };

    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, vsrc));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fsrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'a_position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'u_time');
    const uRes = gl.getUniformLocation(prog, 'u_resolution');

    let animId: number;
    const start = performance.now();
    const render = () => {
      const elapsed = (performance.now() - start) / 1000;
      gl.uniform1f(uTime, elapsed);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animId = requestAnimationFrame(render);
    };
    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Load data
  useEffect(() => {
    (async () => {
      try {
        const [vRes, pRes] = await Promise.all([
          supabase.from('fuel_vehicles').select('id, code, description, vehicle_type, plate').eq('status', 'active').order('code'),
          supabase.from('projects').select('id, name').eq('status', 'active').order('name'),
        ]);
        setVehicles(vRes.data || []);
        setProjects(pRes.data || []);
      } catch (e) {
        console.error(e);
      }
      setLoading(false);
    })();
  }, []);

  const handleSubmit = async () => {
    if (!form.vehicle_code || !form.requested_liters || !form.requested_by) {
      setError('Completá Vehículo, Litros y Tu Nombre');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      const vehicle = vehicles.find(v => v.code === form.vehicle_code);
      const { error: dbError } = await supabase.from('fuel_loads').insert({
        tenant_id: ECAR_TENANT_ID,
        load_number: `SOL-${Date.now().toString(36).toUpperCase()}`,
        load_date: new Date().toISOString().slice(0, 10),
        vehicle_code: form.vehicle_code,
        vehicle_id: vehicle?.id,
        vehicle_description: vehicle?.description || '',
        vehicle_type: vehicle?.vehicle_type || '',
        plate: vehicle?.plate || '',
        requested_liters: parseFloat(form.requested_liters),
        odometer_km: form.odometer_km ? parseInt(form.odometer_km) : null,
        project_name: form.project_name || null,
        requested_by: form.requested_by,
        observations: form.observations || null,
        workflow_status: 'requested',
        driver_name: form.requested_by,
        liters: 0,
        load_source: 'station',
        validation_status: 'pending',
      });

      if (dbError) throw dbError;
      setSubmitted(true);
    } catch (e: any) {
      setError(e.message || 'Error al enviar solicitud');
    }
    setSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />
        <div className="relative z-10 text-center">
          <div className="w-12 h-12 border-4 border-white/20 border-t-orange-400 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white/70 font-medium">Cargando flota...</p>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />
        <div className="relative z-10 bg-white/10 backdrop-blur-xl rounded-3xl p-10 text-center max-w-md w-full border border-white/20 shadow-2xl animate-fade-in">
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <Check size={40} className="text-emerald-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">¡Solicitud Enviada!</h2>
          <p className="text-white/70 mb-2">
            Tu pedido de <span className="text-orange-400 font-bold">{form.requested_liters} litros</span> para el vehículo <span className="text-orange-400 font-bold">{form.vehicle_code}</span> fue registrado.
          </p>
          <p className="text-white/50 text-sm mb-8">
            Gerencia recibirá la solicitud y la autorizará desde el sistema.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ vehicle_code: '', requested_liters: '', odometer_km: '', project_name: '', requested_by: '', observations: '' }); }}
            className="bg-white/10 hover:bg-white/20 text-white font-bold py-3 px-8 rounded-xl transition-all border border-white/20"
          >
            Nueva Solicitud
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ zIndex: 0 }} />

      <div className="relative z-10 w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-in">
          <div className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md rounded-2xl px-6 py-3 border border-white/10 mb-4">
            <Fuel size={28} className="text-orange-400" />
            <div className="text-left">
              <h1 className="text-white font-black text-xl tracking-tight">ECAR</h1>
              <p className="text-white/50 text-[10px] uppercase tracking-[0.2em]">Solicitud de Combustible</p>
            </div>
          </div>
        </div>

        {/* Form Card */}
        <div className="bg-white/[0.08] backdrop-blur-xl rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-fade-in" style={{ animationDelay: '0.1s' }}>
          {/* Card Header */}
          <div className="bg-gradient-to-r from-orange-600/80 to-orange-500/80 backdrop-blur-sm p-5">
            <h2 className="text-white font-bold text-lg flex items-center gap-2">
              <FileText size={20} /> Formulario de Solicitud
            </h2>
            <p className="text-orange-100/70 text-xs mt-1">Completá los datos para pedir autorización de carga</p>
          </div>

          <div className="p-6 space-y-5">
            {/* Nombre del operario */}
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <span className="text-orange-400">*</span> Tu Nombre Completo
              </label>
              <input
                type="text"
                placeholder="Ej: Juan Pérez"
                value={form.requested_by}
                onChange={e => setForm({ ...form, requested_by: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all"
              />
            </div>

            {/* Vehículo */}
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                <Truck size={14} className="text-orange-400" /><span className="text-orange-400">*</span> Vehículo / Máquina
              </label>
              <select
                value={form.vehicle_code}
                onChange={e => setForm({ ...form, vehicle_code: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all appearance-none"
              >
                <option value="" className="bg-slate-800">Seleccionar vehículo...</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.code} className="bg-slate-800">
                    {v.code} — {v.description} {v.plate ? `(${v.plate})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Row: Litros + Odómetro */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Droplets size={14} className="text-blue-400" /><span className="text-orange-400">*</span> Litros
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="Ej: 50"
                  value={form.requested_liters}
                  onChange={e => setForm({ ...form, requested_liters: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
              <div>
                <label className="text-white/70 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
                  <Gauge size={14} className="text-cyan-400" /> Km / Hs
                </label>
                <input
                  type="number"
                  placeholder="Ej: 150325"
                  value={form.odometer_km}
                  onChange={e => setForm({ ...form, odometer_km: e.target.value })}
                  className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white font-mono placeholder:text-white/30 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all"
                />
              </div>
            </div>

            {/* Obra / CC */}
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Obra / Centro de Costo</label>
              <select
                value={form.project_name}
                onChange={e => setForm({ ...form, project_name: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all appearance-none"
              >
                <option value="" className="bg-slate-800">Uso General (sin obra)</option>
                {projects.map(p => (
                  <option key={p.id} value={p.name} className="bg-slate-800">{p.name}</option>
                ))}
              </select>
            </div>

            {/* Observaciones */}
            <div>
              <label className="text-white/70 text-xs font-bold uppercase tracking-wider mb-2 block">Motivo / Notas</label>
              <textarea
                placeholder="Ej: Viaje a obra interior..."
                rows={2}
                value={form.observations}
                onChange={e => setForm({ ...form, observations: e.target.value })}
                className="w-full bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-400/50 focus:ring-2 focus:ring-orange-400/20 transition-all resize-none"
              />
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-500 hover:to-orange-400 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-3 text-lg shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send size={20} /> Enviar Solicitud a Gerencia
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-white/30 text-xs mt-6">
          ECAR Constructora • Sistema de Gestión Integral
        </p>
      </div>
    </div>
  );
};
