const https = require("https");
const fs = require("fs");
const path = require("path");

// Mapeo de códigos de países para flagcdn.com
const countryFlags = {
  MEX: "mx",
  USA: "us",
  CAN: "ca",
  ARG: "ar",
  BRA: "br",
  URU: "uy",
  COL: "co",
  CHI: "cl",
  ECU: "ec",
  PER: "pe",
  FRA: "fr",
  ESP: "es",
  GER: "de",
  ENG: "gb-eng",
  POR: "pt",
  NED: "nl",
  ITA: "it",
  BEL: "be",
  CRO: "hr",
  DEN: "dk",
  SUI: "ch",
  POL: "pl",
  SWE: "se",
  UKR: "ua",
  SEN: "sn",
  MAR: "ma",
  NGA: "ng",
  TUN: "tn",
  CMR: "cm",
  GHA: "gh",
  CIV: "ci",
  EGY: "eg",
  JPN: "jp",
  KOR: "kr",
  IRN: "ir",
  AUS: "au",
  SAU: "sa",
  QAT: "qa",
  CRC: "cr",
  JAM: "jm",
  PAN: "pa",
  HON: "hn",
  NZL: "nz",
  PAR: "py",
  WAL: "gb-wls",
  SRB: "rs",
  ISL: "is",
};

const flagsDir = path.join(__dirname, "..", "public", "flags");

// Crear directorio si no existe
if (!fs.existsSync(flagsDir)) {
  fs.mkdirSync(flagsDir, { recursive: true });
}

// Función para descargar una bandera
function downloadFlag(code, countryCode) {
  return new Promise((resolve, reject) => {
    const url = `https://flagcdn.com/w320/${countryCode}.png`;
    const filePath = path.join(flagsDir, `${code.toLowerCase()}.png`);

    console.log(`Descargando bandera de ${code}...`);

    const file = fs.createWriteStream(filePath);
    https
      .get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          file.on("finish", () => {
            file.close();
            console.log(`✓ ${code} descargada`);
            resolve();
          });
        } else {
          console.log(`✗ Error descargando ${code}: ${response.statusCode}`);
          reject(new Error(`HTTP ${response.statusCode}`));
        }
      })
      .on("error", (err) => {
        fs.unlink(filePath, () => {});
        console.log(`✗ Error descargando ${code}: ${err.message}`);
        reject(err);
      });
  });
}

// Descargar todas las banderas
async function downloadAllFlags() {
  console.log("Iniciando descarga de banderas...\n");

  const downloads = Object.entries(countryFlags).map(([code, countryCode]) =>
    downloadFlag(code, countryCode).catch((err) =>
      console.error(`Error con ${code}:`, err.message)
    )
  );

  await Promise.all(downloads);

  // Crear bandera placeholder para TBD
  const tdbPath = path.join(flagsDir, "tbd.png");
  if (!fs.existsSync(tdbPath)) {
    fs.copyFileSync(path.join(flagsDir, "mx.png"), tdbPath);
    console.log("✓ Bandera placeholder TBD creada");
  }

  console.log("\n¡Descarga completada!");
  console.log(`Total de banderas: ${Object.keys(countryFlags).length + 1}`);
}

downloadAllFlags();
