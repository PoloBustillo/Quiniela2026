# 🎉 Datos del Mundial 2026 - Completado

## ✅ Archivos Creados

### 📊 Datos JSON

1. **`data/teams.json`** - 48 equipos con información completa
2. **`data/matches.json`** - 24 partidos de la primera ronda + estructura de grupos
3. **`data/stadiums.json`** - 16 estadios sede con capacidad y zona horaria
4. **`data/README.md`** - Documentación completa de los datos

### 🏴 Banderas

- **48 banderas descargadas** en formato PNG (320px ancho)
- Ubicación: `public/flags/*.png`
- Fuente: [flagcdn.com](https://flagcdn.com)
- Script de descarga: `scripts/download-flags.js`

### 🎨 Componentes React

1. **`components/MatchCard.tsx`** - Componente para mostrar un partido

   - Muestra banderas de ambos equipos
   - Información de fecha, hora, estadio
   - Grupo y número de partido

2. **`app/matches/page.tsx`** - Página de calendario completo
   - Agrupa partidos por fecha
   - Grid responsive (1/2/3 columnas)
   - Navegación sticky por fecha

### 🔗 Navegación Actualizada

- Agregado link "Partidos" en el menú principal
- Ícono de calendario
- Agregado en página de inicio como acción rápida

## 📋 Estructura de Grupos (48 equipos en 8 grupos)

| Grupo | Equipos                                                           |
| ----- | ----------------------------------------------------------------- |
| **A** | México, Ecuador, Italia, Senegal, Japón, Panamá                   |
| **B** | Estados Unidos, Perú, Bélgica, Marruecos, Corea del Sur, Honduras |
| **C** | Canadá, Francia, Croacia, Nigeria, Irán, Nueva Zelanda            |
| **D** | Argentina, España, Dinamarca, Túnez, Australia, Paraguay          |
| **E** | Brasil, Alemania, Suiza, Camerún, Arabia Saudita, Gales           |
| **F** | Uruguay, Inglaterra, Polonia, Ghana, Qatar, Serbia                |
| **G** | Colombia, Portugal, Suecia, Costa de Marfil, Costa Rica, Islandia |
| **H** | Chile, Países Bajos, Ucrania, Egipto, Jamaica, TBD                |

## 🏟️ Estadios Sede

### 🇲🇽 México (3 estadios)

- **Estadio Azteca** (Ciudad de México) - 87,523
- **Estadio BBVA** (Monterrey) - 53,500
- **Estadio Akron** (Guadalajara) - 46,232

### 🇺🇸 Estados Unidos (11 estadios)

- **MetLife Stadium** (Nueva York) - 82,500
- **AT&T Stadium** (Dallas) - 80,000
- **Arrowhead Stadium** (Kansas City) - 76,416
- **NRG Stadium** (Houston) - 72,220
- **Mercedes-Benz Stadium** (Atlanta) - 71,000
- **SoFi Stadium** (Los Ángeles) - 70,240
- **Lincoln Financial Field** (Filadelfia) - 69,796
- **Lumen Field** (Seattle) - 69,000
- **Levi's Stadium** (San Francisco) - 68,500
- **Hard Rock Stadium** (Miami) - 67,518
- **Gillette Stadium** (Boston) - 65,878

### 🇨🇦 Canadá (2 estadios)

- **BC Place** (Vancouver) - 54,500
- **BMO Field** (Toronto) - 45,500

## 🗓️ Calendario

### Primera Ronda (24 partidos)

- **Fecha inicio:** 11 de junio 2026
- **Partido inaugural:** México vs Panamá (Estadio Azteca)
- **Duración:** 11-19 de junio 2026

### Formato del Torneo

- **Fase de Grupos:** 6 equipos por grupo, todos juegan entre sí
- **Clasifican:** Top 2 o 3 de cada grupo (32 equipos a eliminación directa)
- **Total de partidos:** 104 partidos en todo el mundial

## 🎯 Uso en la Aplicación

### Ver todos los partidos

```bash
npm run dev
# Navega a http://localhost:3000/matches
```

### Descargar/actualizar banderas

```bash
npm run download:flags
```

### Importar datos en tu código

```typescript
import teamsData from "@/data/teams.json";
import matchesData from "@/data/matches.json";
import stadiumsData from "@/data/stadiums.json";

const teams = teamsData.teams;
const matches = matchesData.matches;
const groups = matchesData.groups;
const stadiums = stadiumsData.stadiums;
```

## 🚀 Próximos Pasos

1. **Fase de Grupos Completa**

   - Agregar las rondas 2 y 3 de cada grupo
   - Total: 72 partidos en fase de grupos

2. **Fase Eliminatoria**

   - Octavos de final (16 partidos)
   - Cuartos de final (8 partidos)
   - Semifinales (4 partidos)
   - Tercer lugar y Final (2 partidos)

3. **Sistema de Predicciones**

   - Formulario para hacer predicciones
   - Guardar en base de datos
   - Cálculo automático de puntos

4. **Actualización de Resultados**
   - Panel de admin para ingresar resultados
   - Actualización automática de tabla de posiciones
   - Notificaciones de cambios

## 📦 Archivos Generados

```
QUINIELA/
├── data/
│   ├── teams.json (48 equipos)
│   ├── matches.json (24 partidos + grupos)
│   ├── stadiums.json (16 estadios)
│   └── README.md
├── public/
│   └── flags/ (48 banderas PNG)
├── scripts/
│   └── download-flags.js
├── components/
│   └── MatchCard.tsx
└── app/
    └── matches/
        └── page.tsx
```

## ✨ Features Implementadas

- ✅ Datos completos de equipos con banderas
- ✅ Calendario de partidos con fecha/hora/estadio
- ✅ Información de 16 estadios sede
- ✅ Componente visual para mostrar partidos
- ✅ Página de calendario agrupada por fecha
- ✅ Navegación actualizada
- ✅ Descarga automática de banderas
- ✅ Responsive design (mobile/tablet/desktop)
- ✅ Dark theme integrado

---

**¡Todo listo para empezar a hacer predicciones!** ⚽🏆
