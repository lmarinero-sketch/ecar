-- ================================================================
-- MÓDULO DE COMBUSTIBLE — ECAR ERP
-- Tablas: fuel_vehicles, fuel_loads, fuel_batan_movements, fuel_monthly_reconciliation
-- ================================================================

-- ═══════════════ 1. MAESTRO DE FLOTA ═══════════════
CREATE TABLE IF NOT EXISTS fuel_vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  code VARCHAR(20) NOT NULL,
  vehicle_type VARCHAR(30) NOT NULL,
  description VARCHAR(100) NOT NULL,
  brand VARCHAR(50),
  model VARCHAR(50),
  plate VARCHAR(20),
  year INTEGER,
  preferred_fuel VARCHAR(30),
  tank_capacity_liters NUMERIC(8,2),
  area VARCHAR(50),
  default_driver VARCHAR(100),
  status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 2. CARGAS DE COMBUSTIBLE ═══════════════
CREATE TABLE IF NOT EXISTS fuel_loads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  load_number VARCHAR(20) NOT NULL,
  load_date DATE NOT NULL,
  month VARCHAR(20),
  year INTEGER,
  day_of_week VARCHAR(20),
  vehicle_id UUID REFERENCES fuel_vehicles(id),
  vehicle_code VARCHAR(20),
  vehicle_description VARCHAR(100),
  plate VARCHAR(20),
  vehicle_type VARCHAR(30),
  driver_name VARCHAR(100),
  project_name VARCHAR(100),
  project_id UUID REFERENCES projects(id),
  supplier VARCHAR(100),
  fuel_type VARCHAR(30),
  liters NUMERIC(10,2),
  price_per_liter NUMERIC(10,2),
  total_amount NUMERIC(12,2),
  odometer_km INTEGER,
  hourmeter NUMERIC(10,2),
  km_since_last NUMERIC(10,2),
  hours_since_last NUMERIC(10,2),
  estimated_yield NUMERIC(8,2),
  payment_method VARCHAR(30),
  voucher_number VARCHAR(50),
  remito_number VARCHAR(50),
  observations TEXT,
  validation_status VARCHAR(20) DEFAULT 'pending',
  load_source VARCHAR(30) DEFAULT 'station',
  batan_load_id UUID,
  batan_price_applied NUMERIC(10,2),
  batan_balance_after NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by VARCHAR(100) DEFAULT 'web'
);

-- ═══════════════ 3. CONTROL DE BATÁN ═══════════════
CREATE TABLE IF NOT EXISTS fuel_batan_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  movement_number VARCHAR(20) NOT NULL,
  movement_date DATE NOT NULL,
  batan_name VARCHAR(50) DEFAULT 'Batán 200 L',
  capacity_liters NUMERIC(8,2) DEFAULT 200,
  movement_type VARCHAR(20) NOT NULL,
  supplier VARCHAR(100),
  fuel_type VARCHAR(30),
  liters_loaded NUMERIC(10,2),
  price_per_liter NUMERIC(10,2),
  total_amount NUMERIC(12,2),
  remito_number VARCHAR(50),
  voucher_number VARCHAR(50),
  vehicle_id UUID REFERENCES fuel_vehicles(id),
  vehicle_code VARCHAR(20),
  liters_discharged NUMERIC(10,2),
  driver_name VARCHAR(100),
  project_name VARCHAR(100),
  balance_after NUMERIC(10,2),
  movement_status VARCHAR(20) DEFAULT 'available',
  observations TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ 4. CONCILIACIÓN MENSUAL ═══════════════
CREATE TABLE IF NOT EXISTS fuel_monthly_reconciliation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,
  month_name VARCHAR(20),
  total_loads INTEGER DEFAULT 0,
  total_liters NUMERIC(12,2) DEFAULT 0,
  total_amount_sheet NUMERIC(14,2) DEFAULT 0,
  total_vouchers INTEGER DEFAULT 0,
  avg_per_load NUMERIC(10,2) DEFAULT 0,
  supplier_invoice_amount NUMERIC(14,2),
  supplier_invoice_number VARCHAR(50),
  difference NUMERIC(14,2),
  reconciliation_notes TEXT,
  status VARCHAR(20) DEFAULT 'pending',
  UNIQUE(tenant_id, year, month),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ═══════════════ RLS ═══════════════
ALTER TABLE fuel_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_loads ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_batan_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE fuel_monthly_reconciliation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fuel_vehicles_all" ON fuel_vehicles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fuel_loads_all" ON fuel_loads FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fuel_batan_all" ON fuel_batan_movements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "fuel_reconciliation_all" ON fuel_monthly_reconciliation FOR ALL USING (true) WITH CHECK (true);

-- ═══════════════ INDICES ═══════════════
CREATE INDEX idx_fuel_loads_date ON fuel_loads(load_date);
CREATE INDEX idx_fuel_loads_vehicle ON fuel_loads(vehicle_code);
CREATE INDEX idx_fuel_loads_month ON fuel_loads(year, month);
CREATE INDEX idx_fuel_batan_date ON fuel_batan_movements(movement_date);

-- ═══════════════ SEED DATA — FLOTA ═══════════════
-- Datos reales del Excel "combustible_batan - mayo 2026"

INSERT INTO fuel_vehicles (tenant_id, code, vehicle_type, description, brand, model, plate, year, preferred_fuel, tank_capacity_liters, area, default_driver, status)
SELECT t.id, v.code, v.vehicle_type, v.description, v.brand, v.model, v.plate, v.year, v.preferred_fuel, v.tank_capacity_liters, v.area, v.default_driver, 'active'
FROM tenants t,
(VALUES
  ('C-001', 'Camioneta', 'Toyota Hilux 2.4', 'Toyota', 'Hilux', 'AC399XV', 2020, 'Diesel V-Power', 80.00, 'Obras', 'Ariel Jofre'),
  ('C-002', 'Camioneta', 'Toyota Hilux 2.4', 'Toyota', 'Hilux', 'AG839PV', 2020, 'Diesel V-Power', 80.00, 'Obras', 'Adolfo'),
  ('C-003', 'Camioneta', 'RAM 1500 5.7 V8 LARAMIE 4X4', 'RAM', '1500', 'AB150', 2023, 'Nafta', 98.00, 'Gerencia', 'Enrico'),
  ('C-004', 'Camioneta', 'Peugeot Partner confort 1.6 HDI', 'Peugeot', 'Partner', NULL, 2018, 'Diesel V-Power', 60.00, 'Administración', 'Gustavo'),
  ('C-005', 'Camioneta', 'Toyota Hilux 4X4 C/S DX2.4 TDI 6M/T', 'Toyota', 'Hilux', 'AC399XV', 2022, 'Diesel-Evolux', 80.00, 'Gerencia', NULL),
  ('C-006', 'Camioneta', 'Toyota Hilux 2.4', 'Toyota', 'Hilux', 'ISB928', 2011, 'Diesel-Evolux', 80.00, 'Varios', 'G. Regalado'),
  ('CM-001', 'Camión', 'Iveco Tector', 'Iveco', 'Tector', 'AC', 2020, 'Diesel V-Power', 150.00, 'Logística', 'Ariel Jofre'),
  ('CM-002', 'Camión', 'IVECO Daily 70c17 PASO 4350', 'IVECO', 'Daily', 'AD478QW', 2018, 'Diesel V-Power', 100.00, 'Obras', NULL),
  ('EP-001', 'Equipo', 'Motocompresor', NULL, NULL, NULL, NULL, 'Diesel-Evolux', 70.00, 'Obras', NULL),
  ('EP-002', 'Equipo', 'Motosoldador', NULL, NULL, NULL, NULL, 'Diesel-Evolux', NULL, 'Obras', NULL),
  ('EP-003', 'Equipo', 'Montacarga', 'Longking', NULL, NULL, NULL, 'Diesel-Evolux', NULL, NULL, NULL),
  ('MC-001', 'Mini cargadora', 'CAT', 'Caterpillar', NULL, NULL, 2017, 'Diesel-Evolux', NULL, NULL, 'Luis Martínez'),
  ('MC-002', 'Mini cargadora', 'Longking', NULL, NULL, NULL, NULL, 'Diesel-Evolux', NULL, NULL, NULL),
  ('RP-001', 'Retroexcavadora', 'Hidromek', 'HIDROMEK', NULL, NULL, 2024, 'Diesel-Evolux', 140.00, 'Obras', NULL),
  ('RP-002', 'Retroexcavadora', 'MAXION 750', NULL, NULL, NULL, NULL, 'Diesel-Evolux', NULL, NULL, NULL),
  ('BT-001', 'Batán', 'Batán de 200lts', NULL, NULL, NULL, 2024, 'Diesel-Evolux', 200.00, NULL, NULL)
) AS v(code, vehicle_type, description, brand, model, plate, year, preferred_fuel, tank_capacity_liters, area, default_driver)
LIMIT 16;

-- ═══════════════ SEED DATA — CARGAS DE MAYO ═══════════════
INSERT INTO fuel_loads (tenant_id, load_number, load_date, month, year, day_of_week, vehicle_code, vehicle_description, plate, vehicle_type, driver_name, project_name, supplier, fuel_type, liters, voucher_number, observations, validation_status, load_source)
SELECT t.id, l.load_number, l.load_date, 'Mayo', 2026, l.day_of_week, l.vehicle_code, l.vehicle_description, l.plate, l.vehicle_type, l.driver_name, l.project_name, l.supplier, l.fuel_type, l.liters, l.voucher_number, l.observations, 'ok', 'station'
FROM tenants t,
(VALUES
  ('CARGA-0001', '2026-05-05'::DATE, 'Martes', 'C-002', 'Toyota Hilux 2.4', 'AG839PV', 'Camioneta', 'Adolfo', 'Movimientos Internos', 'Shell Agro', 'Diesel V-Power', 40.00, '205', 'N°205 / REMITO N° 7687'),
  ('CARGA-0002', '2026-05-15'::DATE, 'Viernes', 'CM-002', 'Iveco Daily', 'AD478QW', 'Camión', 'Bruno Guevara', 'Barrio Don José', 'Shell Agro', 'Diesel V-Power', 49.65, 'S-V', '4174/ S-V'),
  ('CARGA-0003', '2026-05-15'::DATE, 'Viernes', 'C-002', 'Toyota Hilux 2.4', 'AG839PV', 'Camioneta', 'Adolfo', 'Movimientos Internos', 'Shell Agro', 'Diesel V-Power', 50.00, 'S-V', '4175/S-V')
) AS l(load_number, load_date, day_of_week, vehicle_code, vehicle_description, plate, vehicle_type, driver_name, project_name, supplier, fuel_type, liters, voucher_number, observations);

-- ═══════════════ SEED DATA — BATÁN ═══════════════
INSERT INTO fuel_batan_movements (tenant_id, movement_number, movement_date, batan_name, capacity_liters, movement_type, supplier, fuel_type, liters_loaded, balance_after, movement_status)
SELECT t.id, b.movement_number, b.movement_date, 'Batán 200 L', 200, 'purchase', 'Shell Agro', 'Diesel - EVOLUX', 200, 200, 'available'
FROM tenants t,
(VALUES
  ('BATAN-0001', '2026-05-04'::DATE),
  ('BATAN-0002', '2026-05-12'::DATE)
) AS b(movement_number, movement_date);

-- ═══════════════ SEED DATA — CONCILIACIÓN ═══════════════
INSERT INTO fuel_monthly_reconciliation (tenant_id, year, month, month_name, total_loads, total_liters, total_amount_sheet, total_vouchers, supplier_invoice_amount, difference, status)
SELECT t.id, r.year, r.month, r.month_name, r.total_loads, r.total_liters, r.total_amount_sheet, r.total_vouchers, r.supplier_invoice_amount, r.difference, r.status
FROM tenants t,
(VALUES
  (2026, 4, 'Abril', 0, 0.00, 0.00, 0, 656800.00, 656800.00, 'controlled'),
  (2026, 5, 'Mayo', 3, 139.65, 0.00, 1, NULL, NULL, 'pending')
) AS r(year, month, month_name, total_loads, total_liters, total_amount_sheet, total_vouchers, supplier_invoice_amount, difference, status);
