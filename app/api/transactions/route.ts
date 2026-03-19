import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { registerTransaction } from "@/lib/portfolio";
import { transactionPayloadSchema } from "@/lib/validations/transaction";

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const payload = transactionPayloadSchema.parse(body);
    const result = await registerTransaction(prisma, user.id, payload);

    return NextResponse.json(result, { status: 201 });
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

    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 422 });
    }

    return NextResponse.json({ message: "Erro interno ao salvar a transacao." }, { status: 500 });
  }
}
