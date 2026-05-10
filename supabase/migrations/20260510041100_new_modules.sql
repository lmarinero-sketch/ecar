-- =============================================
-- ECAR: Nuevos módulos operativos de obra
-- 1. Parte Diario de Obra
-- 2. Seguridad e Incidentes
-- 3. Inspecciones + Punch List (No Conformidades)
-- 4. Consultas de Obra (RFI)
-- =============================================

-- ─── 1. PARTE DIARIO DE OBRA ──────────────────────────────────────────────

create table if not exists parte_diario (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  fecha date not null,
  clima text check (clima in ('despejado','nublado','lluvia','tormenta','nieve','ventoso')),
  temperatura_min numeric,
  temperatura_max numeric,
  trabajo_realizado text not null,
  personal_presente jsonb default '[]',
  equipos_en_obra jsonb default '[]',
  materiales_usados jsonb default '[]',
  entregas text,
  incidentes text,
  horas_trabajadas numeric default 8,
  fotos text[] default '{}',
  notas text,
  firmado_por text,
  estado text default 'borrador' check (estado in ('borrador','enviado','aprobado','rechazado')),
  aprobado_por text,
  aprobado_en timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_parte_diario_obra on parte_diario(obra_id);
create index if not exists idx_parte_diario_fecha on parte_diario(fecha desc);
create unique index if not exists idx_parte_diario_unique on parte_diario(obra_id, fecha);

alter table parte_diario enable row level security;
create policy "parte_diario_all" on parte_diario for all using (true) with check (true);

-- ─── 2. SEGURIDAD E INCIDENTES ────────────────────────────────────────────

create table if not exists seguridad_incidentes (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  fecha date not null,
  hora time,
  tipo text not null check (tipo in ('accidente','incidente','cuasi_accidente','enfermedad_laboral')),
  gravedad text default 'leve' check (gravedad in ('leve','moderado','grave','fatal')),
  ubicacion text,
  descripcion text not null,
  persona_afectada text,
  persona_afectada_dni text,
  testigos text,
  tratamiento text check (tratamiento in ('primeros_auxilios','medico','hospital','ninguno')),
  dias_perdidos integer default 0,
  causa_raiz text,
  acciones_correctivas text,
  responsable_accion text,
  fecha_cierre_accion date,
  estado text default 'abierto' check (estado in ('abierto','en_investigacion','cerrado')),
  reportado_a_art boolean default false,
  fotos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_seg_incidentes_obra on seguridad_incidentes(obra_id);
create index if not exists idx_seg_incidentes_fecha on seguridad_incidentes(fecha desc);

alter table seguridad_incidentes enable row level security;
create policy "seg_incidentes_all" on seguridad_incidentes for all using (true) with check (true);

create table if not exists seguridad_observaciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  fecha date not null default current_date,
  observador text not null,
  categoria text check (categoria in ('epp','orden_limpieza','senalizacion','electrico','altura','excavacion','vehicular','incendio','otros')),
  descripcion text not null,
  severidad integer default 1 check (severidad between 1 and 5),
  probabilidad integer default 1 check (probabilidad between 1 and 5),
  riesgo_score integer generated always as (severidad * probabilidad) stored,
  accion_sugerida text,
  estado text default 'abierta' check (estado in ('abierta','en_correccion','resuelta')),
  fotos text[] default '{}',
  created_at timestamptz default now()
);

create index if not exists idx_seg_obs_obra on seguridad_observaciones(obra_id);

alter table seguridad_observaciones enable row level security;
create policy "seg_obs_all" on seguridad_observaciones for all using (true) with check (true);

-- ─── 3. INSPECCIONES + PUNCH LIST ─────────────────────────────────────────

create table if not exists inspecciones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  fecha date not null default current_date,
  tipo text not null check (tipo in ('estructura','electrica','sanitaria','gas','seguridad_contra_incendio','terminaciones','general')),
  inspector text not null,
  ubicacion text,
  checklist jsonb default '[]',
  resultado text default 'pendiente' check (resultado in ('pendiente','aprobada','aprobada_con_observaciones','rechazada')),
  observaciones text,
  fotos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_inspecciones_obra on inspecciones(obra_id);

alter table inspecciones enable row level security;
create policy "inspecciones_all" on inspecciones for all using (true) with check (true);

create table if not exists punch_list (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  inspeccion_id uuid references inspecciones(id),
  numero serial,
  titulo text not null,
  descripcion text,
  ubicacion text,
  prioridad text default 'media' check (prioridad in ('baja','media','alta','critica')),
  asignado_a text,
  estado text default 'abierto' check (estado in ('abierto','en_correccion','corregido','verificado','cerrado')),
  fecha_limite date,
  foto_antes text,
  foto_despues text,
  verificado_por text,
  verificado_en timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_punch_obra on punch_list(obra_id);
create index if not exists idx_punch_estado on punch_list(estado);

alter table punch_list enable row level security;
create policy "punch_list_all" on punch_list for all using (true) with check (true);

-- ─── 4. CONSULTAS DE OBRA (RFI) ──────────────────────────────────────────

create table if not exists consultas_obra (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid references tenants(id),
  obra_id uuid references projects(id),
  numero serial,
  asunto text not null,
  pregunta text not null,
  consultado_por text not null,
  asignado_a text,
  estado text default 'borrador' check (estado in ('borrador','abierta','respondida','cerrada')),
  respuesta_oficial text,
  respondido_por text,
  respondido_en timestamptz,
  impacto_costo boolean default false,
  impacto_costo_monto numeric default 0,
  impacto_cronograma boolean default false,
  impacto_cronograma_dias integer default 0,
  fecha_requerida date,
  fecha_limite_respuesta date,
  fotos text[] default '{}',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_consultas_obra on consultas_obra(obra_id);
create index if not exists idx_consultas_estado on consultas_obra(estado);

alter table consultas_obra enable row level security;
create policy "consultas_obra_all" on consultas_obra for all using (true) with check (true);
