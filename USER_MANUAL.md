# TAS Hub - Manual de Usuario

Bienvenido al sistema unificado **TAS Hub**, la plataforma central de operaciones que integra múltiples módulos (incluyendo el Estudio Técnico, Calendario, Directorio y más) en una sola aplicación web moderna.

## 🎯 Índice de Módulos
1. [Autenticación](#1-autenticación)
2. [Módulo: Estudio Técnico](#2-módulo-estudio-técnico)
3. [Módulo: Calendario (Próximamente)](#3-módulo-calendario)
4. [Módulo: Directorio de Empleados (Próximamente)](#4-módulo-directorio-de-empleados)

---

## 1. Autenticación
Para acceder al TAS Hub, todos los empleados deben iniciar sesión a través del portal central (`/login`). El sistema utilizará validación segura y determinará tus permisos según tu rol (Subgerente, Ingeniero, RRHH, Superadmin).

---

## 2. Módulo: Estudio Técnico
Este submódulo permite gestionar las instalaciones y evaluaciones en el sitio del cliente y está conectado a NocoDB y Odoo.

### Funciones Administrativas (Directores/Supervisores)
- **Dashboard Principal**: Accede desde el menú lateral para ver tarjetas de KPIs (Volumen, Estudios en curso, Pendientes de Revisión).
- **Creación de Estudio**: Haz clic en "Nuevo Estudio" para importar un Ticket/Orden de Odoo o NocoDB y asignarlo a un ingeniero.
- **Exportación**: Puedes descargar en CSV los estudios visibles o acceder a un estudio individual para exportar la lista de materiales.

### Funciones de Campo (Ingenieros)
1. **Iniciar Trabajos**: Abre el estudio asignado en tu dispositivo móvil y presiona **"Iniciar"** para medir tu tiempo de reacción.
2. **Levantamiento**: Agrega equipos, notas de voz y toma fotografías para evidenciar el estado de la instalación.
3. **Guardar y Enviar**: Al terminar, envía la evaluación a revisión administrativa. El ciclo de tiempo se calculará automáticamente.

---

## 📋 Registro de Cambios y Próximos Pasos
Para ver el avance técnico y de desarrollo, consulta el archivo `CHANGELOG.md`.

*Documento en constante actualización durante la fase de unificación.*
