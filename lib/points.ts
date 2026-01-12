/**
 * Calcula los puntos obtenidos por una predicción
 *
 * Sistema de puntos:
 * - 5 puntos: Resultado exacto (marcador correcto)
 * - 3 puntos: Ganador correcto (sin marcador exacto)
 * - 1 punto: Empate acertado
 * - 0 puntos: Predicción incorrecta
 */
export function calculatePoints(
  predictedHome: number,
  predictedAway: number,
  actualHome: number,
  actualAway: number
): number {
  // Resultado exacto
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 5;
  }

  // Diferencias de goles
  const predictedDiff = predictedHome - predictedAway;
  const actualDiff = actualHome - actualAway;

  // Empate acertado
  if (predictedDiff === 0 && actualDiff === 0) {
    return 1;
  }

  // Ganador correcto
  if (
    (predictedDiff > 0 && actualDiff > 0) || // Ambos predicen victoria local
    (predictedDiff < 0 && actualDiff < 0) // Ambos predicen victoria visitante
  ) {
    return 3;
  }

  // Predicción incorrecta
  return 0;
}

/**
 * Determina si un partido está cerrado para predicciones
 * (30 minutos antes del inicio)
 */
export function isPredictionClosed(matchDate: Date): boolean {
  const now = new Date();
  const thirtyMinutesBefore = new Date(matchDate.getTime() - 30 * 60 * 1000);
  return now >= thirtyMinutesBefore;
}

/**
 * Formatea la fecha de un partido
 */
export function formatMatchDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}
