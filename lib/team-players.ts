/**
 * Mapa de códigos de bandera (3 letras minúsculas extraídas de `/flags/<code>.png`)
 * a la imagen de jugador representativa de esa selección.
 *
 * Los PNG viven en `public/players/` y tienen fondo removido.
 */
export const TEAM_PLAYER_IMAGE: Record<string, string> = {
  fra: "/players/Mbappe-remove-bg-io.png",
  arg: "/players/Messi-remove-bg-io.png",
  eng: "/players/Bellingam-remove-bg-io.png",
  bel: "/players/Bruyne-remove-bg-io.png",
  mar: "/players/Hakimi-remove-bg-io.png",
  nor: "/players/Halland-remove-bg-io.png",
  esp: "/players/Lamine-remove-bg-io.png",
  sui: "/players/Suiza-remove-bg-io.png",
};

interface TeamLike {
  flag: string;
}

/**
 * Extrae el código de bandera de un path tipo `/flags/fra.png` y devuelve
 * la imagen de jugador asociada, o `null` si no existe.
 */
export function getPlayerForTeam(team: TeamLike | null | undefined): string | null {
  if (!team?.flag) return null;

  const match = team.flag.match(/\/flags\/([a-z0-9]+)\.png$/i);
  const code = match?.[1]?.toLowerCase();
  if (!code) return null;

  return TEAM_PLAYER_IMAGE[code] ?? null;
}

/** Alias corto para obtener jugadores por ambos equipos de un partido. */
export function getPlayersForMatch(match: {
  homeTeam: TeamLike;
  awayTeam: TeamLike;
}) {
  return {
    home: getPlayerForTeam(match.homeTeam),
    away: getPlayerForTeam(match.awayTeam),
  };
}
