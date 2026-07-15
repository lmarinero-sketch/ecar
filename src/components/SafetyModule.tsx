import React, { useState, useRef, useEffect } from 'react';
import { ShieldAlert, Plus, X, Check, AlertTriangle, Eye, Activity, Flame, HardHat, Zap, Mountain, Car, ArrowDown, Search, Upload, Phone, Mail, MessageSquare } from 'lucide-react';
import * as THREE from 'three';
import { useSeguridadIncidentes, useCreateSeguridadIncidente, useUpdateSeguridadIncidente, useSeguridadObservaciones, useCreateSeguridadObservacion, useProjects, useEmployees } from '../hooks/useData';
import type { Employee } from '../lib/types';

// 3D Body Map Component
const Body3dMap: React.FC<{ selectedZone: string; onSelectZone: (zone: string) => void }> = ({ selectedZone, onSelectZone }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const meshesRef = useRef<{ [name: string]: THREE.Mesh }>({});

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#ffffff');

    // Camera
    const camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 1.8, 4.8);
    camera.lookAt(0, 0.8, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.0);
    dirLight.position.set(3, 5, 4);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const fillLight = new THREE.DirectionalLight(0x8ecae6, 0.3);
    fillLight.position.set(-2, 3, -1);
    scene.add(fillLight);

    // Group for the body
    const bodyGroup = new THREE.Group();
    scene.add(bodyGroup);

    // Color definitions
    const skinColor = 0xd4a574; // Skin tone
    const vestColor = 0xff8c00; // Hi-vis orange vest
    const pantsColor = 0x2d3748; // Dark work pants
    const activeColor = 0xef4444; // Red for selected zone
    const hoverColor = 0x60a5fa; // Blue hover
    const defaultColor = 0xe2e8f0; // Fallback

    const getColor = (name: string, partDefault: number) => {
      return selectedZone === name ? activeColor : partDefault;
    };

    const createPart = (geometry: THREE.BufferGeometry, name: string, pos: [number, number, number], color: number = defaultColor) => {
      const mat = new THREE.MeshStandardMaterial({
        color: getColor(name, color),
        roughness: 0.65,
        metalness: 0.05,
      });
      const mesh = new THREE.Mesh(geometry, mat);
      mesh.position.set(...pos);
      mesh.name = name;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      bodyGroup.add(mesh);
      meshesRef.current[name] = mesh;
      return mesh;
    };

    // ===== HEAD & NECK =====
    createPart(new THREE.CapsuleGeometry(0.18, 0.15, 4, 16), 'Cabeza', [0, 1.7, 0], skinColor);
    createPart(new THREE.CylinderGeometry(0.06, 0.08, 0.15, 16), 'Cuello', [0, 1.48, 0], skinColor);

    // ===== TORSO =====
    createPart(new THREE.CapsuleGeometry(0.25, 0.35, 4, 16), 'Pecho', [0, 1.25, 0], vestColor);
    createPart(new THREE.CapsuleGeometry(0.22, 0.2, 4, 16), 'Abdomen', [0, 0.95, 0], vestColor);
    createPart(new THREE.SphereGeometry(0.2, 16, 16), 'Pelvis', [0, 0.75, 0], pantsColor);

    // ===== SHOULDERS & ARMS =====
    // Shoulders
    createPart(new THREE.SphereGeometry(0.1, 16, 16), 'Hombro Derecho', [0.35, 1.35, 0], vestColor);
    createPart(new THREE.SphereGeometry(0.1, 16, 16), 'Hombro Izquierdo', [-0.35, 1.35, 0], vestColor);
    // Upper Arms
    const rArm = createPart(new THREE.CapsuleGeometry(0.07, 0.25, 4, 16), 'Brazo Derecho', [0.42, 1.15, 0], skinColor);
    rArm.rotation.z = -0.15;
    const lArm = createPart(new THREE.CapsuleGeometry(0.07, 0.25, 4, 16), 'Brazo Izquierdo', [-0.42, 1.15, 0], skinColor);
    lArm.rotation.z = 0.15;
    // Elbows
    createPart(new THREE.SphereGeometry(0.065, 16, 16), 'Codo Derecho', [0.46, 0.95, 0], skinColor);
    createPart(new THREE.SphereGeometry(0.065, 16, 16), 'Codo Izquierdo', [-0.46, 0.95, 0], skinColor);
    // Forearms
    createPart(new THREE.CapsuleGeometry(0.06, 0.25, 4, 16), 'Antebrazo Derecho', [0.48, 0.75, 0], skinColor);
    createPart(new THREE.CapsuleGeometry(0.06, 0.25, 4, 16), 'Antebrazo Izquierdo', [-0.48, 0.75, 0], skinColor);
    // Hands
    createPart(new THREE.SphereGeometry(0.07, 16, 16), 'Mano Derecha', [0.48, 0.55, 0], skinColor);
    createPart(new THREE.SphereGeometry(0.07, 16, 16), 'Mano Izquierda', [-0.48, 0.55, 0], skinColor);

    // ===== LEGS =====
    // Thighs
    const rThigh = createPart(new THREE.CapsuleGeometry(0.1, 0.35, 4, 16), 'Muslo Derecho', [0.15, 0.5, 0], pantsColor);
    rThigh.rotation.z = -0.05;
    const lThigh = createPart(new THREE.CapsuleGeometry(0.1, 0.35, 4, 16), 'Muslo Izquierdo', [-0.15, 0.5, 0], pantsColor);
    lThigh.rotation.z = 0.05;
    // Knees
    createPart(new THREE.SphereGeometry(0.08, 16, 16), 'Rodilla Derecha', [0.17, 0.25, 0], pantsColor);
    createPart(new THREE.SphereGeometry(0.08, 16, 16), 'Rodilla Izquierda', [-0.17, 0.25, 0], pantsColor);
    // Calves
    createPart(new THREE.CapsuleGeometry(0.08, 0.3, 4, 16), 'Pierna Derecha', [0.17, 0.05, 0], pantsColor);
    createPart(new THREE.CapsuleGeometry(0.08, 0.3, 4, 16), 'Pierna Izquierda', [-0.17, 0.05, 0], pantsColor);
    // Feet
    const rFoot = createPart(new THREE.CapsuleGeometry(0.07, 0.15, 4, 16), 'Pie Derecho', [0.17, -0.15, 0.08], skinColor);
    rFoot.rotation.x = Math.PI / 2;
    const lFoot = createPart(new THREE.CapsuleGeometry(0.07, 0.15, 4, 16), 'Pie Izquierdo', [-0.17, -0.15, 0.08], skinColor);
    lFoot.rotation.x = Math.PI / 2;

    // Floor Grid (concrete look)
    const grid = new THREE.GridHelper(4, 10, 0xd1d5db, 0xe5e7eb);
    grid.position.y = -0.055;
    scene.add(grid);

    // Interaction Raycasting
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredName: string | null = null;

    const getMouseCoords = (e: MouseEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const handleMouseMove = (e: MouseEvent) => {
      getMouseCoords(e);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children);

      let currentHover: string | null = null;
      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        currentHover = obj.name;
      }

      if (currentHover !== hoveredName) {
        if (hoveredName && hoveredName !== selectedZone) {
          const m = meshesRef.current[hoveredName];
          if (m) (m.material as THREE.MeshStandardMaterial).color.setHex((m as any)._defaultColor || defaultColor);
        }
        if (currentHover && currentHover !== selectedZone) {
          const m = meshesRef.current[currentHover];
          if (m) {
            (m as any)._defaultColor = (m.material as THREE.MeshStandardMaterial).color.getHex();
            (m.material as THREE.MeshStandardMaterial).color.setHex(hoverColor);
          }
        }
        hoveredName = currentHover;
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      getMouseCoords(e);
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(bodyGroup.children);

      if (intersects.length > 0) {
        const obj = intersects[0].object as THREE.Mesh;
        onSelectZone(obj.name);
      }
    };

    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mousedown', handleMouseDown);

    // Rotation Drag
    let isDragging = false;
    let previousMouseX = 0;

    const onContainerMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMouseX = e.clientX;
    };

    const onContainerMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const deltaX = e.clientX - previousMouseX;
      bodyGroup.rotation.y += deltaX * 0.015;
      previousMouseX = e.clientX;
    };

    const onContainerMouseUp = () => {
      isDragging = false;
    };

    container.addEventListener('mousedown', onContainerMouseDown);
    window.addEventListener('mousemove', onContainerMouseMove);
    window.addEventListener('mouseup', onContainerMouseUp);

    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      if (!isDragging && !selectedZone) {
        bodyGroup.rotation.y += 0.005;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousedown', onContainerMouseDown);
      window.removeEventListener('mousemove', onContainerMouseMove);
      window.removeEventListener('mouseup', onContainerMouseUp);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [selectedZone, onSelectZone]);

  return (
    <div className="light-card p-4 flex flex-col items-center">
      <div className="w-full flex justify-between items-center px-1 mb-2">
        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Mapa Corporal 3D</span>
        <span className="text-[10px] text-gray-400">Arrastrá para rotar</span>
      </div>
      <div ref={mountRef} className="w-full h-[320px] rounded-lg overflow-hidden border border-gray-100 bg-white cursor-pointer" />
      {selectedZone ? (
        <div className="mt-3 text-center">
          <p className="text-xs text-gray-400 uppercase font-bold">Zona Seleccionada</p>
          <p className="text-sm font-black text-red-600 font-mono mt-0.5">{selectedZone}</p>
        </div>
      ) : (
        <p className="text-xs text-gray-400 mt-3 text-center">Hacé clic sobre la parte afectada</p>
      )}
    </div>
  );
};

// Reusable searchable employee dropdown
const EmployeeCombobox: React.FC<{
  value: string;
  onChange: (name: string) => void;
  employees: Employee[];
  placeholder?: string;
}> = ({ value, onChange, employees, placeholder = 'Buscá un colaborador...' }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = employees.filter(e =>
    e.full_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <div
        onClick={() => setOpen(!open)}
        className={`w-full px-3 py-2 border rounded-xl text-sm cursor-pointer flex items-center justify-between gap-2 transition-all ${
          open ? 'border-ecar-blue ring-2 ring-ecar-blue/30' : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <span className={value ? 'text-gray-800' : 'text-gray-400'}>{value || placeholder}</span>
        <Search size={14} className="text-gray-400 flex-shrink-0" />
      </div>
      {open && (
        <div className="absolute z-50 mt-1 w-full light-card shadow-lg max-h-56 overflow-hidden">
          <div className="p-2 border-b border-gray-100">
            <input
              autoFocus
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscá por nombre..."
              className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-ecar-blue/30"
            />
          </div>
          <div className="overflow-y-auto max-h-40">
            {filtered.length === 0 ? (
              <p className="px-3 py-2 text-xs text-gray-400">Sin resultados</p>
            ) : (
              filtered.map(emp => (
                <button
                  key={emp.id}
                  onClick={() => { onChange(emp.full_name); setOpen(false); setSearch(''); }}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 ${
                    value === emp.full_name ? 'bg-blue-50 text-ecar-blue font-bold' : 'text-gray-700'
                  }`}
                >
                  <div className="w-6 h-6 rounded-full bg-ecar-blueLight flex items-center justify-center text-ecar-blue font-bold text-[10px] flex-shrink-0">
                    {emp.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  {emp.full_name}
                  {emp.dni && <span className="text-xs text-gray-400 ml-auto font-mono">{emp.dni}</span>}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TIPO_LABELS: Record<string, string> = { accidente: 'Accidente', incidente: 'Incidente', cuasi_accidente: 'Cuasi-accidente', enfermedad_laboral: 'Enfermedad Laboral' };
const GRAVEDAD_COLORS: Record<string, string> = { leve: 'bg-green-100 text-green-700', moderado: 'bg-yellow-100 text-yellow-700', grave: 'bg-orange-100 text-orange-700', fatal: 'bg-red-100 text-red-700' };
const ESTADO_COLORS: Record<string, string> = { abierto: 'bg-red-100 text-red-700', en_investigacion: 'bg-yellow-100 text-yellow-700', cerrado: 'bg-green-100 text-green-700' };
const CATEGORIA_ICONS: Record<string, React.ElementType> = { epp: HardHat, electrico: Zap, altura: Mountain, vehicular: Car, incendio: Flame, orden_limpieza: Eye, senalizacion: AlertTriangle, excavacion: ArrowDown, otros: Activity };
const RIESGO_COLOR = (score: number) => score >= 15 ? 'bg-red-500' : score >= 10 ? 'bg-orange-500' : score >= 5 ? 'bg-yellow-500' : 'bg-green-500';

export const SafetyModule: React.FC = () => {
  const { data: incidentes = [], isLoading: loadingInc } = useSeguridadIncidentes();
  const { data: observaciones = [], isLoading: loadingObs } = useSeguridadObservaciones();
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const createIncidente = useCreateSeguridadIncidente();
  const updateIncidente = useUpdateSeguridadIncidente();
  const createObservacion = useCreateSeguridadObservacion();
  const [tab, setTab] = useState<'incidentes' | 'observaciones' | 'comunicar'>('incidentes');
  const [showForm, setShowForm] = useState(false);
  const [selectedZone, setSelectedZone] = useState<string>('');

  const [formInc, setFormInc] = useState({ obra_id: '', fecha: new Date().toISOString().split('T')[0], tipo: 'incidente', gravedad: 'leve', ubicacion: '', descripcion: '', persona_afectada: '', persona_afectada_dni: '', testigos: '', tratamiento: 'ninguno', causa_raiz: '', acciones_correctivas: '', responsable_accion: '' });
  const [formObs, setFormObs] = useState({ obra_id: '', observador: '', categoria: 'epp', descripcion: '', severidad: '3', probabilidad: '3', accion_sugerida: '' });

  const handleSubmitInc = async () => {
    if (!formInc.obra_id || !formInc.descripcion) return;
    const finalDesc = selectedZone ? `${formInc.descripcion} [Zona Afectada: ${selectedZone}]` : formInc.descripcion;
    await createIncidente.mutateAsync({ ...formInc, descripcion: finalDesc, tratamiento: formInc.tratamiento as any, tipo: formInc.tipo as any, gravedad: formInc.gravedad as any });
    setSelectedZone('');
    setShowForm(false);
  };

  const handleSubmitObs = async () => {
    if (!formObs.obra_id || !formObs.descripcion || !formObs.observador) return;
    await createObservacion.mutateAsync({ ...formObs, severidad: Number(formObs.severidad), probabilidad: Number(formObs.probabilidad), categoria: formObs.categoria as any });
    setShowForm(false);
  };

  // KPIs
  const diasSinIncidente = (() => {
    if (!incidentes.length) return '∞';
    const last = incidentes.find(i => i.tipo === 'accidente');
    if (!last) return '∞';
    const diff = Math.floor((Date.now() - new Date(last.fecha).getTime()) / 86400000);
    return diff;
  })();
  const incAbiertos = incidentes.filter(i => i.estado === 'abierto').length;
  const obsAltas = observaciones.filter(o => o.riesgo_score >= 10).length;
  const totalDiasPerdidos = incidentes.reduce((s, i) => s + (i.dias_perdidos || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-800 via-red-700 to-rose-600 rounded-xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10"><ShieldAlert size={120} /></div>
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-red-400 to-orange-400" />
        <div className="relative z-10">
          <h3 className="font-bold text-2xl flex items-center gap-2"><ShieldAlert size={24} /> Seguridad e Incidentes</h3>
          <p className="text-red-200 text-sm mt-1">Doc PR-GO-01 §4.6 — Registro de incidentes, observaciones de riesgo y acciones correctivas (Res. SRT 905/2015)</p>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><ShieldAlert size={16} className="text-green-500" /> Días sin Accidente</div>
          <p className="text-2xl font-black font-mono text-green-600">{diasSinIncidente}</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><AlertTriangle size={16} className="text-red-500" /> Incidentes Abiertos</div>
          <p className="text-2xl font-black font-mono text-red-600">{incAbiertos}</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Eye size={16} className="text-orange-500" /> Obs. Alto Riesgo</div>
          <p className="text-2xl font-black font-mono text-orange-600">{obsAltas}</p>
        </div>
        <div className="light-card p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-gray-500 mb-1"><Activity size={16} className="text-gray-500" /> Días Perdidos</div>
          <p className="text-2xl font-black font-mono text-gray-700">{totalDiasPerdidos}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
        {(['incidentes', 'observaciones', 'comunicar'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`flex-1 py-2.5 rounded-md text-sm font-bold flex items-center justify-center gap-2 transition-all ${tab === t ? 'bg-white text-red-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'incidentes' ? <><AlertTriangle size={16} /> Incidentes ({incidentes.length})</> : t === 'observaciones' ? <><Eye size={16} /> Observaciones ({observaciones.length})</> : <><MessageSquare size={16} /> Comunicar Siniestro</>}
          </button>
        ))}
      </div>

      {tab !== 'comunicar' && (
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          {showForm ? <><X size={16} /> Cancelar</> : <><Plus size={16} /> {tab === 'incidentes' ? 'Registrar Incidente' : 'Nueva Observación'}</>}
        </button>
      )}

      {/* Forms */}
      {showForm && tab === 'incidentes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 light-card p-6 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Obra *</label><select value={formInc.obra_id} onChange={e => setFormInc({...formInc, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Seleccioná</option>{projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Fecha</label><input type="date" value={formInc.fecha} onChange={e => setFormInc({...formInc, fecha: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Tipo</label><select value={formInc.tipo} onChange={e => setFormInc({...formInc, tipo: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm">{Object.entries(TIPO_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}</select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Gravedad</label><select value={formInc.gravedad} onChange={e => setFormInc({...formInc, gravedad: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="leve">Leve</option><option value="moderado">Moderado</option><option value="grave">Grave</option><option value="fatal">Fatal</option></select></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Persona Afectada</label><EmployeeCombobox value={formInc.persona_afectada} onChange={name => setFormInc({...formInc, persona_afectada: name})} employees={employees} placeholder="Seleccioná colaborador..." /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Tratamiento</label><select value={formInc.tratamiento} onChange={e => setFormInc({...formInc, tratamiento: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="ninguno">Ninguno</option><option value="primeros_auxilios">Primeros Auxilios</option><option value="medico">Médico</option><option value="hospital">Hospital</option></select></div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Ubicación del Suceso</label><input value={formInc.ubicacion || ''} onChange={e => setFormInc({...formInc, ubicacion: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Ej. Sector excavación" /></div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Zona Afectada (Mapa 3D)</label>
                <input readOnly value={selectedZone || 'Ninguna'} className={`w-full px-3 py-2 border rounded-xl text-sm bg-gray-50 font-bold ${selectedZone ? 'text-red-600' : 'text-gray-400'}`} placeholder="Hacé clic en el cuerpo" />
              </div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Testigos</label><input value={formInc.testigos || ''} onChange={e => setFormInc({...formInc, testigos: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Nombres" /></div>
            </div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción *</label><textarea value={formInc.descripcion} onChange={e => setFormInc({...formInc, descripcion: e.target.value})} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Descripción detallada del incidente..." /></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="text-xs font-bold text-gray-500 uppercase">Causa Raíz</label><textarea value={formInc.causa_raiz} onChange={e => setFormInc({...formInc, causa_raiz: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Análisis de causa raíz..." /></div>
              <div><label className="text-xs font-bold text-gray-500 uppercase">Acciones Correctivas</label><textarea value={formInc.acciones_correctivas} onChange={e => setFormInc({...formInc, acciones_correctivas: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Medidas a tomar..." /></div>
            </div>
            <button onClick={handleSubmitInc} disabled={createIncidente.isPending} className="bg-red-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-red-700 transition-all">
              {createIncidente.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Registrar Incidente
            </button>
          </div>
          <div className="lg:col-span-1">
            <Body3dMap selectedZone={selectedZone} onSelectZone={setSelectedZone} />
          </div>
        </div>
      )}

      {showForm && tab === 'observaciones' && (
        <div className="light-card p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Obra *</label><select value={formObs.obra_id} onChange={e => setFormObs({...formObs, obra_id: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="">Seleccioná</option>{projects.filter(p => p.status === 'active').map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Observador *</label><EmployeeCombobox value={formObs.observador} onChange={name => setFormObs({...formObs, observador: name})} employees={employees} placeholder="Seleccioná observador..." /></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Categoría</label><select value={formObs.categoria} onChange={e => setFormObs({...formObs, categoria: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm"><option value="epp">EPP</option><option value="orden_limpieza">Orden y Limpieza</option><option value="senalizacion">Señalización</option><option value="electrico">Eléctrico</option><option value="altura">Trabajo en Altura</option><option value="excavacion">Excavación</option><option value="vehicular">Vehicular</option><option value="incendio">Incendio</option><option value="otros">Otros</option></select></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Descripción *</label><textarea value={formObs.descripcion} onChange={e => setFormObs({...formObs, descripcion: e.target.value})} rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Qué observaste..." /></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><label className="text-xs font-bold text-gray-500 uppercase">Severidad (1-5)</label><input type="range" min="1" max="5" value={formObs.severidad} onChange={e => setFormObs({...formObs, severidad: e.target.value})} className="w-full" /><p className="text-center text-sm font-mono font-bold">{formObs.severidad}</p></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Probabilidad (1-5)</label><input type="range" min="1" max="5" value={formObs.probabilidad} onChange={e => setFormObs({...formObs, probabilidad: e.target.value})} className="w-full" /><p className="text-center text-sm font-mono font-bold">{formObs.probabilidad}</p></div>
            <div><label className="text-xs font-bold text-gray-500 uppercase">Riesgo (S×P)</label><div className={`text-center py-2 rounded-xl text-white font-bold text-xl font-mono ${RIESGO_COLOR(Number(formObs.severidad) * Number(formObs.probabilidad))}`}>{Number(formObs.severidad) * Number(formObs.probabilidad)}</div></div>
          </div>
          <div><label className="text-xs font-bold text-gray-500 uppercase">Acción Sugerida</label><input value={formObs.accion_sugerida} onChange={e => setFormObs({...formObs, accion_sugerida: e.target.value})} className="w-full px-3 py-2 border border-gray-300 rounded-xl text-sm" placeholder="Qué se debería hacer..." /></div>
          <button onClick={handleSubmitObs} disabled={createObservacion.isPending} className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-orange-700 transition-all">
            {createObservacion.isPending ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Check size={16} />} Registrar Observación
          </button>
        </div>
      )}

      {/* Incidentes List */}
      {tab === 'incidentes' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Registro de Incidentes</h3></div>
          {loadingInc ? <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-red-500 rounded-full animate-spin mx-auto" /></div> :
            incidentes.length === 0 ? <div className="text-center py-16 text-gray-400"><ShieldAlert size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin incidentes registrados</p><p className="text-sm">¡Mantené el registro actualizado para cumplir con la SRT!</p></div> :
            <table className="w-full text-sm text-left"><thead className="bg-gray-100/50 border-b text-xs font-bold text-gray-500 uppercase"><tr><th className="px-4 py-3">Fecha</th><th className="px-4 py-3">Obra</th><th className="px-4 py-3">Tipo</th><th className="px-4 py-3">Gravedad</th><th className="px-4 py-3">Afectado</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Acción</th></tr></thead>
              <tbody className="divide-y divide-gray-100">{incidentes.map(i => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs">{new Date(i.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</td>
                  <td className="px-4 py-3 font-medium">{(i.obra as any)?.name || '–'}</td>
                  <td className="px-4 py-3">{TIPO_LABELS[i.tipo]}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${GRAVEDAD_COLORS[i.gravedad]}`}>{i.gravedad}</span></td>
                  <td className="px-4 py-3">{i.persona_afectada || '–'}</td>
                  <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ESTADO_COLORS[i.estado]}`}>{i.estado.replace('_', ' ')}</span></td>
                  <td className="px-4 py-3">{i.estado === 'abierto' && <button onClick={() => updateIncidente.mutate({ id: i.id, estado: 'cerrado' })} className="text-xs text-green-600 font-bold hover:underline">Cerrar</button>}</td>
                </tr>
              ))}</tbody></table>
          }
        </div>
      )}

      {/* Observaciones List */}
      {tab === 'observaciones' && (
        <div className="light-card overflow-hidden">
          <div className="p-4 border-b border-gray-100 bg-gray-50"><h3 className="font-bold text-gray-800">Observaciones de Seguridad</h3></div>
          {loadingObs ? <div className="p-8 text-center"><div className="w-6 h-6 border-2 border-gray-200 border-t-orange-500 rounded-full animate-spin mx-auto" /></div> :
            observaciones.length === 0 ? <div className="text-center py-16 text-gray-400"><Eye size={48} className="mx-auto mb-3 opacity-30" /><p className="font-medium">Sin observaciones</p><p className="text-sm">Registrá observaciones de riesgo para prevenir incidentes.</p></div> :
            <div className="divide-y divide-gray-100">{observaciones.map(o => {
              const CatIcon = CATEGORIA_ICONS[o.categoria || 'otros'] || Activity;
              return (
                <div key={o.id} className="px-4 py-3 flex items-center gap-4 hover:bg-gray-50">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white ${RIESGO_COLOR(o.riesgo_score)}`}><span className="font-black font-mono text-sm">{o.riesgo_score}</span></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-800 flex items-center gap-2"><CatIcon size={14} /> {o.descripcion.substring(0, 80)}</p>
                    <p className="text-xs text-gray-500">{(o.obra as any)?.name} — {o.observador} — {new Date(o.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${o.estado === 'resuelta' ? 'bg-green-100 text-green-700' : o.estado === 'en_correccion' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{o.estado.replace('_', ' ')}</span>
                </div>
              );
            })}</div>
          }
        </div>
      )}

      {/* Comunicar Siniestro tab */}
      {tab === 'comunicar' && (
        <div className="space-y-4">
          <div className="light-card p-6">
            <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2"><MessageSquare size={20} /> Canal de Comunicación de Siniestros</h3>
            <p className="text-sm text-gray-500 mb-6">Cuando ocurra un siniestro, la comunicación debe ser inmediata. Usá estos canales para reportar:</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mx-auto"><Phone size={28} className="text-red-600" /></div>
                <h4 className="font-bold text-red-700">Emergencia Inmediata</h4>
                <p className="text-sm text-gray-600">Llamá al responsable de SyH o al 911.</p>
                <p className="text-lg font-black text-red-600 font-mono">Débora — Resp. SyH</p>
                <p className="text-xs text-gray-400">Disponible 24/7 en horario de obra</p>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto"><Mail size={28} className="text-amber-600" /></div>
                <h4 className="font-bold text-amber-700">Reporte Formal</h4>
                <p className="text-sm text-gray-600">Para registrar oficialmente el siniestro.</p>
                <p className="text-sm font-bold text-amber-700">1. Registrá el incidente en esta sección</p>
                <p className="text-sm font-bold text-amber-700">2. Adjuntá fotos y documentos</p>
                <p className="text-sm font-bold text-amber-700">3. Notificá a la ART</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto"><Upload size={28} className="text-blue-600" /></div>
                <h4 className="font-bold text-blue-700">Documentación</h4>
                <p className="text-sm text-gray-600">Subí fotos del lugar, del accidente, y documentos relevantes.</p>
                <p className="text-sm font-bold text-blue-700">Fotos del lugar</p>
                <p className="text-sm font-bold text-blue-700">Declaración de testigos</p>
                <p className="text-sm font-bold text-blue-700">Informe médico / ART</p>
              </div>
            </div>
            <div className="mt-6 bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h4 className="font-bold text-sm text-gray-700 mb-2">📋 Protocolo de Comunicación</h4>
              <ol className="list-decimal list-inside space-y-1 text-sm text-gray-600">
                <li><span className="font-bold">Asegurar la zona</span> — Evitar que ocurran más lesiones</li>
                <li><span className="font-bold">Asistir al afectado</span> — Primeros auxilios y derivación médica</li>
                <li><span className="font-bold">Notificar a Débora (Resp. SyH)</span> — Comunicación inmediata</li>
                <li><span className="font-bold">Registrar en el sistema</span> — Tab "Incidentes" + Mapa 3D corporal</li>
                <li><span className="font-bold">Documentar con fotos</span> — Lugar, condiciones, EPP usado</li>
                <li><span className="font-bold">Investigar causa raíz</span> — Completar el formulario de investigación</li>
                <li><span className="font-bold">Definir acciones correctivas</span> — Prevenir recurrencia</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
