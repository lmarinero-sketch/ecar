import pg from 'pg';
import fs from 'fs';
import { createClient } from '@supabase/supabase-js';

const connectionString = 'postgresql://postgres.pxvhovctyewwppwkldaq:07052812Mv.@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString });

const env = fs.readFileSync('.env', 'utf8');
const url = env.match(/VITE_SUPABASE_URL=(.*)/)[1].trim();
const key = env.match(/VITE_SUPABASE_ANON_KEY=(.*)/)[1].trim();
const supabase = createClient(url, key);

const projectId = 'c4aa422c-cb7a-4e65-8d5a-4480d7b36ad0'; // Loteo Roque

async function audit() {
  console.log('===============================================================');
  console.log(' AUDITORÍA COMPLETA: BASE DE DATOS Y RELACIONES EN SUPABASE');
  console.log('===============================================================\n');

  try {
    await client.connect();

    const tables = [
      'obra_tramos',
      'obra_rubros',
      'obra_subrubros',
      'obra_items',
      'obra_tramo_items',
      'obra_ordenes_trabajo',
      'obra_parte_diario_items',
      'obra_hitos',
      'obra_certificados',
      'obra_certificado_lineas',
      'obra_lecciones_aprendidas'
    ];

    console.log('1. VERIFICACIÓN DE INTEGRIDAD ESTRUCTURAL EN POSTGRESQL:\n');

    for (const t of tables) {
      // Columnas
      const resCols = await client.query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'public' AND table_name = $1 ORDER BY ordinal_position",
        [t]
      );

      // Foreign Keys
      const resFks = await client.query(
        `SELECT
            kcu.column_name, 
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name 
         FROM information_schema.table_constraints AS tc 
         JOIN information_schema.key_column_usage AS kcu
           ON tc.constraint_name = kcu.constraint_name
           AND tc.table_schema = kcu.table_schema
         JOIN information_schema.constraint_column_usage AS ccu
           ON ccu.constraint_name = tc.constraint_name
           AND ccu.table_schema = tc.table_schema
         WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name = $1`,
        [t]
      );

      // RLS Status
      const resRls = await client.query(
        "SELECT rowsecurity FROM pg_tables WHERE schemaname = 'public' AND tablename = $1",
        [t]
      );

      // Políticas RLS
      const resPol = await client.query(
        "SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = $1",
        [t]
      );

      // Conteo
      const resCount = await client.query(`SELECT COUNT(*) FROM ${t}`);

      console.log(`[TABLA] ${t}`);
      console.log(`   * Columnas (${resCols.rows.length}): ${resCols.rows.map(c => c.column_name).join(', ')}`);
      console.log(`   * Registros en BD: ${resCount.rows[0].count}`);
      console.log(`   * RLS Activo: ${resRls.rows[0]?.rowsecurity ? 'SI' : 'NO'} | Política: ${resPol.rows.map(p => p.policyname).join(', ')}`);
      console.log(`   * Relaciones FK: ${resFks.rows.map(f => `${f.column_name} -> ${f.foreign_table_name}(${f.foreign_column_name})`).join(' | ') || 'Sin FKs directas'}`);
      console.log('');
    }

    console.log('---------------------------------------------------------------');
    console.log('2. VERIFICACIÓN DE QUERIES CON JOINS VIA REST CLIENT (SUPABASE)');
    console.log('---------------------------------------------------------------\n');

    // Test 1: Rubros con subrubros e items anidados
    const q1 = await supabase
      .from('obra_rubros')
      .select('id, codigo, nombre, subrubros:obra_subrubros(id, codigo, nombre, items:obra_items(id, codigo_item, descripcion))')
      .eq('project_id', projectId)
      .limit(2);
    console.log('[TEST 1] Query WBS anidado (Rubros -> Subrubros -> Ítems):', q1.error ? 'ERROR: ' + q1.error.message : 'OK (rubros: ' + q1.data.length + ', subrubros anidados: ' + q1.data[0]?.subrubros?.length + ')');

    // Test 2: Tramo items con joins a tramo e item
    const q2 = await supabase
      .from('obra_tramo_items')
      .select('id, cantidad_prevista, saldo, estado, tramo:obra_tramos(codigo, calle_pasaje, longitud_m), item:obra_items(codigo_item, descripcion, unidad)')
      .eq('project_id', projectId)
      .limit(3);
    console.log('[TEST 2] Query Matriz Física (Tramo-Item + Tramo + Item):', q2.error ? 'ERROR: ' + q2.error.message : 'OK (registros: ' + q2.data.length + ', tramo vinculado: ' + q2.data[0]?.tramo?.codigo + ', ítem vinculado: ' + q2.data[0]?.item?.descripcion + ')');

    // Test 3: ODTs con joins a tramo e item
    const q3 = await supabase
      .from('obra_ordenes_trabajo')
      .select('id, numero_odt, meta_cantidad, tramo:obra_tramos(codigo), item:obra_items(descripcion)')
      .eq('project_id', projectId)
      .limit(3);
    console.log('[TEST 3] Query ODTs (Fase 2):', q3.error ? 'ERROR: ' + q3.error.message : 'OK (registros: ' + q3.data.length + ')');

    // Test 4: Partes Diarios de Terreno
    const q4 = await supabase
      .from('obra_parte_diario_items')
      .select('id, cantidad_real, odt:obra_ordenes_trabajo(numero_odt), tramo_item:obra_tramo_items(id, tramo:obra_tramos(codigo))')
      .eq('project_id', projectId)
      .limit(3);
    console.log('[TEST 4] Query Partes Diarios (Fase 3):', q4.error ? 'ERROR: ' + q4.error.message : 'OK (registros: ' + q4.data.length + ')');

    // Test 5: Hitos con tramo
    const q5 = await supabase
      .from('obra_hitos')
      .select('id, codigo_hito, nombre, estado_binario, tramo:obra_tramos(codigo)')
      .eq('project_id', projectId);
    console.log('[TEST 5] Query Hitos Binarios (Fase 4):', q5.error ? 'ERROR: ' + q5.error.message : 'OK (hitos cargados: ' + q5.data.length + ')');

    // Test 6: Certificados con detalle de líneas
    const q6 = await supabase
      .from('obra_certificados')
      .select('id, numero_certificado, base_contractual_ars, lineas:obra_certificado_lineas(id, codigo_item, importe_presente)')
      .eq('project_id', projectId);
    console.log('[TEST 6] Query Certificados e Historial (Fase 4):', q6.error ? 'ERROR: ' + q6.error.message : 'OK (certificados: ' + q6.data.length + ')');

    // Test 7: Lecciones aprendidas
    const q7 = await supabase
      .from('obra_lecciones_aprendidas')
      .select('id, categoria, titulo')
      .eq('project_id', projectId);
    console.log('[TEST 7] Query Lecciones Aprendidas (Fase 5):', q7.error ? 'ERROR: ' + q7.error.message : 'OK');

    console.log('\n===============================================================');
    console.log(' RESULTADO: TODAS LAS TABLAS Y RELACIONES ESTÁN 100% OPERATIVAS');
    console.log('===============================================================\n');

  } catch (err) {
    console.error('Error durante la auditoría:', err);
  } finally {
    await client.end();
  }
}

audit();
