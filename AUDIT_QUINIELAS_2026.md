# Auditoria de quinielas, puntos y seguridad

Fecha: 2026-05-22

## Resumen ejecutivo

La separacion conceptual de las 3 quinielas esta casi bien, pero hay riesgos reales alrededor de fases de cuartos, visibilidad en comparaciones, reglas de puntos configurables que no se usan, y datos que pueden quedar en estado invalido por administracion.

La app ya tiene proteccion importante contra trampa por reloj local: el cierre final de predicciones se valida en servidor en `app/api/predictions/route.ts`. Cambiar el reloj del celular/PC no permite guardar si el partido ya empezo segun servidor.

## Definicion esperada de quinielas

- Quiniela 1: `GROUP_STAGE`.
- Quiniela 2: `ROUND_OF_32` + `ROUND_OF_16`.
- Quiniela 3: `QUARTER_FINAL` + `SEMI_FINAL` + `THIRD_PLACE` + `FINAL`.

Nota actualizada: DB real tiene 4 partidos `QUARTER_FINAL`. La fila fantasma `ROUND_OF_8` con TBD/TBD fue confirmada sin predicciones y eliminada el 2026-05-22.

## Cambios hechos durante auditoria

- `components/admin/AllMatchesManager.tsx`: la pestana Finales vuelve a usar `QUARTER_FINAL` como fase inicial.
- `components/admin/AllMatchesManager.tsx`: el selector de Finales muestra `QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`, `FINAL`.
- Validacion TypeScript del archivo: sin errores.

## Hallazgos criticos

### 1. Fila DB fantasma en `ROUND_OF_8`

Impacto: alto.

Evidencia:

- Conteo DB: `ROUND_OF_8 = 1`, `QUARTER_FINAL = 4`.
- La fila `ROUND_OF_8` es TBD vs TBD, estadio/city `Por definir`, fecha cercana a la fecha actual.
- Esa fila puede aparecer como partido extra, cerrar predicciones por fecha equivocada o contaminar T3 si alguna vista incluye `ROUND_OF_8`.

Tareas:

- Estado: corregido. Se confirmo `predictionCount = 0`, se borro la fila y se quito `ROUND_OF_8` de mapas UI.

### 2. Dos enums representan cuartos de final

Impacto: alto.

Evidencia:

- `prisma/schema.prisma` define `ROUND_OF_8` y `QUARTER_FINAL`.
- `scripts/seed-teams-and-knockout.js` usa `QUARTER_FINAL` para los 4 cuartos reales.
- `components/LeaderboardByPhase.tsx`, `components/ClientHomePage.tsx` y `app/leaderboard/compare/CompareClient.tsx` ya no exponen `ROUND_OF_8` como Cuartos.

Riesgo:

- Si una vista suma T3 con ambos enums, puede contar partido fantasma.
- Si admin crea otro partido como `ROUND_OF_8`, quedan dos buckets de cuartos.

Tareas:

- Elegir enum canonico: recomendado `QUARTER_FINAL`.
- Remover `ROUND_OF_8` de UI, ranking, compare y seeds si no se usara.
- Si se mantiene por compatibilidad, documentar que esta deprecado y bloquear creacion nueva.
- Agregar test unitario para `TORNEO_PHASES.T3` = solo `QUARTER_FINAL`, `SEMI_FINAL`, `THIRD_PLACE`, `FINAL`.

## Hallazgos altos

### 3. Comparar predicciones filtra filas futuras, pero puntos resumen pueden incluir futuras

Impacto: alto.

Evidencia:

- `app/leaderboard/compare/CompareClient.tsx` filtra `rows` por `startedMatchIds`.
- Pero `myPoints` y `otherPoints` suman todas las predicciones de la fase seleccionada, sin filtrar por partidos iniciados/visibles.

Riesgo usuario:

- Pantalla compara solo partidos pasados, pero tarjetas de puntos pueden incluir puntos de otros partidos de la fase.
- El usuario ve resumen que no coincide con filas visibles.

Tareas:

- Calcular puntos del compare usando solo `rows` filtradas.
- Si se quiere mostrar total global, etiquetarlo separado como `Total torneo`.
- Agregar test: partido futuro con puntos precargados no debe afectar resumen de compare.

### 4. `startedSet` se recrea en cada render en CompareClient

Impacto: medio-alto.

Evidencia:

- `const startedSet = new Set(startedMatchIds);` vive directo en render.
- `useMemo` depende de `startedSet`, entonces recalcula en cada render aunque `startedMatchIds` no cambie.

Riesgo:

- No rompe seguridad, pero degrada performance y puede causar renders caros cuando haya muchos usuarios/predicciones.

Tareas:

- Cambiar a `const startedSet = useMemo(() => new Set(startedMatchIds), [startedMatchIds]);`.
- Mantener `startedSet` en deps del memo de comparison.

### 5. Reglas de puntos configurables no afectan calculo real

Impacto: alto.

Evidencia:

- Admin tiene `PointsRulesManager` y API `app/api/admin/points-rules/route.ts`.
- `lib/points.ts` usa valores hardcodeados: exacto 5, ganador/empate 3, fallo 0.
- `correctGoalDifference` existe en DB/UI, pero `calculatePoints` no otorga 2 puntos por diferencia.

Riesgo:

- Admin cree que cambio reglas, pero resultados no cambian.
- Reglas publicas en `app/rules/page.tsx` pueden divergir de DB.

Tareas:

- Estado: corregido. `calculatePoints` acepta reglas activas, admin recalcula con la regla activa y tests cubren reglas custom.

### 6. Usuarios pueden guardar predicciones sin haber pagado la quiniela

Impacto: alto como decision de producto.

Evidencia:

- `app/api/predictions/route.ts` valida auth, match valido y cierre por hora, pero no valida pago por fase.
- DB actual tiene 6 predicciones de T1 hechas por usuarios sin pago de T1.
- Ranking filtra/etiqueta por pago, pero la prediccion queda guardada.

Riesgo:

- Si se marca pago despues del inicio, usuario puede aparecer con predicciones ya guardadas.
- Puede ser feature si se permite predecir antes de pagar; debe quedar explicito.

Tareas:

- Estado: corregido de forma conservadora. La API de predicciones bloquea guardado si la cuota de esa quiniela no esta pagada.

## Hallazgos medios

### 7. Fechas Mexico usan offset fijo `-06:00`

Impacto: medio.

Evidencia:

- `fromMexicoCityTime` crea `${dateStr}T${timeStr}:00-06:00`.
- `app/page.tsx` y `app/api/admin/group-matches/route.ts` reconstruyen strings con `-06`.

Riesgo:

- Si una sede/fecha necesita otra zona o cambia regla oficial de horario, el cierre queda corrido.
- Canada/USA tienen sedes con zonas diferentes, pero la quiniela parece operar en hora Mexico. Eso debe quedar explicito.

Tareas:

- Confirmar regla de producto: todos los horarios se muestran y cierran en America/Mexico_City.
- Reemplazar offset fijo por util que convierta usando timezone IANA.
- Agregar tests para fechas de junio/julio 2026.

### 8. Fallback de fecha invalida puede cerrar/abrir mal

Impacto: medio.

Evidencia:

- `fromMexicoCityTime` devuelve `new Date()` si input invalido.

Riesgo:

- Un error de admin en fecha/hora puede guardar fecha actual y cerrar predicciones inmediatamente o crear partido raro.

Tareas:

- Estado: corregido parcialmente. `fromMexicoCityTime` ya no cae a fecha actual y las APIs admin rechazan `matchDate` invalido.

### 9. Estados de partido no gobiernan cierre ni visibilidad

Impacto: medio.

Evidencia:

- Predicciones cierran por `matchDate`, no por `status`.
- Leaderboard considera terminado por marcador/status para wrong/pending, pero compare usa iniciado por fecha.

Riesgo:

- Partido `POSTPONED` con fecha pasada queda cerrado aunque no se juegue.
- Partido `LIVE` con fecha futura por error puede quedar abierto.

Tareas:

- Definir prioridad: `status` vs `matchDate`.
- Para `POSTPONED/CANCELLED`, decidir si se reabre o congela.
- Hacer helper unico `getMatchVisibilityState`.

### 10. Tests E2E usan terminologia vieja

Impacto: medio.

Evidencia:

- `tests/e2e/leaderboard.spec.ts` menciona T2 como `32avos`.
- Producto actual dice `16vos + 8vos`.

Tareas:

- Estado: corregido. Texto E2E actualizado a T2 `16vos + 8vos`.
- Agregar test especifico de mapas T1/T2/T3.
- Agregar test de compare con partido futuro.

## Hallazgos bajos / deuda

### 11. `data/README.md` esta desactualizado

Impacto: bajo.

Evidencia:

- `data/matches.json` tiene 72 partidos y grupos A-L.
- README aun dice 8 grupos A-H y primeros 24 partidos.

Tareas:

- Estado: corregido. README actualizado a 12 grupos A-L y 72 partidos.

### 12. Logs de admin en consola

Impacto: bajo.

Evidencia:

- `AllMatchesManager` y APIs admin imprimen datos de partidos en consola.

Tareas:

- Quitar logs ruidosos o proteger con `NODE_ENV !== "production"`.

## Plan recomendado

1. Limpiar fase cuartos: usar solo `QUARTER_FINAL`, borrar o migrar fila `ROUND_OF_8` fantasma.
2. Arreglar Compare: puntos resumen deben sumar solo partidos visibles/pasados.
3. Decidir pago antes de prediccion: bloquear o documentar claramente.
4. Resolver reglas de puntos: fijas o configurables, pero no ambas.
5. Crear helpers canonicos: `TORNEO_PHASES`, `PHASE_LABELS`, `getMatchVisibilityState`, `mexicoTimeToDate`.
6. Agregar tests unitarios para fases, puntos, compare, pago y reloj.
7. Actualizar docs (`data/README.md`, `KNOWN_BUGS.md`, `AI_CONTEXT.md`) para que no contradigan codigo real.

## Validaciones ejecutadas

- Conteo DB de partidos por fase.
- Inspeccion DB de fila `ROUND_OF_8`.
- Conteo DB de predicciones por fase.
- Conteo de predicciones sin pago por quiniela.
- Conteo de `data/matches.json`: 72 partidos, grupos A-L.
- TypeScript diagnostics en `components/admin/AllMatchesManager.tsx`: sin errores.
