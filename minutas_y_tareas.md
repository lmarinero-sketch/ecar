# Minutas de Reunión y Plan de Acción - Sistema ECAR

## 1. Resumen Ejecutivo
Se revisaron los módulos operativos del sistema (Logística, Flota, Compras, Inventario y Obras) enfocándose en la experiencia de usuario (UX) para los operarios y la gerencia. El objetivo primordial es que los **módulos core (Logística, Entregas y Pedidos)** funcionen al 100% de manera fluida y controlada antes de dispersar el desarrollo hacia funcionalidades accesorias.

Se detectaron varias oportunidades de mejora en la captura de datos (dropdowns en vez de texto libre), flujos de autorización (doble chequeo, justificación de rechazos) y auditoría (trazabilidad y manejo de roles).

---

## 2. Requerimientos de Lógica y Tareas Faltantes

### A. Módulo Logística, Pedidos y Entregas (ex "Acopios")
*   **Cambio de Nomenclatura:** Reevaluar el nombre de "Acopios" por algo más representativo como "Logística de Envíos" o "Entregas", ya que abarca el movimiento general.
*   **Flujo de Aprobación de Envíos (Doble Control):**
    1.  La obra solicita el material o se arma el envío.
    2.  Un responsable autoriza la preparación (ej. Ezequiel).
    3.  **Control de Montos:** Implementar una regla de negocio donde, si el valor total de la mercadería enviada supera cierto umbral (ej. $300.000), se dispare una notificación/alerta para una segunda autorización de Gerencia.
*   **Edición sobre Rechazos:** Si un gerente u otro responsable rechaza el envío de un material (ej. porque no hace falta enviarlo), **no se debe eliminar** el pedido entero. Se debe mantener un registro (historial) añadiendo una *observación obligatoria* del rechazo, permitiendo editar el envío para que siga su curso sin el ítem cuestionado.
*   **Listas Desplegables (Dropdowns):** Evitar inputs de texto libre para datos estandarizados. Por ejemplo, al elegir el "Chofer responsable", debe ser una lista desplegable.
*   **Trazabilidad en Tránsito (Mapa en Vivo):** Al marcar un pedido como "En tránsito", habilitar una funcionalidad para ir directamente al **mapa en vivo** y visualizar la ubicación del chofer/flota que realiza la entrega, informando también a la persona en obra.
*   **Recepción en Obra:**
    *   El receptor debe contar con un **Checklist** en el celular para validar ítem por ítem lo que llega.
    *   El sistema debe soportar **entregas parciales** y registrar devoluciones inmediatas si un ítem falta o llega dañado, acompañado de una firma digital.
    *   Confirmar que al marcar como "entregado", los ítems se descuenten automáticamente del stock real.

### B. Módulo Inventario y Stock (Pañol)
*   **Estandarización de Nuevos Ítems:** Al crear un material, el campo "Unidad" y la "Ubicación" (estantería) deben ser menús desplegables, no texto libre.
*   **Importación / Exportación masiva:** Es urgente agregar un submódulo para **Importar** (precios, materiales, stock inicial) y **Exportar** datos hacia/desde Excel.
*   **Valorización e Histórico de Costos:** Resolver la lógica contable para materiales acopiados a largo plazo. El sistema debe poder informar a qué costo real o histórico se está dando salida a un material, para tener un cálculo certero de reposición.
*   **Auditoría y Permisos (No Eliminar):** Los usuarios regulares no deben poder eliminar registros ni ítems. Solo el Administrador general puede hacerlo, y para los demás, se debe recurrir a ediciones o ajustes de stock que dejen huella en el sistema (trazabilidad).
*   **Ubicación Visual en Pañol (UX):** Excelente iniciativa a desarrollar: permitir subir un plano del pañol o fotos reales de las estanterías (e incluso imágenes de los productos) y poder interactuar con pines en la imagen para saber exactamente dónde buscar un repuesto/material.

### C. Módulo Flota y Maquinaria
*   **Dashboards Dedicados:** Separar indicadores en "Dashboards" específicos para que en una pantalla general no se mezcle, por ejemplo, información de flota con inventario (quitar stock pañol de la vista de flota).
*   **Parte Diario con QR:**
    *   Ya funciona escanear un QR con el celular para reportar.
    *   **Lógica de Kilometraje:** El kilometraje cargado desde el Parte Diario (y también desde las cargas de combustible) debe impactar y actualizar el kilometraje actual en el perfil principal del vehículo.
*   **Estados de Servicio (Tickets de Mantenimiento):** Si se reporta un daño leve (ej. óptica rota), el vehículo **no** debe pasar automáticamente al estado rojo "Fuera de Servicio". Debe crearse un **Ticket de mantenimiento** y el vehículo debe quedar "Con Observaciones". Reservar "Fuera de Servicio" solo para paralizaciones totales.
*   **Control Económico de Combustible:** En la autorización o carga del comprobante de combustible, obligar a ingresar no solo los litros, sino el **monto total o el valor por litro** para control financiero, no solo logístico.

### D. Mejoras Transversales y Administrativas
*   **Buscador en Compras/Facturas:** Asegurarse de que las facturas no solo se busquen por el nombre del proveedor, sino también **por número de factura**, adaptándose a cómo trabajan los perfiles contables.
*   **Control de Accesos (Roles):** Refinar los permisos. Un perfil como el de armador de pedidos o coordinador logístico, por defecto no debe ver información financiera, costos o indicadores generales si no le corresponde. Lo mismo para el borrado de datos.
*   **Métricas de Uso (Permanencia):** Mantener y valorar la métrica de tiempo de actividad y registro de lo que hace el usuario (permanencia en módulos) para comprobar fehacientemente si el sistema está siendo usado por el equipo.

---

**Siguientes Pasos (Prioridad Alta):**
1. Perfeccionar toda la experiencia de "Entregas a Obra" (Checklist, Estados y Firmas).
2. Perfeccionar "Parte Diario" (Kilómetros unificados, Estados de Flota sin falsos bloqueos).
3. Asegurar los inputs (convertir texto libre a Dropdowns).
4. Implementar Importar/Exportar en Inventario.
