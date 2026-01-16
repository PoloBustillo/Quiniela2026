const fs = require("fs");
const path = require("path");

/**
 * Convierte una fecha con cualquier offset a horario de México (UTC-6)
 */
function convertToMexicoTime(dateString) {
  console.log(`\n📅 Procesando: ${dateString}`);

  // Parsear la fecha con su offset original
  const match = dateString.match(
    /^(\d{4}-\d{2}-\d{2}) (\d{2}):(\d{2}):(\d{2})([+-]\d{2})$/
  );

  if (!match) {
    console.error(`❌ Formato inválido: ${dateString}`);
    return dateString;
  }

  const [, datePart, hours, minutes, seconds, offset] = match;

  // Convertir a formato ISO válido
  const isoString = `${datePart}T${hours}:${minutes}:${seconds}${offset}:00`;
  const date = new Date(isoString);

  if (isNaN(date.getTime())) {
    console.error(`❌ Fecha inválida: ${dateString}`);
    return dateString;
  }

  console.log(`   Original: ${date.toISOString()} (UTC)`);

  // Obtener la hora en México usando formateo manual para evitar "24:00"
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const year = parts.find((p) => p.type === "year").value;
  const month = parts.find((p) => p.type === "month").value;
  const day = parts.find((p) => p.type === "day").value;
  let hour = parts.find((p) => p.type === "hour").value;
  const minute = parts.find((p) => p.type === "minute").value;
  const second = parts.find((p) => p.type === "second").value;

  // Corregir "24" a "00" (medianoche)
  if (hour === "24") {
    hour = "00";
  }

  const result = `${year}-${month}-${day} ${hour}:${minute}:${second}-06`;
  console.log(`   ✅ Convertido: ${result} (México)`);

  return result;
}

// Leer el archivo matches.json
const matchesPath = path.join(__dirname, "..", "data", "matches.json");
console.log("📂 Leyendo:", matchesPath);

const data = JSON.parse(fs.readFileSync(matchesPath, "utf8"));

console.log(
  `\n🔄 Convirtiendo ${data.matches.length} partidos a horario de México...\n`
);
console.log("=".repeat(70));

let convertedCount = 0;

// Convertir todas las fechas a horario de México
data.matches = data.matches.map((match) => {
  const originalDate = match.date;
  const newDate = convertToMexicoTime(match.date);

  if (originalDate !== newDate) {
    convertedCount++;
  }

  return {
    ...match,
    date: newDate,
  };
});

console.log("\n" + "=".repeat(70));
console.log(
  `\n✅ Conversión completada: ${convertedCount} partidos convertidos`
);

// Guardar el archivo actualizado
fs.writeFileSync(matchesPath, JSON.stringify(data, null, 2));
console.log("💾 Archivo guardado:", matchesPath);
console.log(
  "\n✨ ¡Todos los horarios ahora están en zona horaria de México (UTC-6)!"
);
