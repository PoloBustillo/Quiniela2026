import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Obtener todos los usuarios (solo admin)
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

    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        role: true,
        hasPaid: true,
        paidAt: true,
        createdAt: true,
        _count: {
          select: {
            predictions: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json(
      { error: "Error al obtener usuarios" },
      { status: 500 }
    );
  }
}

// PUT - Actualizar estado de pago de usuario (solo admin)
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
    const { userId, hasPaid } = body;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        hasPaid,
        paidAt: hasPaid ? new Date() : null,
      },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Error updating user payment:", error);
    return NextResponse.json(
      { error: "Error al actualizar estado de pago" },
      { status: 500 }
    );
  }
}
