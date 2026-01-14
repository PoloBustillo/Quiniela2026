const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const email = process.argv[2] || "leopoldobeguiluz1@hotmail.com";

  console.log("=".repeat(60));
  console.log("  🔧 Script para Asignar Rol de Administrador");
  console.log("=".repeat(60));
  console.log();

  // Primero, listar todos los usuarios
  console.log("📋 Usuarios registrados en el sistema:");
  console.log("-".repeat(60));

  const allUsers = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (allUsers.length === 0) {
    console.log("❌ No hay usuarios registrados todavía.");
    console.log("\n💡 Para crear tu primer admin:");
    console.log("   1. Ve a http://localhost:3001");
    console.log("   2. Inicia sesión con tu cuenta de Google");
    console.log("   3. Vuelve a ejecutar este script");
    return;
  }

  allUsers.forEach((u, i) => {
    const roleIcon = u.role === "ADMIN" ? "👑" : "👤";
    const roleLabel = u.role === "ADMIN" ? "[ADMIN]" : "[USER]";
    console.log(`${i + 1}. ${roleIcon} ${u.name || "Sin nombre"}`);
    console.log(`   Email: ${u.email}`);
    console.log(`   Rol: ${roleLabel}`);
    console.log(`   Registrado: ${u.createdAt.toLocaleDateString("es-MX")}`);
    console.log();
  });

  console.log("-".repeat(60));
  console.log();
  console.log(`🔍 Buscando usuario: ${email}...`);

  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    console.error(`\n❌ No se encontró usuario con email: ${email}`);
    console.log("\n💡 Opciones:");
    console.log("   • Verifica que el email sea correcto");
    console.log("   • Asegúrate de que el usuario se haya logueado");
    console.log(`   • Usa: node prisma/make-admin.js <email>`);
    return;
  }

  console.log(`✓ Usuario encontrado: ${user.name} (${user.email})`);
  console.log(`  Rol actual: ${user.role}`);

  if (user.role === "ADMIN") {
    console.log("\n✓ El usuario ya tiene rol ADMIN");
    console.log("  No es necesario actualizar.");
    return;
  }

  console.log("\n⏳ Actualizando rol a ADMIN...");

  const updatedUser = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
  });

  console.log();
  console.log("=".repeat(60));
  console.log("  ✅ ¡Usuario actualizado exitosamente!");
  console.log("=".repeat(60));
  console.log();
  console.log(`👑 Nombre: ${updatedUser.name}`);
  console.log(`📧 Email: ${updatedUser.email}`);
  console.log(`🔐 Rol: ${updatedUser.role}`);
  console.log();
  console.log("🎉 ¡Ahora puedes acceder al panel de administración!");
  console.log("   → http://localhost:3001/admin");
  console.log();
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
