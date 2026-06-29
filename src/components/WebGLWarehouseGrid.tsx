import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export const WebGLWarehouseGrid: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0xffffff, 0.05); // White fog matching background
    
    // 2. Camera Setup
    const camera = new THREE.PerspectiveCamera(60, mountRef.current.clientWidth / mountRef.current.clientHeight, 0.1, 100);
    camera.position.set(0, 5, 10);
    camera.lookAt(0, 0, -10);

    // 3. Renderer Setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0xffffff, 0); // Transparent background
    mountRef.current.appendChild(renderer.domElement);

    // 4. Create the Moving Grid (Floor)
    const gridColor = new THREE.Color(0x115C9C); // ECAR Blue
    const gridHelper = new THREE.GridHelper(100, 50, gridColor, gridColor);
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.15;
    scene.add(gridHelper);

    // 5. Create Wireframe Shelves (Boxes)
    const shelfGeometry = new THREE.BoxGeometry(2, 6, 8);
    const edgesGeometry = new THREE.EdgesGeometry(shelfGeometry);
    const shelfMaterial = new THREE.LineBasicMaterial({ color: 0x115C9C, transparent: true, opacity: 0.2 });
    
    const shelves: THREE.LineSegments[] = [];
    const numShelves = 12;
    
    for (let i = 0; i < numShelves; i++) {
      const shelf = new THREE.LineSegments(edgesGeometry, shelfMaterial);
      // Position shelves in two rows on left and right
      const isLeft = i % 2 === 0;
      const zOffset = -Math.floor(i / 2) * 12;
      
      shelf.position.set(isLeft ? -4 : 4, 3, zOffset);
      scene.add(shelf);
      shelves.push(shelf);
    }

    // 6. Animation Loop
    const clock = new THREE.Clock();
    const speed = 4.0; // Units per second

    let animationFrameId: number;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      // Move grid
      gridHelper.position.z += speed * delta;
      if (gridHelper.position.z >= 2) {
        gridHelper.position.z -= 2;
      }

      // Move shelves
      shelves.forEach(shelf => {
        shelf.position.z += speed * delta;
        if (shelf.position.z > 5) {
          shelf.position.z -= 12 * (numShelves / 2);
        }
      });

      renderer.render(scene, camera);
    };
    animate();

    // 7. Resize Handler
    const handleResize = () => {
      if (!mountRef.current) return;
      camera.aspect = mountRef.current.clientWidth / mountRef.current.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
      
      if (mountRef.current && renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose Three.js resources
      shelfGeometry.dispose();
      edgesGeometry.dispose();
      shelfMaterial.dispose();
      (gridHelper.material as THREE.Material).dispose();
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className="absolute inset-0 z-0 pointer-events-none rounded-xl overflow-hidden" 
      style={{ opacity: 0.8 }}
    />
  );
};
