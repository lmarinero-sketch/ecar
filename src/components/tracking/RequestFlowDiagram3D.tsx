import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Line, Html } from '@react-three/drei';
import * as THREE from 'three';

type FlowStatus = 'pending' | 'pañol' | 'obra' | 'compras' | 'logistica' | 'despacho' | 'recepcion';

interface FlowNode {
  id: string;
  label: string;
  position: [number, number, number];
  status: 'completed' | 'active' | 'future';
  color: string;
}

interface RequestFlowDiagram3DProps {
  currentStatus: FlowStatus;
  hasDerivation: boolean;
}

const Node = ({ node }: { node: FlowNode }) => {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (node.status === 'active' && meshRef.current) {
      // Pulse animation for active node
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.1;
      meshRef.current.scale.set(scale, scale, scale);
    }
  });

  const materialColor = node.status === 'completed' ? '#10b981' : node.status === 'active' ? '#3b82f6' : '#9ca3af';
  const emissiveColor = node.status === 'active' ? '#3b82f6' : '#000000';

  return (
    <group position={node.position}>
      <Sphere ref={meshRef} args={[0.4, 32, 32]}>
        <meshStandardMaterial color={materialColor} emissive={emissiveColor} emissiveIntensity={node.status === 'active' ? 0.5 : 0} />
      </Sphere>
      <Html position={[0, -0.7, 0]} center zIndexRange={[100, 0]}>
        <div className={`px-2 py-1 rounded-md text-[10px] font-bold whitespace-nowrap shadow-sm border ${
          node.status === 'completed' ? 'bg-emerald-100 text-emerald-800 border-emerald-200' :
          node.status === 'active' ? 'bg-blue-100 text-blue-800 border-blue-200' :
          'bg-gray-100 text-gray-500 border-gray-200'
        }`}>
          {node.label}
        </div>
      </Html>
    </group>
  );
};

const ConnectionLine = ({ start, end, active }: { start: [number, number, number], end: [number, number, number], active: boolean }) => {
  return (
    <Line
      points={[start, end]}
      color={active ? '#3b82f6' : '#e5e7eb'}
      lineWidth={active ? 3 : 1}
      dashed={!active}
      dashScale={50}
      dashSize={1}
      dashOffset={0}
    />
  );
};

export const RequestFlowDiagram3D: React.FC<RequestFlowDiagram3DProps> = ({ currentStatus, hasDerivation }) => {
  const nodes = useMemo<FlowNode[]>(() => {
    const baseNodes: FlowNode[] = [
      { id: '1', label: '1. Pedido Obra', position: [-4, 0, 0], status: 'completed', color: '#10b981' },
      { id: '2', label: '2. Pañol Central', position: [-1.5, 0, 0], status: 'active', color: '#3b82f6' },
    ];

    if (hasDerivation) {
      baseNodes.push(
        { id: '3', label: '3. Derivado a Compras', position: [0.5, 2, -1], status: 'future', color: '#9ca3af' },
        { id: '4', label: '4. Logística (Recepción)', position: [2.5, 2, -1], status: 'future', color: '#9ca3af' },
        { id: '5', label: '5. Despacho a Obra', position: [2.5, 0, 0], status: 'future', color: '#9ca3af' },
        { id: '6', label: '6. Recepción en Obra', position: [5, 0, 0], status: 'future', color: '#9ca3af' }
      );
    } else {
      baseNodes.push(
        { id: '3', label: '3. Despacho a Obra', position: [1.5, 0, 0], status: 'future', color: '#9ca3af' },
        { id: '4', label: '4. Recepción en Obra', position: [4, 0, 0], status: 'future', color: '#9ca3af' }
      );
    }

    // Map status logic
    if (currentStatus === 'compras' || currentStatus === 'logistica') {
      baseNodes[1].status = 'completed';
      if (hasDerivation) {
        baseNodes[2].status = currentStatus === 'compras' ? 'active' : 'completed';
        baseNodes[3].status = currentStatus === 'logistica' ? 'active' : 'future';
      }
    } else if (currentStatus === 'despacho') {
      baseNodes[1].status = 'completed';
      if (hasDerivation) {
        baseNodes[2].status = 'completed';
        baseNodes[3].status = 'completed';
        baseNodes[4].status = 'active';
      } else {
        baseNodes[2].status = 'active';
      }
    } else if (currentStatus === 'recepcion') {
      baseNodes.forEach(n => n.status = 'completed');
      baseNodes[baseNodes.length - 1].status = 'active';
    }

    return baseNodes;
  }, [currentStatus, hasDerivation]);

  const connections = useMemo(() => {
    const lines = [];
    lines.push({ start: nodes[0].position, end: nodes[1].position, active: nodes[1].status !== 'future' });
    
    if (hasDerivation) {
      lines.push({ start: nodes[1].position, end: nodes[2].position, active: nodes[2].status !== 'future' });
      lines.push({ start: nodes[2].position, end: nodes[3].position, active: nodes[3].status !== 'future' });
      lines.push({ start: nodes[3].position, end: nodes[4].position, active: nodes[4].status !== 'future' });
      lines.push({ start: nodes[4].position, end: nodes[5].position, active: nodes[5].status !== 'future' });
    } else {
      lines.push({ start: nodes[1].position, end: nodes[2].position, active: nodes[2].status !== 'future' });
      lines.push({ start: nodes[2].position, end: nodes[3].position, active: nodes[3].status !== 'future' });
    }
    return lines;
  }, [nodes, hasDerivation]);

  return (
    <div className="w-full h-[400px] bg-slate-900 rounded-xl overflow-hidden relative shadow-inner">
      <div className="absolute top-4 left-4 z-10 text-white/50 text-xs font-mono select-none">
        Arrastra para rotar · Scroll para zoom
      </div>
      <Canvas camera={{ position: [0, 3, 7], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -10]} intensity={0.5} />
        
        {connections.map((c, i) => (
          <ConnectionLine key={`line-${i}`} start={c.start} end={c.end} active={c.active} />
        ))}

        {nodes.map(node => (
          <Node key={node.id} node={node} />
        ))}
        
        <OrbitControls 
          enablePan={false} 
          minDistance={3} 
          maxDistance={12}
          maxPolarAngle={Math.PI / 1.5}
        />
      </Canvas>
    </div>
  );
};
