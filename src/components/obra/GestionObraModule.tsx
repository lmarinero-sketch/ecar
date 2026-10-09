import React from 'react';
import { NuevoModuloObra } from './NuevoModuloObra';

// Grupo 2: Gestión de Obra — Estándar de Ingeniería 5 Fases:
// 1. Planificación (WBS, Rubros, Subrubros, Ítems, Tramos e Incidencias)
// 2. Programación (Bandeja Para Programar, Tiempos, Cuadrillas, ODTs)
// 3. Ejecución (Modo Terreno Tablet, Producción Real en Unidades, Paradas)
// 4. Control (Hitos Binarios 0/100, Semáforo Base 3/3 y Certificados Contractuales)
// 5. Retroalimentación (Benchmark Rendimientos Reales vs Teóricos y Lecciones)
export const GestionObraModule: React.FC = () => {
  return <NuevoModuloObra />;
};
