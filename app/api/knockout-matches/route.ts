import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    // Obtener partidos eliminatorios desde la base de datos
    const matches = await prisma.match.findMany({
      where: phase
        ? { phase: phase as any }
        : {
            phase: {
              not: "GROUP_STAGE",
            },
          },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        matchDate: "asc",
      },
    });

    // Transformar al formato esperado por el frontend
    const formattedMatches = matches.map((match) => ({
      id: match.id,
      matchNumber: 0, // Los partidos eliminatorios no tienen número
      homeTeam: {
        id: parseInt(match.homeTeam.code === "TBD" ? "999" : match.homeTeam.id),
        name: match.homeTeam.name,
        code: match.homeTeam.code,
        flag: match.homeTeam.flag || "",
      },
      awayTeam: {
        id: parseInt(match.awayTeam.code === "TBD" ? "999" : match.awayTeam.id),
        name: match.awayTeam.name,
        code: match.awayTeam.code,
        flag: match.awayTeam.flag || "",
      },
      date: match.matchDate.toISOString(),
      stadium: match.stadium || "",
      city: match.city || "",
      country: "",
      stage: match.phase,
      group: undefined,
      phase: match.phase,
      status: match.status,
      homeScore: match.homeScore,
      awayScore: match.awayScore,
    }));

    return NextResponse.json(formattedMatches);
  } catch (error) {
    console.error("Error fetching knockout matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}
