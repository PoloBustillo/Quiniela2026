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

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const phase = searchParams.get("phase");

    const matches = await prisma.match.findMany({
      where: phase ? { phase: phase as any } : {},
      include: {
        homeTeam: true,
        awayTeam: true,
      },
      orderBy: {
        matchDate: "asc",
      },
    });

    return NextResponse.json(matches);
  } catch (error) {
    console.error("Error fetching matches:", error);
    return NextResponse.json(
      { error: "Error al obtener partidos" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
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
    const { homeTeamId, awayTeamId, matchDate, stadium, city, phase } = body;

    const match = await prisma.match.create({
      data: {
        homeTeamId,
        awayTeamId,
        matchDate: new Date(matchDate),
        stadium,
        city,
        phase,
        status: "SCHEDULED",
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error creating match:", error);
    return NextResponse.json(
      { error: "Error al crear partido" },
      { status: 500 }
    );
  }
}

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
    const { id, homeTeamId, awayTeamId, homeScore, awayScore, status } = body;

    const match = await prisma.match.update({
      where: { id },
      data: {
        ...(homeTeamId && { homeTeamId }),
        ...(awayTeamId && { awayTeamId }),
        ...(homeScore !== undefined && { homeScore }),
        ...(awayScore !== undefined && { awayScore }),
        ...(status && { status }),
      },
      include: {
        homeTeam: true,
        awayTeam: true,
      },
    });

    return NextResponse.json(match);
  } catch (error) {
    console.error("Error updating match:", error);
    return NextResponse.json(
      { error: "Error al actualizar partido" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // @ts-ignore
    if (session.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "No autorizado" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID de partido requerido" },
        { status: 400 }
      );
    }

    await prisma.match.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, message: "Partido eliminado" });
  } catch (error) {
    console.error("Error deleting match:", error);
    return NextResponse.json(
      { error: "Error al eliminar partido" },
      { status: 500 }
    );
  }
}
