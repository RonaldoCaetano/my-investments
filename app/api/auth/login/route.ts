import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { createSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/security";
import { loginPayloadSchema } from "@/lib/validations/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = loginPayloadSchema.parse(body);
    const normalizedEmail = payload.email.toLowerCase();
    const user = await prisma.user.findUnique({
      where: {
        email: normalizedEmail
      },
      select: {
        id: true,
        email: true,
        name: true,
        passwordHash: true
      }
    });

    if (!user?.passwordHash || !verifyPassword(payload.password, user.passwordHash)) {
      return NextResponse.json(
        {
          message: "E-mail ou senha invalidos."
        },
        { status: 401 }
      );
    }

    await createSession(user.id);

    return NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      },
      { status: 200 }
    );
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

    console.error("login_error", error);

    return NextResponse.json(
      {
        message: "Erro interno ao autenticar.",
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
