import React from 'react';
import { NuevoModuloObra } from './obra/NuevoModuloObra';

// Reemplazo total de la antigua WbsModule monolítica de 14 pestañas.
// Ahora implementa exclusivamente el Estándar de Ingeniería en 5 Fases:
// 1. Planificación (WBS, Rubros, Ítems & Tramos Topológicos)
// 2. Programación (Bandeja Para Programar Saldo > 0 & Emisión de ODTs)
// 3. Ejecución (Modo Terreno / Tablet con producción métrica real y paradas con causa raíz)
// 4. Control (Hitos Binarios 0/100 con bloqueo de tramos y Certificados Contractuales inmutables)
// 5. Retroalimentación (Benchmark de rendimientos reales vs cotizados y lecciones aprendidas)
export const WbsModule: React.FC<{ initialProjectId?: string | null; initialTab?: string }> = () => {
  return <NuevoModuloObra />;
};
