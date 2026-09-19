import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, ECAR_TENANT_ID } from '../lib/supabase';
import type {
  ProjectMilestone,
  ProjectPendingTask,
  TechnicalBlueprint,
  MeetingCommitment,
  ProjectWorkReport
} from '../lib/types';

// Helper for local storage keying
const LS_KEYS = {
  milestones: 'ecar_obra_milestones',
  pending: 'ecar_obra_pending_tasks',
  blueprints: 'ecar_obra_blueprints',
  meetings: 'ecar_obra_meetings',
  reports: 'ecar_obra_work_reports',
};

function getLocal<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function setLocal<T>(key: string, data: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Error saving to localStorage', e);
  }
}

// ════════════════════════════════════════════════════════════════════════════
// 1. HITOS Y PLAZOS (ProjectMilestone)
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_MILESTONES: ProjectMilestone[] = [
  {
    id: 'm-1',
    project_id: '',
    nombre: 'Aprobación de Planos de Replanteo y Permisos',
    tipo: 'contractual',
    fecha_objetivo_original: '2026-10-15',
    fecha_pronosticada: '2026-10-15',
    responsable: 'Oficina Técnica / Arq. López',
    estado: 'al_dia',
    avance_requerido_pct: 100,
    avance_real_pct: 85,
  },
  {
    id: 'm-2',
    project_id: '',
    nombre: 'Finalización de Zanjeo y Tendido PEAD Tramo 1',
    tipo: 'interno',
    fecha_objetivo_original: '2026-11-10',
    fecha_pronosticada: '2026-11-18',
    responsable: 'Jefe de Frente / Capataz',
    estado: 'en_riesgo',
    avance_requerido_pct: 50,
    avance_real_pct: 35,
    causa_desvio: 'Interferencia imprevista de cañería pluvial en intersección principal',
    plan_recuperacion: 'Incorporación de miniexcavadora adicional y ampliación de horario de cuadrilla.',
  },
  {
    id: 'm-3',
    project_id: '',
    nombre: 'Prueba Hidráulica y Cierre de Red Troncal',
    tipo: 'terceros',
    fecha_objetivo_original: '2026-12-05',
    fecha_pronosticada: '2026-12-05',
    responsable: 'Inspector Comitente OSSE',
    estado: 'al_dia',
    avance_requerido_pct: 0,
    avance_real_pct: 0,
  },
];

export function useProjectMilestones(projectId?: string) {
  return useQuery({
    queryKey: ['project_milestones', projectId],
    queryFn: async () => {
      // 1. Try Supabase
      try {
        let query = supabase.from('project_milestones').select('*').order('fecha_pronosticada', { ascending: true });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as ProjectMilestone[];
        }
      } catch (e) {
        // Fallback to local
      }

      // 2. Fallback localStorage
      const local = getLocal<ProjectMilestone>(LS_KEYS.milestones);
      if (local.length === 0) {
        // Initialize with realistic seed if empty
        const seeded = DEFAULT_MILESTONES.map(m => ({ ...m, project_id: projectId || '' }));
        setLocal(LS_KEYS.milestones, seeded);
        return seeded;
      }
      return projectId ? local.filter(m => !m.project_id || m.project_id === projectId) : local;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (milestone: Omit<ProjectMilestone, 'id' | 'created_at'>) => {
      const newId = `ms_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload: ProjectMilestone = {
        ...milestone,
        id: newId,
        tenant_id: ECAR_TENANT_ID,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('project_milestones').insert(payload);
      } catch (e) {
        // ignore if table doesn't exist
      }

      const current = getLocal<ProjectMilestone>(LS_KEYS.milestones);
      setLocal(LS_KEYS.milestones, [payload, ...current]);
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_milestones'] });
    },
  });
}

export function useUpdateProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectMilestone> & { id: string }) => {
      try {
        await supabase.from('project_milestones').update(updates).eq('id', id);
      } catch (e) {
        // ignore
      }

      const current = getLocal<ProjectMilestone>(LS_KEYS.milestones);
      const updated = current.map(m => m.id === id ? { ...m, ...updates, updated_at: new Date().toISOString() } : m);
      setLocal(LS_KEYS.milestones, updated);
      return updated.find(m => m.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_milestones'] });
    },
  });
}

export function useDeleteProjectMilestone() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('project_milestones').delete().eq('id', id);
      } catch (e) {
        // ignore
      }
      const current = getLocal<ProjectMilestone>(LS_KEYS.milestones);
      setLocal(LS_KEYS.milestones, current.filter(m => m.id !== id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_milestones'] });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 2. PENDIENTES DE OBRA (ProjectPendingTask)
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_PENDING_TASKS: ProjectPendingTask[] = [
  {
    id: 'p-1',
    project_id: '',
    descripcion: 'Retirar escombros acumulados a menos de 0.60m del borde de zanja',
    sector: 'Tramo N20-N21 / Pasaje 2',
    responsable: 'Capataz de Cuadrilla',
    prioridad: 'alta',
    fecha_objetivo: new Date().toISOString().split('T')[0],
    origen: 'recorrida',
    estado: 'pendiente',
  },
  {
    id: 'p-2',
    project_id: '',
    descripcion: 'Colocar balizamiento nocturno y cinta de peligro en cruce peatonal',
    sector: 'Esquina Pasaje 8 y Calle Principal',
    responsable: 'Prevencionista HyS',
    prioridad: 'urgente',
    fecha_objetivo: new Date().toISOString().split('T')[0],
    origen: 'inspeccion',
    estado: 'en_proceso',
  },
  {
    id: 'p-3',
    project_id: '',
    descripcion: 'Ajuste de cota en acometida domiciliaria n.º 14 por nivel de vereda',
    sector: 'Mza C / Pasaje 6',
    responsable: 'Of. Técnica',
    prioridad: 'media',
    fecha_objetivo: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    origen: 'cliente',
    estado: 'pendiente',
  },
];

export function useProjectPendingTasks(projectId?: string) {
  return useQuery({
    queryKey: ['project_pending_tasks', projectId],
    queryFn: async () => {
      try {
        let query = supabase.from('project_pending_tasks').select('*').order('created_at', { ascending: false });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) {
          return data as ProjectPendingTask[];
        }
      } catch (e) {
        // Fallback
      }

      const local = getLocal<ProjectPendingTask>(LS_KEYS.pending);
      if (local.length === 0) {
        const seeded = DEFAULT_PENDING_TASKS.map(p => ({ ...p, project_id: projectId || '' }));
        setLocal(LS_KEYS.pending, seeded);
        return seeded;
      }
      return projectId ? local.filter(p => !p.project_id || p.project_id === projectId) : local;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateProjectPendingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (task: Omit<ProjectPendingTask, 'id' | 'created_at'>) => {
      const newId = `pend_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload: ProjectPendingTask = {
        ...task,
        id: newId,
        tenant_id: ECAR_TENANT_ID,
        created_at: new Date().toISOString(),
      };

      try {
        await supabase.from('project_pending_tasks').insert(payload);
      } catch (e) {
        // ignore
      }

      const current = getLocal<ProjectPendingTask>(LS_KEYS.pending);
      setLocal(LS_KEYS.pending, [payload, ...current]);
      return payload;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_pending_tasks'] });
    },
  });
}

export function useUpdateProjectPendingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<ProjectPendingTask> & { id: string }) => {
      try {
        await supabase.from('project_pending_tasks').update(updates).eq('id', id);
      } catch (e) {
        // ignore
      }

      const current = getLocal<ProjectPendingTask>(LS_KEYS.pending);
      const updated = current.map(t => t.id === id ? { ...t, ...updates, updated_at: new Date().toISOString() } : t);
      setLocal(LS_KEYS.pending, updated);
      return updated.find(t => t.id === id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_pending_tasks'] });
    },
  });
}

export function useDeleteProjectPendingTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('project_pending_tasks').delete().eq('id', id);
      } catch (e) {
        // ignore
      }
      const current = getLocal<ProjectPendingTask>(LS_KEYS.pending);
      setLocal(LS_KEYS.pending, current.filter(t => t.id !== id));
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project_pending_tasks'] });
    },
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 3. DOCUMENTACIÓN & PLANOS (TechnicalBlueprint con Versión Vigente)
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_BLUEPRINTS: TechnicalBlueprint[] = [
  {
    id: 'bp-1',
    project_id: '',
    codigo_plano: 'PL-SAN-001',
    titulo: 'Red Distribuidora de Agua Potable - Planta General y Nodos',
    disciplina: 'sanitaria',
    sector: 'Sector 1 - Nodos N20 a N30',
    es_vigente: true,
    revision_actual: 'Rev. B',
    fecha_aprobacion: '2026-08-20',
    aprobado_por: 'Ing. Comitente OSSE',
    archivo_url: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=800&q=80',
    archivo_nombre: 'PL-SAN-001_RevB_Aprobado.pdf',
    historial_revisiones: [
      { revision: 'Rev. A', fecha: '2026-07-10', autor: 'Of. Técnica ECAR', archivo_url: '#', notas: 'Emisión inicial para revisión' },
      { revision: 'Rev. B', fecha: '2026-08-20', autor: 'Ing. Comitente OSSE', archivo_url: '#', notas: 'Aprobado con ajuste de tapada mínima' }
    ]
  },
  {
    id: 'bp-2',
    project_id: '',
    codigo_plano: 'PL-EST-004',
    titulo: 'Cámaras de Válvulas y Desagüe - Detalles Estructurales',
    disciplina: 'estructura',
    sector: 'Nodos N15 y N22',
    es_vigente: true,
    revision_actual: 'Rev. 0',
    fecha_aprobacion: '2026-09-02',
    aprobado_por: 'Dirección de Obra',
    archivo_url: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=800&q=80',
    archivo_nombre: 'PL-EST-004_Camaras_Rev0.pdf',
    historial_revisiones: [
      { revision: 'Rev. 0', fecha: '2026-09-02', autor: 'Ing. Estructuras', archivo_url: '#', notas: 'Válido para construcción' }
    ]
  },
];

export function useTechnicalBlueprints(projectId?: string) {
  return useQuery({
    queryKey: ['technical_blueprints', projectId],
    queryFn: async () => {
      try {
        let query = supabase.from('technical_blueprints').select('*').order('codigo_plano', { ascending: true });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as TechnicalBlueprint[];
      } catch (e) {
        // local
      }

      const local = getLocal<TechnicalBlueprint>(LS_KEYS.blueprints);
      if (local.length === 0) {
        const seeded = DEFAULT_BLUEPRINTS.map(b => ({ ...b, project_id: projectId || '' }));
        setLocal(LS_KEYS.blueprints, seeded);
        return seeded;
      }
      return projectId ? local.filter(b => !b.project_id || b.project_id === projectId) : local;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateTechnicalBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (bp: Omit<TechnicalBlueprint, 'id' | 'created_at'>) => {
      const newId = `bp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload: TechnicalBlueprint = {
        ...bp,
        id: newId,
        tenant_id: ECAR_TENANT_ID,
        created_at: new Date().toISOString(),
      };
      try {
        await supabase.from('technical_blueprints').insert(payload);
      } catch (e) {}

      const current = getLocal<TechnicalBlueprint>(LS_KEYS.blueprints);
      setLocal(LS_KEYS.blueprints, [payload, ...current]);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technical_blueprints'] }),
  });
}

export function useUpdateTechnicalBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TechnicalBlueprint> & { id: string }) => {
      try {
        await supabase.from('technical_blueprints').update(updates).eq('id', id);
      } catch (e) {}

      const current = getLocal<TechnicalBlueprint>(LS_KEYS.blueprints);
      const updated = current.map(b => b.id === id ? { ...b, ...updates } : b);
      setLocal(LS_KEYS.blueprints, updated);
      return updated.find(b => b.id === id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technical_blueprints'] }),
  });
}

export function useDeleteTechnicalBlueprint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('technical_blueprints').delete().eq('id', id);
      } catch (e) {}
      const current = getLocal<TechnicalBlueprint>(LS_KEYS.blueprints);
      setLocal(LS_KEYS.blueprints, current.filter(b => b.id !== id));
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['technical_blueprints'] }),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 4. MINUTAS Y COMPROMISOS (MeetingCommitment)
// ════════════════════════════════════════════════════════════════════════════

const DEFAULT_MEETINGS: MeetingCommitment[] = [
  {
    id: 'meet-1',
    project_id: '',
    titulo_reunion: 'Reunión Semanal de Avance con Inspección Comitente',
    fecha: new Date(Date.now() - 86400000 * 3).toISOString().split('T')[0],
    tipo_reunion: 'comitente',
    participantes: ['Lucas Marinero (ECAR)', 'Ing. Roberto Gómez (OSSE)', 'Arq. Elena Varela (Of. Técnica)'],
    temas_tratados: 'Revisión del avance semanal de electrofusión en PEAD. Análisis de interferencia en Pasaje 4 y tramitación de adicional n.º 2.',
    compromisos: [
      { id: 'c-1', descripcion: 'Enviar cómputo métrico valorizado del adicional de zanja en roca', responsable: 'ECAR (Of. Técnica)', fecha_limite: '2026-09-22', estado: 'en_curso' },
      { id: 'c-2', descripcion: 'Liberar frente de empalme en garita principal', responsable: 'Comitente OSSE', fecha_limite: '2026-09-25', estado: 'pendiente' },
    ],
  },
];

export function useMeetingCommitments(projectId?: string) {
  return useQuery({
    queryKey: ['meeting_commitments', projectId],
    queryFn: async () => {
      try {
        let query = supabase.from('meeting_commitments').select('*').order('fecha', { ascending: false });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as MeetingCommitment[];
      } catch (e) {}

      const local = getLocal<MeetingCommitment>(LS_KEYS.meetings);
      if (local.length === 0) {
        const seeded = DEFAULT_MEETINGS.map(m => ({ ...m, project_id: projectId || '' }));
        setLocal(LS_KEYS.meetings, seeded);
        return seeded;
      }
      return projectId ? local.filter(m => !m.project_id || m.project_id === projectId) : local;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateMeetingCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (meet: Omit<MeetingCommitment, 'id' | 'created_at'>) => {
      const newId = `meet_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload: MeetingCommitment = {
        ...meet,
        id: newId,
        tenant_id: ECAR_TENANT_ID,
        created_at: new Date().toISOString(),
      };
      try {
        await supabase.from('meeting_commitments').insert(payload);
      } catch (e) {}

      const current = getLocal<MeetingCommitment>(LS_KEYS.meetings);
      setLocal(LS_KEYS.meetings, [payload, ...current]);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_commitments'] }),
  });
}

export function useUpdateMeetingCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MeetingCommitment> & { id: string }) => {
      try {
        await supabase.from('meeting_commitments').update(updates).eq('id', id);
      } catch (e) {}

      const current = getLocal<MeetingCommitment>(LS_KEYS.meetings);
      const updated = current.map(m => m.id === id ? { ...m, ...updates } : m);
      setLocal(LS_KEYS.meetings, updated);
      return updated.find(m => m.id === id);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_commitments'] }),
  });
}

export function useDeleteMeetingCommitment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('meeting_commitments').delete().eq('id', id);
      } catch (e) {}
      const current = getLocal<MeetingCommitment>(LS_KEYS.meetings);
      setLocal(LS_KEYS.meetings, current.filter(m => m.id !== id));
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['meeting_commitments'] }),
  });
}

// ════════════════════════════════════════════════════════════════════════════
// 5. INFORMES DE OBRA (ProjectWorkReport)
// ════════════════════════════════════════════════════════════════════════════

export function useWorkReports(projectId?: string) {
  return useQuery({
    queryKey: ['project_work_reports', projectId],
    queryFn: async () => {
      try {
        let query = supabase.from('project_work_reports').select('*').order('created_at', { ascending: false });
        if (projectId) query = query.eq('project_id', projectId);
        const { data, error } = await query;
        if (!error && data && data.length > 0) return data as ProjectWorkReport[];
      } catch (e) {}

      const local = getLocal<ProjectWorkReport>(LS_KEYS.reports);
      return projectId ? local.filter(r => !r.project_id || r.project_id === projectId) : local;
    },
    staleTime: 1000 * 60 * 2,
  });
}

export function useCreateWorkReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (report: Omit<ProjectWorkReport, 'id' | 'created_at'>) => {
      const newId = `rep_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const payload: ProjectWorkReport = {
        ...report,
        id: newId,
        tenant_id: ECAR_TENANT_ID,
        created_at: new Date().toISOString(),
      };
      try {
        await supabase.from('project_work_reports').insert(payload);
      } catch (e) {}

      const current = getLocal<ProjectWorkReport>(LS_KEYS.reports);
      setLocal(LS_KEYS.reports, [payload, ...current]);
      return payload;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project_work_reports'] }),
  });
}

export function useDeleteWorkReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      try {
        await supabase.from('project_work_reports').delete().eq('id', id);
      } catch (e) {}
      const current = getLocal<ProjectWorkReport>(LS_KEYS.reports);
      setLocal(LS_KEYS.reports, current.filter(r => r.id !== id));
      return id;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project_work_reports'] }),
  });
}
