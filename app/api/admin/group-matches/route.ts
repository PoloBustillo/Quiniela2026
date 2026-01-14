import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import matchesData from "@/data/matches.json";
import fs from "fs";
import path from "path";

// GET - Obtener todos los partidos de fase de grupos
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    return NextResponse.json(matchesData.matches);
  } catch (error) {
    console.error("Error fetching group matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar un partido de fase de grupos
export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const body = await request.json();
    const { matchId, homeScore, awayScore, matchDate } = body;

    // Leer el archivo JSON actual
    const filePath = path.join(process.cwd(), "data", "matches.json");
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const data = JSON.parse(fileContent);

    // Encontrar y actualizar el partido
    const matchIndex = data.matches.findIndex(
      (m: any) => m.id === matchId
    );

    if (matchIndex === -1) {
      return NextResponse.json(
        { error: "Partido no encontrado" },
        { status: 404 }
      );
    }

    // Actualizar los campos
    if (homeScore !== undefined) {
      data.matches[matchIndex].homeScore = homeScore;
    }
    if (awayScore !== undefined) {
      data.matches[matchIndex].awayScore = awayScore;
    }
    if (matchDate) {
      data.matches[matchIndex].date = matchDate;
    }

    // Guardar el archivo actualizado
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");

    return NextResponse.json(data.matches[matchIndex]);
  } catch (error) {
    console.error("Error updating group match:", error);
    return NextResponse.json(
      { error: "Error al actualizar partido" },
      { status: 500 }
    );
  }
}
