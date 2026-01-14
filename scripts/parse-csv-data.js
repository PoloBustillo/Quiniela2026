const fs = require("fs");
const path = require("path");

// Parse CSV to array of objects - improved version
function parseCSV(csvText) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = lines[0].split(",").map((h) => h.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(",");
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ? values[index].trim() : undefined;
    });
    return obj;
  });
}

// Read CSV files
const teamsCSV = fs.readFileSync(
  path.join(__dirname, "../data/teams.csv"),
  "utf-8"
);
const matchesCSV = fs.readFileSync(
  path.join(__dirname, "../data/matches.csv"),
  "utf-8"
);
const citiesCSV = fs.readFileSync(
  path.join(__dirname, "../data/host_cities.csv"),
  "utf-8"
);
const stagesCSV = fs.readFileSync(
  path.join(__dirname, "../data/tournament_stages.csv"),
  "utf-8"
);

// Parse data
const teams = parseCSV(teamsCSV);
const matches = parseCSV(matchesCSV);
const cities = parseCSV(citiesCSV);
const stages = parseCSV(stagesCSV);

// Transform teams data
const teamsJSON = teams.map((team) => ({
  id: parseInt(team.id),
  name: team.team_name,
  code: team.fifa_code.toLowerCase(),
  group: team.group_letter,
  flag: `/flags/${team.fifa_code.toLowerCase()}.png`,
  isPlaceholder: team.is_placeholder === "True",
}));

// Group teams by group letter
const groupedTeams = teamsJSON.reduce((acc, team) => {
  if (!acc[team.group]) {
    acc[team.group] = [];
  }
  acc[team.group].push(team);
  return acc;
}, {});

// Transform matches data
const matchesJSON = matches
  .map((match) => {
    const homeTeam = teamsJSON.find(
      (t) => t.id === parseInt(match.home_team_id)
    );
    const awayTeam = teamsJSON.find(
      (t) => t.id === parseInt(match.away_team_id)
    );
    const city = cities.find((c) => parseInt(c.id) === parseInt(match.city_id));
    const stage = stages.find(
      (s) => parseInt(s.id) === parseInt(match.stage_id)
    );

    // Skip if teams not found (data integrity check)
    if (!homeTeam || !awayTeam || !city || !stage) {
      console.warn(`Skipping match ${match.id}: missing data`, {
        homeTeam: !!homeTeam,
        awayTeam: !!awayTeam,
        city: !!city,
        stage: !!stage,
      });
      return null;
    }

    // Extract group letter from match_label (e.g., "Group A" -> "A")
    let groupLetter = null;
    if (match.match_label && match.match_label.trim()) {
      const groupMatch = match.match_label.match(/Group ([A-L])/i);
      groupLetter = groupMatch ? groupMatch[1] : null;
    }

    return {
      id: parseInt(match.id),
      matchNumber: parseInt(match.match_number),
      homeTeam: {
        id: homeTeam.id,
        name: homeTeam.name,
        code: homeTeam.code,
        flag: homeTeam.flag,
      },
      awayTeam: {
        id: awayTeam.id,
        name: awayTeam.name,
        code: awayTeam.code,
        flag: awayTeam.flag,
      },
      date: match.kickoff_at,
      stadium: city.venue_name,
      city: city.city_name,
      country: city.country,
      stage: stage.stage_name,
      group: groupLetter,
    };
  })
  .filter(Boolean); // Remove null entries

// Write JSON files
fs.writeFileSync(
  path.join(__dirname, "../data/teams.json"),
  JSON.stringify({ teams: teamsJSON, groups: groupedTeams }, null, 2)
);

fs.writeFileSync(
  path.join(__dirname, "../data/matches.json"),
  JSON.stringify({ matches: matchesJSON }, null, 2)
);

console.log(
  "✅ Successfully generated teams.json with",
  teamsJSON.length,
  "teams in",
  Object.keys(groupedTeams).length,
  "groups"
);
console.log(
  "✅ Successfully generated matches.json with",
  matchesJSON.length,
  "matches"
);
