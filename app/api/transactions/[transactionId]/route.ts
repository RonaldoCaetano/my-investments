import { NextResponse, type NextRequest } from "next/server";
import { ZodError } from "zod";

import { getCurrentUser } from "@/lib/auth";
import { deleteTransaction, updateTransaction } from "@/lib/portfolio";
import { prisma } from "@/lib/prisma";
import { transactionPayloadSchema } from "@/lib/validations/transaction";

interface RouteContext {
  params: {
    transactionId: string;
  };
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
    }

    const body = await request.json();
    const payload = transactionPayloadSchema.parse(body);
    const result = await updateTransaction(prisma, user.id, context.params.transactionId, payload);

    return NextResponse.json(result, { status: 200 });
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

    return NextResponse.json({ message: "Erro interno ao atualizar a transacao." }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json({ message: "Nao autenticado." }, { status: 401 });
    }

    const result = await deleteTransaction(prisma, user.id, context.params.transactionId);

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ message: error.message }, { status: 422 });
    }

    return NextResponse.json({ message: "Erro interno ao excluir a transacao." }, { status: 500 });
  }
}
