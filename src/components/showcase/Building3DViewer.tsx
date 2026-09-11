import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Building3DViewerProps {
  renderMode?: 'wireframe' | 'solid' | 'hybrid';
}

export const Building3DViewer: React.FC<Building3DViewerProps> = ({
  renderMode = 'hybrid',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // 1. Escena y Niebla Cinemática
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Slate 950
    scene.fog = new THREE.FogExp2(0x020617, 0.035);

    // 2. Cámara
    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 1000);
    camera.position.set(13, 11, 16);

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enablePan = false;
    controls.minDistance = 8;
    controls.maxDistance = 26;
    controls.maxPolarAngle = Math.PI / 2 - 0.05;
    controls.minPolarAngle = Math.PI / 6;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.8;

    // 5. Iluminación
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 2.0);
    dirLight.position.set(15, 25, 12);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 1024;
    dirLight.shadow.mapSize.height = 1024;
    scene.add(dirLight);

    const blueLight = new THREE.PointLight(0x0284c7, 3, 30);
    blueLight.position.set(-12, 8, -10);
    scene.add(blueLight);

    const warmAccent = new THREE.PointLight(0xf59e0b, 1.5, 20);
    warmAccent.position.set(10, 2, 8);
    scene.add(warmAccent);

    // 6. Suelo / Terreno con Cuadrícula Técnica
    const gridHelper = new THREE.GridHelper(30, 30, 0x0284c7, 0x1e293b);
    gridHelper.position.y = -3.5;
    scene.add(gridHelper);

    // 7. Grupo del Edificio
    const buildingGroup = new THREE.Group();
    buildingGroup.position.set(0, -3.5, 0);
    scene.add(buildingGroup);

    // Base / Podio Comercial
    const baseGeo = new THREE.BoxGeometry(5.2, 0.8, 5.2);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.3,
      metalness: 0.8,
      wireframe: renderMode === 'wireframe',
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.4;
    baseMesh.castShadow = true;
    baseMesh.receiveShadow = true;
    buildingGroup.add(baseMesh);

    // Niveles de la Torre (16 Pisos)
    const floorsCount = 15;
    const isWire = renderMode === 'wireframe';

    for (let f = 1; f <= floorsCount; f++) {
      const y = 0.8 + f * 0.65;
      const taper = f > 10 ? (f - 10) * 0.15 : 0;
      const size = 4.4 - taper;

      // Losa estructural de hormigón
      const slabGeo = new THREE.BoxGeometry(size, 0.1, size);
      const slabMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.2,
        metalness: 0.8,
        wireframe: isWire,
      });
      const slab = new THREE.Mesh(slabGeo, slabMat);
      slab.position.y = y;
      slab.castShadow = true;
      buildingGroup.add(slab);

      // Núcleo central de hormigón armado
      const coreGeo = new THREE.BoxGeometry(1.6, 0.55, 1.6);
      const coreMat = new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        roughness: 0.4,
        metalness: 0.6,
        wireframe: isWire,
      });
      const core = new THREE.Mesh(coreGeo, coreMat);
      core.position.y = y + 0.32;
      buildingGroup.add(core);

      // Curtain Wall (Fachada de vidrio estructural)
      if (!isWire) {
        const glassGeo = new THREE.BoxGeometry(size - 0.1, 0.54, size - 0.1);
        const glassMat = new THREE.MeshPhysicalMaterial({
          color: 0x38bdf8,
          transmission: 0.8,
          opacity: 0.7,
          transparent: true,
          roughness: 0.1,
          ior: 1.5,
        });
        const glass = new THREE.Mesh(glassGeo, glassMat);
        glass.position.y = y + 0.32;
        buildingGroup.add(glass);
      }
    }

    // Remate / Helipuerto y balizas
    const roofGeo = new THREE.CylinderGeometry(1.8, 1.8, 0.15, 32);
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.3, metalness: 0.9 });
    const roofMesh = new THREE.Mesh(roofGeo, roofMat);
    roofMesh.position.y = 0.8 + (floorsCount + 1) * 0.65;
    buildingGroup.add(roofMesh);

    // Grúa Torre Animada (Identidad Operativa ECAR)
    const craneGroup = new THREE.Group();
    craneGroup.position.set(2.8, 5.5, 2.8);

    const mastGeo = new THREE.BoxGeometry(0.2, 11, 0.2);
    const craneMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.8, wireframe: isWire });
    const mast = new THREE.Mesh(mastGeo, craneMat);
    craneGroup.add(mast);

    const boomGeo = new THREE.BoxGeometry(5.5, 0.22, 0.22);
    const boom = new THREE.Mesh(boomGeo, craneMat);
    boom.position.set(-1.8, 5.5, 0);
    craneGroup.add(boom);

    buildingGroup.add(craneGroup);

    // 8. Loop de Animación
    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Rotación sutil de la pluma de la grúa
      boom.rotation.y = Math.sin(Date.now() * 0.001) * 0.5;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize listener
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      controls.dispose();
      renderer.dispose();
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [renderMode]);

  return (
    <div className="relative w-full h-[540px] md:h-[620px] rounded-3xl overflow-hidden bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 border border-slate-800 shadow-2xl">
      {/* Controles Flotantes */}
      <div className="absolute top-6 left-6 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900/85 backdrop-blur-md border border-slate-700/80 text-xs text-slate-300 font-mono shadow-md">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>BIM Digital Twin • 60 FPS Three.js</span>
        </div>
      </div>

      <div className="absolute bottom-6 left-6 z-10 text-[11px] text-slate-400 font-mono pointer-events-none hidden md:block bg-slate-950/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800">
        🖱️ Orbitar con clic izquierdo • Zoom con rueda • Renderizado en tiempo real
      </div>

      {/* Contenedor WebGL */}
      <div ref={mountRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
    </div>
  );
};
