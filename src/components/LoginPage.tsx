import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useAuth } from '../contexts/AuthContext';
import { HardHat, LogIn, UserPlus, AlertCircle } from 'lucide-react';

/* ── 3D Canvas Background component ── */
const Login3dBackground: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;
    const container = mountRef.current;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#f9fafb'); // General light background matching bg-gray-50

    // Camera
    const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 15);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0x115C9C, 1.2);
    dirLight.position.set(5, 10, 7);
    scene.add(dirLight);

    // Objects: construction-related shapes floating around (cubes, cylinders, octahedrons)
    const group = new THREE.Group();
    scene.add(group);

    const colors = [
      0x115C9C, // ecar-blue
      0x0B477D, // ecar-blueDark
      0xe5e7eb, // gray-200
      0xef4444, // ecar-red (subtle red accents)
    ];

    const shapes: THREE.Mesh[] = [];
    const shapeCount = 30;

    for (let i = 0; i < shapeCount; i++) {
      const size = Math.random() * 1.6 + 0.4;
      let geometry: THREE.BufferGeometry;
      
      const rand = Math.random();
      if (rand < 0.4) {
        geometry = new THREE.BoxGeometry(size, size, size);
      } else if (rand < 0.7) {
        geometry = new THREE.CylinderGeometry(size / 3, size / 3, size, 8);
      } else {
        geometry = new THREE.OctahedronGeometry(size / 2);
      }
      
      const color = colors[Math.floor(Math.random() * colors.length)];
      const material = new THREE.MeshPhongMaterial({
        color: color,
        transparent: true,
        opacity: color === 0xef4444 ? 0.35 : 0.25,
        wireframe: Math.random() > 0.7,
      });

      const mesh = new THREE.Mesh(geometry, material);
      
      // Distribute in 3D space
      mesh.position.set(
        (Math.random() - 0.5) * 22,
        (Math.random() - 0.5) * 16,
        (Math.random() - 0.5) * 10
      );

      // Random rotation
      mesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, 0);

      mesh.userData = {
        rotX: (Math.random() - 0.5) * 0.008,
        rotY: (Math.random() - 0.5) * 0.008,
        floatOffset: Math.random() * 100,
        floatSpeed: 0.001 + Math.random() * 0.001,
      };

      group.add(mesh);
      shapes.push(mesh);
    }

    // Dynamic grid floor (feeling of blueprint / construction drawing)
    const gridHelper = new THREE.GridHelper(40, 40, 0x115C9C, 0xe5e7eb);
    gridHelper.position.y = -7;
    gridHelper.rotation.x = 0.08;
    scene.add(gridHelper);

    // Mouse interactive panning
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / window.innerWidth - 0.5) * 3;
      targetMouseY = (e.clientY / window.innerHeight - 0.5) * 3;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Resize handler
    const handleResize = () => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    };

    window.addEventListener('resize', handleResize);

    // Animation Loop
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Smooth mouse follow
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      group.rotation.y = currentMouseX * 0.2;
      group.rotation.x = -currentMouseY * 0.2;

      // Animate shapes
      shapes.forEach((shape) => {
        shape.rotation.x += shape.userData.rotX;
        shape.rotation.y += shape.userData.rotY;

        // Up and down float
        shape.position.y += Math.sin(Date.now() * shape.userData.floatSpeed + shape.userData.floatOffset) * 0.003;
      });

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} className="absolute inset-0 z-0 opacity-80" />;
};

export const LoginPage: React.FC = () => {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'login') {
      const result = await signIn(email, password);
      if (result.error) setError(result.error);
    } else {
      if (!fullName.trim()) { setError('Ingresá tu nombre completo'); setLoading(false); return; }
      const result = await signUp(email, password, fullName);
      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(true);
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
        <Login3dBackground />
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center relative z-10 border border-gray-200">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserPlus className="text-green-600" size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">¡Cuenta creada!</h2>
          <p className="text-gray-600 text-sm mb-6">Revisá tu email para confirmar la cuenta y luego iniciá sesión.</p>
          <button onClick={() => { setSuccess(false); setMode('login'); }} className="bg-ecar-blue text-white px-6 py-2 rounded-lg font-bold hover:bg-ecar-blueDark transition-colors">
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 relative overflow-hidden">
      <Login3dBackground />
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden max-w-md w-full relative z-10 border border-gray-200">
        {/* Header */}
        <div className="bg-ecar-blueDark p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-blue-700/30 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="bg-white rounded-xl p-3 inline-block mb-4 relative z-10 shadow-md">
            <img src="/logoECAR.png" alt="ECAR" className="h-10 w-auto" onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }} />
          </div>
          <div className="flex items-center justify-center gap-2 text-white relative z-10">
            <HardHat size={20} className="text-blue-300" />
            <h1 className="text-lg font-bold tracking-wide">Sistema de Gestión Integral</h1>
          </div>
          <p className="text-blue-200 text-sm mt-1 relative z-10">ERP para Construcción</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-4 bg-white/95 backdrop-blur-sm">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2 text-sm text-red-700">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">Nombre Completo</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all text-sm"
                placeholder="Ingresá tu nombre"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all text-sm"
              placeholder="admin@ecar.com"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-ecar-blue/30 focus:border-ecar-blue transition-all text-sm"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ecar-blue text-white py-3 rounded-xl font-bold text-sm hover:bg-ecar-blueDark hover:shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 mt-6"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <LogIn size={18} />
                {mode === 'login' ? 'Iniciar Sesión' : 'Crear Cuenta'}
              </>
            )}
          </button>

          <div className="text-center pt-2">
            <button
              type="button"
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); }}
              className="text-sm text-ecar-blue hover:text-ecar-blueDark hover:underline font-bold transition-colors"
            >
              {mode === 'login' ? '¿No tenés cuenta? Registrate' : '¿Ya tenés cuenta? Iniciá sesión'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
