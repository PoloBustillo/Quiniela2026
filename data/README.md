# 📊 Datos del Mundial 2026

Esta carpeta contiene todos los datos estructurados del Mundial 2026.

## Archivos JSON

### `teams.json`

Contiene información de los 48 equipos participantes:

- ID único del equipo
- Nombre completo
- Grupo asignado
- Confederación
- Ruta a la bandera

**Ejemplo:**

```json
{
  "id": "MEX",
  "name": "México",
  "group": "A",
  "confederation": "CONCACAF",
  "flag": "/flags/mex.png"
}
```

### `matches.json`

Contiene el calendario de partidos de la fase de grupos (72 partidos):

- ID único del partido
- Número de partido
- Fecha y hora (formato ISO 8601)
- Estadio, ciudad y país
- Grupo
- Equipos local y visitante
- Fase del torneo
- Ronda

**Ejemplo:**

```json
{
  "id": 1,
  "matchNumber": 1,
  "date": "2026-06-11 13:00:00-06",
  "stadium": "Estadio Azteca",
  "city": "Ciudad de México",
  "country": "México",
  "group": "A",
  "homeTeam": "MEX",
  "awayTeam": "PAN",
  "phase": "GROUP_STAGE",
  "round": 1
}
```

### `stadiums.json`

Información de los 16 estadios sede:

- ID del estadio
- Nombre completo
- Ciudad y país
- Capacidad
- Zona horaria

**Ejemplo:**

```json
{
  "id": "azteca",
  "name": "Estadio Azteca",
  "city": "Ciudad de México",
  "country": "México",
  "capacity": 87523,
  "timezone": "America/Mexico_City"
}
```

## Grupos

El Mundial 2026 tiene **12 grupos (A-L)** con **4 equipos** cada uno:

- Grupos A-L con 4 equipos por grupo.
- Los equipos TBD se actualizan conforme se definan clasificados/playoffs.

## Banderas

Las banderas se descargan automáticamente de [flagcdn.com](https://flagcdn.com) y se guardan en:

```
public/flags/
```

Para descargar/actualizar las banderas:

```bash
node scripts/download-flags.js
```

## Formato de Fechas

Las fechas de `matches.json` usan hora de Ciudad de Mexico con offset:

```
2026-06-11 13:00:00-06
```

Para convertir a hora local en tu código:

```javascript
const matchDate = new Date(match.date);
const localTime = matchDate.toLocaleString("es-MX", {
  timeZone: stadium.timezone,
});
```

## Confederaciones

- **UEFA:** Europa (16 equipos)
- **CONMEBOL:** Sudamérica (6 equipos)
- **CONCACAF:** Norte y Centroamérica (6 equipos, incluye anfitriones)
- **CAF:** África (8 equipos)
- **AFC:** Asia (8 equipos)
- **OFC:** Oceanía (1 equipo)

## Notas

- Los datos de la fase eliminatoria se agregarán después de que termine la fase de grupos
- Las fechas y horarios pueden estar sujetos a cambios por la FIFA
- Algunos equipos aún están por definirse (clasificatorias en curso)

## Uso en la Aplicación

```typescript
import teamsData from "@/data/teams.json";
import matchesData from "@/data/matches.json";
import stadiumsData from "@/data/stadiums.json";

// Acceder a los datos
const teams = teamsData.teams;
const matches = matchesData.matches;
const groups = matchesData.groups;
const stadiums = stadiumsData.stadiums;
```
