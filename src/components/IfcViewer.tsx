import React, { useRef, useEffect, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import * as WebIFC from 'web-ifc';
import { Upload, RotateCw, ZoomIn, ZoomOut, Maximize2, Eye, Layers, Box, X, Loader2, Calculator, HelpCircle } from 'lucide-react';
import { BimCostCalculator, type BimElementMeasure } from './BimCostCalculator';

interface IfcViewerProps {
  onElementSelect?: (elementId: number, properties: Record<string, any>) => void;
}

// IFC category names for display
const IFC_CATEGORIES: Record<number, string> = {
  [WebIFC.IFCWALL]: 'Muro',
  [WebIFC.IFCWALLSTANDARDCASE]: 'Muro',
  [WebIFC.IFCSLAB]: 'Losa',
  [WebIFC.IFCCOLUMN]: 'Columna',
  [WebIFC.IFCBEAM]: 'Viga',
  [WebIFC.IFCWINDOW]: 'Ventana',
  [WebIFC.IFCDOOR]: 'Puerta',
  [WebIFC.IFCSTAIR]: 'Escalera',
  [WebIFC.IFCROOF]: 'Techo',
  [WebIFC.IFCFURNISHINGELEMENT]: 'Mobiliario',
  [WebIFC.IFCPLATE]: 'Placa',
  [WebIFC.IFCMEMBER]: 'Miembro',
  [WebIFC.IFCRAILING]: 'Baranda',
  [WebIFC.IFCFOOTING]: 'Fundación',
  [WebIFC.IFCPILE]: 'Pilote',
};

// Material colors by IFC type
const TYPE_COLORS: Record<string, number> = {
  'Muro': 0xd4c9a8, 'Losa': 0xb0b0b0, 'Columna': 0xa0a0a0,
  'Viga': 0x909090, 'Ventana': 0x88ccee, 'Puerta': 0x8b6f47,
  'Escalera': 0xc0c0c0, 'Techo': 0xcc5533, 'Fundación': 0x888070,
  'Pilote': 0x777060, 'default': 0xcccccc,
};

export const IfcViewer: React.FC<IfcViewerProps> = ({ onElementSelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const ifcApiRef = useRef<WebIFC.IfcAPI | null>(null);
  const modelRef = useRef<THREE.Group | null>(null);
  const raycaster = useRef(new THREE.Raycaster());
  const mouse = useRef(new THREE.Vector2());

  const [loading, setLoading] = useState(false);
  const [loadProgress, setLoadProgress] = useState('');
  const [fileName, setFileName] = useState<string | null>(null);
  const [elementCount, setElementCount] = useState(0);
  const [selectedElement, setSelectedElement] = useState<{ id: number; type: string; name: string; props: Record<string, any> } | null>(null);
  const [viewMode, setViewMode] = useState<'solid' | 'wireframe' | 'xray'>('solid');
  const [error, setError] = useState<string | null>(null);
  const [elementMeasures, setElementMeasures] = useState<BimElementMeasure[]>([]);
  const [showCosts, setShowCosts] = useState(false);
  const [showHelp, setShowHelp] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;
    const w = container.clientWidth, h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f2f5);
    sceneRef.current = scene;

    // Grid
    const grid = new THREE.GridHelper(100, 50, 0xcccccc, 0xe0e0e0);
    scene.add(grid);

    // Axes
    const axes = new THREE.AxesHelper(5);
    scene.add(axes);

    // Camera
    const camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
    camera.position.set(30, 25, 30);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.screenSpacePanning = true;
    controls.maxPolarAngle = Math.PI / 1.5;
    controlsRef.current = controls;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight.position.set(30, 50, 30);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.set(2048, 2048);
    scene.add(dirLight);
    const fillLight = new THREE.DirectionalLight(0x8899ff, 0.3);
    fillLight.position.set(-20, 10, -20);
    scene.add(fillLight);

    // Animation loop
    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      const nw = container.clientWidth, nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    const ro = new ResizeObserver(handleResize);
    ro.observe(container);

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
      renderer.dispose();
      controls.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  // Initialize web-ifc
  useEffect(() => {
    const initIfc = async () => {
      const api = new WebIFC.IfcAPI();
      api.SetWasmPath('/');
      await api.Init();
      ifcApiRef.current = api;
    };
    initIfc().catch(err => setError(`Error inicializando web-ifc: ${err.message}`));
    return () => { ifcApiRef.current?.Dispose(); };
  }, []);

  // Extract geometry from IFC model
  const loadIfcModel = useCallback(async (buffer: ArrayBuffer) => {
    const api = ifcApiRef.current;
    if (!api || !sceneRef.current) return;

    setLoading(true); setError(null); setLoadProgress('Parseando archivo IFC...');

    try {
      const modelID = api.OpenModel(new Uint8Array(buffer));
      const group = new THREE.Group();
      group.name = 'ifc-model';
      let count = 0;
      const measures: BimElementMeasure[] = [];

      // Get all mesh geometries
      setLoadProgress('Extrayendo geometría...');
      api.StreamAllMeshes(modelID, (mesh: WebIFC.FlatMesh) => {
        const placedGeometries = mesh.geometries;
        for (let i = 0; i < placedGeometries.size(); i++) {
          const pg = placedGeometries.get(i);
          const geomData = api.GetGeometry(modelID, pg.geometryExpressID);

          const verts = api.GetVertexArray(geomData.GetVertexData(), geomData.GetVertexDataSize());
          const indices = api.GetIndexArray(geomData.GetIndexData(), geomData.GetIndexDataSize());

          if (!verts.length || !indices.length) continue;

          // Build Three.js geometry
          const geometry = new THREE.BufferGeometry();
          const posArr = new Float32Array(verts.length / 2);
          const normArr = new Float32Array(verts.length / 2);

          for (let j = 0; j < verts.length; j += 6) {
            const idx = j / 2;
            posArr[idx] = verts[j];
            posArr[idx + 1] = verts[j + 1];
            posArr[idx + 2] = verts[j + 2];
            normArr[idx] = verts[j + 3];
            normArr[idx + 1] = verts[j + 4];
            normArr[idx + 2] = verts[j + 5];
          }

          geometry.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
          geometry.setAttribute('normal', new THREE.BufferAttribute(normArr, 3));
          geometry.setIndex(Array.from(indices));

          // Get element type for color
          let typeName = 'default';
          try {
            const line = api.GetLine(modelID, mesh.expressID);
            const typeNum = line?.type;
            typeName = IFC_CATEGORIES[typeNum] || 'default';
          } catch { /* fallback */ }

          const color = TYPE_COLORS[typeName] ?? TYPE_COLORS['default'];
          const material = new THREE.MeshPhongMaterial({
            color, side: THREE.DoubleSide,
            transparent: pg.color.w < 1, opacity: pg.color.w < 1 ? pg.color.w : 1,
          });

          const meshObj = new THREE.Mesh(geometry, material);
          meshObj.userData.expressID = mesh.expressID;
          meshObj.userData.typeName = typeName;

          // Apply transform
          const mat = new THREE.Matrix4();
          mat.fromArray(pg.flatTransformation);
          meshObj.applyMatrix4(mat);
          meshObj.receiveShadow = true;
          meshObj.castShadow = true;

          // Extract bounding box measurements
          geometry.computeBoundingBox();
          const bb = geometry.boundingBox;
          if (bb) {
            const sz = new THREE.Vector3();
            bb.getSize(sz);
            // Apply transform scale
            const scaleVec = new THREE.Vector3();
            mat.decompose(new THREE.Vector3(), new THREE.Quaternion(), scaleVec);
            const w = sz.x * Math.abs(scaleVec.x);
            const h = sz.y * Math.abs(scaleVec.y);
            const d = sz.z * Math.abs(scaleVec.z);
            measures.push({
              expressID: mesh.expressID,
              typeName: typeName !== 'default' ? typeName : 'Otro',
              width: w, height: h, depth: d,
              area: 2 * (w * h + w * d + h * d),
              volume: w * h * d,
              perimeter: 2 * (w + d),
            });
          }

          group.add(meshObj);
          count++;
        }
      });

      // Remove old model
      if (modelRef.current) {
        sceneRef.current.remove(modelRef.current);
        modelRef.current.traverse(child => {
          if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
          if ((child as THREE.Mesh).material) {
            const mat = (child as THREE.Mesh).material;
            if (Array.isArray(mat)) mat.forEach(m => m.dispose());
            else mat.dispose();
          }
        });
      }

      // Center and scale model
      const box = new THREE.Box3().setFromObject(group);
      const center = box.getCenter(new THREE.Vector3());
      const size = box.getSize(new THREE.Vector3());
      group.position.sub(center);
      group.position.y += size.y / 2;

      // Fit camera
      const maxDim = Math.max(size.x, size.y, size.z);
      const cam = cameraRef.current!;
      cam.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
      cam.lookAt(0, size.y / 4, 0);
      controlsRef.current!.target.set(0, size.y / 4, 0);

      sceneRef.current.add(group);
      modelRef.current = group;
      setElementCount(count);
      setElementMeasures(measures);

      api.CloseModel(modelID);
      setLoadProgress('');
    } catch (err: any) {
      setError(`Error cargando modelo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, []);

  // File drop/upload handler
  const handleFile = useCallback(async (file: File) => {
    if (!file.name.toLowerCase().endsWith('.ifc')) {
      setError('Solo se aceptan archivos .ifc');
      return;
    }
    setFileName(file.name);
    const buffer = await file.arrayBuffer();
    await loadIfcModel(buffer);
  }, [loadIfcModel]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  // Click to select element
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!mountRef.current || !cameraRef.current || !modelRef.current) return;
    const rect = mountRef.current.getBoundingClientRect();
    mouse.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.current.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.current.setFromCamera(mouse.current, cameraRef.current);
    const intersects = raycaster.current.intersectObjects(modelRef.current.children, true);

    // Reset previous selection
    modelRef.current.children.forEach(child => {
      const m = child as THREE.Mesh;
      if (m.userData._originalColor && m.material) {
        (m.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000);
      }
    });

    if (intersects.length > 0) {
      const hit = intersects[0].object as THREE.Mesh;
      const mat = hit.material as THREE.MeshPhongMaterial;
      mat.emissive.setHex(0x115c9c);
      hit.userData._originalColor = true;

      setSelectedElement({
        id: hit.userData.expressID || 0,
        type: hit.userData.typeName || 'Elemento',
        name: `${hit.userData.typeName || 'Elemento'} #${hit.userData.expressID || '?'}`,
        props: { expressID: hit.userData.expressID },
      });
      onElementSelect?.(hit.userData.expressID, { type: hit.userData.typeName });
    } else {
      setSelectedElement(null);
    }
  }, [onElementSelect]);

  // View mode toggle
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.children.forEach(child => {
      const m = child as THREE.Mesh;
      const mat = m.material as THREE.MeshPhongMaterial;
      if (!mat) return;
      switch (viewMode) {
        case 'solid': mat.wireframe = false; mat.opacity = mat.userData?.origOpacity ?? 1; mat.transparent = mat.opacity < 1; break;
        case 'wireframe': mat.wireframe = true; mat.opacity = 1; mat.transparent = false; break;
        case 'xray': mat.wireframe = false; mat.opacity = 0.3; mat.transparent = true; break;
      }
    });
  }, [viewMode]);

  // Zoom controls
  const zoomIn = () => { if (cameraRef.current) { cameraRef.current.position.multiplyScalar(0.8); } };
  const zoomOut = () => { if (cameraRef.current) { cameraRef.current.position.multiplyScalar(1.25); } };
  const resetView = () => {
    if (!cameraRef.current || !modelRef.current) return;
    const box = new THREE.Box3().setFromObject(modelRef.current);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    cameraRef.current.position.set(maxDim * 1.2, maxDim * 0.8, maxDim * 1.2);
    controlsRef.current!.target.set(0, size.y / 4, 0);
  };

  return (
    <>
    <div className="flex flex-col lg:flex-row gap-0 h-[620px] bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
      {/* 3D Viewport */}
      <div className="flex-1 relative min-h-0">
        <div
          ref={mountRef}
          className="w-full h-full cursor-grab active:cursor-grabbing"
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={handleClick}
        />

        {/* Loading overlay */}
        {loading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
            <Loader2 size={40} className="text-indigo-600 animate-spin mb-3" />
            <p className="text-sm font-bold text-gray-700">{loadProgress || 'Cargando modelo...'}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="absolute top-4 left-4 right-4 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-xl z-20 flex items-center gap-2">
            <span className="font-bold">Error:</span> {error}
            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
          </div>
        )}

        {/* Upload prompt when no model */}
        {!fileName && !loading && (
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <label className="pointer-events-auto cursor-pointer">
              <div className="bg-white/95 backdrop-blur border-2 border-dashed border-indigo-300 rounded-2xl p-10 text-center hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group">
                <Upload size={48} className="mx-auto mb-3 text-indigo-400 group-hover:text-indigo-600 transition-colors" />
                <p className="font-bold text-gray-800 text-lg">Cargá un archivo IFC</p>
                <p className="text-sm text-gray-500 mt-1">Arrastrá o hacé click para subir</p>
                <p className="text-xs text-gray-400 mt-3">Formatos: .ifc (Revit, ArchiCAD, AutoCAD exportado)</p>
                <div className="mt-4 bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm inline-flex items-center gap-2 group-hover:bg-indigo-700 transition-all shadow-md">
                  <Upload size={16} /> Seleccionar Archivo
                </div>
              </div>
              <input type="file" accept=".ifc" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </label>
          </div>
        )}

        {/* Toolbar */}
        {fileName && (
          <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
            <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl p-2.5 shadow-md">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-[10px] font-bold text-gray-800 uppercase tracking-wider">BIM Viewer</span>
              </div>
              <p className="text-[10px] text-gray-500 font-mono truncate max-w-[180px]">{fileName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">{elementCount} elementos</p>
            </div>

            <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-md flex flex-col">
              <button onClick={zoomIn} className="p-2 hover:bg-gray-100 rounded-t-xl transition-colors" title="Acercar"><ZoomIn size={16} className="text-gray-600" /></button>
              <button onClick={zoomOut} className="p-2 hover:bg-gray-100 transition-colors" title="Alejar"><ZoomOut size={16} className="text-gray-600" /></button>
              <button onClick={resetView} className="p-2 hover:bg-gray-100 transition-colors" title="Resetear vista"><Maximize2 size={16} className="text-gray-600" /></button>
              <button className="p-2 hover:bg-gray-100 rounded-b-xl transition-colors" title="Rotar"><RotateCw size={16} className="text-gray-600" /></button>
            </div>

            <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-md flex flex-col">
              {([
                { mode: 'solid' as const, icon: Box, label: 'Sólido' },
                { mode: 'wireframe' as const, icon: Layers, label: 'Wireframe' },
                { mode: 'xray' as const, icon: Eye, label: 'Rayos X' },
              ]).map(({ mode, icon: Icon, label }) => (
                <button key={mode} onClick={() => setViewMode(mode)}
                  className={`p-2 transition-colors flex items-center gap-1.5 text-[10px] font-bold first:rounded-t-xl last:rounded-b-xl ${viewMode === mode ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-gray-100 text-gray-500'}`}
                  title={label}
                >
                  <Icon size={14} /> {label}
                </button>
              ))}
            </div>

            {/* Upload new file */}
            <label className="cursor-pointer">
              <div className="bg-white/95 backdrop-blur border border-gray-200 rounded-xl shadow-md p-2 text-center hover:bg-gray-50 transition-colors">
                <Upload size={14} className="mx-auto text-gray-500" />
                <span className="text-[9px] font-bold text-gray-500 block mt-0.5">Nuevo</span>
              </div>
              <input type="file" accept=".ifc" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }} />
            </label>

            {/* Cost calculator toggle */}
            <button onClick={() => setShowCosts(!showCosts)}
              className={`backdrop-blur border border-gray-200 rounded-xl shadow-md p-2 text-center transition-colors ${showCosts ? 'bg-emerald-50 border-emerald-300' : 'bg-white/95 hover:bg-gray-50'}`}>
              <Calculator size={14} className={`mx-auto ${showCosts ? 'text-emerald-600' : 'text-gray-500'}`} />
              <span className={`text-[9px] font-bold block mt-0.5 ${showCosts ? 'text-emerald-600' : 'text-gray-500'}`}>Costos</span>
            </button>

            {/* Help toggle */}
            <button onClick={() => setShowHelp(true)}
              className="backdrop-blur border border-gray-200 bg-white/95 hover:bg-gray-50 rounded-xl shadow-md p-2 text-center transition-colors"
              title="Ver Ayuda de Cómputo">
              <HelpCircle size={14} className="mx-auto text-indigo-500" />
              <span className="text-[9px] font-bold text-indigo-500 block mt-0.5">Ayuda</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar — selected element info */}
      {selectedElement && (
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-gray-200 bg-slate-900 text-white p-5 flex flex-col">
          <div className="flex justify-between items-start mb-4">
            <div>
              <span className="text-[9px] font-bold tracking-wider text-cyan-400 uppercase">Elemento BIM</span>
              <h5 className="font-bold text-sm text-white mt-0.5">{selectedElement.name}</h5>
            </div>
            <button onClick={() => setSelectedElement(null)} className="text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
          </div>

          <div className="space-y-3">
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Tipo</span>
              <span className="text-sm font-bold text-white">{selectedElement.type}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Express ID</span>
              <span className="text-sm font-mono text-cyan-400">{selectedElement.id}</span>
            </div>
            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Vincular a Tarea WBS</span>
              <p className="text-xs text-slate-300">Próximamente: seleccioná una tarea del WBS para vincular este elemento del modelo.</p>
            </div>
          </div>
        </div>
      )}
    </div>

      {/* Cost Calculator Panel */}
      {showCosts && fileName && (
        <BimCostCalculator elements={elementMeasures} />
      )}

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h3 className="font-bold text-lg text-gray-800 flex items-center gap-2">
                <HelpCircle className="text-indigo-600" size={20} /> ¿Cómo calcula las medidas el Visor BIM?
              </h3>
              <button onClick={() => setShowHelp(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 text-sm text-gray-600">
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
                <p className="font-medium text-indigo-900 mb-1">Cómputo Métrico Real e Instantáneo</p>
                <p className="text-xs text-indigo-700 leading-relaxed">
                  Al subir un archivo IFC, el sistema no estima los valores ni usa placeholders. Lee directamente la geometría del modelo en 3D utilizando un motor WebAssembly de alto rendimiento y calcula las medidas reales en base a su representación física en el espacio tridimensional.
                </p>
              </div>

              {/* Schematic Image */}
              <div className="border border-gray-200 rounded-xl overflow-hidden bg-gray-50 flex flex-col items-center p-4">
                <img src="/bim_help_diagram.png" alt="Esquema de cálculo de Bounding Box BIM" className="max-h-72 object-contain rounded-lg shadow-sm" />
                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-2.5">Esquema tridimensional del Bounding Box (Caja contenedora)</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Metros Cúbicos (Volumen)</span>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Se calcula multiplicando las dimensiones tridimensionales (ancho, alto y profundidad) de la caja contenedora del objeto en base a su escala real en el modelo:
                  </p>
                  <p className="font-mono font-bold text-xs text-gray-800 bg-white border border-gray-200 p-1.5 rounded mt-2 text-center">
                    Volumen = W × H × D
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-cyan-600 uppercase tracking-wider">Metros Cuadrados (Superficie)</span>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Corresponde al área superficial exterior de la caja contenedora calculada a partir de las caras del elemento:
                  </p>
                  <p className="font-mono font-bold text-xs text-gray-800 bg-white border border-gray-200 p-1.5 rounded mt-2 text-center">
                    Área = 2 × (W·H + W·D + H·D)
                  </p>
                </div>

                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3">
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Metros Lineales (Perímetro)</span>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    Corresponde al perímetro de la base del elemento tridimensional, ideal para calcular zócalos o molduras:
                  </p>
                  <p className="font-mono font-bold text-xs text-gray-800 bg-white border border-gray-200 p-1.5 rounded mt-2 text-center">
                    Perímetro = 2 × (W + D)
                  </p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5">
                <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider block">Presupuestación e IVA</span>
                <p className="text-xs leading-relaxed text-slate-600">
                  Una vez computadas las cantidades físicas reales, podés ir al panel de <strong>Costos</strong> para modificar el costo unitario de cada categoría (ej: Muro, Losa, Viga) y definir qué magnitud física usar para el cálculo. El presupuesto final sumará todos los subtotales más el porcentaje de Gastos Generales (GG%) ingresado.
                </p>
              </div>
            </div>

            <div className="flex justify-end border-t border-gray-100 pt-3">
              <button
                onClick={() => setShowHelp(false)}
                className="bg-ecar-blue text-white px-5 py-2 rounded-lg font-bold text-sm hover:bg-ecar-blueDark hover:shadow-md transition-all animate-pulse"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
