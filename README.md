# Sistema de Gestión de Estudios Técnicos

Plataforma web para la administración, ejecución y análisis de estudios técnicos de campo. Diseñado para optimizar los tiempos de respuesta y mejorar la calidad de los reportes.

## Características Principales

- **Dashboard Ejecutivo**: Métricas en tiempo real, KPIs de rendimiento y filtrado avanzado.
- **App de Campo**: Interfaz móvil para ingenieros con carga de fotos, notas de voz y manejo de materiales.
- **Integración NocoDB**: Base de datos flexible y escalable.
- **Analítica**: Seguimiento de tiempos de ciclo (Reacción, Ejecución, Revisión).
- **Exportación**: Generación de reportes en PDF y exportación de datos a CSV/Excel.

## Tecnologías

- **Framework**: Next.js 14+ (App Router)
- **Lenguaje**: TypeScript
- **UI**: Tailwind CSS, Shadcn/ui
- **Base de Datos**: NocoDB (API)
- **Integraciones**: Slack (Notificaciones)

## Instalación

1. Clonar el repositorio:

   ```bash
   git clone https://github.com/dachavarriam/estudiotecnico.git
   ```

2. Instalar dependencias:

   ```bash
   cd web
   npm install
   ```

3. Configurar variables de entorno (`.env`):

   ```
   NOCODB_URL=...
   NOCODB_API_TOKEN=...
   SLACK_BOT_TOKEN=...
   ```

4. Ejecutar servidor de desarrollo:
   ```bash

   ```
   npm run dev
   ```

   ```

## Despliegue (Docker)

Esta aplicación está lista para ser desplegada como container utilizando Docker Compose.

1. Asegúrese de tener un archivo `.env` configurado en la raíz del proyecto.
2. Ejecute el siguiente comando para construir y levantar el servicio:

   ```bash
   docker-compose up -d --build
   ```

3. La aplicación estará disponible en `http://localhost:3000` (o expuesta para su Cloudflare Tunnel).

**Notas de Producción:**

- El `Dockerfile` utiliza una construcción _standalone_ para optimizar el tamaño de la imagen.
- `docker-compose.yml` expone el puerto 3000.
- `next.config.ts` ha sido configurado para permitir orígenes como `et.tashonduras.com`.

## Documentación Adicional

- [Manual de Instrucciones](INSTRUCTION_MANUAL.md): Guía de uso para Directores e Ingenieros.
- [Changelog](CHANGELOG.md): Historial de cambios y versiones.
