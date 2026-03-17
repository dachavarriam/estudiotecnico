# Configuración de Slack App para Login

Para permitir que los usuarios inicien sesión con Slack, sigue estos pasos:

1.  Ve a [api.slack.com/apps](https://api.slack.com/apps) y crea una nueva App ("Create New App" -> "From Scratch").
2.  Nombra la App (ej. "Estudios Técnicos Auth") y selecciona tu Workspace.

## 1. Configurar OAuth & Permissions

En el menú lateral, ve a **OAuth & Permissions**.

### Redirect URLs

Añade la siguiente URL (para desarrollo local):

- `http://localhost:3000/api/auth/callback/slack`

_Nota: Cuando subas esto a producción (Vercel, etc.), deberás agregar esa URL también._

### Scopes (User Token Scopes)

Baja a la sección **Scopes** -> **User Token Scopes** y añade los siguientes permisos:

- `identity.basic`: Para ver información básica del usuario.
- `identity.email`: Para ver el email (crucial para emparejar con Odoo).
- `identity.avatar`: Para mostrar la foto de perfil.

## 2. Obtener Credenciales

Sube al principio de la página **OAuth & Permissions** (o ve a **Basic Information**).
Copia los siguientes valores:

- **Client ID**
- **Client Secret**

## 3. Configurar Variables de Entorno

Abre el archivo `.env` en tu proyecto y añade/actualiza estas líneas:

```env
AUTH_SLACK_ID=tu_client_id_aqui
AUTH_SLACK_SECRET=tu_client_secret_aqui
AUTH_SECRET=genera_un_string_random_aqui_openssl_rand_base64_32
```

> Tip: Puedes generar un `AUTH_SECRET` seguro ejecutando `openssl rand -base64 32` en tu terminal.

¡Listo! Con esto configurado, procederé a crear el código para que el login funcione al final.
