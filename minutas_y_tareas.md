# Minutas de Reunión y Requerimientos del Sistema (ECAR)

## 1. Resumen de la Reunión
En la reunión se revisaron varios módulos operativos del sistema (Logística, Flota, Compras, Inventario y Obras) desde el punto de vista del usuario final (operarios, choferes y gerencia). El objetivo principal es mejorar la experiencia de usuario (UX), agilizar el uso en campo (vía celular) y asegurar que existan los controles, trazabilidad y autorizaciones correspondientes para evitar pérdidas o errores.

Se destacó que el desarrollo debe centrarse en los "Módulos Core" de uso diario (Logística, Entregas y Pedidos de Obra) para estabilizarlos antes de avanzar con otros módulos accesorios.

---

## 2. Lógicas Faltantes y Tareas de Desarrollo

### A. Módulo de Logística y Entregas (Acopios)
* **Revisión de Nomenclatura:** Cambiar el término "Acopio" por "Logística", "Inicio" o "Entregas", ya que el término actual es confuso.
* **Flujo de Autorizaciones en Pedidos:**
  1. La obra solicita materiales.
  2. Logística arma el pedido.
  3. Un responsable (ej. Ezequiel) debe autorizar el envío.
  4. **Control de montos:** Si el valor del envío supera un límite (ej. $300.000), requerir una segunda validación del Gerente General (vía alerta/notificación).
  5. **Rechazos:** Si un pedido se rechaza, no debe borrarse. Debe quedar en estado de "Revisión" con una *observación obligatoria* de por qué se rechazó (ej. "No envíes la amoladora"), permitiendo su edición para re-envío.
* **Trazabilidad en Tránsito:** 
  * Al marcar un envío como "En Tránsito", el sistema debe habilitar un botón/acceso directo que lleve al mapa en vivo (Tracking) para ver la ubicación real de la camioneta que lleva el pedido.
  * El receptor en la obra debe recibir un enlace (o notificación) avisando que su pedido está en camino.
* **Recepción en Obra (Checklist y Devoluciones):** 
  * El encargado de recibir en obra debe tener un *Checklist* en el celular para tildar ítem por ítem lo que llega.
  * Debe poder firmar digitalmente la recepción.
  * Permitir **entregas parciales y devoluciones** en el momento (si algo llega roto o falta).
* **Descuento Automático de Stock e Historial:** Al confirmarse la salida/entrega, el material debe descontarse automáticamente del stock del pañol y dejar un registro en el "Historial de Entradas y Salidas".

### B. Módulo de Inventario y Pañol
* **Gestión de Permisos (Eliminación):** Quitar el permiso de eliminar movimientos/materiales a los usuarios normales. Solo un Administrador/Gerente debe poder borrar. Los errores deben ser corregidos mediante edición o notas de compensación (auditoría).
* **Campos Estandarizados:** En la creación de nuevos ítems, los campos como "Unidad de Medida" y "Ubicación/Estantería" deben ser listas desplegables (Dropdowns) y no campos de texto libre.
* **Importación y Exportación masiva:** Implementar funcionalidad para importar y exportar stock, materiales y precios mediante archivos Excel.
* **Control de Costos de Salida (Valorización):** Desarrollar lógica para saber a qué costo histórico se está entregando un material (para previsiones de reposición).
* **Ubicaciones Visuales (Plano/Fotos):** Añadir la capacidad de subir fotos reales o un plano interactivo del pañol (Estanterías A, B, C...) con puntos interactivos. Al hacer clic en un material, el sistema debe mostrar visualmente dónde está guardado.

### C. Módulo de Flota y Maquinaria
* **Separación Visual (Dashboards):** Separar los reportes en tableros específicos ("Dashboard de Flota", "Dashboard de Logística") para no mezclar la información en pantallas gigantes.
* **Parte Diario (QR):** 
  * Imprimir Códigos QR para cada vehículo. Al escanear, el operario debe poder llenar su parte diario: nivel de combustible, kilometraje y reporte de daños.
  * El kilometraje ingresado en el Parte Diario y en las Cargas de Combustible debe alimentar y actualizar automáticamente los "Kilómetros Actuales" del vehículo en el maestro de la Flota.
* **Estados del Vehículo:** 
  * Si en el Parte Diario se reporta un daño (ej. luz rota), el vehículo no debería pasar automáticamente a un "Fuera de Servicio" total (que indica que no puede usarse). Debería generar un "Ticket de Mantenimiento" y mantener un estado como "Con Observaciones", reservando el "Fuera de Servicio" para daños graves.
* **Cargas de Combustible:**
  * En la carga de combustible (que ya tiene autorización y vale digital), se debe exigir el ingreso del **monto total o valor por litro** facturado, para tener el gasto monetario real, no solo los litros.
