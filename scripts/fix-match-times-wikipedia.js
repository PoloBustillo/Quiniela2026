/**
 * Fix match times in matches.json based on official Wikipedia/FIFA data
 * All times converted to UTC-6 (Mexico City time)
 * 
 * Conversion rules:
 * UTC-4 → UTC-6: subtract 2 hours
 * UTC-5 → UTC-6: subtract 1 hour
 * UTC-6 → UTC-6: same
 * UTC-7 → UTC-6: add 1 hour
 */

const fs = require('fs');
const path = require('path');

const matchesPath = path.join(__dirname, '../data/matches.json');
const data = JSON.parse(fs.readFileSync(matchesPath, 'utf-8'));

// Map of match ID to correct UTC-6 date/time string
// Format: "YYYY-MM-DD HH:MM:00-06"
// Source: Wikipedia 2026 FIFA World Cup article (verified March 2026)
const corrections = {
  // GROUP A
  // Match 1: MEX vs RSA, Jun 11 1:00pm UTC-6 → 13:00 UTC-6 ✓ (no change)
  // Match 2: KOR vs UEPD, Jun 11 8:00pm UTC-6 → 20:00 UTC-6 ✓ (no change)
  // Match 25: UEPD vs RSA, Jun 18 7:00pm UTC-6 = 19:00 UTC-6
  25: "2026-06-18 19:00:00-06",
  // Match 28: MEX vs KOR, Jun 18 12:00pm UTC-4 = 10:00 UTC-6
  28: "2026-06-18 10:00:00-06",
  // Match 53: UEPD vs MEX, Jun 24 7:00pm UTC-6 = 19:00 UTC-6 ✓ (no change)
  // Match 54: RSA vs KOR, Jun 24 7:00pm UTC-6 = 19:00 UTC-6 ✓ (no change)

  // GROUP B
  // Match 3: CAN vs UEPA, Jun 12 3:00pm UTC-4 = 13:00 UTC-6
  3: "2026-06-12 13:00:00-06",
  // Match 5: QAT vs SUI, Jun 13 12:00pm UTC-7 = 13:00 UTC-6
  5: "2026-06-13 13:00:00-06",
  // Match 26: SUI vs UEPA, Jun 18 3:00pm UTC-7 = 16:00 UTC-6
  26: "2026-06-18 16:00:00-06",
  // Match 27: CAN vs QAT, Jun 18 12:00pm UTC-7 = 13:00 UTC-6
  27: "2026-06-18 13:00:00-06",
  // Match 49: SUI vs CAN, Jun 24 12:00pm UTC-7 = 13:00 UTC-6
  49: "2026-06-24 13:00:00-06",
  // Match 50: UEPA vs QAT, Jun 24 12:00pm UTC-7 = 13:00 UTC-6
  50: "2026-06-24 13:00:00-06",

  // GROUP C
  // Match 6: BRA vs MAR, Jun 13 6:00pm UTC-4 = 16:00 UTC-6
  6: "2026-06-13 16:00:00-06",
  // Match 7: HAI vs SCO, Jun 13 9:00pm UTC-4 = 19:00 UTC-6
  7: "2026-06-13 19:00:00-06",
  // Match 30: SCO vs MAR, Jun 19 6:00pm UTC-4 = 16:00 UTC-6
  30: "2026-06-19 16:00:00-06",
  // Match 31: BRA vs HAI, Jun 19 9:00pm UTC-4 = 19:00 UTC-6
  31: "2026-06-19 19:00:00-06",
  // Match 51: SCO vs BRA, Jun 24 6:00pm UTC-4 = 16:00 UTC-6
  51: "2026-06-24 16:00:00-06",
  // Match 52: MAR vs HAI, Jun 24 6:00pm UTC-4 = 16:00 UTC-6
  52: "2026-06-24 16:00:00-06",

  // GROUP D
  // Match 4: USA vs PAR, Jun 12 6:00pm UTC-7 = 19:00 UTC-6
  4: "2026-06-12 19:00:00-06",
  // Match 8: AUS vs UEPC, Jun 13 9:00pm UTC-7 = 22:00 UTC-6
  8: "2026-06-13 22:00:00-06",
  // Match 29: USA vs AUS, Jun 19 9:00pm UTC-7 = 22:00 UTC-6
  29: "2026-06-19 22:00:00-06",
  // Match 32: UEPC vs PAR, Jun 21 12:00pm UTC-7 = 13:00 UTC-6
  32: "2026-06-21 13:00:00-06",
  // Match 59: UEPC vs USA, Jun 25 7:00pm UTC-7 = 20:00 UTC-6
  59: "2026-06-25 20:00:00-06",
  // Match 60: PAR vs AUS, Jun 25 7:00pm UTC-7 = 20:00 UTC-6
  60: "2026-06-25 20:00:00-06",

  // GROUP E
  // Match 9: GER vs CUR, Jun 14 12:00pm UTC-5 = 11:00 UTC-6
  9: "2026-06-14 11:00:00-06",
  // Match 11: CIV vs ECU, Jun 14 7:00pm UTC-4 = 17:00 UTC-6
  11: "2026-06-14 17:00:00-06",
  // Match 34: GER vs CIV, Jun 20 7:00pm UTC-5 = 18:00 UTC-6
  34: "2026-06-20 18:00:00-06",
  // Match 35: ECU vs CUR, Jun 20 4:00pm UTC-4 = 14:00 UTC-6
  35: "2026-06-20 14:00:00-06",
  // Match 55: CUR vs CIV, Jun 25 4:00pm UTC-4 = 14:00 UTC-6
  55: "2026-06-25 14:00:00-06",
  // Match 56: ECU vs GER, Jun 25 4:00pm UTC-4 = 14:00 UTC-6
  56: "2026-06-25 14:00:00-06",

  // GROUP F
  // Match 10: NED vs JPN, Jun 14 8:00pm UTC-6 = 20:00 UTC-6
  10: "2026-06-14 20:00:00-06",
  // Match 12: UEPB vs TUN, Jun 14 3:00pm UTC-5 = 14:00 UTC-6
  12: "2026-06-14 14:00:00-06",
  // Match 33: NED vs UEPB, Jun 20 12:00pm UTC-5 = 11:00 UTC-6
  33: "2026-06-20 11:00:00-06",
  // Match 36: TUN vs JPN, Jun 20 10:00pm UTC-6 = 22:00 UTC-6
  36: "2026-06-20 22:00:00-06",
  // Match 57: JPN vs UEPB, Jun 25 6:00pm UTC-5 = 17:00 UTC-6
  57: "2026-06-25 17:00:00-06",
  // Match 58: TUN vs NED, Jun 25 6:00pm UTC-5 = 17:00 UTC-6
  58: "2026-06-25 17:00:00-06",

  // GROUP G
  // Match 14: BEL vs EGY, Jun 15 6:00pm UTC-7 = 19:00 UTC-6
  14: "2026-06-15 19:00:00-06",
  // Match 16: IRN vs NZL, Jun 15 12:00pm UTC-7 = 13:00 UTC-6
  16: "2026-06-15 13:00:00-06",
  // Match 38: BEL vs IRN, Jun 21 6:00pm UTC-7 = 19:00 UTC-6
  38: "2026-06-21 19:00:00-06",
  // Match 40: NZL vs EGY, Jun 21 12:00pm UTC-7 = 13:00 UTC-6 (was 21:00 for BC Place)
  40: "2026-06-21 13:00:00-06",
  // Match 65: EGY vs IRN, Jun 26 8:00pm UTC-7 = 21:00 UTC-6
  65: "2026-06-26 21:00:00-06",
  // Match 66: NZL vs BEL, Jun 26 8:00pm UTC-7 = 21:00 UTC-6
  66: "2026-06-26 21:00:00-06",

  // GROUP H
  // Match 13: ESP vs CPV, Jun 15 12:00pm UTC-4 = 10:00 UTC-6
  13: "2026-06-15 10:00:00-06",
  // Match 15: KSA vs URU, Jun 15 12:00pm UTC-4 = 10:00 UTC-6
  15: "2026-06-15 10:00:00-06",
  // Match 37: ESP vs KSA, Jun 21 6:00pm UTC-4 = 16:00 UTC-6
  37: "2026-06-21 16:00:00-06",
  // Match 39: URU vs CPV, Jun 21 12:00pm UTC-4 = 10:00 UTC-6
  39: "2026-06-21 10:00:00-06",
  // Match 63: CPV vs KSA, Jun 26 6:00pm UTC-6 = 18:00 UTC-6
  63: "2026-06-26 18:00:00-06",
  // Match 64: URU vs ESP, Jun 26 7:00pm UTC-6 = 19:00 UTC-6
  64: "2026-06-26 19:00:00-06",

  // GROUP I
  // Match 17: FRA vs SEN, Jun 16 3:00pm UTC-4 = 13:00 UTC-6
  17: "2026-06-16 13:00:00-06",
  // Match 18: FP02 vs NOR, Jun 16 6:00pm UTC-4 = 16:00 UTC-6
  18: "2026-06-16 16:00:00-06",
  // Match 42: FRA vs FP02, Jun 22 5:00pm UTC-4 = 15:00 UTC-6 (was 11:00)
  42: "2026-06-22 15:00:00-06",
  // Match 43: NOR vs SEN, Jun 22 8:00pm UTC-4 = 18:00 UTC-6 (was 14:00)
  43: "2026-06-22 18:00:00-06",
  // Match 61: NOR vs FRA, Jun 26 3:00pm UTC-4 = 13:00 UTC-6
  61: "2026-06-26 13:00:00-06",
  // Match 62: SEN vs FP02, Jun 26 3:00pm UTC-4 = 13:00 UTC-6
  62: "2026-06-26 13:00:00-06",

  // GROUP J
  // Match 19: ARG vs ALG, Jun 16 8:00pm UTC-5 = 19:00 UTC-6
  19: "2026-06-16 19:00:00-06",
  // Match 20: AUT vs JOR, Jun 16 9:00pm UTC-7 = 22:00 UTC-6 (NOT Jun 18)
  20: "2026-06-16 22:00:00-06",
  // Match 41: ARG vs AUT, Jun 22 9:00pm UTC-7 = 22:00 UTC-6
  41: "2026-06-22 22:00:00-06",
  // Match 44: JOR vs ALG, Jun 22 12:00pm UTC-5 = 11:00 UTC-6
  44: "2026-06-22 11:00:00-06",
  // Match 71: ALG vs AUT, Jun 27 9:00pm UTC-5 = 20:00 UTC-6
  71: "2026-06-27 20:00:00-06",
  // Match 72: JOR vs ARG, Jun 27 9:00pm UTC-5 = 20:00 UTC-6
  72: "2026-06-27 20:00:00-06",

  // GROUP K
  // Match 21: POR vs FP01, Jun 17 12:00pm UTC-5 = 11:00 UTC-6
  21: "2026-06-17 11:00:00-06",
  // Match 24: UZB vs COL, Jun 17 8:00pm UTC-6 = 20:00 UTC-6
  24: "2026-06-17 20:00:00-06",
  // Match 45: POR vs UZB, Jun 23 12:00pm UTC-5 = 11:00 UTC-6
  45: "2026-06-23 11:00:00-06",
  // Match 48: COL vs FP01, Jun 23 8:00pm UTC-6 = 20:00 UTC-6
  48: "2026-06-23 20:00:00-06",
  // Match 69: COL vs POR, Jun 27 7:30pm UTC-4 = 17:30 UTC-6
  69: "2026-06-27 17:30:00-06",
  // Match 70: FP01 vs UZB, Jun 27 7:30pm UTC-4 = 17:30 UTC-6
  70: "2026-06-27 17:30:00-06",

  // GROUP L
  // Match 22: ENG vs CRO, Jun 17 7:00pm UTC-4 = 17:00 UTC-6
  22: "2026-06-17 17:00:00-06",
  // Match 23: GHA vs PAN, Jun 17 3:00pm UTC-5 = 14:00 UTC-6
  23: "2026-06-17 14:00:00-06",
  // Match 46: ENG vs GHA, Jun 23 7:00pm UTC-4 = 17:00 UTC-6
  46: "2026-06-23 17:00:00-06",
  // Match 47: PAN vs CRO, Jun 23 4:00pm UTC-4 = 14:00 UTC-6
  47: "2026-06-23 14:00:00-06",
  // Match 67: PAN vs ENG, Jun 27 5:00pm UTC-4 = 15:00 UTC-6
  67: "2026-06-27 15:00:00-06",
  // Match 68: CRO vs GHA, Jun 27 5:00pm UTC-4 = 15:00 UTC-6
  68: "2026-06-27 15:00:00-06",
};

let corrected = 0;
let unchanged = 0;

data.matches = data.matches.map(match => {
  const correction = corrections[match.id];
  if (correction) {
    if (match.date !== correction) {
      console.log(`Match ${match.id} (${match.homeTeam.name} vs ${match.awayTeam.name}): ${match.date} → ${correction}`);
      corrected++;
    } else {
      unchanged++;
    }
    return { ...match, date: correction };
  }
  return match;
});

console.log(`\nTotal corrected: ${corrected}`);
console.log(`Already correct: ${unchanged}`);
console.log(`No correction needed: ${data.matches.length - corrected - unchanged}`);

fs.writeFileSync(matchesPath, JSON.stringify(data, null, 2), 'utf-8');
console.log('\n✅ matches.json updated successfully!');
