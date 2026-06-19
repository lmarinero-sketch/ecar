-- =============================================================
-- RRHH Improvements Migration
-- Adds personal data fields, union, observations, debt, overtime
-- =============================================================

-- Datos personales para alta
ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('masculino','femenino','otro'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS marital_status TEXT CHECK (marital_status IN ('soltero','casado','divorciado','viudo','conviviente'));
ALTER TABLE employees ADD COLUMN IF NOT EXISTS children_info JSONB DEFAULT '[]';
ALTER TABLE employees ADD COLUMN IF NOT EXISTS education_level TEXT CHECK (education_level IN ('primario_incompleto','primario','secundario_incompleto','secundario','terciario','universitario','posgrado'));

-- Convenio / sindicato
ALTER TABLE employees ADD COLUMN IF NOT EXISTS union_name TEXT;

-- Observaciones generales
ALTER TABLE employees ADD COLUMN IF NOT EXISTS observations TEXT;

-- Deuda al empleado
ALTER TABLE employees ADD COLUMN IF NOT EXISTS debt_to_employee NUMERIC DEFAULT 0;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS debt_notes TEXT;

-- Horas extras
ALTER TABLE employees ADD COLUMN IF NOT EXISTS does_overtime BOOLEAN DEFAULT false;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS overtime_rate TEXT DEFAULT '50' CHECK (overtime_rate IN ('50','100'));
