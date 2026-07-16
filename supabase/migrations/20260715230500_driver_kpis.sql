-- Add driver license fields to employees table

ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_category text;
ALTER TABLE employees ADD COLUMN IF NOT EXISTS driver_license_expiry date;

-- Add a daily report completion rate function for convenience (mocking logic using daily_tasks for now, or just returning a static default if not fully implemented)
CREATE OR REPLACE FUNCTION calculate_driver_safety_score(p_driver_name text)
RETURNS numeric AS $$
DECLARE
  v_score numeric := 100;
  v_speeding_events integer := 0;
BEGIN
  -- Simplification: count tracking points where speed > 110
  -- In a real scenario, this would be grouped by session and duration.
  SELECT COUNT(*) INTO v_speeding_events
  FROM vehicle_tracking_points pt
  JOIN vehicle_tracking_sessions s ON pt.session_id = s.id
  WHERE s.driver_name = p_driver_name
    AND pt.speed > 110;
    
  -- Deduct 2 points for every speeding event
  v_score := v_score - (v_speeding_events * 2);
  
  -- Floor at 0
  IF v_score < 0 THEN
    v_score := 0;
  END IF;
  
  RETURN v_score;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
