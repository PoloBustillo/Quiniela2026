const https = require("https");
const fs = require("fs");
const path = require("path");

// Códigos de países faltantes
const missingFlags = [
  { code: "hai", name: "Haiti" },
  { code: "sco", name: "Scotland" },
  { code: "cur", name: "Curacao" },
  { code: "cpv", name: "Cape Verde" },
  { code: "ksa", name: "Saudi Arabia" }, // mismo que sau
  { code: "fp01", name: "FP01" }, // placeholder
  { code: "fp02", name: "FP02" }, // placeholder
  { code: "nor", name: "Norway" },
  { code: "alg", name: "Algeria" },
  { code: "aut", name: "Austria" },
  { code: "jor", name: "Jordan" },
  { code: "uzb", name: "Uzbekistan" },
];

// Mapeo de códigos especiales a códigos de flagcdn
const codeMap = {
  hai: "ht", // Haiti
  sco: "gb-sct", // Scotland
  cur: "cw", // Curacao
  cpv: "cv", // Cape Verde
  ksa: "sa", // Saudi Arabia (mismo que sau)
  nor: "no", // Norway
  alg: "dz", // Algeria
  aut: "at", // Austria
  jor: "jo", // Jordan
  uzb: "uz", // Uzbekistan
};

const flagsDir = path.join(__dirname, "../public/flags");

async function downloadFlag(code, name) {
  return new Promise((resolve, reject) => {
    const flagCode = codeMap[code] || code;
    const url = `https://flagcdn.com/w320/${flagCode}.png`;
    const filePath = path.join(flagsDir, `${code}.png`);

    https
      .get(url, (response) => {
        if (response.statusCode !== 200) {
          console.log(`❌ No se pudo descargar ${name} (${code})`);
          resolve();
          return;
        }

        const fileStream = fs.createWriteStream(filePath);
        response.pipe(fileStream);

        fileStream.on("finish", () => {
          fileStream.close();
          console.log(`✅ Descargada: ${name} (${code})`);
          resolve();
        });

        fileStream.on("error", (err) => {
          fs.unlinkSync(filePath);
          console.error(`❌ Error descargando ${name}:`, err.message);
          reject(err);
        });
      })
      .on("error", (err) => {
        console.error(`❌ Error de red para ${name}:`, err.message);
        reject(err);
      });
  });
}

async function downloadAllFlags() {
  console.log("🏁 Descargando banderas faltantes...\n");

  for (const { code, name } of missingFlags) {
    // Si es placeholder, copiar TBD
    if (code.startsWith("fp")) {
      const tbdPath = path.join(flagsDir, "tbd.png");
      const targetPath = path.join(flagsDir, `${code}.png`);
      fs.copyFileSync(tbdPath, targetPath);
      console.log(`✅ Copiada: ${name} (${code}) desde TBD`);
      continue;
    }

    await downloadFlag(code, name);
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  console.log("\n✨ ¡Descarga completa!");
}

downloadAllFlags().catch(console.error);
