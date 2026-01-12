# 🚀 Guía de Configuración Rápida

## Paso 1: Instalar PostgreSQL

Si aún no tienes PostgreSQL instalado:

- Descarga desde: https://www.postgresql.org/download/
- Instala y recuerda la contraseña que estableces
- Por defecto usa el puerto 5432

## Paso 2: Crear la Base de Datos

Abre pgAdmin o psql y ejecuta:

```sql
CREATE DATABASE quiniela_mundial;
```

O desde la línea de comandos:

```bash
psql -U postgres
CREATE DATABASE quiniela_mundial;
\q
```

## Paso 3: Configurar Variables de Entorno

Edita el archivo `.env` en la raíz del proyecto:

```env
# Actualiza esto con tu información de PostgreSQL
DATABASE_URL="postgresql://postgres:tu_password@localhost:5432/quiniela_mundial"

# Genera un secreto seguro (puedes usar el comando de abajo)
NEXTAUTH_SECRET="genera-un-secreto-aqui"

# URL de la aplicación
NEXTAUTH_URL="http://localhost:3000"

# Credenciales de Google OAuth (configura después)
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
```

### Generar NEXTAUTH_SECRET:

```bash
# En PowerShell
[Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes((New-Guid).ToString()))

# O en línea de comandos Unix
openssl rand -base64 32
```

## Paso 4: Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un nuevo proyecto o selecciona uno existente
3. Habilita **Google+ API**
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. Tipo de aplicación: **Aplicación web**
6. Agrega estas URIs autorizadas:
   - **Orígenes autorizados:** `http://localhost:3000`
   - **URIs de redirección:** `http://localhost:3000/api/auth/callback/google`
7. Copia el **Client ID** y **Client Secret** al archivo `.env`

## Paso 5: Configurar la Base de Datos

Ejecuta las migraciones de Prisma:

```bash
npx prisma db push
```

Esto creará todas las tablas necesarias en tu base de datos.

## Paso 6: (Opcional) Ver la Base de Datos

Puedes abrir Prisma Studio para ver y editar los datos:

```bash
npm run db:studio
```

## Paso 7: Iniciar la Aplicación

```bash
npm run dev
```

Abre tu navegador en: http://localhost:3000

## 🎮 Primeros Pasos Después de Instalar

1. **Inicia sesión con Google** - La primera vez que inicies sesión se creará tu usuario
2. **Hacer Admin a un usuario:**

   - Abre Prisma Studio: `npm run db:studio`
   - Ve a la tabla `User`
   - Encuentra tu usuario y cambia `role` de `USER` a `ADMIN`
   - Guarda los cambios

3. **Agregar Equipos y Partidos** (como Admin):
   - Una vez que seas admin, ve a `/admin`
   - Agrega los equipos participantes
   - Crea los partidos del mundial

## 📋 Scripts Disponibles

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Construye la aplicación para producción
npm run start        # Inicia la aplicación en producción
npm run lint         # Ejecuta el linter
npm run db:push      # Sincroniza el esquema con la BD
npm run db:studio    # Abre Prisma Studio
npm run db:generate  # Genera el cliente de Prisma
```

## 🔧 Solución de Problemas

### Error de conexión a PostgreSQL

- Verifica que PostgreSQL esté corriendo
- Verifica el usuario, contraseña y nombre de la base de datos en `.env`
- Prueba la conexión con: `psql -U postgres -d quiniela_mundial`

### Error de NextAuth

- Asegúrate de haber configurado `NEXTAUTH_SECRET`
- Verifica que las credenciales de Google estén correctas
- Verifica las URIs de redirección en Google Cloud Console

### Errores de TypeScript

- Ejecuta: `npm run db:generate` para regenerar el cliente de Prisma
- Reinicia VS Code si es necesario

## 🌐 Despliegue a Producción

Cuando estés listo para desplegar:

1. **Base de Datos:** Usa un servicio como:

   - [Neon](https://neon.tech) (PostgreSQL gratis)
   - [Supabase](https://supabase.com) (PostgreSQL gratis)
   - [Railway](https://railway.app)

2. **Aplicación:** Despliega en:

   - [Vercel](https://vercel.com) (Recomendado para Next.js)
   - [Netlify](https://netlify.com)
   - [Railway](https://railway.app)

3. **Configura variables de entorno** en tu plataforma de despliegue

## 📞 Ayuda

Si tienes problemas, revisa:

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de NextAuth.js](https://next-auth.js.org)

---

¡Buena suerte con tu quiniela del Mundial 2026! ⚽🏆
