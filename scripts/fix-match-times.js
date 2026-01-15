const fs = require("fs");
const path = require("path");

// Leer el archivo matches.json
const matchesPath = path.join(__dirname, "..", "data", "matches.json");
const matchesData = JSON.parse(fs.readFileSync(matchesPath, "utf-8"));

console.log("🔧 Corrigiendo horarios en matches.json (restando 2 horas)...");
console.log(`Total de partidos: ${matchesData.matches.length}`);

let corrected = 0;

// Función para restar 2 horas a una fecha
function subtractTwoHours(dateString) {
  // Formato original: "2026-06-11 15:00:00-06"
  const parts = dateString.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})([+-]\d{2})$/
  );

  if (!parts) {
    console.error(`❌ Formato inválido: ${dateString}`);
    return dateString;
  }

  const [, datePart, hours, minutes, seconds, offset] = parts;

  // Convertir a Date
  const isoString = `${datePart}T${hours}:${minutes}:${seconds}${offset}:00`;
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.error(`❌ Fecha inválida: ${dateString}`);
    return dateString;
  }

  // Restar 2 horas
  date.setHours(date.getHours() - 2);

  // Formatear de vuelta
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hour}:${minute}:${second}${offset}`;
}

// Corregir cada partido
matchesData.matches = matchesData.matches.map((match) => {
  const oldDate = match.date;
  const newDate = subtractTwoHours(match.date);

  if (oldDate !== newDate) {
    console.log(`✓ Partido ${match.id}: ${oldDate} → ${newDate}`);
    corrected++;
  }

  return {
    ...match,
    date: newDate,
  };
});

// Guardar el archivo actualizado
fs.writeFileSync(matchesPath, JSON.stringify(matchesData, null, 2), "utf-8");

console.log(`\n✅ Corregidos ${corrected} horarios`);
console.log("📝 Archivo guardado: data/matches.json");
