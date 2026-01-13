# 🚀 Despliegue en Vercel

Este proyecto está optimizado para desplegarse en Vercel con Prisma.

## ✅ Configuración Automática

El proyecto ya incluye:

1. **Script postinstall** en `package.json`:

   ```json
   "postinstall": "prisma generate"
   ```

   Esto genera automáticamente Prisma Client después de `npm install`

2. **Script build mejorado**:

   ```json
   "build": "prisma generate && next build"
   ```

   Asegura que Prisma Client esté actualizado en cada build

3. **Archivo vercel.json** con configuración óptima

## 📋 Pasos para Desplegar

### 1. Preparar Base de Datos

Obtén una base de datos PostgreSQL en la nube:

**Opción A: Neon (Recomendado)**

- Ve a [neon.tech](https://neon.tech)
- Crea una cuenta gratis
- Crea un nuevo proyecto
- Copia la connection string

**Opción B: Supabase**

- Ve a [supabase.com](https://supabase.com)
- Crea un proyecto
- Ve a Settings → Database
- Copia la connection string (pooler mode)

**Opción C: Railway**

- Ve a [railway.app](https://railway.app)
- Crea un proyecto con PostgreSQL
- Copia la connection string

### 2. Configurar Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com)
2. Crea un proyecto o selecciona uno existente
3. Habilita Google+ API
4. Ve a "Credenciales" → "Crear credenciales" → "ID de cliente OAuth 2.0"
5. **Importante:** Agrega estas URIs:
   - Origen autorizado: `https://tu-app.vercel.app`
   - URI de redirección: `https://tu-app.vercel.app/api/auth/callback/google`

### 3. Desplegar en Vercel

#### Opción A: Desde la UI de Vercel

1. Ve a [vercel.com](https://vercel.com) e inicia sesión con GitHub
2. Click en "New Project"
3. Importa tu repositorio
4. Configura las variables de entorno:

```env
DATABASE_URL=postgresql://usuario:password@host:5432/dbname
NEXTAUTH_URL=https://tu-app.vercel.app
NEXTAUTH_SECRET=genera-uno-con-openssl-rand-base64-32
GOOGLE_CLIENT_ID=tu-google-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=tu-google-client-secret
```

5. Click en "Deploy"

#### Opción B: Desde CLI

```bash
# 1. Instala Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Configura el proyecto
vercel

# 4. Agrega variables de entorno
vercel env add DATABASE_URL
vercel env add NEXTAUTH_URL
vercel env add NEXTAUTH_SECRET
vercel env add GOOGLE_CLIENT_ID
vercel env add GOOGLE_CLIENT_SECRET

# 5. Despliega
vercel --prod
```

### 4. Configurar Base de Datos en Producción

Después del primer deploy exitoso:

```bash
# Opción 1: Push del schema (para primera vez)
npx prisma db push --accept-data-loss

# Opción 2: Usar migraciones (recomendado para producción)
npx prisma migrate deploy
```

O usa Prisma Studio para verificar:

```bash
npx prisma studio
```

### 5. Verificar el Deploy

1. Visita tu URL de Vercel: `https://tu-app.vercel.app`
2. Intenta hacer login con Google
3. Verifica que la conexión a la base de datos funcione

## 🔧 Troubleshooting

### Error: "Prisma Client not generated"

**Causa:** Vercel cachea dependencias y no regenera Prisma Client

**Solución:** Ya está arreglado con:

- Script `postinstall` en package.json
- Script `build` actualizado
- Archivo vercel.json configurado

Si persiste:

1. Ve a Vercel Dashboard → Settings → General
2. Verifica que Build Command sea: `prisma generate && next build`
3. Limpia el cache: Settings → General → Clear Build Cache
4. Redespliega

### Error: "Can't reach database server"

**Solución:**

1. Verifica que DATABASE_URL sea correcta
2. Asegúrate que la base de datos acepte conexiones externas
3. Verifica el formato de la connection string:
   ```
   postgresql://USER:PASSWORD@HOST:PORT/DATABASE?sslmode=require
   ```
4. Para Neon/Supabase, usa la connection string con pooling

### Error: "OAuth redirect_uri_mismatch"

**Solución:**

1. Ve a Google Cloud Console
2. Actualiza las URIs autorizadas con tu URL de Vercel
3. Espera 5 minutos para que se propague
4. Prueba de nuevo

### Base de Datos Vacía

**Solución:**
Conecta a tu base de datos y ejecuta:

```bash
# Desde tu máquina local con la DATABASE_URL de producción
DATABASE_URL="tu-connection-string-produccion" npx prisma db push
```

## 📊 Monitoreo

### Logs en Vercel

- Dashboard → Tu Proyecto → Deployments
- Click en cualquier deployment → View Function Logs

### Métricas

- Dashboard → Tu Proyecto → Analytics
- Vercel Analytics (activar en Settings)

### Base de Datos

- Prisma Studio: `npx prisma studio`
- O usa la UI de Neon/Supabase/Railway

## 🔄 Redeployar

### Automático (Recomendado)

Cada push a la rama `main` desplegará automáticamente

### Manual

```bash
vercel --prod
```

### Desde Vercel UI

Dashboard → Tu Proyecto → Deployments → Redeploy

## 🎯 Configuración Avanzada

### Variables de Entorno por Ambiente

```bash
# Production
vercel env add DATABASE_URL production

# Preview (ramas)
vercel env add DATABASE_URL preview

# Development (local)
vercel env add DATABASE_URL development
```

### Custom Domain

1. Vercel Dashboard → Settings → Domains
2. Agrega tu dominio
3. Actualiza Google OAuth con el nuevo dominio
4. Actualiza NEXTAUTH_URL

### Edge Functions (Opcional)

Para mejor rendimiento, considera usar Edge Functions:

```javascript
// app/api/route.ts
export const runtime = "edge";
```

## 📚 Recursos

- [Vercel Docs](https://vercel.com/docs)
- [Prisma + Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)
- [NextAuth.js Deployment](https://next-auth.js.org/deployment)

---

¿Problemas? Revisa los [logs en Vercel](https://vercel.com/docs/concepts/observability/logs-overview) 📝
