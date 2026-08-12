-- Agregar columna 'source' a las sesiones y puntos de seguimiento GPS
ALTER TABLE vehicle_tracking_sessions
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';

ALTER TABLE vehicle_tracking_points
ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'web';
