# Auditoría de Bugs, Áreas de Oportunidad y UI/UX

Fecha: 2026-05-31  
Alcance: revisión estática de código, documentación existente, rutas API, componentes principales y validación local con tests/typecheck.  
Objetivo: detectar riesgos antes del Mundial 2026 y priorizar trabajo práctico.

## Resumen ejecutivo

El producto ya tiene una base sólida: autenticación server-side, bloqueo de predicciones en backend, segmentación por torneos, sanitización de predicciones ajenas antes del kickoff, cron externo para BSD y panel admin funcional.

Los riesgos principales están en cuatro zonas:

1. **Puntos de eliminatorias por BSD**: el sync automático puede actualizar marcador/status pero no recalcular puntos por un mismatch de `matchId`.
2. **Fechas en cliente**: varios componentes usan `new Date(match.date)` sobre strings tipo `2026-06-11 13:00:00-06`; backend ya tiene parser seguro, UI no.
3. **Validación de APIs**: algunas rutas confían en el cliente para rangos/enteros y pueden aceptar payloads inválidos.
4. **UX móvil y admin**: flujo de predicción funciona, pero puede generar demasiados fetches, refreshes completos, errores tardíos de cuota y controles compactos poco claros.

## Validación ejecutada

| Comando | Resultado | Nota |
|---|---:|---|
| `npm test` | Pasa | 29 tests unitarios en `tests/unit/points.test.ts` |
| `npx tsc --noEmit` | Falla | Errores en `components/LeaderboardRaceChart.tsx` y dependencia/tipos D3 no instalados localmente |
| `npm ls d3 @types/d3` | `(empty)` | `package.json` declara deps, pero entorno local no las tiene instaladas |

## Bugs funcionales

### P0 — BSD sync de eliminatorias no recalcula puntos

**Archivo:** `lib/bsd-sync.ts`  
**Zona:** `recalcKnockoutMatchPredictions(matchDbId, ...)`

**Qué pasa**

Las predicciones de eliminatorias se guardan como `match_<Match.id>`, por ejemplo `match_clx...`. El helper de BSD busca predicciones con:

```ts
where: { matchId: matchDbId }
```

Eso omite el prefijo `match_`. Resultado: `syncKnockoutMatch()` y `forceSyncKnockoutMatch()` pueden actualizar marcador/status, pero no actualizar puntos de usuarios.

**Impacto**

- Tabla de posiciones queda incorrecta después de sync automático BSD en eliminatorias.
- Admin puede ver marcador actualizado y asumir que puntos también se recalcularon.
- Riesgo alto durante partidos de eliminación directa, donde el tráfico y presión serán mayores.

**Fix recomendado**

- Cambiar lookup a `match_${matchDbId}`.
- Añadir fallback legacy `match_1000+` igual que `app/api/admin/matches/route.ts`.
- Agregar test unit/integration para `syncKnockoutMatch` con predicción estable.

---

### P0 — Fechas no ISO en cliente pueden romper agrupación, orden y bloqueo visual

**Archivos afectados:**

- `components/PredictionCard.tsx`
- `components/ClientHomePage.tsx`
- `components/MatchCard.tsx`
- `components/MatchDetailTabs.tsx`
- `app/matches/page.tsx`
- `components/admin/AllMatchesManager.tsx`
- `app/page_new.tsx`

**Qué pasa**

`data/matches.json` usa strings como:

```text
2026-06-11 13:00:00-06
```

Backend usa `parseMatchDate()` para convertir a ISO válido. UI usa `new Date(match.date)` directamente en muchos lugares. Ese formato no es ISO estándar en todos los runtimes/browsers.

**Impacto**

- En Safari/iOS puede producir `Invalid Date`.
- `isPast` en `PredictionCard` puede fallar si `matchDate.getTime()` es `NaN`.
- Agrupación por fecha puede mostrar `Invalid Date` o agrupar mal.
- Orden de fechas puede quedar inestable (`NaN` en sort).
- Admin puede filtrar días incorrectos.

**Fix recomendado**

- Exportar y usar un helper único para cliente/servidor, por ejemplo `parseMatchDateSafe(dateString)`.
- Normalizar fechas enviadas desde server a ISO (`toISOString()`) antes de llegar a client components.
- Añadir tests para parseo en browser-like environment.

---

### P1 — API de predicciones acepta números fuera de rango o no enteros

**Archivo:** `app/api/predictions/route.ts`

**Qué pasa**

La ruta valida solo `typeof homeScore === "number"`. El cliente limita 0–20, pero una llamada directa puede enviar:

- `-1`
- `99`
- `1.5`

**Impacto**

- Predicciones imposibles guardadas en DB.
- Prisma `Int` puede aceptar enteros negativos/grandes; floats pueden fallar con 500.
- Scoring y UI quedan inconsistentes.

**Fix recomendado**

Validar en servidor:

```ts
Number.isInteger(homeScore) && homeScore >= 0 && homeScore <= 20
```

Aplicar igual a `awayScore`. Agregar test API para negativos, floats y valores >20.

---

### P1 — Typecheck falla en gráfica de leaderboard

**Archivo:** `components/LeaderboardRaceChart.tsx`

**Qué pasa**

`npx tsc --noEmit` falla con errores de D3:

- `Cannot find module 'd3' or its corresponding type declarations`
- parámetros implícitos `any`
- `this` implícito `any` en tween

**Impacto**

- Riesgo de build fallido si el entorno de deploy no instala deps correctamente.
- Pérdida de seguridad de tipos en componente complejo.

**Fix recomendado**

- Reinstalar deps (`npm install` o definir package manager único con lock consistente).
- Tipar callbacks D3 y evitar `as any` donde sea posible.
- Considerar separar lógica D3 en helper pequeño y testear shape de frames.

---

### P1 — Cron queda público si `CRON_SECRET` falta

**Archivo:** `app/api/cron/sync-bsd/route.ts`

**Qué pasa**

La ruta solo exige `Authorization` si `process.env.CRON_SECRET` existe.

**Impacto**

- Si Vercel queda sin `CRON_SECRET`, cualquiera puede disparar `/api/cron/sync-bsd`.
- No expone datos sensibles directamente, pero genera carga, logs y llamadas BSD.

**Fix recomendado**

- En producción, fallar cerrado si falta `CRON_SECRET`.
- Permitir modo abierto solo en `NODE_ENV !== "production"`, si se desea.

---

### P1 — Reglas visibles dicen grupos A–H, pero Mundial 2026 usa A–L

**Archivo:** `app/rules/page.tsx`

**Qué pasa**

La sección de inscripción dice `Partidos del grupo A al H`. El JSON tiene grupos A–L.

**Impacto**

- Confusión de usuarios.
- Puede parecer que faltan grupos o que cuota de fase de grupos cubre menos partidos.

**Fix recomendado**

Cambiar a `Partidos del grupo A al L`.

---

### P1 — Admin de reglas de puntos no valida payload

**Archivo:** `app/api/admin/points-rules/route.ts`

**Qué pasa**

`PUT` acepta `exactScore`, `correctWinner`, `correctDraw` sin validar tipo, entero ni rango.

**Impacto**

- Puede guardar reglas negativas o inválidas si se llama directo al endpoint.
- Si falla Prisma, admin recibe 500 genérico.

**Fix recomendado**

- Validar enteros `>= 0`.
- Limitar rango razonable, por ejemplo 0–20.
- Responder 400 con mensaje claro.

---

### P2 — Modelo conserva `correctGoalDifference`, pero app no lo usa

**Archivos:**

- `prisma/schema.prisma`
- `lib/points.ts`
- `components/admin/PointsRulesManager.tsx`
- `AI_CONTEXT.md`

**Qué pasa**

`PointsRule` tiene `correctGoalDifference Int @default(2)`, pero la lógica actual no otorga puntos por diferencia de goles. El admin tampoco permite editarlo. Además, el contexto decía que existía regla de 2 puntos por diferencia.

**Impacto**

- Confusión para futuros cambios.
- Riesgo de que alguien active docs/reglas incorrectas.

**Fix recomendado**

- Decidir producto: eliminar/deprecar campo o implementar regla.
- Actualizar docs para declarar que hoy no hay bono por diferencia.

---

### P2 — Página `/settings` es placeholder

**Archivo:** `app/settings/page.tsx`

**Qué pasa**

Existe página con `Settings page coming soon`, pero no aporta función.

**Impacto**

- Si usuario llega por URL directa, parece app incompleta.

**Fix recomendado**

- Ocultarla, redirigir a home o convertirla en perfil/preferencias reales.

## Áreas de oportunidad técnica

### 1. Centralizar IDs de partidos

Hay normalización `match_1000+` → `match_<cuid>` duplicada en varias rutas. Funciona, pero aumenta riesgo.

**Mejora**

Crear helper compartido:

- `normalizePredictionMatchId()`
- `getPredictionMatchIdsForDbMatch()`
- `getLegacyKnockoutMatchId()`

Usarlo en API, leaderboard, compare, scripts y BSD sync.

### 2. Centralizar fechas

Ya existe `parseMatchDate()`, pero UI no lo usa. Las fechas son una fuente de bugs crítica por horario CDMX/UTC.

**Mejora**

Crear módulo `lib/match-dates.ts` con:

- parse de formato JSON
- formato CDMX
- conversión para inputs admin
- guardas contra `Invalid Date`

### 3. Reducir N fetches de `/api/server-time`

`PredictionCard` pide server time en cada card. Con 104 partidos, puede generar 104 requests al montar.

**Mejora**

- Fetch una vez en `ClientHomePage`.
- Pasar `serverNow` o `serverOffset` como prop.
- Revalidar cada minuto con un timer global si hace falta.

### 4. Evitar refresh completo después de cada predicción

`handleSave()` hace `router.refresh()` en cada guardado.

**Mejora**

- Optimistic update local.
- Mostrar estado guardado sin refrescar todo.
- Refrescar datos agregados solo cuando el usuario cambie de vista o después de un debounce.

### 5. Package manager claro

Repo tiene `bun.lockb`, pero scripts usan `npm`. Localmente `npm ls d3 @types/d3` aparece vacío.

**Mejora**

- Elegir `npm` o `bun` para deploy/dev.
- Añadir lock correspondiente (`package-lock.json` si npm).
- Documentar comando oficial en README/AI context.

## Análisis UI/UX

### Predicciones

**Lo bueno**

- Vista compacta móvil prioriza lista rápida.
- Inputs numéricos directos son mejores que steppers pequeños en móvil.
- Estado guardado cambia borde/color.
- Hay bloqueo visual después del kickoff y backend valida de verdad.

**Problemas**

- Usuario sin cuota puede editar y solo descubre el bloqueo al guardar.
- Botón compacto usa símbolos `↑`, `✓`, `🔒` sin `aria-label`; no queda claro para todos.
- No hay resumen de progreso por torneo: cuántos partidos predichos/faltantes.
- Guardar partido por partido puede sentirse lento si hay muchos partidos.
- Error por cuota aparece en tarjeta específica, no guía al usuario a pagar/contactar admin.

**Recomendaciones**

- Mostrar banner por fase: `Cuota pendiente: puedes ver partidos, pero no guardar predicciones`.
- Añadir contador: `12/72 predicciones guardadas` por fase.
- Cambiar `↑` por icono de guardar/subir con `aria-label="Guardar predicción"`.
- Agrupar guardado o autosave con debounce.
- Añadir filtro rápido: `Faltantes`, `Guardadas`, `Cerradas`, `Hoy`.

### Leaderboard

**Lo bueno**

- Segmentación por torneos clara.
- Badges de cuota ayudan a transparencia.
- Expansión multiusuario ya está resuelta.
- Scores ajenos se ocultan server-side antes del kickoff.

**Problemas**

- `Grafica` debería ser `Gráfica`.
- Chart usa fondo claro hard-coded dentro de app dark.
- Chart D3 es denso para móvil y tiene controles pequeños.
- En `Todo`, usuarios sin cuota aparecen junto a pagados; es intencional para visibilidad, pero puede confundirse con ranking competitivo real.

**Recomendaciones**

- Mantener `Todo` como vista global, pero añadir microcopy compacto: `Incluye usuarios con cuotas pendientes`.
- En tabs T1/T2/T3, ordenar o destacar primero usuarios con cuota cubierta.
- Dar alternativa tabular a la gráfica si D3 falla/no carga.
- Ajustar chart a tema dark o usar tokens CSS.

### Admin

**Lo bueno**

- Unifica grupos, eliminatorias, usuarios, reglas y BSD.
- Manual override protege datos del admin.
- Sync BSD es best-effort y no rompe flujo manual.

**Problemas**

- Hay muchos `console.log` y `@ts-ignore` en rutas/componentes admin.
- Uso de `alert()`/`confirm()` en admin se siente tosco y poco consistente.
- `getValidDate()` en admin vuelve a `new Date()` si una fecha es inválida; eso puede ocultar errores visuales.
- Reset de puntos es acción destructiva lógica y necesita UX de confirmación fuerte.

**Recomendaciones**

- Usar toasts no bloqueantes para éxito/error.
- Confirm dialogs propios para acciones destructivas.
- Mostrar `manualOverride`, `syncSource`, `lastSyncedAt` con estados claros por partido.
- Reemplazar `@ts-ignore` con tipos de sesión (`types/next-auth.d.ts`).

### Navegación y layout

**Lo bueno**

- Bottom nav móvil ya mejora alcance con pulgar.
- Desktop nav clara.
- Sesión/avatar visible.

**Problemas**

- `RootLayout` tiene `pb-20` y `Navigation` agrega spacer `h-14`; puede duplicar espacio inferior en móvil.
- Si admin entra en móvil, bottom nav puede tener 5 items y quedar apretado.
- `/settings` no está en nav pero existe.

**Recomendaciones**

- Dejar un solo mecanismo de bottom padding.
- En móvil admin, mover Admin a menú/avatar si 5 tabs saturan.
- Quitar o completar Settings.

### Accesibilidad

**Problemas**

- Botones icon-only compactos sin `aria-label`.
- Estados por color (`saved`, cuotas, puntos) necesitan texto accesible consistente.
- Emojis en estados pueden ser ambiguos para lectores de pantalla.
- Controles D3 no tienen descripción del estado actual de jornada para screen readers.

**Recomendaciones**

- Añadir `aria-label` a guardar, lock, stepper y controles chart.
- Añadir `aria-live="polite"` para mensajes de guardado/error.
- Asegurar contraste del verde/azul en dark mode.

## Roadmap sugerido

### Sprint P0 — Antes de depender de BSD en eliminatorias

1. Arreglar recálculo de puntos BSD para eliminatorias.
2. Agregar test de sync knockout con `match_<id>`.
3. Centralizar parseo de fechas en UI.
4. Cambiar rules copy A–H → A–L.

### Sprint P1 — Antes de abrir a más usuarios

1. Validar scores server-side en `/api/predictions`.
2. Validar reglas de puntos en admin API.
3. Resolver typecheck/D3 y package manager.
4. Fetch único de server-time.
5. UX de cuota pendiente antes de guardar.

### Sprint P2 — Pulido de experiencia

1. Progreso por torneo en predicciones.
2. Autosave/debounce o guardado por bloque.
3. Chart dark/responsive o fallback.
4. Admin toasts/dialogs.
5. Limpieza de `@ts-ignore`, logs y página Settings.

## Tests recomendados

| Área | Test |
|---|---|
| BSD sync | `syncKnockoutMatch` recalcula predicciones con `match_<dbId>` |
| Fechas | Cada formato de `matches.json` produce Date válido en helper compartido |
| API predicciones | Rechaza negativos, floats y >20 |
| Admin reglas | Rechaza valores no enteros/negativos |
| UI cuotas | Usuario sin cuota ve estado bloqueado antes de intentar guardar |
| Leaderboard privacidad | Scores ajenos futuros llegan null desde server |
| Chart | Typecheck y smoke render con frames vacíos y con datos |

## Notas finales

El mayor valor inmediato está en corregir el bug BSD de eliminatorias y el parseo de fechas en cliente. Son cambios pequeños con alto impacto. Después, la UX de predicciones debe reducir fricción: menos requests, menos refresh completo y estado de cuota visible antes del error.
