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
 * No se permiten predicciones cuando el partido ya inició
 */
export function isPredictionClosed(matchDate: Date): boolean {
  const now = new Date();
  return now >= matchDate;
}

/**
 * Parsea una fecha en formato ISO 8601 con offset UTC
 * Ejemplo: "2026-06-11 15:00:00-06" -> Date object
 */
export function parseMatchDate(dateString: string): Date {
  // El formato es "YYYY-MM-DD HH:mm:ss±HH"
  // Convertir a formato ISO estándar: "YYYY-MM-DDTHH:mm:ss±HH:mm"
  const isoString = dateString
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");

  return new Date(isoString);
}

/**
 * Formatea la fecha de un partido en zona horaria de Ciudad de México
 */
export function formatMatchDate(date: Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Mexico_City",
    timeZoneName: "short",
  }).format(date);
}

/**
 * Extrae fecha y hora en zona horaria de México de un Date object
 * Para usar en inputs del admin panel
 */
export function extractMexicoCityDateTime(date: Date): {
  date: string;
  time: string;
} {
  const year = date.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
  });
  const month = date.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    month: "2-digit",
  });
  const day = date.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    day: "2-digit",
  });
  const hour = date.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    hour: "2-digit",
    hour12: false,
  });
  const minute = date.toLocaleString("en-US", {
    timeZone: "America/Mexico_City",
    minute: "2-digit",
  });

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
  };
}

/**
 * Convierte una fecha/hora de México a Date object
 * Para guardar desde el admin panel
 */
export function fromMexicoCityTime(dateStr: string, timeStr: string): Date {
  // Crear string en formato ISO con offset de México (UTC-6)
  const isoString = `${dateStr}T${timeStr}:00-06:00`;
  return new Date(isoString);
}
