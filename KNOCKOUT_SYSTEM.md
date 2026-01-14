# Sistema de Administración de Fases Eliminatorias

## 📋 Resumen

Se ha implementado un sistema completo para que el administrador pueda gestionar las fases eliminatorias del Mundial 2026 (32avos, 16avos, octavos, cuartos, semifinales, tercer lugar y final).

## 🎯 Características Implementadas

### 1. **Nuevo Enum en Prisma Schema**

- ✅ Agregado `ROUND_OF_32` al enum `MatchPhase`
- ✅ Migración aplicada exitosamente a la base de datos

### 2. **APIs de Administración**

#### `/api/admin/matches`

Endpoint para gestionar partidos eliminatorios:

- **GET**: Obtener partidos (filtrable por fase)
- **POST**: Crear nuevo partido
- **PUT**: Actualizar equipos y resultados

#### `/api/admin/teams`

Endpoint para obtener equipos disponibles:

- **GET**: Listar todos los equipos
- **POST**: Crear nuevo equipo (futuro)

### 3. **Componente `KnockoutMatchManager`**

Interfaz completa de administración que permite:

- ✅ **Selector de Fase**: Cambiar entre todas las fases eliminatorias
- ✅ **Crear Partidos**: Agregar nuevos partidos con equipos TBD iniciales
- ✅ **Asignar Equipos**: Seleccionar equipos de dropdowns con banderas
- ✅ **Ingresar Resultados**: Actualizar marcadores cuando el partido termina
- ✅ **Estados de Partido**: Indicador visual de pendiente/finalizado
- ✅ **Responsive**: Funciona en móvil y desktop

### 4. **Equipo TBD (Por Definir)**

- ✅ Creado equipo especial con código `TBD`
- ✅ Bandera placeholder en `/flags/tbd.png`
- ✅ Se usa como valor por defecto para partidos sin equipos asignados

### 5. **Página de Admin Actualizada**

- ✅ Reemplazadas las cards de "Próximamente" con el gestor funcional
- ✅ Acceso solo para usuarios con rol `ADMIN`

## 📂 Archivos Creados/Modificados

### Nuevos Archivos

```
app/api/admin/matches/route.ts          # API de gestión de partidos
app/api/admin/teams/route.ts            # API de consulta de equipos
components/admin/KnockoutMatchManager.tsx  # Interfaz de administración
components/ui/select.tsx                 # Componente Select de shadcn/ui
prisma/seed-tbd.js                      # Script para crear equipo TBD
prisma/migrations/20260113213557_add_round_of_32/  # Migración DB
```

### Archivos Modificados

```
prisma/schema.prisma                    # Agregado ROUND_OF_32
app/admin/page.tsx                      # Integrado KnockoutMatchManager
```

## 🚀 Cómo Usar

### Como Administrador:

1. **Acceder al Panel**

   - Navegar a `/admin` (solo disponible para admins)
   - Verás el gestor de fases eliminatorias

2. **Crear un Partido**

   - Seleccionar la fase deseada (ej: "16avos de Final")
   - Clic en "Agregar Partido"
   - Se crea un partido con ambos equipos como "Por Definir"

3. **Asignar Equipos**

   - Una vez se conozcan los equipos clasificados
   - Usar los dropdowns para seleccionar equipo local y visitante
   - Los cambios se guardan automáticamente

4. **Registrar Resultados**
   - Cuando el partido finalice
   - Ingresar marcadores en los campos numéricos
   - Clic en "Guardar"
   - El partido cambia a estado "Finalizado"

### Para Usuarios (Próximo):

Los usuarios verán estos partidos en la página principal:

- Si el equipo es "TBD", se mostrará como "Por Definir"
- Si ya están asignados, verán las banderas y nombres reales
- Podrán hacer predicciones solo si ambos equipos están definidos

## 🎨 UI/UX

### Desktop

```
┌─────────────────────────────────────┐
│ Panel de Administración       [Admin]│
├─────────────────────────────────────┤
│ 🏆 Fases Eliminatorias              │
│                    [Selector: ▼]    │
│                                     │
│ [+ Agregar Partido]                 │
│                                     │
│ ┌─ 16avos de Final ─ [Pendiente] ─┐│
│ │ 📅 Lunes, 1 de julio de 2026    ││
│ │                                  ││
│ │ Equipo Local:   [Brasil ▼]      ││
│ │ Equipo Visitante: [Argentina ▼] ││
│ │                                  ││
│ │ Resultado Final:                 ││
│ │ [2] - [1]  [💾 Guardar]         ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

### Móvil

```
┌───────────────────┐
│ 🏆 Fases Elim...│
│   [Selector ▼]  │
├───────────────────┤
│ [+ Agregar]     │
│                 │
│ ┌─ 16avos ─┐   │
│ │ [Pendie]  │   │
│ │ Brasil ▼  │   │
│ │ Argent ▼  │   │
│ │ [2] - [1] │   │
│ └───────────┘   │
└───────────────────┘
```

## 🔐 Seguridad

- ✅ Solo usuarios autenticados pueden acceder
- ✅ Solo rol `ADMIN` puede modificar datos
- ✅ Validación de sesión en todas las APIs
- ✅ Retorna 401/403 para accesos no autorizados

## 📊 Base de Datos

### Tabla: Match

```sql
- id: String (UUID)
- homeTeamId: String (FK → Team)
- awayTeamId: String (FK → Team)
- homeScore: Int (nullable)
- awayScore: Int (nullable)
- matchDate: DateTime
- stadium: String
- city: String
- phase: MatchPhase enum
- status: MatchStatus enum
```

### Enum: MatchPhase

```
- GROUP_STAGE
- ROUND_OF_32    ← NUEVO
- ROUND_OF_16
- QUARTER_FINAL
- SEMI_FINAL
- THIRD_PLACE
- FINAL
```

## 🎯 Próximos Pasos

1. **Mostrar partidos eliminatorios en homepage**

   - Agregar tabs para "Fase de Grupos" y "Eliminatorias"
   - Mostrar "TBD" cuando equipos no estén definidos
   - Permitir predicciones solo si ambos equipos están confirmados

2. **Automatización de clasificación**

   - Script para calcular clasificados de fase de grupos
   - Auto-asignar equipos a partidos de 16avos según tabla

3. **Notificaciones**

   - Alertar a usuarios cuando se definan nuevos partidos
   - Notificar cuando se abran predicciones de eliminatorias

4. **Histórico**
   - Ver quién predijo correctamente resultados de fases anteriores
   - Estadísticas especiales para eliminatorias

## ✅ Estado Actual

- ✅ Base de datos actualizada con ROUND_OF_32
- ✅ Equipo TBD creado
- ✅ APIs de administración funcionales
- ✅ Interfaz de admin completa y responsive
- ✅ Sistema de permisos implementado
- ⏳ Integración con predicciones de usuarios (pendiente)
- ⏳ Visualización de partidos TBD en homepage (pendiente)
