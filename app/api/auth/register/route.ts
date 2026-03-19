import { NextResponse, type NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/security";
import { registerPayloadSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = registerPayloadSchema.parse(body);
    const normalizedEmail = payload.email.toLowerCase();
    const existingUser = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      },
      select: {
        id: true
      }
    });

    if (existingUser) {
      return NextResponse.json(
        {
          message: "Ja existe uma conta com este e-mail."
        },
        { status: 409 }
      );
    }

    const user = await prisma.user.create({
      data: {
        name: payload.name,
        email: normalizedEmail,
        passwordHash: hashPassword(payload.password)
      },
      select: {
        id: true,
        email: true,
        name: true
      }
    });

    await createSession(user.id);

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          message: "Payload invalido.",
          issues: error.flatten()
        },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        {
          message: "Ja existe uma conta com este e-mail."
        },
        { status: 409 }
      );
    }

    console.error("register_error", error);

    return NextResponse.json(
      {
        message: "Erro interno ao criar a conta.",
        detail:
          process.env.NODE_ENV === "development"
            ? error instanceof Error
              ? error.message
              : "Erro desconhecido."
            : undefined
      },
      { status: 500 }
    );
  }
}
