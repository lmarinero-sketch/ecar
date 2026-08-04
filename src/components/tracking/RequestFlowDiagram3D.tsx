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
  type: 'box' | 'warehouse' | 'truck' | 'construction';
}

interface RequestFlowDiagram3DProps {
  currentStatus: FlowStatus;
  hasDerivation: boolean;
}

// --- 3D Models built with primitives ---

const TruckModel = ({ color, emissive }: any) => (
  <group scale={0.5} position={[0, 0.2, 0]}>
    {/* Cabin */}
    <mesh position={[0.6, 0.4, 0]}>
      <boxGeometry args={[0.6, 0.8, 0.8]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    {/* Body */}
    <mesh position={[-0.4, 0.4, 0]}>
      <boxGeometry args={[1.4, 0.8, 0.9]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    {/* Wheels */}
    <mesh position={[0.6, 0, 0.45]} rotation={[Math.PI/2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[0.6, 0, -0.45]} rotation={[Math.PI/2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[-0.6, 0, 0.45]} rotation={[Math.PI/2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
    <mesh position={[-0.6, 0, -0.45]} rotation={[Math.PI/2, 0, 0]}>
      <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
      <meshStandardMaterial color="#1f2937" />
    </mesh>
  </group>
);

const WarehouseModel = ({ color, emissive }: any) => (
  <group scale={0.5} position={[0, 0.25, 0]}>
    {/* Main Building */}
    <mesh position={[0, 0.4, 0]}>
      <boxGeometry args={[1.6, 0.8, 1.2]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    {/* Roof */}
    <mesh position={[0, 1.05, 0]} rotation={[0, Math.PI/4, 0]}>
      <cylinderGeometry args={[0, 1.2, 0.5, 4]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
  </group>
);

const BoxModel = ({ color, emissive }: any) => (
  <group scale={0.5} position={[0, 0.3, 0]}>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[0.8, 0.6, 0.8]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    {/* Tape */}
    <mesh position={[0, 0.31, 0]}>
      <boxGeometry args={[0.9, 0.02, 0.2]} />
      <meshStandardMaterial color="#fcd34d" />
    </mesh>
  </group>
);

const ConstructionModel = ({ color, emissive }: any) => (
  <group scale={0.5} position={[0, 0.3, 0]}>
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1.2, 0.6, 1.2]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    <mesh position={[-0.4, 0.6, -0.4]}>
      <cylinderGeometry args={[0.1, 0.1, 0.6]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
    <mesh position={[0.4, 0.6, 0.4]}>
      <cylinderGeometry args={[0.1, 0.1, 0.6]} />
      <meshStandardMaterial color={color} emissive={emissive} />
    </mesh>
  </group>
);

const getModelForType = (type: string, color: string, emissive: string) => {
  switch (type) {
    case 'truck': return <TruckModel color={color} emissive={emissive} />;
    case 'warehouse': return <WarehouseModel color={color} emissive={emissive} />;
    case 'construction': return <ConstructionModel color={color} emissive={emissive} />;
    case 'box':
    default: return <BoxModel color={color} emissive={emissive} />;
  }
};

const Node = ({ node }: { node: FlowNode }) => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state) => {
    if (node.status === 'active' && groupRef.current) {
      // Bobbing animation for active node
      const y = Math.sin(state.clock.elapsedTime * 3) * 0.1;
      groupRef.current.position.y = node.position[1] + y;
      groupRef.current.rotation.y += 0.01;
    }
  });

  const materialColor = node.status === 'completed' ? '#10b981' : node.status === 'active' ? '#3b82f6' : '#9ca3af';
  const emissiveColor = node.status === 'active' ? '#1d4ed8' : '#000000';

  return (
    <group position={node.position}>
      <group ref={groupRef}>
        {getModelForType(node.type, materialColor, emissiveColor)}
      </group>
      <Html position={[0, -0.8, 0]} center zIndexRange={[100, 0]}>
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
      { id: '1', label: '1. Pedido Obra', position: [-4, 0, 0], status: 'completed', color: '#10b981', type: 'box' },
      { id: '2', label: '2. Pañol Central', position: [-1.5, 0, 0], status: 'active', color: '#3b82f6', type: 'warehouse' },
    ];

    if (hasDerivation) {
      baseNodes.push(
        { id: '3', label: '3. Derivado a Compras', position: [0.5, 2, -1], status: 'future', color: '#9ca3af', type: 'warehouse' },
        { id: '4', label: '4. Logística (Recepción)', position: [2.5, 2, -1], status: 'future', color: '#9ca3af', type: 'warehouse' },
        { id: '5', label: '5. Despacho a Obra', position: [2.5, 0, 0], status: 'future', color: '#9ca3af', type: 'truck' },
        { id: '6', label: '6. Recepción en Obra', position: [5, 0, 0], status: 'future', color: '#9ca3af', type: 'construction' }
      );
    } else {
      baseNodes.push(
        { id: '3', label: '3. Despacho a Obra', position: [1.5, 0, 0], status: 'future', color: '#9ca3af', type: 'truck' },
        { id: '4', label: '4. Recepción en Obra', position: [4, 0, 0], status: 'future', color: '#9ca3af', type: 'construction' }
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
