# NUEVO MÓDULO DE GESTIÓN DE OBRA — ECAR
## Arquitectura de Datos de Ingeniería, Ciclo de 5 Fases y Plan de Implementación desde Cero

**Preparado para:** ECAR SAS  
**Basado en:** Informe Grow Labs (1 de Octubre de 2026), `ECAR_Control_Integral_Obra_Roque_AUDITADA_CORREGIDA_FINAL.xlsx` y `ECAR_Certificacion_Red_Agua_Loteo_Roque_V6_CORREGIDO.xlsx`.  
**Decisión Estratégica:** **Reemplazo total desde cero del módulo actual de WBS** (`WbsModule.tsx` y componentes acoplados con sliders manuales), sustituyéndolo por un núcleo operativo estricto de ingeniería basado en el **Ciclo de 5 Fases**.

---

## 1. El Ciclo Integral de las 5 Fases de Obra

El nuevo módulo se estructura bajo la lógica industrial y de ingeniería de proyectos (Ciclo PHVA / Deming adaptado a Obra Civil):

```
       ┌─────────────────────────────────────────────────────────────┐
       │                                                             │
       ▼                                                             │
┌──────────────┐      ┌──────────────┐      ┌──────────────┐         │
│   FASE 1     │ ───► │    FASE 2    │ ───► │    FASE 3    │         │
│ PLANIFICACIÓN│      │ PROGRAMACIÓN │      │  EJECUCIÓN   │         │
└──────────────┘      └──────────────┘      └──────────────┘         │
  (Alcance, Presupuesto  (Tiempos, Cuadrillas,  (Terreno, Unidades    │
   Nodos, Rubros, Ítems)  Bandeja PP, ODTs)      Físicas Reales)     │
                                                   │                 │
                                                   ▼                 │
                      ┌──────────────┐      ┌──────────────┐         │
                      │    FASE 5    │ ◄─── │    FASE 4    │ ────────┘
                      │RETROALIMENTAC│      │   CONTROL    │
                      └──────────────┘      └──────────────┘
                       (Lecciones,            (Hitos Binarios,
                        Rendimientos Reales,   Desvíos, KPIs,
                        Ajuste de Catálogos)   Certificaciones)
```

### ¿Falta algún paso? Análisis Técnico
Los 5 pasos cubren el ciclo de vida completo de un proyecto de ingeniería:
- **Fase 1 (Planificación)**: Define el **QUÉ** y el **CUÁNTO CUESTA** (Línea Base contractual inmutable).
- **Fase 2 (Programación)**: Define el **CUÁNDO**, **DÓNDE** y **CON QUIÉN** (Asignación en el tiempo y emisión de ODTs).
- **Fase 3 (Ejecución)**: Es la acción en el terreno (**PRODUCCIÓN FÍSICA REAL** en $ml, m^3, u$).
- **Fase 4 (Control)**: Es la verificación (**AUDITORÍA Y CERTIFICACIÓN**): Hitos binarios 0/100, desvíos temporales/físicos y emisión de estados de pago mensuales.
- **Fase 5 (Retroalimentación)**: Es la inteligencia de negocio (**MEJORA CONTINUA**): compara los rendimientos reales de campo ($ml/\text{día}$ y $HH/ml$) contra los teóricos presupuestados para recalibrar los futuros presupuestos de ECAR.

*Conclusión*: La secuencia de 5 fases es perfecta, completa y sin fisuras.

---

## 2. Definición Detallada de las 5 Fases y Reglas de Bloqueo

### FASE 1: PLANIFICACIÓN (Definición del Alcance y Cómputo Base)
* **Objetivo:** Establecer la Línea Base Contractual.
* **Génesis:** Toda obra nace obligatoriamente de un **Presupuesto Aprobado**. No se puede crear una obra vacía.
* **Estructura Jerárquica Estricta**:
  - **Obra**: Proyecto global dividido topológicamente en **Nodos / Tramos** (ej. `N1-N2` de 165 ml).
  - **Rubros**: Categorías primarias (ej. *01 Trabajos Preliminares*, *02 Movimiento de Suelos*, *03 Cañerías*, *04 Rellenos*, *05 Conexiones*, *06 Especiales*).
  - **Subrubros**: Agrupaciones técnicas homogéneas (ej. *3.1 Provisión PEAD*, *3.2 Tendido y Montaje*).
  - **Ítems**: Componentes atómicos medibles con Unidad ($ml, m^3, u, gl$), Cantidad Contractual ($Q$), Precio Unitario ($PU$) e **Incidencia Matemática Ponderada** ($Inc = \frac{Q \times PU}{\text{Total Obra}}$).
* **Regla de Bloqueo**: Es el **único entorno** habilitado para crear o modificar la estructura WBS y los tramos. Una vez aprobada la planificación, la línea base se congela. Modificaciones posteriores requieren "Adicional de Obra".

---

### FASE 2: PROGRAMACIÓN (Asignación Temporal y Despacho Operativo)
* **Objetivo:** Traducir el saldo contractual en compromisos operativos semanales y diarios.
* **Regla de Bloqueo Total**: **Prohibido crear tareas, crear rubros o alterar cómputos en esta vista.**
* **Mecánica (Filtro Inteligente por Nodo)**:
  1. El usuario selecciona el **Nodo / Tramo** geográfico a intervenir.
  2. La vista muestra **únicamente la Bandeja "Para Programar"**: ítems de ese tramo con $\text{Saldo} > 0$ y con prerrequisitos/hitos técnicos aprobados al 100%.
  3. No se muestran ítems completados ni bloqueados.
* **Acción Permitida**:
  - Asignar fechas (inicio/fin), horas y rendimiento objetivo ($ml/\text{día}$).
  - Asignar recursos: Cuadrilla (`obra_cuadrillas`), responsable, maquinaria y materiales.
  - **Emitir la Orden Diaria de Trabajo (ODT)** formal con meta física para el equipo de campo.

---

### FASE 3: EJECUCIÓN (Control de Avance Físico Objetivo en Terreno)
* **Objetivo:** Registro ágil en terreno (diseñado para tablet o celular de capataz).
* **Regla de Bloqueo Total**: **Se eliminan por completo los sliders y porcentajes manuales.**
* **Mecánica**:
  1. El capataz visualiza únicamente las **ODTs asignadas a su cuadrilla para la jornada**.
  2. Presiona "Iniciar Tarea" (marca hora de arranque).
  3. Al terminar, reporta la **producción métrica real** en la unidad del ítem:  
     `Cantidad Ejecutada Hoy: [ 45 ] ml`.  
     *(El sistema valida que no exceda el saldo contractual del tramo).*
  4. Confirma personal real presente, máquinas operativas y horómetros.
  5. Si hubo problemas, presiona **"+ Registrar Parada"** indicando motivo (ej. *caño de gas roto / lluvia*) y minutos perdidos.
* **Propagación Matemática Automática**:
  - Al transmitir la ODT, el sistema calcula el avance del ítem ($\frac{\text{Ejecutado}}{\text{Contractual}}$) y propaga el impacto hacia el **Subrubro**, el **Rubro** y la **Obra completa** en función de sus incidencias económicas.

---

### FASE 4: CONTROL (Hitos, Desvíos, Bitácora y Certificaciones)
* **Objetivo:** Auditoría técnica, seguimiento de desvíos y emisión de estados de pago oficiales.
* **Subprocesos de Control**:
  1. **Control de Hitos Técnicos (Binarios 0% o 100%)**:
     - Ensayos de compactación de laboratorio, inspecciones de fondo de zanja, pruebas hidráulicas y desinfección.
     - Carácter binario estricto: están al 0% (Pendiente/Rechazado) o al 100% (Aprobado).
     - Si un hito está en 0%, **bloquea automáticamente** el paso de los ítems sucesores a la bandeja "Para Programar".
  2. **Parte Diario Oficial y Bitácora**:
     - Consolida todas las ODTs cerradas del día con respaldo fotográfico geolocalizado, condiciones climáticas y firmas del Jefe de Obra.
  3. **Control de Desvíos y Semáforo Topológico**:
     - Matriz de control por tramos (control de base 3/3: nivelación, aporte, compactación).
     - Monitoreo en tiempo real de atrasos temporales (fechas) y desvíos de rendimiento ($ml/\text{día}$ real vs. plan).
  4. **Módulo de Certificaciones de Obra**:
     - Generación mensual automática: el sistema barre todas las producciones físicas reales aprobadas en el mes.
     - Arma la planilla oficial idéntica al contrato:
       $$\text{Cant. Anterior} + \text{Cant. Período} = \text{Cant. Acumulada} \quad | \quad \text{Saldo Contractual}$$
     - Aplica los Precios Unitarios sin IVA, calcula IVA 21%, fondo de reparo (5%) y amortización de anticipos.
     - **Estado Cerrado / Inmutable**: una vez emitido el certificado, queda sellado para auditoría legal. Exportación a PDF y Excel oficial con membrete ECAR.

---

### FASE 5: RETROALIMENTACIÓN (Inteligencia de Negocio y Cierre del Ciclo)
* **Objetivo:** Cerrar la brecha entre la teoría presupuestaria y la realidad operativa de campo para mejorar la rentabilidad de futuros proyectos.
* **Mecánica**:
  1. **Auditoría de Rendimientos (Roque Benchmark)**:
     - Compara los rendimientos teóricos del presupuesto (ej. $70\text{ ml/día}$ de excavación) contra los rendimientos reales promedio obtenidos por cada cuadrilla y tipo de suelo.
  2. **Análisis de Paradas y Causa Raíz**:
     - Ranking de causas de tiempos muertos (falta de materiales, fallas mecánicas de retropala, interferencias de servicios existentes).
     - Cuantificación económica en pesos de las horas no productivas.
  3. **Retroalimentación al Catálogo de Presupuestos**:
     - Con un click, el Ingeniero de Costos puede actualizar los rendimientos estándar de la base maestra (`budget_resources` y `obra_actividades_catalogo`).
     - Si la cuadrilla rinde realmente $55\text{ ml/día}$ en lugar de $70\text{ ml/día}$, las próximas licitaciones se cotizan con datos reales, protegiendo el margen de ECAR.
  4. **Repositorio de Lecciones Aprendidas**:
     - Registro documentado por obra sobre interferencias municipales, requisitos de OSSE y particularidades constructivas.

---

## 3. Plan de Implementación desde Cero (Hoja de Ruta Técnica)

Dado que se eliminará por completo el módulo WBS anterior, la implementación se ejecutará en 5 etapas secuenciales:

```
ETAPA 1: Modelo de Base de Datos en Supabase (Schema Relacional Limpio)
   ↓
ETAPA 2: Motor de Cálculo de Incidencias y Migrador de Presupuestos
   ↓
ETAPA 3: Módulo de Planificación (Jerarquía Rubro-Subrubro-Ítem y Nodos)
   ↓
ETAPA 4: Módulo de Programación (Bandeja Para Programar y ODTs)
   ↓
ETAPA 5: Módulo de Ejecución en Terreno (Tablet Capataz y Partes Diarios)
   ↓
ETAPA 6: Módulo de Control (Hitos Binarios, Matriz Semáforo y Certificaciones)
   ↓
ETAPA 7: Módulo de Retroalimentación y Auditoría de Rendimientos
```

### Detalle de las Etapas de Desarrollo:

#### Etapa 1: Base de Datos Relacional Limpia
* Crear tablas dedicadas para la nueva arquitectura:
  - `obra_tramos` (Topología de nodos, longitudes, pasajes, diámetros).
  - `obra_rubros`, `obra_subrubros` y `obra_items` (Jerarquía del contrato).
  - `obra_tramo_items` (Matriz física: cómputo, ejecutado, saldo y estado por tramo).
  - `obra_ordenes_trabajo` (ODTs de programación diaria).
  - `obra_parte_diario_items` (Carga física en terreno y paradas).
  - `obra_hitos` (Control binario 0/100 con bloqueo de sucesores).
  - `obra_certificados` y `obra_certificado_lineas` (Emisión mensual inmutable).
  - `obra_lecciones_aprendidas` (Retroalimentación y auditoría de rendimientos).

#### Etapa 2: Componentes de UI Limpios (Reemplazo de WbsModule)
* Diseñar la nueva carcasa principal con navegación lateral o por pestañas que refleje exactamente el ciclo de 5 fases:
  1. 📋 **Planificación** (WBS contractual, tramos y congelamiento de línea base).
  2. 📅 **Programación** (Selector de nodo, bandeja para programar y emisión de ODTs).
  3. 🔨 **Ejecución Terreno** (Vista tablet para capataces, solo unidades físicas).
  4. 📊 **Control & Certificaciones** (Hitos binarios, partes diarios, desvíos y emisión de certificados).
  5. 🔄 **Retroalimentación** (Métricas de rendimiento real vs. planificado y lecciones aprendidas).

#### Etapa 3: Importador de Excel Roque
* Implementar una utilidad para importar directamente los datos maestros de `ECAR_Control_Integral_Obra_Roque_AUDITADA_CORREGIDA_FINAL.xlsx` y `ECAR_Certificacion_Red_Agua_Loteo_Roque_V6_CORREGIDO.xlsx`, dejando la obra de Roque completamente operativa en el nuevo sistema desde el primer día.

---

## 4. Matriz Comparativa: Lo Que Se Elimina vs. Lo Que Se Construye

| Funcionalidad Anterior (A ELIMINAR) | Nueva Funcionalidad (A CONSTRUIR) |
| :--- | :--- |
| `WbsModule.tsx` monolítico de 2.900 líneas con formularios mezclados. | **Módulo modular desacoplado** por cada una de las 5 fases. |
| Creación de tareas sueltas desde Gantt o Ejecución. | **Bloqueo estricto**: Tareas nacen sólo en Planificación desde Presupuesto Aprobado. |
| Slider de avance manual (0% a 100% "a ojímetro"). | **Carga de producción física en unidades reales** ($ml, m^3, u$). |
| Promedio simple de avance $\frac{\sum \%}{N}$. | **Avance matemático ponderado por Incidencia Económica Contractual**. |
| Hitos con avance progresivo confuso. | **Hitos binarios (0% o 100%)** con bloqueo de tramos dependientes. |
| Certificados financieros manuales desacoplados. | **Certificación contractual automática** calculada desde las mediciones de campo. |
| Cero retroalimentación de costos y tiempos. | **Fase 5 de Retroalimentación**: Comparativa real vs. teórico para ajustar futuros presupuestos. |
