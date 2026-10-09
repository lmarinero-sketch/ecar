import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import type {
  ObraTramo,
  ObraRubro,
  ObraSubrubro,
  ObraItem,
  ObraTramoItem,
  ObraOrdenTrabajo,
  ObraParteDiarioItem,
  ObraHito,
  ObraCertificado,
  ObraCertificadoLinea,
  ObraLeccionAprendida
} from '../lib/types';

// ==============================================================================
// HOOKS: FASE 1 - PLANIFICACIÓN (Tramos, Rubros, Subrubros, Ítems, Matriz)
// ==============================================================================

export const useObraTramos = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_tramos', projectId],
    queryFn: async (): Promise<ObraTramo[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_tramos')
        .select('*')
        .eq('project_id', projectId)
        .order('orden', { ascending: true })
        .order('codigo', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraTramo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (tramo: Partial<ObraTramo>) => {
      const { data, error } = await supabase.from('obra_tramos').insert([tramo]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_tramos', vars.project_id] });
    },
  });
};

export const useObraRubros = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_rubros', projectId],
    queryFn: async (): Promise<ObraRubro[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_rubros')
        .select('*, subrubros:obra_subrubros(*, items:obra_items(*))')
        .eq('project_id', projectId)
        .order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraRubro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rubro: Partial<ObraRubro>) => {
      const { data, error } = await supabase.from('obra_rubros').insert([rubro]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_rubros', vars.project_id] });
    },
  });
};

export const useCreateObraSubrubro = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (subrubro: Partial<ObraSubrubro>) => {
      const { data, error } = await supabase.from('obra_subrubros').insert([subrubro]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_rubros', vars.project_id] });
    },
  });
};

export const useObraItems = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_items', projectId],
    queryFn: async (): Promise<ObraItem[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_items')
        .select('*')
        .eq('project_id', projectId)
        .order('orden', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ObraItem>) => {
      const { data, error } = await supabase.from('obra_items').insert([item]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_items', vars.project_id] });
      queryClient.invalidateQueries({ queryKey: ['obra_rubros', vars.project_id] });
    },
  });
};

export const useObraTramoItems = (projectId?: string, tramoId?: string) => {
  return useQuery({
    queryKey: ['obra_tramo_items', projectId, tramoId],
    queryFn: async (): Promise<ObraTramoItem[]> => {
      if (!projectId) return [];
      let query = supabase
        .from('obra_tramo_items')
        .select('*, tramo:obra_tramos(*), item:obra_items(*)')
        .eq('project_id', projectId);

      if (tramoId) {
        query = query.eq('tramo_id', tramoId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useUpdateObraTramoItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ObraTramoItem> & { id: string }) => {
      const { data, error } = await supabase.from('obra_tramo_items').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra_tramo_items'] });
    },
  });
};

// ==============================================================================
// HOOKS: FASE 2 - PROGRAMACIÓN (ODTs)
// ==============================================================================

export const useObraOrdenesTrabajo = (projectId?: string, fecha?: string) => {
  return useQuery({
    queryKey: ['obra_ordenes_trabajo', projectId, fecha],
    queryFn: async (): Promise<ObraOrdenTrabajo[]> => {
      if (!projectId) return [];
      let query = supabase
        .from('obra_ordenes_trabajo')
        .select('*, tramo:obra_tramos(*), item:obra_items(*)')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fecha) {
        query = query.eq('fecha', fecha);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraOrdenTrabajo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (odt: Partial<ObraOrdenTrabajo>) => {
      const { data, error } = await supabase.from('obra_ordenes_trabajo').insert([odt]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_ordenes_trabajo', vars.project_id] });
      queryClient.invalidateQueries({ queryKey: ['obra_tramo_items', vars.project_id] });
    },
  });
};

export const useUpdateObraOrdenTrabajo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...patch }: Partial<ObraOrdenTrabajo> & { id: string }) => {
      const { data, error } = await supabase.from('obra_ordenes_trabajo').update(patch).eq('id', id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra_ordenes_trabajo'] });
    },
  });
};

// ==============================================================================
// HOOKS: FASE 3 - EJECUCIÓN (Carga Física en Terreno)
// ==============================================================================

export const useObraParteDiarioItems = (projectId?: string, fecha?: string) => {
  return useQuery({
    queryKey: ['obra_parte_diario_items', projectId, fecha],
    queryFn: async (): Promise<ObraParteDiarioItem[]> => {
      if (!projectId) return [];
      let query = supabase
        .from('obra_parte_diario_items')
        .select('*, odt:obra_ordenes_trabajo(*), tramo_item:obra_tramo_items(*, tramo:obra_tramos(*), item:obra_items(*))')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (fecha) {
        query = query.eq('fecha', fecha);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraParteDiarioItem = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (item: Partial<ObraParteDiarioItem>) => {
      // 1. Insert execution record
      const { data, error } = await supabase.from('obra_parte_diario_items').insert([item]).select().single();
      if (error) throw error;

      // 2. Update tramo_item executed quantity
      if (item.tramo_item_id && item.cantidad_real) {
        const { data: ti } = await supabase
          .from('obra_tramo_items')
          .select('cantidad_prevista, cantidad_ejecutada')
          .eq('id', item.tramo_item_id)
          .single();

        if (ti) {
          const nuevaEjecutada = Number(ti.cantidad_ejecutada || 0) + Number(item.cantidad_real);
          const progresoPct = ti.cantidad_prevista > 0 
            ? Math.min(100, Math.round((nuevaEjecutada / Number(ti.cantidad_prevista)) * 100)) 
            : 0;
          const nuevoEstado = progresoPct >= 100 ? 'terminada' : 'en_ejecucion';

          await supabase
            .from('obra_tramo_items')
            .update({
              cantidad_ejecutada: nuevaEjecutada,
              progreso_pct: progresoPct,
              estado: nuevoEstado,
              updated_at: new Date().toISOString()
            })
            .eq('id', item.tramo_item_id);
        }
      }

      // 3. If ODT was linked, update its status
      if (item.odt_id) {
        await supabase
          .from('obra_ordenes_trabajo')
          .update({
            estado: 'cumplida',
            updated_at: new Date().toISOString()
          })
          .eq('id', item.odt_id);
      }

      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_parte_diario_items', vars.project_id] });
      queryClient.invalidateQueries({ queryKey: ['obra_tramo_items', vars.project_id] });
      queryClient.invalidateQueries({ queryKey: ['obra_ordenes_trabajo', vars.project_id] });
    },
  });
};

// ==============================================================================
// HOOKS: FASE 4 - CONTROL (Hitos Binarios 0/100 y Certificados)
// ==============================================================================

export const useObraHitos = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_hitos', projectId],
    queryFn: async (): Promise<ObraHito[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_hitos')
        .select('*, tramo:obra_tramos(*)')
        .eq('project_id', projectId)
        .order('codigo_hito', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraHito = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hito: Partial<ObraHito>) => {
      const { data, error } = await supabase.from('obra_hitos').insert([hito]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_hitos', vars.project_id] });
    },
  });
};

export const useUpdateObraHito = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, estado_binario, acta_numero, acta_url, inspector_nombre, fecha_inspeccion }: {
      id: string;
      estado_binario: 0 | 100;
      acta_numero?: string;
      acta_url?: string;
      inspector_nombre?: string;
      fecha_inspeccion?: string;
    }) => {
      const { data, error } = await supabase
        .from('obra_hitos')
        .update({
          estado_binario,
          acta_numero,
          acta_url,
          inspector_nombre,
          fecha_inspeccion: fecha_inspeccion || new Date().toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['obra_hitos'] });
      queryClient.invalidateQueries({ queryKey: ['obra_tramo_items'] });
    },
  });
};

export const useObraCertificados = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_certificados', projectId],
    queryFn: async (): Promise<ObraCertificado[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_certificados')
        .select('*, lineas:obra_certificado_lineas(*)')
        .eq('project_id', projectId)
        .order('numero_certificado', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraCertificado = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      certificado,
      lineas
    }: {
      certificado: Partial<ObraCertificado>;
      lineas: Array<Omit<ObraCertificadoLinea, 'id' | 'certificado_id' | 'created_at'>>;
    }) => {
      const { data: cert, error: certErr } = await supabase
        .from('obra_certificados')
        .insert([certificado])
        .select()
        .single();
      if (certErr) throw certErr;

      if (lineas && lineas.length > 0) {
        const payload = lineas.map(l => ({ ...l, certificado_id: cert.id }));
        const { error: lineasErr } = await supabase.from('obra_certificado_lineas').insert(payload);
        if (lineasErr) throw lineasErr;
      }

      return cert;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_certificados', vars.certificado.project_id] });
    },
  });
};

// ==============================================================================
// HOOKS: FASE 5 - RETROALIMENTACIÓN (Lecciones Aprendidas & Rendimientos)
// ==============================================================================

export const useObraLeccionesAprendidas = (projectId?: string) => {
  return useQuery({
    queryKey: ['obra_lecciones_aprendidas', projectId],
    queryFn: async (): Promise<ObraLeccionAprendida[]> => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from('obra_lecciones_aprendidas')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!projectId,
  });
};

export const useCreateObraLeccionAprendida = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (leccion: Partial<ObraLeccionAprendida>) => {
      const { data, error } = await supabase.from('obra_lecciones_aprendidas').insert([leccion]).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, vars) => {
      queryClient.invalidateQueries({ queryKey: ['obra_lecciones_aprendidas', vars.project_id] });
    },
  });
};
