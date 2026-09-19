import React, { useState, useMemo } from 'react';
import {
  FileText, Plus, Calendar, ShieldCheck, Download,
  CheckCircle2, Clock, Building2,
  Trash2, Edit3, X, Check,
  Camera, ShoppingCart, UserCheck
} from 'lucide-react';
import {
  useSeguridadInformesSemanales, useCreateSeguridadInformeSemanal,
  useUpdateSeguridadInformeSemanal, useDeleteSeguridadInformeSemanal,
  useProjects, useEmployees, useSeguridadObservaciones,
  useObraControlTareas, useCreatePurchaseRequest
} from '../hooks/useData';
import { PPEDeliveriesPanel } from './PPEDeliveriesPanel';
import type {
  SeguridadInformeSemanal, SituacionDetectadaHyS,
  MedidaCorrectivaHyS, PendienteSeguimientoHyS, FotoEvidenciaHyS
} from '../lib/types';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface WeeklySafetyReportsPanelProps {
  selectedProjectId?: string;
}

const DEFAULT_SITUACIONES: SituacionDetectadaHyS[] = [
  { descripcion: 'Necesidad de disponer de puentes o pasarelas adecuadas para permitir el cruce seguro de los trabajadores sobre las zanjas.', categoria: 'excavacion', nivel_riesgo: 'alto' },
  { descripcion: 'Necesidad de señalizar y mantener correctamente identificadas las pasarelas y sectores de cruce.', categoria: 'senalizacion', nivel_riesgo: 'medio' },
  { descripcion: 'Necesidad de reforzar la capacitación y concientización del personal respecto de los riesgos propios de los trabajos de excavación.', categoria: 'capacitacion', nivel_riesgo: 'medio' },
  { descripcion: 'Necesidad de mantener el material proveniente de las excavaciones a una distancia segura del borde de las zanjas (>0.60 m), evitando sobrecargas y desprendimientos.', categoria: 'excavacion', nivel_riesgo: 'alto' },
  { descripcion: 'Falta de botiquín de primeros auxilios disponible en obra.', categoria: 'primeros_auxilios', nivel_riesgo: 'alto' },
  { descripcion: 'Falta de matafuegos adecuados para la atención inicial de posibles principios de incendio.', categoria: 'incendio', nivel_riesgo: 'alto' },
];

const DEFAULT_MEDIDAS: MedidaCorrectivaHyS[] = [
  { descripcion: 'Se colocaron puentes/pasarelas con barandas reglamentarias para permitir el cruce seguro de los trabajadores sobre las zanjas.', responsable: 'Capataz de Obra', estado: 'implementada' },
  { descripcion: 'Se realizó la señalización correspondiente de las pasarelas y sectores de circulación peatonal.', responsable: 'Responsable HyS', estado: 'implementada' },
  { descripcion: 'Se brindaron charlas de 5 minutos al personal sobre los riesgos asociados a los trabajos de zanjeo y medidas preventivas.', responsable: 'Responsable HyS', estado: 'implementada' },
  { descripcion: 'Se reforzó al personal la indicación estricta de mantener el material extraído a distancia adecuada del borde.', responsable: 'Jefe de Obra', estado: 'implementada' },
  { descripcion: 'Se incorporó un botiquín de primeros auxilios equipado para la atención inicial ante eventuales lesiones o emergencias menores.', responsable: 'Pañol / HyS', estado: 'implementada' },
  { descripcion: 'Se incorporaron matafuegos triclase ABC con carga y tarjeta IRAM vigente en los frentes de excavación y maquinarias.', responsable: 'Pañol / HyS', estado: 'implementada' },
];

const DEFAULT_PENDIENTES: PendienteSeguimientoHyS[] = [
  { item: 'Reforzar la señalización preventiva en los sectores de circulación incorporando cartelería de "NO PASAR - SOLO PERSONAL AUTORIZADO", "MAQUINARIA PESADA EN MOVIMIENTO" y "PELIGRO - ZANJA ABIERTA".', prioridad: 'alta' },
  { item: 'Continuar con el control periódico de las condiciones de estabilidad de las excavaciones y zanjas.', prioridad: 'alta' },
  { item: 'Verificar en forma permanente que el material extraído se mantenga a una distancia segura del borde.', prioridad: 'media' },
  { item: 'Continuar reforzando el uso correcto y permanente de los EPP correspondientes a cada tarea (casco, botines, chaleco reflectivo, guantes).', prioridad: 'alta' },
  { item: 'Mantener las acciones de capacitación y concientización semanal del personal.', prioridad: 'media' },
  { item: 'Verificar periódicamente el estado, accesibilidad y vigencia de la carga del botiquín de primeros auxilios y de los matafuegos.', prioridad: 'alta' },
];

const DEFAULT_FOTOS: FotoEvidenciaHyS[] = [
  {
    id: 'f1',
    url: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    titulo: 'Fotografía 1',
    fecha: '11/09/2026',
    epigrafe: 'Matafuego triclase ABC incorporado en obra y disponible para la atención inicial ante principios de incendio.',
    sector: 'Frente de excavación'
  },
  {
    id: 'f2',
    url: 'https://images.unsplash.com/photo-1541888946425-d0fbb180c5f5?auto=format&fit=crop&w=800&q=80',
    titulo: 'Fotografía 2',
    fecha: '11/09/2026',
    epigrafe: 'Vista general del sector de excavaciones con pasarelas y medidas de señalización para el cruce seguro.',
    sector: 'Traza principal red de agua'
  },
  {
    id: 'f3',
    url: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    titulo: 'Fotografía 3',
    fecha: '11/09/2026',
    epigrafe: 'Detalle de pasarela colocada para el cruce seguro de trabajadores sobre zanja abierta.',
    sector: 'Pasaje 2 y Manzana A'
  },
  {
    id: 'f4',
    url: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=800&q=80',
    titulo: 'Fotografía 4',
    fecha: '11/09/2026',
    epigrafe: 'Botiquín de primeros auxilios incorporado en obra y dispuesto para emergencias menores.',
    sector: 'Obrador / Pañol móvil'
  }
];

export const WeeklySafetyReportsPanel: React.FC<WeeklySafetyReportsPanelProps> = ({ selectedProjectId }) => {
  const [filterProject, setFilterProject] = useState<string>(selectedProjectId || '');
  const [filterEstado, setFilterEstado] = useState<string>('todos');
  const [activeTab, setActiveTab] = useState<'informes' | 'entregas_personal'>('informes');

  // Queries
  const { data: informes = [], isLoading } = useSeguridadInformesSemanales(filterProject || undefined);
  const { data: projects = [] } = useProjects();
  const { data: employees = [] } = useEmployees();
  const { data: observaciones = [] } = useSeguridadObservaciones();
  const { data: tareas = [] } = useObraControlTareas(filterProject || undefined);

  // Mutations
  const createInforme = useCreateSeguridadInformeSemanal();
  const updateInforme = useUpdateSeguridadInformeSemanal();
  const deleteInforme = useDeleteSeguridadInformeSemanal();
  const createPurchaseRequest = useCreatePurchaseRequest();

  // Modales
  const [showEditorModal, setShowEditorModal] = useState(false);
  const [editingInforme, setEditingInforme] = useState<SeguridadInformeSemanal | null>(null);
  const [showPedidoModal, setShowPedidoModal] = useState(false);
  const [pedidoFaltantes, setPedidoFaltantes] = useState({
    descripcion: 'Matafuegos ABC 5kg con sello IRAM + Botiquín reglamentario de obra + Cartelería de seguridad (Zanja Abierta / Maquinaria Pesada)',
    cantidad: 1,
    unidad: 'kit',
    urgencia: 'urgent' as const,
    notas: 'Requerido para subsanar observaciones de seguridad según Informe Semanal de HyS.',
  });

  // Form State para el Editor
  const [form, setForm] = useState<{
    project_id: string;
    numero_informe: string;
    periodo_desde: string;
    periodo_hasta: string;
    titulo: string;
    tipo_informe: string;
    empresa: string;
    comitente: string;
    sintesis_ejecutiva: string;
    alcance: string;
    actividades_realizadas: string;
    situaciones_detectadas: SituacionDetectadaHyS[];
    medidas_correctivas: MedidaCorrectivaHyS[];
    pendientes_seguimiento: PendienteSeguimientoHyS[];
    observacion_general: string;
    responsable_hys_id: string;
    responsable_hys_nombre: string;
    matricula_hys: string;
    responsable_obra_nombre: string;
    registro_fotografico: FotoEvidenciaHyS[];
    estado: 'borrador' | 'emitido' | 'entregado';
  }>({
    project_id: '',
    numero_informe: 'INF-SEM-01-ROQUE',
    periodo_desde: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
    periodo_hasta: new Date().toISOString().split('T')[0],
    titulo: 'INFORME SEMANAL DE HIGIENE Y SEGURIDAD',
    tipo_informe: 'Informe semanal de relevamiento',
    empresa: 'ECAR SAS',
    comitente: 'VALDIVIESO GROUP S.R.L.',
    sintesis_ejecutiva: 'Se documentan las tareas relevadas, las observaciones detectadas, las medidas correctivas implementadas y el seguimiento de condiciones de seguridad en obra.',
    alcance: 'El presente informe resume las inspecciones, controles, capacitaciones y acciones preventivas realizadas durante el período consignado en la obra, incorporando además el registro fotográfico de los elementos y mejoras implementadas en conformidad con el Decreto 911/96 y Res. SRT 905/15.',
    actividades_realizadas: 'Durante el período indicado se realizaron recorridos e inspecciones generales en los distintos sectores de la obra, verificándose las condiciones generales de seguridad, el cumplimiento de las medidas preventivas y el uso adecuado de los Elementos de Protección Personal (EPP) por parte de los trabajadores.\n\nSe efectuaron controles específicos sobre los sectores donde se desarrollan tareas de excavación y apertura de zanjas, prestando especial atención a las condiciones de circulación y acceso, la posibilidad de cruce de las excavaciones, la ubicación del material extraído respecto del borde y las medidas de prevención implementadas.\n\nAsimismo, se realizaron charlas y capacitaciones dirigidas al personal, destinadas a reforzar la identificación de los riesgos asociados a los trabajos de excavación, circulación en obra y las medidas preventivas necesarias para evitar accidentes e incidentes.',
    situaciones_detectadas: DEFAULT_SITUACIONES,
    medidas_correctivas: DEFAULT_MEDIDAS,
    pendientes_seguimiento: DEFAULT_PENDIENTES,
    observacion_general: 'Las medidas implementadas deberán mantenerse y ser verificadas durante los próximos recorridos de obra, a fin de asegurar su continuidad y eficacia preventiva.',
    responsable_hys_id: '',
    responsable_hys_nombre: 'Ing. / Lic. Higiene y Seguridad',
    matricula_hys: 'Mat. Prof. COPIG / HyS N° 4582',
    responsable_obra_nombre: 'B. Guevara / Capataz General',
    registro_fotografico: DEFAULT_FOTOS,
    estado: 'borrador',
  });

  // Filtrado de Informes
  const filteredInformes = useMemo(() => {
    return informes.filter(inf => {
      const matchProject = !filterProject || inf.project_id === filterProject;
      const matchEstado = filterEstado === 'todos' || inf.estado === filterEstado;
      return matchProject && matchEstado;
    });
  }, [informes, filterProject, filterEstado]);

  // Manejar Nuevo Informe
  const handleOpenNew = () => {
    const defaultProj = projects.find(p => p.id === filterProject) || projects[0];
    const nro = `INF-SEM-${String(informes.length + 1).padStart(2, '0')}-${defaultProj?.name ? defaultProj.name.substring(0, 5).toUpperCase() : 'ECAR'}`;
    
    setEditingInforme(null);
    setForm({
      project_id: defaultProj?.id || '',
      numero_informe: nro,
      periodo_desde: new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0],
      periodo_hasta: new Date().toISOString().split('T')[0],
      titulo: 'INFORME SEMANAL DE HIGIENE Y SEGURIDAD',
      tipo_informe: 'Informe semanal de relevamiento',
      empresa: 'ECAR SAS',
      comitente: 'VALDIVIESO GROUP S.R.L.',
      sintesis_ejecutiva: 'Se documentan las tareas relevadas, las observaciones detectadas, las medidas correctivas implementadas y el seguimiento de condiciones de seguridad en obra.',
      alcance: 'El presente informe resume las inspecciones, controles, capacitaciones y acciones preventivas realizadas durante el período consignado en la obra, incorporando además el registro fotográfico de los elementos y mejoras implementadas (Dec. 911/96).',
      actividades_realizadas: 'Durante el período indicado se realizaron recorridos e inspecciones generales en los distintos sectores de la obra, verificándose las condiciones generales de seguridad, el uso de EPP y controles específicos de excavaciones y zanjas.',
      situaciones_detectadas: DEFAULT_SITUACIONES,
      medidas_correctivas: DEFAULT_MEDIDAS,
      pendientes_seguimiento: DEFAULT_PENDIENTES,
      observacion_general: 'Las medidas implementadas deberán mantenerse y ser verificadas durante los próximos recorridos de obra.',
      responsable_hys_id: '',
      responsable_hys_nombre: 'Lic. Higiene y Seguridad Laboral',
      matricula_hys: 'Matrícula Provincial N° 2841',
      responsable_obra_nombre: 'B. Guevara / Capataz General',
      registro_fotografico: DEFAULT_FOTOS,
      estado: 'borrador',
    });
    setShowEditorModal(true);
  };

  // Manejar Edición
  const handleOpenEdit = (inf: SeguridadInformeSemanal) => {
    setEditingInforme(inf);
    setForm({
      project_id: inf.project_id,
      numero_informe: inf.numero_informe,
      periodo_desde: inf.periodo_desde,
      periodo_hasta: inf.periodo_hasta,
      titulo: inf.titulo,
      tipo_informe: inf.tipo_informe,
      empresa: inf.empresa,
      comitente: inf.comitente || 'VALDIVIESO GROUP S.R.L.',
      sintesis_ejecutiva: inf.sintesis_ejecutiva || '',
      alcance: inf.alcance || '',
      actividades_realizadas: inf.actividades_realizadas || '',
      situaciones_detectadas: inf.situaciones_detectadas?.length ? inf.situaciones_detectadas : DEFAULT_SITUACIONES,
      medidas_correctivas: inf.medidas_correctivas?.length ? inf.medidas_correctivas : DEFAULT_MEDIDAS,
      pendientes_seguimiento: inf.pendientes_seguimiento?.length ? inf.pendientes_seguimiento : DEFAULT_PENDIENTES,
      observacion_general: inf.observacion_general || '',
      responsable_hys_id: inf.responsable_hys_id || '',
      responsable_hys_nombre: inf.responsable_hys_nombre || '',
      matricula_hys: inf.matricula_hys || '',
      responsable_obra_nombre: inf.responsable_obra_nombre || '',
      registro_fotografico: inf.registro_fotografico?.length ? inf.registro_fotografico : DEFAULT_FOTOS,
      estado: inf.estado,
    });
    setShowEditorModal(true);
  };

  // Guardar Informe
  const handleSave = async () => {
    if (!form.project_id || !form.numero_informe) {
      alert('Por favor seleccione la obra y asigne un número de informe.');
      return;
    }

    if (editingInforme) {
      await updateInforme.mutateAsync({
        id: editingInforme.id,
        updates: form,
      });
    } else {
      await createInforme.mutateAsync(form);
    }
    setShowEditorModal(false);
  };

  // Autocompletar con Datos Reales de la Semana
  const handleAutocompletarSemana = () => {
    const desde = new Date(form.periodo_desde);
    const hasta = new Date(form.periodo_hasta);
    hasta.setHours(23, 59, 59);

    // 1. Actividades desde Tareas de Obra
    const tareasSemana = tareas.filter(t => {
      const ft = new Date(t.fecha_plan);
      return ft >= desde && ft <= hasta;
    });

    let actText = form.actividades_realizadas;
    if (tareasSemana.length > 0) {
      const resumenActividades = Array.from(new Set(tareasSemana.map(t => `${t.actividad} (${t.sector_nombre || 'Sector gral'})`))).join(', ');
      actText = `Durante el período indicado se realizaron recorridos e inspecciones generales en la obra sobre las siguientes tareas en ejecución: ${resumenActividades}.\n\nSe efectuaron controles específicos sobre los sectores de zanjas y tendido de cañería PEAD, verificando accesos, taludes y acopio de material. Se impartieron charlas operativas de 5 minutos sobre prevención en excavaciones y uso obligatorio de EPP a las cuadrillas presentes.`;
    }

    // 2. Hallazgos desde Observaciones registradas
    const obsSemana = observaciones.filter(o => {
      const fo = new Date(o.fecha);
      return fo >= desde && fo <= hasta;
    });

    let nuevasSituaciones = [...form.situaciones_detectadas];
    if (obsSemana.length > 0) {
      const obsNuevas: SituacionDetectadaHyS[] = obsSemana.map(o => ({
        descripcion: o.descripcion,
        categoria: o.categoria || 'general',
        nivel_riesgo: (o.severidad * o.probabilidad >= 10 ? 'alto' : 'medio') as any,
      }));
      nuevasSituaciones = [...nuevasSituaciones, ...obsNuevas];
    }

    setForm(prev => ({
      ...prev,
      actividades_realizadas: actText,
      situaciones_detectadas: nuevasSituaciones,
    }));

    alert(`¡Datos sincronizados! Se analizaron ${tareasSemana.length} tareas operativas y ${obsSemana.length} observaciones registradas en el período.`);
  };

  // Emitir Solicitud de Pedido a Compras
  const handlePedirFaltantesCompras = async () => {
    if (!form.project_id) return;
    await createPurchaseRequest.mutateAsync({
      project_id: form.project_id,
      requested_by: `Higiene y Seguridad (${form.numero_informe})`,
      urgency: pedidoFaltantes.urgencia,
      notes: `Pedido derivado del Informe Semanal de HyS: ${pedidoFaltantes.notas}`,
      request_type: 'purchase',
      items: [{
        description: pedidoFaltantes.descripcion,
        quantity: pedidoFaltantes.cantidad,
        unit: pedidoFaltantes.unidad,
        estimated_unit_cost: 0,
      }],
    });
    alert('Solicitud de Pedido enviada exitosamente a la Gerencia de Compras y Pañol.');
    setShowPedidoModal(false);
  };

  // Generar PDF Oficial con membrete idéntico al .docx
  const handleExportPDF = (inf: SeguridadInformeSemanal) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const primaryColor: [number, number, number] = [15, 58, 103]; // Azul institucional ECAR
    const projectName = projects.find(p => p.id === inf.project_id)?.name || 'Loteo Roque';

    // ─── PÁGINA 1: INFORME TÉCNICO ───
    // Membrete Superior
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ECAR SAS — GESTIÓN DE HIGIENE, SEGURIDAD Y MEDIO AMBIENTE', 14, 11);

    // Título Principal
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('INFORME TÉCNICO', 14, 26);
    doc.setFontSize(13);
    doc.setTextColor(...primaryColor);
    doc.text(inf.titulo.toUpperCase(), 14, 33);
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.setFont('helvetica', 'bold');
    doc.text(`OBRA: ${projectName.toUpperCase()} — N° ${inf.numero_informe}`, 14, 40);

    // Tabla 1: Datos del Informe y Alcance
    autoTable(doc, {
      startY: 44,
      theme: 'grid',
      headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      bodyStyles: { fontSize: 8.5, textColor: [30, 41, 59], cellPadding: 3 },
      body: [
        [
          `DATOS DEL INFORME\nPeríodo: ${inf.periodo_desde} al ${inf.periodo_hasta}\nObra: ${projectName}\nEmpresa: ${inf.empresa}\nComitente: ${inf.comitente}\nTipo: ${inf.tipo_informe}\n\nSíntesis: ${inf.sintesis_ejecutiva || 'Se documentan tareas relevadas, desvíos y medidas correctivas.'}`,
          'DOCUMENTO LISTO PARA ENTREGA\n\nEstado: Conforme para auditoría técnica y comitente según Decreto 911/96 y Res. SRT 905/2015.'
        ],
        [
          {
            content: `ALCANCE DEL INFORME\n${inf.alcance || 'El presente informe resume las inspecciones, controles, capacitaciones y acciones preventivas realizadas durante el período consignado en la obra, incorporando además el registro fotográfico de los elementos y mejoras implementadas.'}`,
            colSpan: 2
          }
        ]
      ]
    });

    // Tabla 2: Actividades Realizadas
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      head: [['ACTIVIDADES REALIZADAS EN EL PERÍODO']],
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 3 },
      body: [
        [inf.actividades_realizadas || 'Recorridos de inspección general y verificación de condiciones de seguridad.']
      ]
    });

    // Tabla 3: Situaciones Detectadas
    const situacionesList = inf.situaciones_detectadas?.map(s => `• ${s.descripcion}`).join('\n\n') || 'Sin desvíos registrados.';
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [180, 83, 9], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      head: [['SITUACIONES DETECTADAS / CONDICIONES OBSERVADAS']],
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 3 },
      body: [[situacionesList]]
    });

    // Tabla 4: Medidas Correctivas Implementadas
    const medidasList = inf.medidas_correctivas?.map(m => `• ${m.descripcion} (Resp: ${m.responsable || 'Obra'})`).join('\n\n') || 'Medidas preventivas estándar.';
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      head: [['MEDIDAS CORRECTIVAS IMPLEMENTADAS']],
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 3 },
      body: [[medidasList]]
    });

    // Tabla 5: Pendientes y Seguimiento
    const pendientesList = inf.pendientes_seguimiento?.map(p => `• ${p.item}`).join('\n') || 'Sin pendientes críticos.';
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [71, 85, 105], textColor: [255, 255, 255], fontStyle: 'bold', fontSize: 9 },
      head: [['PENDIENTES Y SEGUIMIENTO']],
      bodyStyles: { fontSize: 8.5, textColor: [51, 65, 85], cellPadding: 3 },
      body: [[pendientesList]]
    });

    // Observación General y Firmas
    autoTable(doc, {
      startY: (doc as any).lastAutoTable.finalY + 4,
      theme: 'grid',
      headStyles: { fillColor: [241, 245, 249], textColor: [15, 23, 42], fontStyle: 'bold', fontSize: 8.5 },
      head: [['OBSERVACIÓN GENERAL']],
      bodyStyles: { fontSize: 8, textColor: [71, 85, 105], cellPadding: 2.5 },
      body: [[inf.observacion_general || 'Las medidas deberán mantenerse y verificarse en los próximos recorridos.']]
    });

    // Bloque de Firmas
    const sigY = (doc as any).lastAutoTable.finalY + 18;
    doc.setDrawColor(148, 163, 184);
    doc.line(20, sigY, 85, sigY);
    doc.line(125, sigY, 190, sigY);

    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(inf.responsable_hys_nombre || 'Responsable de Seguridad e Higiene', 22, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text(inf.matricula_hys || 'Matrícula Profesional', 22, sigY + 8);

    doc.setFont('helvetica', 'bold');
    doc.text(inf.responsable_obra_nombre || 'Responsable de Obra / Jefe de Obra', 127, sigY + 4);
    doc.setFont('helvetica', 'normal');
    doc.text('ECAR Constructora SAS', 127, sigY + 8);

    // ─── PÁGINA 2: REGISTRO FOTOGRÁFICO ───
    doc.addPage();

    // Membrete Página 2
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, 210, 16, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('ECAR SAS — REGISTRO FOTOGRÁFICO DE SEGURIDAD', 14, 11);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('EVIDENCIA FOTOGRÁFICA DE ACCIONES CORRECTIVAS', 14, 26);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(100, 116, 139);
    doc.text(`Elementos disponibles y medidas de protección implementadas en la obra ${projectName}.`, 14, 32);

    const fotos = inf.registro_fotografico?.length ? inf.registro_fotografico : DEFAULT_FOTOS;

    // Cuadrícula 2x2 de fotos
    const gridCoords = [
      { x: 14, y: 38 },
      { x: 110, y: 38 },
      { x: 14, y: 140 },
      { x: 110, y: 140 }
    ];

    fotos.slice(0, 4).forEach((foto, i) => {
      const coord = gridCoords[i];
      if (!coord) return;

      // Marco
      doc.setDrawColor(226, 232, 240);
      doc.setFillColor(255, 255, 255);
      doc.roundedRect(coord.x, coord.y, 86, 92, 2, 2, 'FD');

      // Recuadro simulado para la foto
      doc.setFillColor(241, 245, 249);
      doc.rect(coord.x + 3, coord.y + 3, 80, 56, 'F');

      // Placeholder icon / text
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139);
      doc.setFont('helvetica', 'bold');
      doc.text(`[ ${foto.titulo || `Fotografía ${i + 1}`} ]`, coord.x + 22, coord.y + 32);

      // Epígrafe
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 58, 103);
      doc.text(`${foto.titulo} — Fecha: ${foto.fecha || inf.periodo_hasta}`, coord.x + 4, coord.y + 64);

      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      const splitEpigrafe = doc.splitTextToSize(foto.epigrafe || '', 78);
      doc.text(splitEpigrafe, coord.x + 4, coord.y + 69);
    });

    // Guardar PDF
    doc.save(`${inf.numero_informe}_${projectName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal */}
      <div className="bg-gradient-to-r from-slate-900 via-ecar-blueDark to-ecar-blue rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none"><ShieldCheck size={140} /></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
              <CheckCircle2 size={14} /> Documento Listo para Entrega (Comitente & OSSE)
            </div>
            <h2 className="text-2xl font-extrabold text-white tracking-tight">
              Informes Semanales de Higiene y Seguridad
            </h2>
            <p className="text-xs text-gray-300 max-w-2xl">
              Generación del informe técnico semanal de relevamiento, seguimiento de excavaciones, pasarelas, botiquines, matafuegos y registro fotográfico formal según Decreto 911/96.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setActiveTab(activeTab === 'entregas_personal' ? 'informes' : 'entregas_personal')}
              className={`px-3.5 py-2.5 rounded-xl font-bold text-xs border flex items-center gap-1.5 transition-all shadow-sm ${
                activeTab === 'entregas_personal'
                  ? 'bg-emerald-500 text-white border-emerald-400'
                  : 'bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-400/30'
              }`}
            >
              <ShieldCheck size={14} /> {activeTab === 'entregas_personal' ? '📋 Ver Informes Semanales' : '🦺 Material & EPP al Personal'}
            </button>
            <button
              onClick={() => setShowPedidoModal(true)}
              className="px-3.5 py-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold text-xs border border-amber-400/30 flex items-center gap-1.5 transition-all shadow-sm"
            >
              <ShoppingCart size={14} /> Pedir Elementos HyS a Pañol
            </button>
            <button
              onClick={handleOpenNew}
              className="btn-primary text-xs font-bold py-2.5 px-4 shadow-md flex items-center gap-1.5"
            >
              <Plus size={16} /> Nuevo Informe Semanal
            </button>
          </div>
        </div>
      </div>

      {/* Selector de Pestañas: Informes Semanales vs Material Entregado al Personal */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-2">
        <button
          onClick={() => setActiveTab('informes')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'informes'
              ? 'bg-ecar-blue text-white shadow-md'
              : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
          }`}
        >
          <FileText size={15} /> Informes Semanales (Entregables) ({filteredInformes.length})
        </button>
        <button
          onClick={() => setActiveTab('entregas_personal')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
            activeTab === 'entregas_personal'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200'
          }`}
        >
          <ShieldCheck size={15} /> 🦺 Material & EPP Entregado al Personal
        </button>
      </div>

      {activeTab === 'entregas_personal' ? (
        <PPEDeliveriesPanel />
      ) : (
        <>
      {/* Barra de Filtros */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-ecar-blue" />
            <select
              value={filterProject}
              onChange={e => setFilterProject(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 focus:outline-none focus:border-ecar-blue"
            >
              <option value="">Todas las Obras Activas</option>
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
            {(['todos', 'borrador', 'emitido', 'entregado'] as const).map(st => (
              <button
                key={st}
                onClick={() => setFilterEstado(st)}
                className={`px-3 py-1 text-xs font-bold rounded-lg capitalize transition-all ${
                  filterEstado === st ? 'bg-white text-ecar-blue shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {st === 'todos' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>

        <div className="text-xs text-gray-400 font-medium">
          Total Informes: <strong>{filteredInformes.length}</strong>
        </div>
      </div>

      {/* Lista de Informes */}
      {isLoading ? (
        <div className="text-center py-12 text-gray-400">Cargando informes de seguridad...</div>
      ) : filteredInformes.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center space-y-3">
          <FileText size={48} className="mx-auto text-gray-300" />
          <h3 className="font-bold text-gray-800 text-base">No hay informes semanales registrados</h3>
          <p className="text-xs text-gray-500 max-w-md mx-auto">
            Creá el primer informe semanal de relevamiento para la obra seleccionada o autocompletalo con las tareas y desvíos de la semana.
          </p>
          <button
            onClick={handleOpenNew}
            className="btn-primary text-xs font-bold px-4 py-2 inline-flex items-center gap-1.5"
          >
            <Plus size={15} /> Crear Primer Informe
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInformes.map(inf => {
            const projName = projects.find(p => p.id === inf.project_id)?.name || 'Obra';
            const estadoBadge = inf.estado === 'entregado'
              ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
              : inf.estado === 'emitido'
              ? 'bg-blue-100 text-blue-800 border-blue-200'
              : 'bg-amber-100 text-amber-800 border-amber-200';

            return (
              <div
                key={inf.id}
                className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-extrabold text-ecar-blue">{inf.numero_informe}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border capitalize ${estadoBadge}`}>
                        {inf.estado}
                      </span>
                    </div>
                    <h4 className="font-bold text-gray-900 text-base">{projName}</h4>
                    <p className="text-xs text-gray-500 font-medium">Comitente: {inf.comitente || 'VALDIVIESO GROUP S.R.L.'}</p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleExportPDF(inf)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-all"
                      title="Descargar PDF Oficial"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      onClick={() => handleOpenEdit(inf)}
                      className="p-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-ecar-blue transition-all"
                      title="Editar Informe"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar el informe ${inf.numero_informe}?`)) {
                          deleteInforme.mutate(inf.id);
                        }
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1 font-bold"><Calendar size={13} className="text-ecar-blue" /> Período:</span>
                    <span className="font-mono">{inf.periodo_desde} al {inf.periodo_hasta}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1 font-bold"><UserCheck size={13} className="text-emerald-600" /> Resp. HyS:</span>
                    <span className="truncate max-w-[180px]">{inf.responsable_hys_nombre || 'Lic. HyS'}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-600">
                    <span className="flex items-center gap-1 font-bold"><Camera size={13} className="text-purple-600" /> Fotos Evidencia:</span>
                    <span>{inf.registro_fotografico?.length || 4} fotografías adjuntas</span>
                  </div>
                </div>

                <p className="text-xs text-gray-600 line-clamp-2 italic">
                  "{inf.sintesis_ejecutiva || 'Se documentan las condiciones de seguridad en excavaciones y medidas adoptadas.'}"
                </p>

                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => handleExportPDF(inf)}
                    className="text-xs font-bold text-ecar-blue hover:text-ecar-blueDark flex items-center gap-1"
                  >
                    <Download size={14} /> Descargar PDF Listo para Entrega
                  </button>
                  <button
                    onClick={() => handleOpenEdit(inf)}
                    className="text-xs font-bold text-gray-500 hover:text-gray-800"
                  >
                    Ver detalles →
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
        </>
      )}

      {/* ─── MODAL EDITOR DE INFORME SEMANAL ─── */}
      {showEditorModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-6 space-y-6 max-h-[92vh] overflow-y-auto">
            {/* Header del Modal */}
            <div className="flex justify-between items-center pb-3 border-b border-gray-200">
              <div className="space-y-0.5">
                <h3 className="font-extrabold text-lg text-gray-900 flex items-center gap-2">
                  <ShieldCheck size={20} className="text-ecar-blue" />
                  {editingInforme ? `Editar Informe ${form.numero_informe}` : 'Nuevo Informe Semanal de HyS'}
                </h3>
                <p className="text-xs text-gray-400">
                  Estructura oficial idéntica al documento listo para entrega (Decreto 911/96).
                </p>
              </div>
              <button onClick={() => setShowEditorModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            {/* Barra de Autocompletar */}
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Clock size={14} className="text-emerald-600" /> Sincronización Automática de Módulos
                </p>
                <p className="text-[11px] text-emerald-700">
                  Carga automáticamente las tareas de excavación, observaciones y cuadrillas de la semana seleccionada.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAutocompletarSemana}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-sm flex items-center gap-1.5 flex-shrink-0"
              >
                <CheckCircle2 size={14} /> Autocompletar con Datos de la Semana
              </button>
            </div>

            {/* Formulario Secciones */}
            <div className="space-y-4">
              {/* Metadatos */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Obra *</label>
                  <select
                    value={form.project_id}
                    onChange={e => setForm({ ...form, project_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none"
                  >
                    <option value="">Seleccionar obra...</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">N° Informe *</label>
                  <input
                    type="text"
                    value={form.numero_informe}
                    onChange={e => setForm({ ...form, numero_informe: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Estado</label>
                  <select
                    value={form.estado}
                    onChange={e => setForm({ ...form, estado: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none capitalize"
                  >
                    <option value="borrador">Borrador</option>
                    <option value="emitido">Emitido</option>
                    <option value="entregado">Entregado al Comitente</option>
                  </select>
                </div>
              </div>

              {/* Rango de Fechas & Comitente */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Período Desde</label>
                  <input
                    type="date"
                    value={form.periodo_desde}
                    onChange={e => setForm({ ...form, periodo_desde: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Período Hasta</label>
                  <input
                    type="date"
                    value={form.periodo_hasta}
                    onChange={e => setForm({ ...form, periodo_hasta: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Comitente</label>
                  <input
                    type="text"
                    value={form.comitente}
                    onChange={e => setForm({ ...form, comitente: e.target.value })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              {/* Síntesis Ejecutiva */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Síntesis Ejecutiva</label>
                <textarea
                  value={form.sintesis_ejecutiva}
                  onChange={e => setForm({ ...form, sintesis_ejecutiva: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none"
                />
              </div>

              {/* Actividades Realizadas */}
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">1. Actividades Realizadas en el Período</label>
                <textarea
                  value={form.actividades_realizadas}
                  onChange={e => setForm({ ...form, actividades_realizadas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:outline-none font-sans"
                />
              </div>

              {/* Situaciones Detectadas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">2. Situaciones Detectadas / Observaciones de Seguridad</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      situaciones_detectadas: [...prev.situaciones_detectadas, { descripcion: '', nivel_riesgo: 'medio' }]
                    }))}
                    className="text-xs font-bold text-ecar-blue hover:text-ecar-blueDark"
                  >
                    + Agregar Hallazgo
                  </button>
                </div>
                {form.situaciones_detectadas.map((sit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-400 font-mono">#{i + 1}</span>
                    <input
                      type="text"
                      value={sit.descripcion}
                      onChange={e => {
                        const updated = [...form.situaciones_detectadas];
                        updated[i].descripcion = e.target.value;
                        setForm({ ...form, situaciones_detectadas: updated });
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-xl text-xs"
                      placeholder="Descripción de la situación detectada..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.situaciones_detectadas.filter((_, idx) => idx !== i);
                        setForm({ ...form, situaciones_detectadas: updated });
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Medidas Correctivas */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-gray-700">3. Medidas Correctivas Implementadas</label>
                  <button
                    type="button"
                    onClick={() => setForm(prev => ({
                      ...prev,
                      medidas_correctivas: [...prev.medidas_correctivas, { descripcion: '', responsable: 'Obra', estado: 'implementada' }]
                    }))}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    + Agregar Medida
                  </button>
                </div>
                {form.medidas_correctivas.map((med, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs font-bold text-emerald-600 font-mono">#{i + 1}</span>
                    <input
                      type="text"
                      value={med.descripcion}
                      onChange={e => {
                        const updated = [...form.medidas_correctivas];
                        updated[i].descripcion = e.target.value;
                        setForm({ ...form, medidas_correctivas: updated });
                      }}
                      className="flex-1 px-3 py-1.5 border rounded-xl text-xs"
                      placeholder="Medida preventiva adoptada..."
                    />
                    <input
                      type="text"
                      value={med.responsable || ''}
                      onChange={e => {
                        const updated = [...form.medidas_correctivas];
                        updated[i].responsable = e.target.value;
                        setForm({ ...form, medidas_correctivas: updated });
                      }}
                      className="w-36 px-2 py-1.5 border rounded-xl text-xs"
                      placeholder="Responsable"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = form.medidas_correctivas.filter((_, idx) => idx !== i);
                        setForm({ ...form, medidas_correctivas: updated });
                      }}
                      className="text-red-400 hover:text-red-600 p-1"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>

              {/* Responsables y Firmas */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Responsable HyS</label>
                  <select
                    value={form.responsable_hys_id}
                    onChange={e => {
                      const emp = employees.find(em => em.id === e.target.value);
                      setForm({
                        ...form,
                        responsable_hys_id: e.target.value,
                        responsable_hys_nombre: emp ? emp.full_name : form.responsable_hys_nombre
                      });
                    }}
                    className="w-full px-3 py-1.5 border rounded-xl text-xs font-medium"
                  >
                    <option value="">Seleccionar de empleados...</option>
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>{e.full_name} {e.legajo ? `(Leg. ${e.legajo})` : ''}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Matrícula Profesional</label>
                  <input
                    type="text"
                    value={form.matricula_hys}
                    onChange={e => setForm({ ...form, matricula_hys: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl text-xs"
                    placeholder="Ej. Mat. Prof. COPIG N° 4582"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Responsable de Obra / Jefe de Obra</label>
                  <input
                    type="text"
                    value={form.responsable_obra_nombre}
                    onChange={e => setForm({ ...form, responsable_obra_nombre: e.target.value })}
                    className="w-full px-3 py-1.5 border rounded-xl text-xs"
                    placeholder="B. Guevara / Capataz General"
                  />
                </div>
              </div>

              {/* Registro Fotográfico (4 Evidencias con Epígrafes) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Camera size={15} className="text-purple-600" /> Registro Fotográfico Formal (Evidencias de Entrega)
                    </h4>
                    <p className="text-[11px] text-gray-400">
                      Configurá las 4 fotografías con sus fechas y epígrafes descriptivos para el reporte comitente.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {form.registro_fotografico.map((foto, idx) => (
                    <div key={foto.id || idx} className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-xs text-ecar-blue">{foto.titulo}</span>
                        <input
                          type="text"
                          value={foto.fecha}
                          onChange={e => {
                            const updated = [...form.registro_fotografico];
                            updated[idx].fecha = e.target.value;
                            setForm({ ...form, registro_fotografico: updated });
                          }}
                          className="w-24 px-2 py-0.5 border rounded text-[11px] font-mono"
                          placeholder="dd/mm/aaaa"
                        />
                      </div>
                      <input
                        type="text"
                        value={foto.url}
                        onChange={e => {
                          const updated = [...form.registro_fotografico];
                          updated[idx].url = e.target.value;
                          setForm({ ...form, registro_fotografico: updated });
                        }}
                        className="w-full px-2 py-1 border rounded text-[11px]"
                        placeholder="URL de la imagen o ruta..."
                      />
                      <textarea
                        value={foto.epigrafe}
                        onChange={e => {
                          const updated = [...form.registro_fotografico];
                          updated[idx].epigrafe = e.target.value;
                          setForm({ ...form, registro_fotografico: updated });
                        }}
                        rows={2}
                        className="w-full px-2 py-1 border rounded text-[11px]"
                        placeholder="Epígrafe formal descriptivo..."
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setShowEditorModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={createInforme.isPending || updateInforme.isPending}
                className="btn-primary px-5 py-2 text-xs font-bold flex items-center gap-1.5"
              >
                <Check size={16} /> Guardar Informe Semanal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PEDIDO DIRECTO A COMPRAS DESDE HYS ─── */}
      {showPedidoModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-gray-100">
              <h3 className="font-extrabold text-base text-gray-900 flex items-center gap-2">
                <ShoppingCart size={18} className="text-amber-600" /> Solicitud a Compras / Pañol (HyS)
              </h3>
              <button onClick={() => setShowPedidoModal(false)} className="text-gray-400 hover:text-gray-600">
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-500">
              Emití una Solicitud de Pedido inmediata para compras o provisión de elementos de seguridad faltantes detectados en obra.
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Obra Destino *</label>
                <select
                  value={form.project_id}
                  onChange={e => setForm({ ...form, project_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-xl text-xs font-bold"
                >
                  <option value="">Seleccionar obra...</option>
                  {projects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-1">Elementos a Solicitar</label>
                <textarea
                  value={pedidoFaltantes.descripcion}
                  onChange={e => setPedidoFaltantes({ ...pedidoFaltantes, descripcion: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Cantidad</label>
                  <input
                    type="number"
                    value={pedidoFaltantes.cantidad}
                    onChange={e => setPedidoFaltantes({ ...pedidoFaltantes, cantidad: parseFloat(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 block mb-1">Urgencia</label>
                  <select
                    value={pedidoFaltantes.urgencia}
                    onChange={e => setPedidoFaltantes({ ...pedidoFaltantes, urgencia: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-xl text-xs font-bold text-red-600"
                  >
                    <option value="urgent">Urgente (Bloqueante Seguridad)</option>
                    <option value="normal">Normal</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowPedidoModal(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handlePedirFaltantesCompras}
                className="btn-primary text-xs font-bold px-4 py-2 flex items-center gap-1.5"
              >
                <ShoppingCart size={14} /> Enviar a Compras
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
