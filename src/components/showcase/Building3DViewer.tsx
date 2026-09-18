import React, { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export type UtilityFilter = 'all' | 'water' | 'gas' | 'electric' | 'wireframe';

interface Pipeline3DViewerProps {
  renderMode?: UtilityFilter;
  onFilterChange?: (mode: UtilityFilter) => void;
}

export const Building3DViewer: React.FC<Pipeline3DViewerProps> = ({
  renderMode = 'all',
  onFilterChange,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [activeMode, setActiveMode] = useState<UtilityFilter>(renderMode);

  useEffect(() => {
    setActiveMode(renderMode);
  }, [renderMode]);

  const handleModeChange = (mode: UtilityFilter) => {
    setActiveMode(mode);
    if (onFilterChange) onFilterChange(mode);
  };

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Escena & Niebla Cinemática
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950
    scene.fog = new THREE.FogExp2(0x020617, 0.03);

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(12, 8, 14);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // 4. Controles Orbitales
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 6;
    controls.maxDistance = 28;
    controls.maxPolarAngle = Math.PI / 2 - 0.02;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.6;

    // 5. Iluminación Técnica
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    dirLight.position.set(12, 20, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    // Luces de acento de servicios
    const blueLight = new THREE.PointLight(0x0284c7, 3, 20); // Agua
    blueLight.position.set(-2, 2, 4);
    scene.add(blueLight);

    const yellowLight = new THREE.PointLight(0xeab308, 2.5, 20); // Gas
    yellowLight.position.set(0, 1, 0);
    scene.add(yellowLight);

    const redLight = new THREE.PointLight(0xf97316, 2.5, 20); // Electricidad
    redLight.position.set(2, 3, -4);
    scene.add(redLight);

    // 6. Grupo Principal
    const mainGroup = new THREE.Group();
    scene.add(mainGroup);

    const isWire = activeMode === 'wireframe';
    const showWater = activeMode === 'all' || activeMode === 'water' || isWire;
    const showGas = activeMode === 'all' || activeMode === 'gas' || isWire;
    const showElectric = activeMode === 'all' || activeMode === 'electric' || isWire;

    // Cuadrícula Técnica
    const gridHelper = new THREE.GridHelper(26, 26, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -2.5;
    mainGroup.add(gridHelper);

    // Trinchera / Terreno Excavado
    const trenchLength = 22;
    const trenchWidth = 10;
    const trenchDepth = 3;

    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x09101d,
      roughness: 0.9,
      metalness: 0.1,
      wireframe: isWire,
    });

    // Paredes de excavación / Talud
    const leftWallGeo = new THREE.BoxGeometry(0.6, trenchDepth, trenchLength);
    const leftWall = new THREE.Mesh(leftWallGeo, groundMat);
    leftWall.position.set(-trenchWidth / 2, -1, 0);
    mainGroup.add(leftWall);

    const rightWallGeo = new THREE.BoxGeometry(0.6, trenchDepth, trenchLength);
    const rightWall = new THREE.Mesh(rightWallGeo, groundMat);
    rightWall.position.set(trenchWidth / 2, -1, 0);
    mainGroup.add(rightWall);

    // Cama de arena / Base de apoyo
    const sandBedGeo = new THREE.BoxGeometry(trenchWidth, 0.4, trenchLength);
    const sandBedMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.95,
      wireframe: isWire,
    });
    const sandBed = new THREE.Mesh(sandBedGeo, sandBedMat);
    sandBed.position.set(0, -2.3, 0);
    mainGroup.add(sandBed);

    // Puntales de entibación metálica (Shoring struts)
    const strutMat = new THREE.MeshStandardMaterial({
      color: 0x475569,
      roughness: 0.4,
      metalness: 0.7,
      wireframe: isWire,
    });
    for (let z = -8; z <= 8; z += 4) {
      const strutGeo = new THREE.CylinderGeometry(0.12, 0.12, trenchWidth - 0.2, 16);
      const strut = new THREE.Mesh(strutGeo, strutMat);
      strut.rotation.z = Math.PI / 2;
      strut.position.set(0, 0.2, z);
      mainGroup.add(strut);
    }

    // ──────────────────────────────────────────────
    // 7. CAÑERÍA DE AGUA POTABLE (AZUL / PEAD & FUNDICIÓN)
    // ──────────────────────────────────────────────
    if (showWater) {
      const waterGroup = new THREE.Group();
      waterGroup.position.set(-2.5, -1.2, 0);

      const waterMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7, // Sky Blue
        roughness: 0.2,
        metalness: 0.8,
        wireframe: isWire,
      });

      // Tubería principal recta
      const pipeGeo = new THREE.CylinderGeometry(0.8, 0.8, trenchLength, 32);
      const pipeMesh = new THREE.Mesh(pipeGeo, waterMat);
      pipeMesh.rotation.x = Math.PI / 2;
      pipeMesh.castShadow = true;
      pipeMesh.receiveShadow = true;
      waterGroup.add(pipeMesh);

      // Bridas y Uniones (Flanges) cada 4 metros
      const flangeMat = new THREE.MeshStandardMaterial({
        color: 0x0369a1,
        roughness: 0.3,
        metalness: 0.9,
        wireframe: isWire,
      });
      for (let z = -8; z <= 8; z += 4) {
        const flangeGeo = new THREE.CylinderGeometry(0.98, 0.98, 0.25, 24);
        const flangeMesh = new THREE.Mesh(flangeGeo, flangeMat);
        flangeMesh.rotation.x = Math.PI / 2;
        flangeMesh.position.z = z;
        waterGroup.add(flangeMesh);

        // Pernos perimetrales
        for (let b = 0; b < 8; b++) {
          const angle = (b / 8) * Math.PI * 2;
          const boltGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 8);
          const boltMesh = new THREE.Mesh(boltGeo, strutMat);
          boltMesh.position.set(Math.cos(angle) * 0.9, Math.sin(angle) * 0.9, z);
          boltMesh.rotation.x = Math.PI / 2;
          waterGroup.add(boltMesh);
        }
      }

      // Válvula Esclusa con Volante de Maniobra
      const valveBoxGeo = new THREE.BoxGeometry(1.9, 1.9, 1.4);
      const valveBoxMat = new THREE.MeshStandardMaterial({
        color: 0x075985,
        roughness: 0.3,
        metalness: 0.8,
        wireframe: isWire,
      });
      const valveBox = new THREE.Mesh(valveBoxGeo, valveBoxMat);
      valveBox.position.set(0, 0, 0);
      waterGroup.add(valveBox);

      // Vástago de válvula hacia la superficie
      const stemGeo = new THREE.CylinderGeometry(0.1, 0.1, 2.2, 16);
      const stem = new THREE.Mesh(stemGeo, strutMat);
      stem.position.set(0, 1.3, 0);
      waterGroup.add(stem);

      // Volante de operación
      const wheelGeo = new THREE.TorusGeometry(0.6, 0.08, 12, 24);
      const wheelMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.9 });
      const wheel = new THREE.Mesh(wheelGeo, wheelMat);
      wheel.rotation.x = Math.PI / 2;
      wheel.position.set(0, 2.4, 0);
      waterGroup.add(wheel);

      mainGroup.add(waterGroup);
    }

    // ──────────────────────────────────────────────
    // 8. GASODUCTO TRONCAL DE ALTA PRESIÓN (AMARILLO / ACERO API 5L)
    // ──────────────────────────────────────────────
    if (showGas) {
      const gasGroup = new THREE.Group();
      gasGroup.position.set(0.5, -1.4, 0);

      const gasMat = new THREE.MeshStandardMaterial({
        color: 0xeab308, // Warning Yellow
        roughness: 0.25,
        metalness: 0.7,
        wireframe: isWire,
      });

      // Tubería de gas
      const gasPipeGeo = new THREE.CylinderGeometry(0.55, 0.55, trenchLength, 32);
      const gasPipeMesh = new THREE.Mesh(gasPipeGeo, gasMat);
      gasPipeMesh.rotation.x = Math.PI / 2;
      gasPipeMesh.castShadow = true;
      gasPipeMesh.receiveShadow = true;
      gasGroup.add(gasPipeMesh);

      // Cordones de soldadura perimetral (Weld beads)
      const weldMat = new THREE.MeshStandardMaterial({
        color: 0xca8a04,
        roughness: 0.5,
        metalness: 0.8,
        wireframe: isWire,
      });
      for (let z = -9; z <= 9; z += 3) {
        const weldGeo = new THREE.TorusGeometry(0.56, 0.035, 8, 24);
        const weldMesh = new THREE.Mesh(weldGeo, weldMat);
        weldMesh.position.z = z;
        gasGroup.add(weldMesh);
      }

      // Estación de prueba catódica y toma de presión
      const testPostGeo = new THREE.CylinderGeometry(0.08, 0.08, 3.2, 16);
      const testPostMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.4 });
      const testPost = new THREE.Mesh(testPostGeo, testPostMat);
      testPost.position.set(0, 1.4, 2);
      gasGroup.add(testPost);

      // Cartel de advertencia NAG-100 en superficie
      const signGeo = new THREE.BoxGeometry(0.8, 0.5, 0.08);
      const signMat = new THREE.MeshStandardMaterial({ color: 0xeab308 });
      const sign = new THREE.Mesh(signGeo, signMat);
      sign.position.set(0, 2.9, 2);
      gasGroup.add(sign);

      mainGroup.add(gasGroup);
    }

    // ──────────────────────────────────────────────
    // 9. INFRAESTRUCTURA ELÉCTRICA SUBTERRÁNEA (ROJO/NARANJA / 132kV - 33kV)
    // ──────────────────────────────────────────────
    if (showElectric) {
      const elecGroup = new THREE.Group();
      elecGroup.position.set(3.2, -1.5, 0);

      // Banco de ductos / Bandeja de hormigón
      const trayGeo = new THREE.BoxGeometry(1.6, 0.6, trenchLength);
      const trayMat = new THREE.MeshStandardMaterial({
        color: 0x334155,
        roughness: 0.8,
        metalness: 0.2,
        wireframe: isWire,
      });
      const tray = new THREE.Mesh(trayGeo, trayMat);
      tray.position.y = -0.3;
      elecGroup.add(tray);

      // 3 Conductores de potencia de alta tensión (Terna blindada XLPE)
      const cableMat = new THREE.MeshStandardMaterial({
        color: 0xef4444, // Red
        roughness: 0.3,
        metalness: 0.6,
        wireframe: isWire,
      });

      const cableOffsets = [-0.4, 0, 0.4];
      cableOffsets.forEach((offsetX) => {
        const cableGeo = new THREE.CylinderGeometry(0.15, 0.15, trenchLength, 24);
        const cable = new THREE.Mesh(cableGeo, cableMat);
        cable.rotation.x = Math.PI / 2;
        cable.position.set(offsetX, 0.1, 0);
        cable.castShadow = true;
        elecGroup.add(cable);
      });

      // Tritubo de Fibra Óptica (Color Verde Neón)
      const fiberMat = new THREE.MeshStandardMaterial({
        color: 0x10b981, // Emerald
        roughness: 0.3,
        metalness: 0.5,
        wireframe: isWire,
      });
      const fiberGeo = new THREE.CylinderGeometry(0.08, 0.08, trenchLength, 16);
      const fiber = new THREE.Mesh(fiberGeo, fiberMat);
      fiber.rotation.x = Math.PI / 2;
      fiber.position.set(0, 0.4, 0);
      elecGroup.add(fiber);

      // Cámara de empalme subterránea (Manhole vault)
      const vaultGeo = new THREE.BoxGeometry(2.2, 2.0, 2.2);
      const vaultMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.85,
        metalness: 0.3,
        wireframe: isWire,
      });
      const vault = new THREE.Mesh(vaultGeo, vaultMat);
      vault.position.set(0, 0.2, -4);
      elecGroup.add(vault);

      mainGroup.add(elecGroup);
    }

    // 10. Loop de Animación
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      controls.update();

      // Pulsación lumínica sutil en luces de inspección
      const elapsed = clock.getElapsedTime();
      blueLight.intensity = 2.5 + Math.sin(elapsed * 2) * 0.8;
      yellowLight.intensity = 2.2 + Math.cos(elapsed * 1.8) * 0.6;
      redLight.intensity = 2.2 + Math.sin(elapsed * 2.2) * 0.6;

      renderer.render(scene, camera);
    };

    animate();

    // 11. Redimensionamiento
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [activeMode]);

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden border border-slate-800 bg-slate-950 shadow-2xl">
      {/* Three.js Canvas Container */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

      {/* Selector de Redes (Estilo Joby Aviation) */}
      <div className="absolute top-6 left-6 z-10 flex flex-wrap items-center gap-2 bg-slate-900/90 backdrop-blur-xl p-2 rounded-2xl border border-slate-800 shadow-xl">
        <button
          onClick={() => handleModeChange('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeMode === 'all'
              ? 'bg-white text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          Red Completa
        </button>

        <button
          onClick={() => handleModeChange('water')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeMode === 'water'
              ? 'bg-sky-500 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-sky-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-sky-400" />
          Agua Potable
        </button>

        <button
          onClick={() => handleModeChange('gas')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeMode === 'gas'
              ? 'bg-amber-400 text-slate-950 shadow-md'
              : 'text-slate-400 hover:text-amber-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400" />
          Gasoducto
        </button>

        <button
          onClick={() => handleModeChange('electric')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center gap-1.5 ${
            activeMode === 'electric'
              ? 'bg-red-500 text-white shadow-md'
              : 'text-slate-400 hover:text-red-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-400" />
          Electricidad & Redes
        </button>

        <button
          onClick={() => handleModeChange('wireframe')}
          className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
            activeMode === 'wireframe'
              ? 'bg-slate-700 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          BIM Wireframe
        </button>
      </div>

      {/* HUD de Telemetría Técnica Subterránea (Estilo Joby Engineering) */}
      <div className="absolute bottom-6 left-6 z-10 hidden sm:flex items-center gap-4 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 px-4 py-3 rounded-2xl text-[11px] font-mono text-slate-300">
        <div>
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Profundidad</span>
          <span className="font-bold text-sky-400">-3.20 m N.T.</span>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div>
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Cañería Agua</span>
          <span className="font-bold text-sky-400">PEAD DN1000 PN16</span>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div>
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Gasoducto</span>
          <span className="font-bold text-amber-400">API 5L Gr.B 12" • 75 Bar</span>
        </div>
        <div className="h-6 w-px bg-slate-800" />
        <div>
          <span className="text-[9px] text-slate-500 block uppercase tracking-wider">Energía</span>
          <span className="font-bold text-red-400">132 kV XLPE 630mm²</span>
        </div>
      </div>

      {/* Guía de Control de Navegación 3D */}
      <div className="absolute bottom-6 right-6 z-10 bg-slate-900/80 backdrop-blur-xl border border-slate-800/80 px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 flex items-center gap-2">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
        <span>Girar 360° con ratón • Zoom con rueda</span>
      </div>
    </div>
  );
};
