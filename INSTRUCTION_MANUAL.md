# Manual de Instrucciones - Sistema de Estudios Técnicos

Este sistema permite la gestión integral de estudios técnicos, desde la asignación hasta la aprobación, proporcionando métricas clave para la toma de decisiones.

## Roles y Funcionalidades

### 1. Director / Administrador

#### Acceso al Dashboard

- Ingrese a `/dashboard` desde la página de inicio.
- **Vista General**: Observe las tarjetas superiores para un estado rápido (Volumen, Ingenieros en Sitio, Pendientes de Revisión).

#### Gestión de Estudios

- **Crear Nuevo**: Click en "Nuevo Estudio" para asignar un trabajo a un ingeniero (integración Odoo/NocoDB).
- **Filtrar Información**:
  - Use la barra superior para buscar un cliente específico.
  - Filtre por un Ingeniero para ver su carga de trabajo.
  - Seleccione un rango de fechas para ver la productividad del mes.
- **Exportar Reportes**:
  - Click en "Exportar CSV" para descargar un Excel con la lista de estudios que está viendo en pantalla (respeta sus filtros).

#### Análisis de KPIs

- El sistema calcula automáticamente:
  - **Tiempo de Reacción**: Cuánto tarda el ingeniero en llegar/iniciar desde que se le asigna.
  - **Tiempo de Ejecución**: Cuánto tiempo pasa trabajando en el sitio.
  - **Tiempo de Revisión**: Cuánto tarda administración en aprobar el reporte.

---

### 2. Ingeniero de Campo

#### Realización del Estudio

1. **Inicio**: Al llegar al sitio del cliente, abra el estudio asignado y presione **"Iniciar"**. Esto marca su hora de llegada.
2. **Levantamiento**:
   - Agregue equipos y suministros.
   - Use las notas de voz para descripciones rápidas.
   - Suba fotos de evidencia.
3. **Finalización**:
   - Revise la información.
   - Presione **"Guardar y Enviar"**. El estado cambiará a "En Revisión".

#### Herramientas

- **Exportar Materiales**: Use el botón "Excel/CSV" para descargar la lista de materiales y adjuntarla a cotizaciones o solicitudes de bodega.
- **Generar PDF**: Descargue una versión impresa preliminar del reporte.

---

## Flujo de Trabajo Típico

1. **Director** crea estudio (Estado: _Borrador_).
2. **Ingeniero** recibe notificación y viaja al sitio.
3. **Ingeniero** click en "Iniciar" (Estado: _En Progreso_).
4. **Ingeniero** completa datos y envía (Estado: _En Revisión_).
5. **Director** revisa en Dashboard y Aprueba (Estado: _Aprobado_).
6. **Sistema** cierra tiempos y actualiza estadísticas.
