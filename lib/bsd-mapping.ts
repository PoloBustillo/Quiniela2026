/**
 * Mapeo estático: ID local (matches.json) → BSD event ID
 *
 * Generado verificando coincidencia de equipos y fechas contra la API BSD.
 * Liga: FIFA World Cup 2026 (league_id: 27, season_id: 188)
 *
 * SÓLO FASE DE GRUPOS (IDs 1-72).
 * Los partidos de eliminación directa se asocian dinámicamente
 * cuando el admin captura el partido (campo bsdEventId en Match).
 *
 * Para consultar o actualizar el mapeo de un partido:
 *   POST /api/admin/bsd/map  { localMatchId, bsdEventId }
 */

export const GROUP_STAGE_BSD_MAP: Record<number, number> = {
  1: 8287, // Mexico vs South Africa (Jun 11, Group A)
  2: 8288, // South Korea vs Czechia (Jun 12, Group A)
  3: 8289, // Canada vs Bosnia & Herzegovina (Jun 12, Group B)
  4: 8290, // USA vs Paraguay (Jun 13, Group D)
  5: 8292, // Qatar vs Switzerland (Jun 13, Group B)
  6: 8293, // Brazil vs Morocco (Jun 13, Group C)
  7: 8294, // Haiti vs Scotland (Jun 14, Group C)
  8: 8291, // Australia vs Türkiye (Jun 14, Group D)
  9: 8295, // Germany vs Curaçao (Jun 14, Group E)
  10: 8296, // Netherlands vs Japan (Jun 14, Group F)
  11: 8297, // Côte d'Ivoire vs Ecuador (Jun 14, Group E)
  12: 8298, // Sweden vs Tunisia (Jun 15, Group F)
  13: 8299, // Spain vs Cabo Verde (Jun 15, Group H)
  14: 8300, // Belgium vs Egypt (Jun 15, Group G)
  15: 8301, // Saudi Arabia vs Uruguay (Jun 15, Group H)
  16: 8302, // Iran vs New Zealand (Jun 16, Group G)
  17: 8304, // France vs Senegal (Jun 16, Group I)
  18: 8305, // Iraq vs Norway (Jun 16, Group I)
  19: 8306, // Argentina vs Algeria (Jun 17, Group J)
  20: 8303, // Austria vs Jordan (Jun 17, Group J)
  21: 8307, // Portugal vs DR Congo (Jun 17, Group K)
  22: 8308, // England vs Croatia (Jun 17, Group L)
  23: 8309, // Ghana vs Panama (Jun 17, Group L)
  24: 8310, // Uzbekistan vs Colombia (Jun 18, Group K)
  25: 8311, // Czechia vs South Africa (Jun 18, Group A)
  26: 8312, // Switzerland vs Bosnia & Herzegovina (Jun 18, Group B)
  27: 8313, // Canada vs Qatar (Jun 18, Group B)
  28: 8314, // Mexico vs South Korea (Jun 19, Group A)
  29: 8316, // USA vs Australia (Jun 19, Group D)
  30: 8317, // Scotland vs Morocco (Jun 19, Group C)
  31: 8318, // Brazil vs Haiti (Jun 20, Group C)
  32: 8315, // Türkiye vs Paraguay (Jun 20, Group D)
  33: 8320, // Netherlands vs Sweden (Jun 20, Group F)
  34: 8321, // Germany vs Côte d'Ivoire (Jun 20, Group E)
  35: 8322, // Ecuador vs Curaçao (Jun 21, Group E)
  36: 8319, // Tunisia vs Japan (Jun 21, Group F)
  37: 8323, // Spain vs Saudi Arabia (Jun 21, Group H)
  38: 8324, // Belgium vs Iran (Jun 21, Group G)
  39: 8325, // Uruguay vs Cabo Verde (Jun 22, Group H)
  40: 8326, // New Zealand vs Egypt (Jun 22, Group G)
  41: 8327, // Argentina vs Austria (Jun 22, Group J)
  42: 8328, // France vs Iraq (Jun 22, Group I)
  43: 8329, // Norway vs Senegal (Jun 23, Group I)
  44: 8330, // Jordan vs Algeria (Jun 23, Group J)
  45: 8331, // Portugal vs Uzbekistan (Jun 23, Group K)
  46: 8332, // England vs Ghana (Jun 23, Group L)
  47: 8333, // Panama vs Croatia (Jun 24, Group L)
  48: 8334, // Colombia vs DR Congo (Jun 24, Group K)
  49: 8335, // Switzerland vs Canada (Jun 24, Group B)
  50: 8336, // Bosnia & Herzegovina vs Qatar (Jun 24, Group B)
  51: 8338, // Scotland vs Brazil (Jun 24, Group C)
  52: 8337, // Morocco vs Haiti (Jun 25, Group C)
  53: 8340, // Czechia vs Mexico (Jun 25, Group A)
  54: 8339, // South Africa vs South Korea (Jun 25, Group A)
  55: 8341, // Curaçao vs Côte d'Ivoire (Jun 25, Group E)
  56: 8342, // Ecuador vs Germany (Jun 25, Group E)
  57: 8343, // Japan vs Sweden (Jun 25, Group F)
  58: 8344, // Tunisia vs Netherlands (Jun 26, Group F)
  59: 8346, // Türkiye vs USA (Jun 26, Group D)
  60: 8345, // Paraguay vs Australia (Jun 26, Group D)
  61: 8347, // Norway vs France (Jun 26, Group I)
  62: 8348, // Senegal vs Iraq (Jun 26, Group I)
  63: 8349, // Cabo Verde vs Saudi Arabia (Jun 27, Group H)
  64: 8350, // Uruguay vs Spain (Jun 27, Group H)
  65: 8351, // Egypt vs Iran (Jun 27, Group G)
  66: 8352, // New Zealand vs Belgium (Jun 27, Group G)
  67: 8354, // Panama vs England (Jun 27, Group L)
  68: 8353, // Croatia vs Ghana (Jun 27, Group L)
  69: 8355, // Colombia vs Portugal (Jun 27, Group K)
  70: 8356, // DR Congo vs Uzbekistan (Jun 27, Group K)
  71: 8357, // Algeria vs Austria (Jun 28, Group J)
  72: 8358, // Jordan vs Argentina (Jun 28, Group J) — verify if 8358 exists
};

/**
 * Busca el BSD event ID para un partido de fase de grupos.
 * Retorna null si no existe mapeo (nunca lanza).
 */
export function getBsdEventIdForGroupMatch(
  localMatchId: number,
): number | null {
  return GROUP_STAGE_BSD_MAP[localMatchId] ?? null;
}
