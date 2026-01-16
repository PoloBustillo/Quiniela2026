// Test de parsing de fechas

function parseMatchDate(dateString) {
  console.log("Input:", dateString);

  const isoString = dateString
    .replace(" ", "T")
    .replace(/([+-]\d{2})$/, "$1:00");

  console.log("ISO String:", isoString);

  const date = new Date(isoString);
  console.log("Date object:", date);
  console.log("Is valid?", !isNaN(date.getTime()));

  if (!isNaN(date.getTime())) {
    console.log("ISO output:", date.toISOString());
    console.log(
      "Mexico time:",
      date.toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      })
    );
  }

  return date;
}

// Probar con las fechas CONVERTIDAS del JSON (todas ahora en UTC-6)
console.log("\n=== Test 1: Match 1 (Mexico vs South Africa) ===");
parseMatchDate("2026-06-11 13:00:00-06");

console.log("\n=== Test 2: Match 3 (Canada vs TBD) - Ahora en UTC-6 ===");
parseMatchDate("2026-06-12 09:00:00-06");

console.log("\n=== Test 3: Match 4 (USA vs Paraguay) - Ahora en UTC-6 ===");
parseMatchDate("2026-06-12 21:00:00-06");
