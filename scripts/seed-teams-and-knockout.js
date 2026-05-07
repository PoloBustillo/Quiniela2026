#!/usr/bin/env node
/**
 * seed-teams-and-knockout.js
 *
 * 1. Upserts all 48 World Cup 2026 teams into the DB
 * 2. Removes old placeholder knockout matches
 * 3. Creates all 32 knockout matches (P73-P104) with TBD teams
 *
 * Run: node scripts/seed-teams-and-knockout.js
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// ─── 48 Teams ────────────────────────────────────────────────────────────────
const TEAMS = [
  // Group A
  { code: "mex", name: "México", flag: "/flags/mex.png", group: "A" },
  { code: "rsa", name: "Sudáfrica", flag: "/flags/rsa.png", group: "A" },
  {
    code: "kor",
    name: "República de Corea",
    flag: "/flags/kor.png",
    group: "A",
  },
  {
    code: "uepd",
    name: "República Checa",
    flag: "/flags/uepd.png",
    group: "A",
  },
  // Group B
  { code: "can", name: "Canadá", flag: "/flags/can.png", group: "B" },
  {
    code: "uepa",
    name: "Bosnia y Herzegovina",
    flag: "/flags/uepa.png",
    group: "B",
  },
  { code: "qat", name: "Catar", flag: "/flags/qat.png", group: "B" },
  { code: "sui", name: "Suiza", flag: "/flags/sui.png", group: "B" },
  // Group C
  { code: "bra", name: "Brasil", flag: "/flags/bra.png", group: "C" },
  { code: "mar", name: "Marruecos", flag: "/flags/mar.png", group: "C" },
  { code: "hai", name: "Haití", flag: "/flags/hai.png", group: "C" },
  { code: "sco", name: "Escocia", flag: "/flags/sco.png", group: "C" },
  // Group D
  { code: "usa", name: "Estados Unidos", flag: "/flags/usa.png", group: "D" },
  { code: "par", name: "Paraguay", flag: "/flags/par.png", group: "D" },
  { code: "aus", name: "Australia", flag: "/flags/aus.png", group: "D" },
  { code: "uepc", name: "Turquía", flag: "/flags/uepc.png", group: "D" },
  // Group E
  { code: "ger", name: "Alemania", flag: "/flags/ger.png", group: "E" },
  { code: "cur", name: "Curazao", flag: "/flags/cur.png", group: "E" },
  { code: "civ", name: "Costa de Marfil", flag: "/flags/civ.png", group: "E" },
  { code: "ecu", name: "Ecuador", flag: "/flags/ecu.png", group: "E" },
  // Group F
  { code: "ned", name: "Países Bajos", flag: "/flags/ned.png", group: "F" },
  { code: "jpn", name: "Japón", flag: "/flags/jpn.png", group: "F" },
  { code: "uepb", name: "Suecia", flag: "/flags/uepb.png", group: "F" },
  { code: "tun", name: "Túnez", flag: "/flags/tun.png", group: "F" },
  // Group G
  { code: "bel", name: "Bélgica", flag: "/flags/bel.png", group: "G" },
  { code: "egy", name: "Egipto", flag: "/flags/egy.png", group: "G" },
  { code: "irn", name: "Irán", flag: "/flags/irn.png", group: "G" },
  { code: "nzl", name: "Nueva Zelanda", flag: "/flags/nzl.png", group: "G" },
  // Group H
  { code: "esp", name: "España", flag: "/flags/esp.png", group: "H" },
  { code: "cpv", name: "Cabo Verde", flag: "/flags/cpv.png", group: "H" },
  { code: "ksa", name: "Arabia Saudí", flag: "/flags/ksa.png", group: "H" },
  { code: "uru", name: "Uruguay", flag: "/flags/uru.png", group: "H" },
  // Group I
  { code: "fra", name: "Francia", flag: "/flags/fra.png", group: "I" },
  { code: "sen", name: "Senegal", flag: "/flags/sen.png", group: "I" },
  { code: "fp02", name: "Irak", flag: "/flags/fp02.png", group: "I" },
  { code: "nor", name: "Noruega", flag: "/flags/nor.png", group: "I" },
  // Group J
  { code: "arg", name: "Argentina", flag: "/flags/arg.png", group: "J" },
  { code: "alg", name: "Argelia", flag: "/flags/alg.png", group: "J" },
  { code: "aut", name: "Austria", flag: "/flags/aut.png", group: "J" },
  { code: "jor", name: "Jordania", flag: "/flags/jor.png", group: "J" },
  // Group K
  { code: "por", name: "Portugal", flag: "/flags/por.png", group: "K" },
  { code: "fp01", name: "RD de Congo", flag: "/flags/fp01.png", group: "K" },
  { code: "uzb", name: "Uzbekistán", flag: "/flags/uzb.png", group: "K" },
  { code: "col", name: "Colombia", flag: "/flags/col.png", group: "K" },
  // Group L
  { code: "eng", name: "Inglaterra", flag: "/flags/eng.png", group: "L" },
  { code: "cro", name: "Croacia", flag: "/flags/cro.png", group: "L" },
  { code: "gha", name: "Ghana", flag: "/flags/gha.png", group: "L" },
  { code: "pan", name: "Panamá", flag: "/flags/pan.png", group: "L" },
  // TBD
  { code: "TBD", name: "Por Definir", flag: "/flags/tbd.png", group: null },
];

// ─── Knockout matches P73–P104 ────────────────────────────────────────────────
// Times are stored as UTC (user-given local times treated as UTC-6 / Mexico City)
// UTC = local_time + 6h

const KNOCKOUT_MATCHES = [
  // ── ROUND_OF_32 (Dieciseisavos de final) ──────────────────────────────────
  // Jun 28
  {
    matchDate: new Date("2026-06-28T20:00:00.000Z"), // 2pm CST
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P73 – 2° Grupo A vs 2° Grupo B",
  },
  // Jun 29
  {
    matchDate: new Date("2026-06-29T18:00:00.000Z"), // 12pm CST
    stadium: "Gillette Stadium",
    city: "Boston",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P74 – 1° Grupo E vs 3° Grupo A/B/C/D/F",
  },
  {
    matchDate: new Date("2026-06-29T21:30:00.000Z"), // 3:30pm CST
    stadium: "Estadio BBVA",
    city: "Monterrey",
    country: "Mexico",
    phase: "ROUND_OF_32",
    label: "P75 – 1° Grupo F vs 2° Grupo C",
  },
  {
    matchDate: new Date("2026-06-30T02:00:00.000Z"), // 8pm CST
    stadium: "NRG Stadium",
    city: "Houston",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P76 – 1° Grupo E vs 2° Grupo F",
  },
  // Jun 30
  {
    matchDate: new Date("2026-06-30T18:00:00.000Z"), // 12pm CST
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P77 – 1° Grupo I vs 3° Grupo C/D/F/G/H",
  },
  {
    matchDate: new Date("2026-06-30T22:00:00.000Z"), // 4pm CST
    stadium: "AT&T Stadium",
    city: "Dallas",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P78 – 2° Grupo E vs 2° Grupo I",
  },
  {
    matchDate: new Date("2026-07-01T02:00:00.000Z"), // 8pm CST
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    phase: "ROUND_OF_32",
    label: "P79 – 1° Grupo A vs 3° Grupo C/E/F/H/I",
  },
  // Jul 1
  {
    matchDate: new Date("2026-07-01T17:00:00.000Z"), // 11am CST
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P80 – 1° Grupo L vs 3° Grupo E/H/I/J/K",
  },
  {
    matchDate: new Date("2026-07-01T21:00:00.000Z"), // 3pm CST
    stadium: "Levi's Stadium",
    city: "San Francisco Bay Area",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P81 – 1° Grupo D vs 3° Grupo B/E/F/I/J",
  },
  {
    matchDate: new Date("2026-07-02T01:00:00.000Z"), // 7pm CST
    stadium: "Lumen Field",
    city: "Seattle",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P82 – 1° Grupo G vs 3° Grupo A/E/H/I/J",
  },
  // Jul 2
  {
    matchDate: new Date("2026-07-02T20:00:00.000Z"), // 2pm CST
    stadium: "BMO Field",
    city: "Toronto",
    country: "Canada",
    phase: "ROUND_OF_32",
    label: "P83 – 2° Grupo K vs 2° Grupo L",
  },
  {
    matchDate: new Date("2026-07-03T00:00:00.000Z"), // 6pm CST
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P84 – 1° Grupo H vs 2° Grupo J",
  },
  {
    matchDate: new Date("2026-07-03T02:30:00.000Z"), // 8:30pm CST
    stadium: "BC Place",
    city: "Vancouver",
    country: "Canada",
    phase: "ROUND_OF_32",
    label: "P85 – 1° Grupo B vs 3° Grupo E/F/G/I/J",
  },
  {
    matchDate: new Date("2026-07-03T04:00:00.000Z"), // 10pm CST
    stadium: "Hard Rock Stadium",
    city: "Miami",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P86 – 1° Grupo J vs 2° Grupo H",
  },
  // Jul 3
  {
    matchDate: new Date("2026-07-03T19:00:00.000Z"), // 1pm CST
    stadium: "Arrowhead Stadium",
    city: "Kansas City",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P87 – 1° Grupo K vs 3° Grupo D/E/I/J/L",
  },
  {
    matchDate: new Date("2026-07-03T23:00:00.000Z"), // 5pm CST
    stadium: "AT&T Stadium",
    city: "Dallas",
    country: "USA",
    phase: "ROUND_OF_32",
    label: "P88 – 2° Grupo D vs 2° Grupo G",
  },

  // ── ROUND_OF_16 (Octavos de final) ────────────────────────────────────────
  // Jul 4
  {
    matchDate: new Date("2026-07-04T18:00:00.000Z"), // 12pm CST
    stadium: "Lincoln Financial Field",
    city: "Philadelphia",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P89 – Gan. P74 vs Gan. P77",
  },
  {
    matchDate: new Date("2026-07-04T22:00:00.000Z"), // 4pm CST
    stadium: "NRG Stadium",
    city: "Houston",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P90 – Gan. P73 vs Gan. P75",
  },
  // Jul 5
  {
    matchDate: new Date("2026-07-05T21:00:00.000Z"), // 3pm CST
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P91 – Gan. P76 vs Gan. P78",
  },
  {
    matchDate: new Date("2026-07-06T01:00:00.000Z"), // 7pm CST
    stadium: "Estadio Azteca",
    city: "Mexico City",
    country: "Mexico",
    phase: "ROUND_OF_16",
    label: "P92 – Gan. P79 vs Gan. P80",
  },
  // Jul 6
  {
    matchDate: new Date("2026-07-06T20:00:00.000Z"), // 2pm CST
    stadium: "AT&T Stadium",
    city: "Dallas",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P93 – Gan. P83 vs Gan. P84",
  },
  {
    matchDate: new Date("2026-07-07T01:00:00.000Z"), // 7pm CST
    stadium: "Lumen Field",
    city: "Seattle",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P94 – Gan. P81 vs Gan. P82",
  },
  // Jul 7
  {
    matchDate: new Date("2026-07-07T17:00:00.000Z"), // 11am CST
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "USA",
    phase: "ROUND_OF_16",
    label: "P95 – Gan. P86 vs Gan. P88",
  },
  {
    matchDate: new Date("2026-07-07T21:00:00.000Z"), // 3pm CST
    stadium: "BC Place",
    city: "Vancouver",
    country: "Canada",
    phase: "ROUND_OF_16",
    label: "P96 – Gan. P85 vs Gan. P87",
  },

  // ── QUARTER_FINAL (Cuartos de final) ──────────────────────────────────────
  // Jul 9
  {
    matchDate: new Date("2026-07-09T21:00:00.000Z"), // 3pm CST
    stadium: "Gillette Stadium",
    city: "Boston",
    country: "USA",
    phase: "QUARTER_FINAL",
    label: "P97 – Gan. P89 vs Gan. P90",
  },
  // Jul 10
  {
    matchDate: new Date("2026-07-10T20:00:00.000Z"), // 2pm CST
    stadium: "SoFi Stadium",
    city: "Los Angeles",
    country: "USA",
    phase: "QUARTER_FINAL",
    label: "P98 – Gan. P93 vs Gan. P94",
  },
  // Jul 11
  {
    matchDate: new Date("2026-07-11T22:00:00.000Z"), // 4pm CST
    stadium: "Hard Rock Stadium",
    city: "Miami",
    country: "USA",
    phase: "QUARTER_FINAL",
    label: "P99 – Gan. P91 vs Gan. P92",
  },
  {
    matchDate: new Date("2026-07-12T02:00:00.000Z"), // 8pm CST
    stadium: "Arrowhead Stadium",
    city: "Kansas City",
    country: "USA",
    phase: "QUARTER_FINAL",
    label: "P100 – Gan. P95 vs Gan. P96",
  },

  // ── SEMI_FINAL (Semifinales) ──────────────────────────────────────────────
  // Jul 14
  {
    matchDate: new Date("2026-07-14T20:00:00.000Z"), // 2pm CST
    stadium: "AT&T Stadium",
    city: "Dallas",
    country: "USA",
    phase: "SEMI_FINAL",
    label: "P101 – Gan. P97 vs Gan. P98",
  },
  // Jul 15
  {
    matchDate: new Date("2026-07-15T20:00:00.000Z"), // 2pm CST
    stadium: "Mercedes-Benz Stadium",
    city: "Atlanta",
    country: "USA",
    phase: "SEMI_FINAL",
    label: "P102 – Gan. P99 vs Gan. P100",
  },

  // ── THIRD_PLACE (3er lugar) ──────────────────────────────────────────────
  // Jul 18
  {
    matchDate: new Date("2026-07-18T22:00:00.000Z"), // 4pm CST
    stadium: "Hard Rock Stadium",
    city: "Miami",
    country: "USA",
    phase: "THIRD_PLACE",
    label: "P103 – 3° lugar",
  },

  // ── FINAL ────────────────────────────────────────────────────────────────
  // Jul 19
  {
    matchDate: new Date("2026-07-19T20:00:00.000Z"), // 2pm CST
    stadium: "MetLife Stadium",
    city: "New York/New Jersey",
    country: "USA",
    phase: "FINAL",
    label: "P104 – Final",
  },
];

async function main() {
  console.log("🌍 Seeding teams...");

  const teamMap = {};
  for (const team of TEAMS) {
    const t = await prisma.team.upsert({
      where: { code: team.code },
      update: {
        name: team.name,
        flag: team.flag,
        group: team.group,
      },
      create: {
        name: team.name,
        code: team.code,
        flag: team.flag,
        group: team.group,
      },
    });
    teamMap[team.code] = t;
    console.log(`  ✓ ${t.code} – ${t.name}`);
  }

  const tbdId = teamMap["TBD"].id;
  console.log(`\n🏟️  TBD team id: ${tbdId}`);

  // Remove old placeholder knockout matches
  const deleted = await prisma.match.deleteMany({
    where: {
      phase: { not: "GROUP_STAGE" },
    },
  });
  console.log(`\n🗑️  Removed ${deleted.count} old knockout match(es).`);

  console.log("\n⚽ Creating knockout matches...");
  let created = 0;
  for (const m of KNOCKOUT_MATCHES) {
    const match = await prisma.match.create({
      data: {
        homeTeamId: tbdId,
        awayTeamId: tbdId,
        matchDate: m.matchDate,
        stadium: m.stadium,
        city: m.city,
        phase: m.phase,
        status: "SCHEDULED",
      },
    });
    created++;
    const localTime = m.matchDate.toLocaleString("es-MX", {
      timeZone: "America/Mexico_City",
      dateStyle: "short",
      timeStyle: "short",
    });
    console.log(
      `  ✓ [${m.phase}] ${m.label}  →  ${localTime} CST  (id: ${match.id})`,
    );
  }

  console.log(
    `\n✅ Done! Created ${created} knockout matches with ${TEAMS.length} teams.`,
  );
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
