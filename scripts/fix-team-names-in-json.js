#!/usr/bin/env node
/**
 * fix-team-names-in-json.js
 *
 * Corrects wrong team names in data/matches.json:
 *   - code "sco"  named "República Checa"      → "Escocia"
 *   - code "por"  named "Bosnia y Herzegovina" → "Portugal"
 *   - code "fp01" any name                     → "RD de Congo"
 *   - code "fp02" any name                     → "Irak"
 *
 * Also corrects the flag paths for fp01/fp02 to use proper country codes:
 *   fp01 → /flags/fp01.png  (DRC placeholder, already exists)
 *   fp02 → /flags/fp02.png  (Iraq placeholder, already exists)
 *
 * Run: node scripts/fix-team-names-in-json.js
 */

const fs = require("fs");
const path = require("path");

const matchesPath = path.join(__dirname, "../data/matches.json");
const raw = fs.readFileSync(matchesPath, "utf8");
const data = JSON.parse(raw);

const CODE_NAME_MAP = {
  sco: "Escocia",
  por: "Portugal",
  fp01: "RD de Congo",
  fp02: "Irak",
};

let fixed = 0;

function fixTeam(team) {
  const correctName = CODE_NAME_MAP[team.code];
  if (correctName && team.name !== correctName) {
    console.log(`  ${team.code}: "${team.name}" → "${correctName}"`);
    team.name = correctName;
    fixed++;
  }
}

for (const match of data.matches) {
  fixTeam(match.homeTeam);
  fixTeam(match.awayTeam);
}

fs.writeFileSync(matchesPath, JSON.stringify(data, null, 2) + "\n", "utf8");
console.log(`\n✅ Fixed ${fixed} team name(s) in data/matches.json`);
