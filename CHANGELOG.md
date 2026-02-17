# Changelog

## [0.1.0] - 2026-02-17

### Added

- **Dashboard de Gestión (`/dashboard`)**:
  - Vista centralizada de todos los estudios técnicos.
  - Tarjetas de KPIs (Volumen, En Ejecución, Por Revisar, Tiempo Ciclo).
  - Tiempos promedio de fases (Reacción, Ejecución, Revisión).
  - Gráfico de barras para Top Clientes.
  - Tabla de estudios con estado, fechas y acciones.
- **Filtrado Avanzado**:
  - Buscador de Clientes por texto.
  - Selectores para Ingeniero y Estado.
  - Rango de fechas (Desde/Hasta) para análisis temporal.
- **Exportación de Datos**:
  - Botón "Exportar CSV" en Dashboard para descargar tabla filtrada.
  - Botón "Excel/CSV" en Detalle de Estudio para descargar materiales/equipos.
- **Gestión de Tiempos (KPIs)**:
  - Registro automático de timestamps:
    - `started_at`: Al iniciar trabajo en sitio.
    - `submitted_at`: Al enviar a revisión.
    - `approved_at`: Al aprobar por el director.
- **Flujo de Estudio (`/engineer/study/[id]`)**:
  - Botón "Iniciar" para marcar el comienzo del trabajo.
  - Botón "Guardar y Enviar" para pasar a revisión.
  - Visualización de estado (Borrador, En Proceso, Revisión, Aprobado).
- **Integraciones**:
  - NocoDB: Tablas `technical_studies`, `study_materials`, etc.
  - Slack: Notificaciones de asignación (simulado).

### Changed

- **Navegación**:
  - Redirección de "Nuevo Estudio" en Home a `/dashboard`.
- **UI/UX**:
  - Mejoras en márgenes y espaciado del contenedor principal.
  - Formato de moneda (L.) consistente en todas las vistas.
  - Etiquetas de estado con colores distintivos.

### Fixed

- Error de construcción por caracteres especiales en JSX del Dashboard.
- Referencia indefinida a `studyData` en la exportación de materiales.
