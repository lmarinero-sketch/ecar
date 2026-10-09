import XLSX from 'xlsx';
import fs from 'fs';
import pg from 'pg';

const connectionString = 'postgresql://postgres.pxvhovctyewwppwkldaq:07052812Mv.@aws-0-us-west-2.pooler.supabase.com:6543/postgres';
const client = new pg.Client({ connectionString });

const projectId = 'c4aa422c-cb7a-4e65-8d5a-4480d7b36ad0'; // Loteo Roque

async function seed() {
  try {
    await client.connect();
    console.log('Connected to DB.');

    // 1. Read Excel files
    const wbCert = XLSX.readFile('ECAR_Certificacion_Red_Agua_Loteo_Roque_V6_CORREGIDO (2).xlsx');
    const wbCtrl = XLSX.readFile('ECAR_Control_Integral_Obra_Roque_AUDITADA_CORREGIDA_FINAL (1).xlsx');

    // 2. Clear previous data for this project if any
    await client.query('DELETE FROM obra_parte_diario_items WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_ordenes_trabajo WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_tramo_items WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_items WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_subrubros WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_rubros WHERE project_id = $1', [projectId]);
    await client.query('DELETE FROM obra_tramos WHERE project_id = $1', [projectId]);
    console.log('Cleaned old records for project.');

    // 3. Extract Tramos from Base Tecnica
    const wsBt = wbCtrl.Sheets['07_Base_Tecnica'];
    const dBt = XLSX.utils.sheet_to_json(wsBt, { header: 1, defval: '' });

    const tramosMap = new Map();
    for (let r = 4; r < dBt.length; r++) {
      const row = dBt[r];
      const codigo = String(row[10] || '').trim();
      const nodoInicio = String(row[11] || '').trim();
      const nodoFin = String(row[12] || '').trim();
      const longitud = Number(row[13]) || 0;
      const calle = String(row[22] || '').trim();
      const diametro = Number(row[23]) || 75;
      const servicios = Number(row[16]) || 0;
      const hidrantes = Number(row[17]) || 0;
      const obs = String(row[21] || '').trim();

      if (codigo && !tramosMap.has(codigo)) {
        tramosMap.set(codigo, {
          codigo,
          nodoInicio: nodoInicio || codigo.split('-')[0].trim(),
          nodoFin: nodoFin || (codigo.split('-')[1] ? codigo.split('-')[1].trim() : ''),
          longitud,
          calle,
          diametro,
          servicios,
          hidrantes,
          obs
        });
      }
    }

    console.log(`Parsed ${tramosMap.size} distinct tramos.`);

    const tramoDbMap = new Map();
    let tramoOrder = 1;
    for (const t of tramosMap.values()) {
      const res = await client.query(
        `INSERT INTO obra_tramos (project_id, codigo, nodo_inicio, nodo_fin, longitud_m, calle_pasaje, diametro_mm, servicios_count, hidrantes_count, observaciones, orden)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING id, codigo, longitud_m, diametro_mm, servicios_count`,
        [projectId, t.codigo, t.nodoInicio, t.nodoFin, t.longitud, t.calle, t.diametro, t.servicios, t.hidrantes, t.obs, tramoOrder++]
      );
      tramoDbMap.set(t.codigo, res.rows[0]);
    }
    console.log(`Inserted ${tramoDbMap.size} tramos into DB.`);

    // 4. Create Rubros and Subrubros
    const rubrosDef = [
      {
        codigo: 'R-01', nombre: '01 Trabajos Preliminares', orden: 1, incidencia: 0.75,
        subrubros: [
          { codigo: 'SR-01.1', nombre: 'Replanteo y Topografía', orden: 1, inc_rub: 100, inc_obr: 0.75 }
        ]
      },
      {
        codigo: 'R-02', nombre: '02 Movimiento de Suelos', orden: 2, incidencia: 21.50,
        subrubros: [
          { codigo: 'SR-02.1', nombre: 'Zanjeo y Excavación', orden: 1, inc_rub: 62.79, inc_obr: 13.50 },
          { codigo: 'SR-02.2', nombre: 'Fondo y Asiento de Zanja', orden: 2, inc_rub: 37.21, inc_obr: 8.00 }
        ]
      },
      {
        codigo: 'R-03', nombre: '03 Cañerías Distribuidoras PEAD', orden: 3, incidencia: 27.00,
        subrubros: [
          { codigo: 'SR-03.1', nombre: 'Tendido Cañería Ø75', orden: 1, inc_rub: 59.26, inc_obr: 16.00 },
          { codigo: 'SR-03.2', nombre: 'Tendido Cañería Ø110', orden: 2, inc_rub: 40.74, inc_obr: 11.00 }
        ]
      },
      {
        codigo: 'R-04', nombre: '04 Relleno y Tapadas', orden: 4, incidencia: 34.00,
        subrubros: [
          { codigo: 'SR-04.1', nombre: 'Paquete Estructural 30 cm', orden: 1, inc_rub: 48.53, inc_obr: 16.50 },
          { codigo: 'SR-04.2', nombre: 'Capas Superiores Cota -0.60 y -0.30', orden: 2, inc_rub: 51.47, inc_obr: 17.50 }
        ]
      },
      {
        codigo: 'R-05', nombre: '05 Conexiones Domiciliarias', orden: 5, incidencia: 10.00,
        subrubros: [
          { codigo: 'SR-05.1', nombre: 'Acometidas y Conexiones', orden: 1, inc_rub: 100, inc_obr: 10.00 }
        ]
      },
      {
        codigo: 'R-06', nombre: '06 Especiales, Válvulas e Hidrantes', orden: 6, incidencia: 3.50,
        subrubros: [
          { codigo: 'SR-06.1', nombre: 'Válvulas Esclusas', orden: 1, inc_rub: 57.14, inc_obr: 2.00 },
          { codigo: 'SR-06.2', nombre: 'Hidrantes a Bola', orden: 2, inc_rub: 42.86, inc_obr: 1.50 }
        ]
      },
      {
        codigo: 'R-07', nombre: '07 Pruebas y Cierre Contractual', orden: 7, incidencia: 3.25,
        subrubros: [
          { codigo: 'SR-07.1', nombre: 'Pruebas Hidráulicas y Desinfección', orden: 1, inc_rub: 46.15, inc_obr: 1.50 },
          { codigo: 'SR-07.2', nombre: 'Terminaciones y Conforme a Obra', orden: 2, inc_rub: 53.85, inc_obr: 1.75 }
        ]
      }
    ];

    const subrubroDbMap = new Map();
    for (const r of rubrosDef) {
      const resR = await client.query(
        `INSERT INTO obra_rubros (project_id, codigo, nombre, orden, incidencia_pct)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
        [projectId, r.codigo, r.nombre, r.orden, r.incidencia]
      );
      const rubroId = resR.rows[0].id;

      for (const sr of r.subrubros) {
        const resSr = await client.query(
          `INSERT INTO obra_subrubros (project_id, rubro_id, codigo, nombre, orden, incidencia_rubro_pct, incidencia_obra_pct)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [projectId, rubroId, sr.codigo, sr.nombre, sr.orden, sr.inc_rub, sr.inc_obr]
        );
        subrubroDbMap.set(sr.codigo, resSr.rows[0].id);
      }
    }
    console.log(`Inserted ${rubrosDef.length} rubros and subrubros.`);

    // 5. Insert Items from Presupuesto Base
    const wsPb = wbCert.Sheets['Presupuesto Base'];
    const dPb = XLSX.utils.sheet_to_json(wsPb, { header: 1, defval: '' });

    // Mapping item code to subrubro code
    const itemSubrubroMap = {
      '1': 'SR-01.1',
      '2': 'SR-02.1',
      '3': 'SR-02.2',
      '4': 'SR-02.2',
      '5.1': 'SR-03.1',
      '5.2': 'SR-03.2',
      '6': 'SR-04.1',
      '7': 'SR-04.1',
      '8': 'SR-04.2',
      '9': 'SR-04.2',
      '10.1': 'SR-05.1',
      '10.2': 'SR-05.1',
      '11.1': 'SR-06.1',
      '11.2': 'SR-06.1',
      '12': 'SR-06.2',
      '13.1': 'SR-07.1',
      '13.2': 'SR-07.2',
      '13.3': 'SR-07.2',
    };

    const itemDbList = [];
    for (let r = 6; r <= 23; r++) {
      const row = dPb[r];
      const codigo = String(row[0] || '').trim();
      const desc = String(row[1] || '').trim();
      const un = String(row[2] || 'ml').trim();
      const cant = Number(row[3]) || 0;
      const pu = Number(row[4]) || 0;
      const imp = Number(row[5]) || (cant * pu);
      const inc = (Number(row[6]) || 0) * 100;
      const srCode = itemSubrubroMap[codigo] || 'SR-01.1';
      const subrubroId = subrubroDbMap.get(srCode);

      const resItem = await client.query(
        `INSERT INTO obra_items (project_id, subrubro_id, codigo_item, descripcion, unidad, cantidad_contractual, precio_unitario_ars, importe_contractual_ars, incidencia_obra_pct, orden)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING id, codigo_item, unidad, cantidad_contractual`,
        [projectId, subrubroId, codigo, desc, un, cant, pu, imp, inc, r - 5]
      );
      itemDbList.push(resItem.rows[0]);
    }
    console.log(`Inserted ${itemDbList.length} items into DB.`);

    // 6. Generate Tramo Items Matrix
    let tramoItemCount = 0;
    for (const tramo of tramoDbMap.values()) {
      for (const item of itemDbList) {
        let cantPrevista = 0;
        let estado = 'para_programar';

        if (['1', '2', '3', '4', '6', '7', '8', '9'].includes(item.codigo_item)) {
          cantPrevista = tramo.longitud_m;
        } else if (item.codigo_item === '5.1') {
          cantPrevista = tramo.diametro_mm === 75 ? tramo.longitud_m : 0;
        } else if (item.codigo_item === '5.2') {
          cantPrevista = tramo.diametro_mm === 110 ? tramo.longitud_m : 0;
        } else if (item.codigo_item === '10.1') {
          cantPrevista = tramo.diametro_mm === 75 ? tramo.servicios_count : 0;
        } else if (item.codigo_item === '10.2') {
          cantPrevista = tramo.diametro_mm === 110 ? tramo.servicios_count : 0;
        } else if (['11.1', '11.2', '12', '13.1', '13.2', '13.3'].includes(item.codigo_item)) {
          cantPrevista = 0; // Se cargan puntualmente
          estado = 'no_iniciada';
        }

        if (cantPrevista > 0 || ['1', '2', '3', '4', '5.1', '5.2'].includes(item.codigo_item)) {
          await client.query(
            `INSERT INTO obra_tramo_items (project_id, tramo_id, item_id, cantidad_prevista, cantidad_ejecutada, progreso_pct, estado)
             VALUES ($1, $2, $3, $4, 0, 0, $5)
             ON CONFLICT DO NOTHING`,
            [projectId, tramo.id, item.id, cantPrevista, estado]
          );
          tramoItemCount++;
        }
      }
    }
    console.log(`Generated ${tramoItemCount} tramo-item combinations.`);

    // 7. Seed typical Hitos
    const hitosDef = [
      { codigo: 'HI-01', nombre: 'Inspección de fondo de zanja y laboratorio base', tipo: 'laboratorio', ente: 'OSSE / Laboratorio Suelos' },
      { codigo: 'HI-02', nombre: 'Inspección de zanja y cañería en posición', tipo: 'inspeccion', ente: 'OSSE' },
      { codigo: 'HI-03', nombre: 'Ensayo de compactación paquete estructural 30cm', tipo: 'laboratorio', ente: 'Laboratorio Suelos' },
      { codigo: 'HI-04', nombre: 'Prueba hidráulica a presión y desinfección', tipo: 'prueba_hidraulica', ente: 'OSSE' }
    ];

    for (const h of hitosDef) {
      await client.query(
        `INSERT INTO obra_hitos (project_id, codigo_hito, nombre, tipo, ente_regulador, estado_binario)
         VALUES ($1, $2, $3, $4, $5, 0)`,
        [projectId, h.codigo, h.nombre, h.tipo, h.ente]
      );
    }
    console.log(`Inserted ${hitosDef.length} hitos.`);

    await client.query(`NOTIFY pgrst, 'reload schema';`);
    console.log('Done! All Roque data seeded successfully.');

  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await client.end();
  }
}

seed();
