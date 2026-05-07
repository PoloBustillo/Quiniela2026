#!/usr/bin/env node
/*
  Simple script to replace placeholder playoff winners in data/matches.json
  Usage:
    node scripts/update-playoff-winners.js            # uses data/playoff-winners.json
    node scripts/update-playoff-winners.js --in file  # use different mapping file

  The mapping file should be a JSON object where keys match the placeholder
  name in matches.json (e.g. "Winner UEFA Playoff A") and values are the
  actual team name to substitute (e.g. "Portugal").

  Note: This intentionally avoids fragile scraping. You can generate the
  mapping file manually or via a separate scraper tailored to your data source.
*/

const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
let mappingFile = path.join(__dirname, "../data/playoff-winners.json");
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--in" && args[i + 1]) {
    mappingFile = path.resolve(process.cwd(), args[i + 1]);
    i++;
  }
}

if (!fs.existsSync(mappingFile)) {
  console.error(`Mapping file not found: ${mappingFile}`);
  console.error(
    "Create a mapping JSON at data/playoff-winners.json or pass --in <file>",
  );
  process.exit(1);
}

const matchesPath = path.join(__dirname, "../data/matches.json");
if (!fs.existsSync(matchesPath)) {
  console.error(`matches.json not found at ${matchesPath}`);
  process.exit(1);
}

const mapping = JSON.parse(fs.readFileSync(mappingFile, "utf8"));
const matches = JSON.parse(fs.readFileSync(matchesPath, "utf8"));

let replaced = 0;

for (const m of matches) {
  if (typeof m.name === "string" && m.name.toLowerCase().startsWith("winner")) {
    const key = m.name.trim();
    const newName = mapping[key];
    if (newName) {
      m.name = newName;
      replaced++;
    }
  }
}

if (replaced === 0) {
  console.log(
    "No placeholders replaced. Check your mapping keys and matches.json entries.",
  );
} else {
  fs.writeFileSync(
    matchesPath,
    JSON.stringify(matches, null, 2) + "\n",
    "utf8",
  );
  console.log(`Replaced ${replaced} placeholder(s) in data/matches.json`);
}

process.exit(0);
