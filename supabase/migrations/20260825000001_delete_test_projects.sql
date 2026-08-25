-- Delete dependent records dynamically
DO $$
DECLARE
    r RECORD;
    project_ids UUID[] := ARRAY(SELECT id FROM projects WHERE name IN ('ROQUE', 'probando que el presupuesto se adjunte a la oportunidad'));
    pid UUID;
BEGIN
    IF array_length(project_ids, 1) IS NULL THEN
        RETURN;
    END IF;
    
    FOR r IN (
        SELECT tc.table_name, kcu.column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
        WHERE constraint_type = 'FOREIGN KEY' AND ccu.table_name = 'projects'
    ) LOOP
        FOREACH pid IN ARRAY project_ids
        LOOP
            EXECUTE format('DELETE FROM %I WHERE %I = %L', r.table_name, r.column_name, pid);
        END LOOP;
    END LOOP;
END;
$$;

-- Delete the projects
DELETE FROM projects 
WHERE name IN ('ROQUE', 'probando que el presupuesto se adjunte a la oportunidad');
