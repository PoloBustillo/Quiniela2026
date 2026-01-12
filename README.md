# 🏆 Quiniela Mundial 2026

Aplicación web moderna para gestionar quinielas del Mundial de Fútbol 2026 (USA, México, Canadá).

## ✨ Características

- ✅ **Tema Oscuro Sobrio** - Diseño elegante optimizado para la vista
- ✅ **Autenticación con Google** (NextAuth.js)
- 🎯 Sistema de predicciones de partidos
- 🏆 Tabla de posiciones en tiempo real
- ⚽ Gestión de resultados (admin)
- 💯 Sistema de puntos automático
- 📱 **Totalmente Responsive** - Optimizado para mobile
- 🎨 UI moderna con **shadcn/ui** y Tailwind CSS
- ⚡ Animaciones fluidas y transiciones suaves

## 🛠️ Tecnologías

- **Framework:** Next.js 14 (App Router)
- **Base de datos:** PostgreSQL
- **ORM:** Prisma
- **Autenticación:** NextAuth.js (Google OAuth)
- **UI Components:** shadcn/ui
- **Estilos:** Tailwind CSS
- **Icons:** Lucide React
- **TypeScript:** Para type safety

## 📋 Requisitos previos

- Node.js 18+ instalado
- PostgreSQL instalado y corriendo
- Cuenta de Google Cloud Platform (para OAuth)

## 🔧 Configuración

1. **Clonar e instalar dependencias:**

```bash
npm install
```

2. **Configurar variables de entorno:**
   Crea un archivo `.env` en la raíz del proyecto:

```env
# Database
DATABASE_URL="postgresql://usuario:password@localhost:5432/quiniela_mundial"

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="tu-secret-key-super-seguro-aqui"

# Google OAuth
GOOGLE_CLIENT_ID="tu-google-client-id"
GOOGLE_CLIENT_SECRET="tu-google-client-secret"
```

3. **Configurar Google OAuth:**

   - Ve a [Google Cloud Console](https://console.cloud.google.com)
   - Crea un nuevo proyecto
   - Habilita Google+ API
   - Crea credenciales OAuth 2.0
   - Agrega `http://localhost:3000/api/auth/callback/google` como URI de redirección autorizada

4. **Configurar la base de datos:**

```bash
npx prisma db push
npx prisma generate
```

5. **Ejecutar en desarrollo:**

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## 📊 Esquema de la Base de Datos

### Tablas principales:

- **User** - Usuarios registrados
- **Match** - Partidos del mundial
- **Prediction** - Predicciones de usuarios
- **Team** - Equipos participantes

## 🎮 Sistema de Puntos

- **5 puntos** - Resultado exacto (marcador correcto)
- **3 puntos** - Ganador correcto (sin marcador exacto)
- **1 punto** - Empate acertado
- **0 puntos** - Predicción incorrecta

## 🗂️ Estructura del Proyecto

```
├── app/
│   ├── api/
│   │   ├── auth/          # NextAuth endpoints
│   │   ├── matches/       # API de partidos
│   │   └── predictions/   # API de predicciones
│   ├── admin/             # Panel de administración
│   ├── leaderboard/       # Tabla de posiciones
│   └── page.tsx           # Página principal
├── components/            # Componentes React
├── lib/                   # Utilidades y configuración
├── prisma/
│   └── schema.prisma      # Esquema de base de datos
└── public/                # Archivos estáticos
```

## 👥 Roles de Usuario

- **Usuario regular:** Puede hacer predicciones y ver la tabla
- **Administrador:** Puede actualizar resultados de partidos

## 📝 Licencia

MIT

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor abre un issue primero para discutir los cambios.

---

Hecho con ⚽ para el Mundial 2026
