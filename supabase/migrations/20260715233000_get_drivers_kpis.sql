CREATE OR REPLACE FUNCTION get_drivers_kpis()
RETURNS TABLE (
  driver_name text,
  safety_score numeric,
  efficiency_km_l numeric
) AS $$
BEGIN
  RETURN QUERY
  WITH driver_safety AS (
    SELECT 
      s.driver_name,
      100 - (COUNT(pt.id) FILTER (WHERE pt.speed > 110) * 2) AS score
    FROM vehicle_tracking_sessions s
    LEFT JOIN vehicle_tracking_points pt ON pt.session_id = s.id
    GROUP BY s.driver_name
  ),
  driver_efficiency AS (
    SELECT 
      fl.driver_name,
      SUM(COALESCE(fl.km_since_last, 0)) / NULLIF(SUM(COALESCE(fl.liters, 0)), 0) AS efficiency
    FROM fuel_loads fl
    GROUP BY fl.driver_name
  )
  SELECT 
    COALESCE(ds.driver_name, de.driver_name) AS driver_name,
    COALESCE(GREATEST(ds.score, 0), 100)::numeric AS safety_score,
    COALESCE(de.efficiency, 0)::numeric AS efficiency_km_l
  FROM driver_safety ds
  FULL OUTER JOIN driver_efficiency de ON ds.driver_name = de.driver_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
