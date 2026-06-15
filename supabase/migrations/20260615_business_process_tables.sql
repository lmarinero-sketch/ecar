-- ========== PIPELINE DE OPORTUNIDADES ==========
CREATE TABLE IF NOT EXISTS opportunities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid REFERENCES projects(id),
  client_name text NOT NULL,
  client_contact text,
  description text NOT NULL,
  work_type text NOT NULL DEFAULT 'obra_nueva',
  estimated_amount numeric NOT NULL DEFAULT 0,
  stage text NOT NULL DEFAULT 'oportunidad',
  priority text NOT NULL DEFAULT 'media',
  risk_level text NOT NULL DEFAULT 'bajo',
  location text,
  estimated_deadline date,
  documentation_checklist jsonb DEFAULT '{"planos":false,"pliego":false,"memoria_tecnica":false,"visita_obra":false,"fotos":false,"mediciones":false,"condiciones_pago":false}'::jsonb,
  assumptions text,
  exclusions text,
  assigned_to text,
  rejection_reason text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "opportunities_tenant_all" ON opportunities FOR ALL USING (true);

-- ========== VERSIONES DE PRESUPUESTO ==========
CREATE TABLE IF NOT EXISTS budget_versions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  opportunity_id uuid NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  version_number integer NOT NULL DEFAULT 1,
  amount numeric NOT NULL DEFAULT 0,
  margin_pct numeric DEFAULT 0,
  sent_to text,
  sent_date date,
  status text NOT NULL DEFAULT 'borrador',
  conditions text,
  validity_days integer,
  file_url text,
  notes text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE budget_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "budget_versions_tenant_all" ON budget_versions FOR ALL USING (true);

-- ========== ÓRDENES DE COMPRA / TRABAJO ==========
CREATE TABLE IF NOT EXISTS purchase_orders (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  po_number text NOT NULL,
  request_id uuid REFERENCES purchase_requests(id),
  project_id uuid REFERENCES projects(id),
  supplier_id uuid REFERENCES suppliers(id),
  supplier_name text NOT NULL,
  order_type text NOT NULL DEFAULT 'compra',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total_amount numeric NOT NULL DEFAULT 0,
  payment_condition text,
  delivery_date date,
  delivery_location text,
  status text NOT NULL DEFAULT 'borrador',
  approval_status text NOT NULL DEFAULT 'no_requerida',
  approved_by text,
  approved_at timestamptz,
  notes text,
  urgency boolean DEFAULT false,
  urgency_reason text,
  created_by text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE purchase_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "purchase_orders_tenant_all" ON purchase_orders FOR ALL USING (true);

-- ========== COMPARATIVAS DE COTIZACIÓN ==========
CREATE TABLE IF NOT EXISTS quotation_comparisons (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid REFERENCES projects(id),
  request_id uuid REFERENCES purchase_requests(id),
  description text NOT NULL,
  quotations jsonb NOT NULL DEFAULT '[]'::jsonb,
  selected_supplier text,
  selection_reason text,
  status text NOT NULL DEFAULT 'en_curso',
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE quotation_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotation_comparisons_tenant_all" ON quotation_comparisons FOR ALL USING (true);

-- ========== EVALUACIÓN DE PROVEEDORES ==========
CREATE TABLE IF NOT EXISTS supplier_evaluations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  supplier_id uuid REFERENCES suppliers(id),
  supplier_name text NOT NULL,
  period text NOT NULL, -- YYYY-MM
  score_delivery integer NOT NULL DEFAULT 3,
  score_quality integer NOT NULL DEFAULT 3,
  score_price integer NOT NULL DEFAULT 3,
  score_documentation integer NOT NULL DEFAULT 3,
  score_response integer NOT NULL DEFAULT 3,
  overall_score numeric NOT NULL DEFAULT 3,
  recommendation text NOT NULL DEFAULT 'recomendado',
  nc_count integer DEFAULT 0,
  notes text,
  evaluated_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE supplier_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "supplier_evaluations_tenant_all" ON supplier_evaluations FOR ALL USING (true);

-- ========== NO CONFORMIDADES ==========
CREATE TABLE IF NOT EXISTS nonconformities (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  nc_number text NOT NULL,
  project_id uuid REFERENCES projects(id),
  category text NOT NULL DEFAULT 'obra',
  area text NOT NULL DEFAULT '',
  description text NOT NULL,
  evidence_urls text[] DEFAULT '{}',
  impact text NOT NULL DEFAULT 'bajo',
  root_cause text,
  immediate_action text,
  corrective_action text,
  responsible text,
  status text NOT NULL DEFAULT 'abierta',
  detected_by text,
  detected_at timestamptz DEFAULT now(),
  closed_at timestamptz,
  lesson_learned text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE nonconformities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nonconformities_tenant_all" ON nonconformities FOR ALL USING (true);

-- ========== CAMBIOS DE ALCANCE Y ADICIONALES ==========
CREATE TABLE IF NOT EXISTS scope_changes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id uuid NOT NULL,
  project_id uuid REFERENCES projects(id),
  opportunity_id uuid REFERENCES opportunities(id),
  change_type text NOT NULL DEFAULT 'adicional',
  origin text NOT NULL DEFAULT 'obra',
  description text NOT NULL,
  technical_impact text,
  economic_impact numeric,
  deadline_impact_days integer,
  status text NOT NULL DEFAULT 'detectado',
  approved_by text,
  approved_at timestamptz,
  evidence_urls text[] DEFAULT '{}',
  notes text,
  created_by text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE scope_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scope_changes_tenant_all" ON scope_changes FOR ALL USING (true);

-- ========== INDEXES ==========
CREATE INDEX IF NOT EXISTS idx_opportunities_tenant ON opportunities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_nonconformities_tenant ON nonconformities(tenant_id);
CREATE INDEX IF NOT EXISTS idx_nonconformities_status ON nonconformities(status);
CREATE INDEX IF NOT EXISTS idx_scope_changes_tenant ON scope_changes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scope_changes_project ON scope_changes(project_id);
CREATE INDEX IF NOT EXISTS idx_supplier_evaluations_tenant ON supplier_evaluations(tenant_id);
